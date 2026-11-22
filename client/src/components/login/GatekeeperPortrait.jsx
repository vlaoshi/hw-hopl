// 항구 검문관 초상화 - 직접 그린 16비트 스타일 픽셀 아트 (SVG)
// 40 x 40 칸짜리 격자에 사각형만 찍어서 그려요. (shape-rendering="crispEdges")

const C = {
  bg: '#1f2b5e',
  bgDark: '#141c40',
  stone: '#4a4f66',
  stoneLine: '#363a4f',
  lamp: '#ffd36b',
  lampGlow: '#8a6a3a',
  hat: '#1c1d2e',
  hatShade: '#2e3050',
  gold: '#e8c25a',
  goldDark: '#a8782a',
  feather: '#c0392b',
  skin: '#e8b48a',
  skinShade: '#c98d63',
  skinDark: '#a8704a',
  eye: '#24160c',
  eyeWhite: '#f4ecd8',
  hair: '#6b4a2e',
  hairDark: '#4a311c',
  coat: '#8a1f2b',
  coatShade: '#5e1420',
  shirt: '#f4ecd8',
  wood: '#8a5a2b',
  steel: '#c9d1d9',
  steelShade: '#8a949e',
}

const r = (x, y, w, h, fill) => ({ x, y, w, h, fill })

// 배경: 성문 돌벽 + 벽등
const background = [
  r(0, 0, 40, 40, C.bg),
  r(0, 0, 40, 4, C.bgDark),
  // 돌벽 줄눈
  ...[6, 12, 18, 24, 30].map((y) => r(0, y, 40, 1, C.stoneLine)),
  r(0, 0, 9, 40, C.stone),
  r(31, 0, 9, 40, C.stone),
  r(0, 9, 9, 1, C.stoneLine),
  r(0, 21, 9, 1, C.stoneLine),
  r(31, 15, 9, 1, C.stoneLine),
  r(31, 27, 9, 1, C.stoneLine),
  r(4, 0, 1, 9, C.stoneLine),
  r(35, 15, 1, 12, C.stoneLine),
  // 벽등 (왼쪽 위)
  r(3, 10, 4, 5, C.lampGlow),
  r(4, 11, 2, 3, C.lamp),
  r(3, 9, 4, 1, C.goldDark),
]

// 창 (오른쪽)
const spear = [
  r(34, 4, 2, 36, C.wood),
  r(34, 0, 2, 1, C.steel),
  r(33, 1, 4, 3, C.steel),
  r(36, 2, 1, 2, C.steelShade),
  r(32, 4, 6, 1, C.goldDark),
]

// 몸 (제복)
const body = [
  r(6, 31, 28, 9, C.coat),
  r(6, 31, 3, 9, C.coatShade),
  // 견장
  r(5, 30, 7, 2, C.gold),
  r(28, 30, 7, 2, C.gold),
  r(5, 32, 7, 1, C.goldDark),
  r(28, 32, 7, 1, C.goldDark),
  // 셔츠 깃
  r(16, 30, 8, 4, C.shirt),
  r(18, 34, 4, 2, C.shirt),
  // 금단추
  r(19, 36, 2, 1, C.gold),
  r(19, 38, 2, 1, C.gold),
  // 창을 잡은 손
  r(32, 27, 4, 4, C.skin),
  r(32, 30, 4, 1, C.skinShade),
]

// 얼굴
const face = [
  r(13, 12, 14, 16, C.skin),
  r(12, 14, 1, 11, C.skin),
  r(27, 14, 1, 11, C.skin),
  r(14, 28, 12, 2, C.skin),
  r(25, 13, 2, 15, C.skinShade), // 오른쪽 그림자
  // 귀
  r(11, 17, 1, 4, C.skinShade),
  r(28, 17, 1, 4, C.skinShade),
  // 짙은 눈썹 (한쪽을 치켜올려 상인을 알아보는 표정)
  r(14, 15, 5, 1, C.hairDark),
  r(21, 14, 5, 1, C.hairDark),
  r(21, 15, 1, 1, C.hairDark),
  // 눈 (왼쪽은 가늘게 뜬 눈, 오른쪽은 동그랗게)
  r(15, 17, 3, 1, C.eye),
  r(22, 16, 3, 2, C.eyeWhite),
  r(23, 16, 2, 2, C.eye),
  // 코
  r(19, 17, 2, 5, C.skinShade),
  r(18, 21, 4, 1, C.skinDark),
  // 볼 홍조
  r(14, 20, 2, 1, '#d98a6a'),
  r(24, 20, 2, 1, '#d98a6a'),
]

// 콧수염 + 턱수염
const beard = [
  r(14, 22, 12, 2, C.hair),
  r(12, 21, 2, 2, C.hair), // 말려 올라간 콧수염 끝
  r(26, 21, 2, 2, C.hair),
  r(11, 20, 1, 1, C.hair),
  r(28, 20, 1, 1, C.hair),
  r(17, 24, 6, 1, C.skinDark), // 입
  r(15, 25, 10, 3, C.hair),
  r(16, 28, 8, 2, C.hair),
  r(18, 30, 4, 1, C.hairDark),
  r(15, 22, 10, 1, C.hairDark),
]

// 삼각모 (금테 + 붉은 깃털)
const hat = [
  r(10, 9, 20, 3, C.hat),
  r(8, 10, 2, 2, C.hat),
  r(30, 10, 2, 2, C.hat),
  r(13, 5, 14, 4, C.hat),
  r(15, 3, 10, 2, C.hat),
  r(17, 2, 6, 1, C.hat),
  r(13, 5, 14, 1, C.hatShade),
  r(8, 12, 24, 1, C.gold), // 금테
  r(19, 6, 2, 3, C.gold), // 모표
  r(19, 7, 2, 1, C.feather),
  // 깃털
  r(25, 2, 2, 1, C.feather),
  r(26, 1, 3, 1, C.feather),
  r(27, 0, 3, 1, C.feather),
  r(24, 3, 2, 2, C.feather),
]

function Pixels({ rects }) {
  return rects.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.fill} />)
}

function GatekeeperPortrait() {
  return (
    <svg
      className="gatekeeper-art"
      viewBox="0 0 40 40"
      shapeRendering="crispEdges"
      role="img"
      aria-label="삼각모를 쓰고 창을 든 항구 검문관 초상화"
    >
      <Pixels rects={background} />
      <g className="gatekeeper-lamp">
        <Pixels rects={[r(4, 11, 2, 3, C.lamp)]} />
      </g>
      <Pixels rects={spear} />
      <Pixels rects={body} />
      <Pixels rects={face} />
      <Pixels rects={beard} />
      <Pixels rects={hat} />
    </svg>
  )
}

export default GatekeeperPortrait
