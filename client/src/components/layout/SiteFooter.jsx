// 하플 상회 공통 푸터 (16비트 도트 게임 스타일)
// 픽셀 물결 띠 → 나무 장부판(나침반 · 상회 정보 창 · 오늘의 바다 창) → 데모 안내 줄
import PixelShipIcon from './PixelShipIcon.jsx'

// 물결 띠의 반짝이는 물결 위치 (320 x 8 칸 기준)
const WAVES = [
  [6, 2, 10],
  [40, 4, 8],
  [78, 2, 12],
  [120, 5, 9],
  [160, 2, 10],
  [204, 4, 8],
  [242, 2, 12],
  [290, 5, 9],
]

// 나침반 아이콘 (16 x 16 칸)
const COMPASS = [
  [7, 1, 2, 14, '#2a1608'],
  [1, 7, 14, 2, '#2a1608'],
  [7, 1, 2, 5, '#c0392b'],
  [6, 3, 4, 2, '#c0392b'],
  [5, 5, 6, 6, '#e8c25a'],
  [7, 7, 2, 2, '#2a1608'],
  [3, 3, 1, 1, '#a8782a'],
  [12, 3, 1, 1, '#a8782a'],
  [3, 12, 1, 1, '#a8782a'],
  [12, 12, 1, 1, '#a8782a'],
]

function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      {/* 픽셀 물결 띠 */}
      <svg
        className="site-footer-waves"
        viewBox="0 0 320 8"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="320" height="8" fill="#1b4685" />
        <rect x="0" y="0" width="320" height="2" fill="#3a78c2" />
        {WAVES.map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height="1" fill="#a9dcf7" />
        ))}
      </svg>

      {/* 나무 장부판 */}
      <div className="site-footer-board">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <svg className="site-footer-compass" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
              {COMPASS.map(([x, y, w, h, fill], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
              ))}
            </svg>
            <div>
              <p className="site-footer-name">
                <PixelShipIcon className="site-footer-ship" />
                하플 상회
              </p>
              <p className="site-footer-en">HAPL TRADING HOUSE</p>
            </div>
          </div>

          <div className="site-footer-info px-window">
            <p>여러 바다를 건너 모은 진귀한 물건을 거래하는 안개섬의 상회</p>
            <p>
              <span className="site-footer-label">◆ 상회 위치</span> 안개섬 항구 등대길 끝, 안개가 걷히는 곳
            </p>
            <p>
              <span className="site-footer-label">◆ 영업 시간</span> 밀물부터 썰물까지
            </p>
          </div>

          <div className="site-footer-sea px-window">
            <p className="site-footer-label">▶ 오늘의 바다</p>
            <p>바람: 남서풍 · 순풍</p>
            <p>안개: 옅음 · 입항 가능</p>
          </div>
        </div>
      </div>

      {/* 데모 안내 줄 */}
      <div className="site-footer-copy">
        <p>
          © {year} 하플 상회 (HAPL Trading House) · 과제용 데모 쇼핑몰이며, 등장하는 지명과 상회는 가상의
          세계관입니다.
        </p>
      </div>
    </footer>
  )
}

export default SiteFooter
