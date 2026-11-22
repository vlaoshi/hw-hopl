// 안개섬 항구 입항 장면 - 직접 그린 16비트 스타일 픽셀 아트 (SVG)
// 160 x 90 칸짜리 격자에 1칸 = 1픽셀인 사각형만 찍어서 그려요.
// 확대해도 도트 느낌이 유지되도록 shape-rendering="crispEdges"를 사용해요.

// 팔레트 (16비트 게임 느낌의 제한된 색)
const C = {
  sky1: '#2a4f9e',
  sky2: '#3d74c7',
  sky3: '#79b2e6',
  cloud: '#ffffff',
  cloudShade: '#c9dcf0',
  fog: '#e4ecf4',
  mountainFar: '#6f84a6',
  mountainNear: '#4d6a5e',
  grass: '#3f7a4a',
  sea1: '#3a78c2',
  sea2: '#2a60a8',
  sea3: '#1b4685',
  wave: '#a9dcf7',
  stone: '#7d746a',
  stoneTop: '#a0968a',
  wall: '#efe0bc',
  roof: '#b8452f',
  roof2: '#2f5d8a',
  window: '#3a2a1a',
  wood: '#8a5a2b',
  woodDark: '#5a3416',
  hull: '#7a4320',
  hullDark: '#4e2a12',
  gold: '#e8c25a',
  sail: '#f4ecd8',
  sailShade: '#cdbf9f',
  mast: '#4a2a12',
  red: '#c0392b',
  white: '#ffffff',
  light: '#ffe27a',
}

// 사각형 하나를 만드는 함수 (x, y, 너비, 높이, 색)
const r = (x, y, w, h, fill) => ({ x, y, w, h, fill })

// --- 배경: 하늘 ---
const sky = [
  r(0, 0, 160, 16, C.sky1),
  r(0, 16, 160, 16, C.sky2),
  r(0, 32, 160, 18, C.sky3),
]

// 하늘 색 경계를 디더링(체크무늬)으로 부드럽게 이어요.
const dither = []
for (let x = 0; x < 160; x += 2) {
  dither.push(r(x, 15, 1, 1, C.sky2), r(x + 1, 16, 1, 1, C.sky1))
  dither.push(r(x, 31, 1, 1, C.sky3), r(x + 1, 32, 1, 1, C.sky2))
}

// --- 구름 ---
const cloud = (x, y) => [
  r(x + 3, y, 8, 1, C.cloud),
  r(x + 1, y + 1, 13, 2, C.cloud),
  r(x, y + 3, 18, 2, C.cloud),
  r(x + 2, y + 5, 14, 1, C.cloudShade),
]
const clouds = [...cloud(8, 8), ...cloud(58, 4), ...cloud(120, 12)]

// --- 먼 섬(산) : x 위치마다 높이를 계산해 1칸짜리 기둥을 세워요 ---
const mountains = []
for (let x = 84; x < 160; x++) {
  const far = Math.round(13 - Math.abs(x - 116) * 0.42 + ((x * 7) % 3))
  if (far > 0) mountains.push(r(x, 50 - far, 1, far, C.mountainFar))
  const near = Math.round(8 - Math.abs(x - 140) * 0.45 + ((x * 5) % 2))
  if (near > 0) mountains.push(r(x, 50 - near, 1, near, C.mountainNear))
}

// --- 등대 (섬 오른쪽 언덕 위) ---
const lighthouse = [
  r(146, 33, 4, 11, C.white),
  r(146, 36, 4, 2, C.red),
  r(146, 41, 4, 2, C.red),
  r(145, 32, 6, 1, C.woodDark),
  r(145, 44, 6, 1, C.woodDark),
]
const lighthouseLamp = [r(146, 29, 4, 3, C.light), r(145, 28, 6, 1, C.roof)]

// --- 바다 ---
const sea = [r(0, 50, 160, 6, C.sea1), r(0, 56, 160, 12, C.sea2), r(0, 68, 160, 22, C.sea3)]

// 반짝이는 물결 (위치는 고정값으로 정해 매번 같은 그림이 나오게 해요)
const wavePoints = [
  [6, 53], [24, 58], [40, 52], [92, 54], [104, 59], [14, 63], [86, 63],
  [2, 72], [20, 76], [44, 81], [70, 75], [94, 79], [8, 85], [58, 87], [100, 70],
]
const waves = wavePoints.map(([x, y]) => r(x, y, 4, 1, C.wave))
const waves2 = wavePoints.map(([x, y]) => r(x + 2, y + 1, 3, 1, C.wave))

// --- 오른쪽 항구 마을 (부두 + 집) ---
const harbor = [
  r(112, 60, 48, 30, C.stone),
  r(112, 60, 48, 2, C.stoneTop),
  // 집 1
  r(116, 51, 10, 9, C.wall),
  r(115, 48, 12, 3, C.roof),
  r(119, 54, 2, 3, C.window),
  r(123, 54, 2, 3, C.window),
  // 집 2
  r(129, 49, 12, 11, C.wall),
  r(128, 45, 14, 4, C.roof2),
  r(132, 52, 2, 3, C.window),
  r(136, 52, 2, 3, C.window),
  r(134, 56, 3, 4, C.woodDark),
  // 집 3
  r(144, 52, 12, 8, C.wall),
  r(143, 49, 14, 3, C.roof),
  r(147, 54, 2, 3, C.window),
  r(152, 54, 2, 3, C.window),
  // 나무 잔교
  r(94, 64, 18, 2, C.wood),
  r(96, 66, 1, 5, C.woodDark),
  r(103, 66, 1, 5, C.woodDark),
  r(110, 66, 1, 5, C.woodDark),
  // 화물 상자
  r(114, 56, 4, 4, C.wood),
  r(114, 56, 4, 1, C.gold),
]

// --- 배 (돛대 2개짜리 상선) ---
const ship = [
  // 선수(앞쪽) 기움돛대
  r(22, 57, 2, 1, C.mast),
  r(24, 58, 3, 1, C.mast),
  r(27, 59, 3, 1, C.mast),
  r(30, 60, 4, 1, C.mast),
  // 선미루(뒤쪽 높은 곳)
  r(74, 55, 12, 7, C.hull),
  r(74, 55, 12, 1, C.gold),
  r(76, 57, 2, 2, C.gold),
  r(80, 57, 2, 2, C.gold),
  // 선체
  r(33, 62, 54, 1, C.gold),
  r(33, 63, 54, 4, C.hull),
  r(35, 65, 50, 1, C.gold),
  r(36, 67, 47, 3, C.hullDark),
  r(40, 70, 39, 1, C.hullDark),
  // 대포 구멍
  r(42, 63, 2, 2, C.hullDark),
  r(50, 63, 2, 2, C.hullDark),
  r(58, 63, 2, 2, C.hullDark),
  r(66, 63, 2, 2, C.hullDark),
  // 돛대
  r(50, 20, 2, 42, C.mast),
  r(68, 27, 2, 35, C.mast),
  // 깃발
  r(52, 20, 6, 3, C.red),
  r(52, 21, 4, 1, C.gold),
  // 앞 돛대의 돛 (위, 아래)
  r(42, 25, 18, 1, C.mast),
  r(42, 26, 18, 9, C.sail),
  r(41, 28, 1, 5, C.sail),
  r(58, 26, 2, 9, C.sailShade),
  r(39, 37, 24, 1, C.mast),
  r(39, 38, 24, 12, C.sail),
  r(38, 40, 1, 8, C.sail),
  r(60, 38, 3, 12, C.sailShade),
  // 큰 돛의 문장 (나침반 별 모양)
  r(50, 41, 2, 6, C.red),
  r(48, 43, 6, 2, C.red),
  r(50, 43, 2, 2, C.gold),
  // 뒤 돛대의 돛 (위, 아래)
  r(62, 31, 14, 1, C.mast),
  r(62, 32, 14, 8, C.sail),
  r(74, 32, 2, 8, C.sailShade),
  r(60, 42, 18, 1, C.mast),
  r(60, 43, 18, 11, C.sail),
  r(75, 43, 3, 11, C.sailShade),
]

// 배 아래 물에 비친 그림자
const shipShadow = [r(38, 71, 44, 1, C.sea3), r(42, 72, 36, 1, C.hullDark)]

// --- 갈매기 ---
const gull = (x, y) => [r(x, y, 1, 1, C.white), r(x + 1, y + 1, 1, 1, C.white), r(x + 2, y, 1, 1, C.white)]
const gulls = [...gull(92, 18), ...gull(100, 24), ...gull(30, 14)]

// 사각형 배열을 SVG <rect>로 그리는 작은 컴포넌트
function Pixels({ rects }) {
  return rects.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.fill} />)
}

function HarborPixelArt() {
  return (
    <svg
      className="harbor-art"
      viewBox="0 0 160 90"
      shapeRendering="crispEdges"
      role="img"
      aria-label="안개 낀 섬의 항구로 돛단배가 입항하는 픽셀 아트"
    >
      <Pixels rects={sky} />
      <Pixels rects={dither} />
      <g className="harbor-clouds">
        <Pixels rects={clouds} />
      </g>
      <g className="harbor-gulls">
        <Pixels rects={gulls} />
      </g>
      <Pixels rects={mountains} />
      <Pixels rects={lighthouse} />
      <g className="harbor-lamp">
        <Pixels rects={lighthouseLamp} />
      </g>
      <Pixels rects={sea} />
      <g className="harbor-waves">
        <Pixels rects={waves} />
      </g>
      <g className="harbor-waves harbor-waves-alt">
        <Pixels rects={waves2} />
      </g>
      <Pixels rects={harbor} />
      <g className="harbor-ship">
        <Pixels rects={shipShadow} />
        <Pixels rects={ship} />
      </g>
      {/* 안개섬의 상징인 낮게 깔린 안개 띠 */}
      <g className="harbor-fog">
        <rect x="-20" y="44" width="200" height="3" fill={C.fog} opacity="0.75" />
        <rect x="-20" y="47" width="200" height="2" fill={C.fog} opacity="0.5" />
        <rect x="-20" y="58" width="200" height="2" fill={C.fog} opacity="0.35" />
      </g>
    </svg>
  )
}

export default HarborPixelArt
