# 하플 상회 (HAPL Trading House)

> 대항해시대, 신기한 물건을 찾아 새로운 도시를 누비는 상인 여러분을 기다립니다.

안개섬 항구에 자리한 진귀품 교역소 **하플 상회**를 컨셉으로 한 쇼핑몰 과제 프로젝트예요.
구매자는 항구에 입항한 상인이 되어, 교역허가증(회원가입)을 받고 입항 심사(로그인)를 거쳐 상회와 거래해요.
화면은 1990년대 16비트 도트 게임 분위기로, 모든 그림은 직접 그린 픽셀 아트(SVG)예요.

## 체험판

GitHub Pages에 프론트엔드 체험판이 배포돼요: `https://<GitHub 아이디>.github.io/<저장소 이름>/`

- 백엔드 서버 없이 화면을 체험하는 판이에요. (체험 모드)
- 교역허가증 발급(회원가입)과 입항(로그인) 정보는 체험하는 사람의 브라우저에만 저장되고, 어디에도 전송되지 않아요.

| 화면 | 주소 |
|---|---|
| 메인 타이틀 | `/` |
| 항구 (입항 전: 검문관 / 입항 후: 상단 비서) | `/harbor` |
| 교역허가증 발급 (회원가입) | `/signup` |
| 입항 검문소 (로그인) | `/login` |

## 세계관 용어

| 일반 용어 | 하플 상회 |
|---|---|
| 로그인 / 로그아웃 | 입항 / 출항 |
| 회원가입 | 교역허가증 발급 |
| 이메일 / 비밀번호 | 전서구 주소 / 교역등록번호 |
| 이름 / 주소 | 상인명 / 교역물 인도지 |

## 기술 구성

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 (`client/`) | React 19, Vite 8, React Router 7 |
| 백엔드 (`server/`) | Node.js, Express 5, Mongoose 9 (MongoDB) |
| 인증 | JWT 토큰, bcryptjs 비밀번호 해시 |

## 내 컴퓨터에서 실행하기 (백엔드 포함)

필요한 것: Node.js 20.19 이상, MongoDB

```bash
# 1. 백엔드
cd server
npm install
cp .env.example .env   # 열어서 JWT_SECRET 등을 채워요 (방법은 파일 안 주석 참고)
npm run dev            # http://localhost:4000

# 2. 프론트엔드 (다른 터미널에서)
cd client
npm install
npm run dev            # http://localhost:5173
```

자세한 내용은 [server/README.md](server/README.md), [client/README.md](client/README.md)를 보세요.

## 체험판 배포 방식

`main` 브랜치에 코드를 올리면 [GitHub Actions](.github/workflows/deploy-pages.yml)가 프론트엔드를 체험 모드로 빌드해 GitHub Pages에 배포해요.
처음 한 번은 저장소의 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿔야 해요.

---

과제용 데모 쇼핑몰이며, 등장하는 지명과 상회는 가상의 세계관입니다.
