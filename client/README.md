# hw-mall 클라이언트

쇼핑몰 서비스 프론트엔드 (React 19 + Vite 8 + React Router 7)

## 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 개발 서버 실행 → http://localhost:5173
npm run dev
```

백엔드 API를 사용하려면 다른 터미널에서 `server` 폴더의 서버(`npm run dev`, 4000번 포트)도 켜야 해요.
메인 화면에 `✅ 서버: ok / DB: connected`가 보이면 프론트와 백엔드가 잘 연결된 거예요.

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (저장하면 화면에 바로 반영) |
| `npm run build` | 제출·배포용 파일을 `dist/` 폴더에 생성 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint로 코드 검사 |

## 폴더 구조

```
client/
├── index.html              # HTML 진입점
├── vite.config.js          # 포트(5173) 고정, /api → localhost:4000 프록시
├── public/                 # 그대로 제공되는 정적 파일 (favicon 등)
└── src/
    ├── main.jsx            # React 시작점 (BrowserRouter 설정)
    ├── App.jsx             # 주소별 페이지 연결 (Routes)
    ├── index.css           # 공통 스타일
    ├── api/client.js       # 백엔드 API 호출 함수 (api.get, api.post ...)
    ├── components/         # 여러 페이지에서 쓰는 컴포넌트 (Layout 등)
    ├── pages/              # 페이지 컴포넌트 (HomePage, NotFoundPage ...)
    ├── hooks/              # 직접 만든 Hook
    ├── utils/              # 가격 표시 등 보조 함수
    └── assets/             # import해서 쓰는 이미지
```

## API 호출 방법

```js
import { api } from '../api/client.js'

const data = await api.get('/products')          // GET  /api/products
await api.post('/orders', { items: [...] })        // POST /api/orders
```

실패하면 서버가 보낸 `message`를 담은 에러가 발생하므로 `try/catch`로 처리하면 돼요.

## 참고

- `npm install` 중에 `fsevents` 설치 스크립트 경고가 나올 수 있어요. 미리 빌드된 파일이 포함되어 있어서 무시해도 괜찮아요.
- 패키지 충돌이 의심되면 `rm -rf node_modules && npm ci`로 `package-lock.json` 기준으로 다시 설치하세요.

## 체험 모드 (백엔드 없이 배포한 체험판)

`VITE_DEMO_MODE=true`로 빌드하면 서버 대신 브라우저(localStorage) 안에서 회원가입·로그인을 처리해요 ([src/api/demoApi.js](src/api/demoApi.js)).
GitHub Pages 배포([../.github/workflows/deploy-pages.yml](../.github/workflows/deploy-pages.yml))에서만 켜지고, `npm run dev`로 개발할 때는 꺼져 있어서 진짜 서버를 써요.
체험판 화면 왼쪽 아래에 "⚓ 체험 모드" 표시가 떠요.
