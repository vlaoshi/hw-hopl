# hw-mall 서버

쇼핑몰 서비스 백엔드 (Node.js + Express 5 + MongoDB/Mongoose)

## 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 파일 만들기 (처음 한 번)
cp .env.example .env

# 3. MongoDB 실행 (Homebrew 설치 기준)
brew services start mongodb-community

# 4. 개발 서버 실행 (파일 저장 시 자동 재시작)
npm run dev

# 운영 모드 실행
npm start
```

실행 확인: http://localhost:4000/api/health → `"db": "connected"`가 보이면 정상이에요.

## 폴더 구조

```
server/
├── src/
│   ├── server.js            # 진입점: DB 연결 → 서버 실행 → 종료 처리
│   ├── app.js               # Express 앱 설정 (미들웨어, 라우트, 에러 처리)
│   ├── config/
│   │   ├── env.js           # 환경변수 읽기 + 검증
│   │   └── db.js            # MongoDB 연결
│   ├── models/              # Mongoose 스키마 (User, Product, Cart, Order ...)
│   ├── controllers/         # 요청 처리 로직
│   ├── routes/
│   │   └── index.js         # /api 라우트 모음 (+ /api/health)
│   ├── middlewares/
│   │   ├── notFound.js      # 404 처리
│   │   └── errorHandler.js  # 공통 에러 응답
│   └── utils/
│       └── AppError.js      # 상태 코드를 담는 에러 클래스
├── .env.example             # 환경변수 예시 (git에 올림)
├── .env                     # 실제 환경변수 (git에 올리지 않음)
└── nodemon.json
```

## API 목록

### 회원 (User)
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/users` | 회원 생성 (email, name, password 필수 / user_type, address 선택) |
| GET | `/api/users?page=1&limit=20` | 회원 목록 (최근 가입 순, limit 최대 100) |
| GET | `/api/users/:id` | 회원 한 명 조회 |
| PATCH, PUT | `/api/users/:id` | 회원 정보 수정 (보낸 필드만 변경) |
| DELETE | `/api/users/:id` | 회원 삭제 |

### 인증 (Auth)
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/auth/login` | 로그인. 본문 `{ email, password }` → 성공 시 `{ token, user }` |
| GET | `/api/auth/me` | 내 정보. 헤더 `Authorization: Bearer <토큰>` 필요 |

- 로그인 실패(이메일 없음, 비밀번호 틀림)는 똑같이 401과 같은 메시지로 응답해요.
- 로그인이 필요한 API에는 `middlewares/auth.js`의 `requireAuth`를, 관리자 전용 API에는 `requireAdmin`을 붙이세요.
- 토큰 설정은 `.env`의 `JWT_SECRET`(비밀키), `JWT_EXPIRES_IN`(유효 기간, 기본 1d)에서 바꿔요.

### 상품 (Product)
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/products` | 진열장 상품 목록 (판매 중인 상품만, 진열 순서대로) |
| GET | `/api/products/:id` | 상품 상세 (없는 상품은 404) |

- 예시 상품 넣기: `npm run seed` (여러 번 실행해도 중복되지 않아요. 내용은 `src/data/sampleProducts.js`에서 고쳐요)
- 상품 필드
  - 필수: `sku`(상품 코드), `name`(이름), `price`(가격, 원), `stock`(재고, 0 이상 정수),  `image`(도트 이미지 이름), `description`(자세한 설명), `summary`(진열장 카드용 한두 줄, 120자 이하)
  - 재고 상태: 0개 = 품절, 1~3개 = 품절 임박 (`LOW_STOCK_THRESHOLD`), 품절 상품도 진열장에는 '품절'로 보여요
  - 판매 상태: 재고 1개 이상 = 구매 가능 / 재고 0 = 품절 / 재고 0 + `discontinued: true`(재입고 계획 없음) = 판매 완료
  - 선택: `photos`(실물 사진 최대 3장), `sortOrder`(진열 순서, 기본 0), `isActive`(진열 여부, 기본 true)
- **SKU 규칙**: `HAPL-` + 영문 대·소문자·숫자 8자리 (예: `HAPL-a7K2m9Qx`, 대·소문자 구분)
  - 등록할 때 서버가 자동 발급해요. 요청에 `sku`를 보내도 무시돼요.
  - DB 유니크 인덱스로 같은 SKU는 절대 두 번 저장되지 않고, 한 번 정해지면 바꿀 수 없어요.
- `image`는 `client/src/components/goods/goodsSprites.js`의 그림 이름과 짝을 이뤄요. 그림이 없는 새 상품은 `mystery-crate`(물음표 상자)를 써요.
- 상품 스키마가 바뀌기 전(slug 사용)에 넣은 상품은 `npm run migrate:products`로 한 번 옮겨요. (slug → image, SKU 발급, 여러 번 실행해도 안전)

### 장바구니 (Cart) - 스키마만 있음, API는 다음 단계
- 파일: `src/models/Cart.js`
- 구조: `{ user, items: [{ product, quantity, addedAt }], createdAt, updatedAt }`
- 회원 한 명당 장바구니 하나 (`user` 유니크), 같은 상품은 한 줄로만 담겨요 (다시 담으면 수량 증가)
- 수량 1~99개 정수, 상품 종류는 30개까지
- 가격은 저장하지 않고, 보여 줄 때 상품의 지금 가격을 읽어요 (`populate('items.product')`)
- 도우미: `Cart.findOrCreate(userId)`, `cart.addItem(id, 수량)`, `cart.setItemQuantity(id, 수량)`, `cart.removeItem(id)`, `cart.clear()` (저장은 `cart.save()`)

### 관리자 (하플 상점주 대시보드)
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/admin/stats` | 대시보드 요약 `{ merchants, products, stock: { soldOut, lowStock, ended, threshold, alerts }, orders, revenue, recentOrders }` |
| GET | `/api/admin/products?page=1&limit=5` | 상품 목록 (숨긴 상품 포함, 페이지 단위). 응답에 `pagination: { page, limit, total, totalPages }` |
| POST | `/api/admin/products` | 상품 등록 `{ name, image, summary, description, price, stock, sortOrder?, isActive? }` → SKU 자동 발급 |
| GET | `/api/admin/products/:id` | 상품 하나 |
| PATCH | `/api/admin/products/:id` | 상품 수정 (보낸 필드만, SKU는 수정 불가). 진열 숨기기: `{ "isActive": false }`, 재고: `{ "stock": 10 }`, 판매 종료: `{ "discontinued": true }` |
| DELETE | `/api/admin/products/:id` | 상품 삭제 |
| POST | `/api/admin/products/:id/photos` | 실물 사진 추가 `{ urls: [...] }` (Cloudinary에 올린 사진 주소, 합계 최대 3장) |
| DELETE | `/api/admin/products/:id/photos` | 실물 사진 빼기 `{ url }` |

- `/api/admin` 아래는 모두 **로그인 + 관리자(user_type: admin)**만 쓸 수 있어요. (토큰 없음 401, 일반 회원 403)
- 실물 사진 파일은 브라우저(Cloudinary 업로드 위젯)가 Cloudinary에 바로 올리고, 서버는 사진 주소만 저장해요.
  - 환경변수 `CLOUDINARY_CLOUD_NAME`과 같은 계정의 `https://res.cloudinary.com/<클라우드이름>/image/upload/...` 주소만 받아요.
  - 사진을 빼도 Cloudinary의 원본 파일은 남아요. 필요하면 Cloudinary 관리 화면(Media Library)에서 지워요.
- `npm run seed`는 기본적으로 **없는 상품만** 넣어요. 관리 화면에서 고친 값을 파일 내용으로 되돌리려면 `npm run seed -- --overwrite`
- `orders`, `revenue`, `recentOrders`는 주문 기능을 만들기 전까지 0 / 빈 목록이에요.

## 응답 형식

- 성공: `{ "success": true, ... }`
- 실패: `{ "success": false, "message": "...", "details"?: [...] }`

## 새 기능 추가 순서 (예: 상품)

1. `src/models/Product.js` — 스키마 정의
2. `src/controllers/product.controller.js` — 로직 작성 (에러는 `throw new AppError(404, '...')`)
3. `src/routes/product.routes.js` — 라우터 작성
4. `src/routes/index.js`에 `router.use('/products', productRoutes)` 추가

Express 5는 async 함수에서 throw한 에러를 자동으로 에러 핸들러에 넘겨주므로 try/catch나 asyncHandler가 필요 없어요.
