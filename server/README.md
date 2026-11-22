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

## 응답 형식

- 성공: `{ "success": true, ... }`
- 실패: `{ "success": false, "message": "...", "details"?: [...] }`

## 새 기능 추가 순서 (예: 상품)

1. `src/models/Product.js` — 스키마 정의
2. `src/controllers/product.controller.js` — 로직 작성 (에러는 `throw new AppError(404, '...')`)
3. `src/routes/product.routes.js` — 라우터 작성
4. `src/routes/index.js`에 `router.use('/products', productRoutes)` 추가

Express 5는 async 함수에서 throw한 에러를 자동으로 에러 핸들러에 넘겨주므로 try/catch나 asyncHandler가 필요 없어요.
