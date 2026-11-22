// 하플 상회 로고용 작은 픽셀 돛단배 아이콘 (16 x 16 칸, 직접 그린 SVG)
const PIXELS = [
  // 깃발
  [8, 1, 3, 1, '#c0392b'],
  // 돛대
  [7, 1, 1, 10, '#4a2a12'],
  // 돛 (앞, 뒤)
  [3, 3, 4, 1, '#f4ecd8'],
  [2, 4, 5, 3, '#f4ecd8'],
  [3, 7, 4, 1, '#f4ecd8'],
  [8, 3, 3, 1, '#f4ecd8'],
  [8, 4, 4, 4, '#f4ecd8'],
  [11, 4, 1, 4, '#cdbf9f'],
  // 선체
  [1, 11, 14, 1, '#e8c25a'],
  [2, 12, 12, 1, '#7a4320'],
  [3, 13, 10, 1, '#4e2a12'],
  // 물결
  [0, 15, 3, 1, '#79b2e6'],
  [6, 15, 4, 1, '#79b2e6'],
  [13, 15, 3, 1, '#79b2e6'],
]

function PixelShipIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      {PIXELS.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  )
}

export default PixelShipIcon
