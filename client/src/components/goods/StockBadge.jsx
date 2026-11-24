// 판매 상태 딱지 - [도트 아이콘 + 상태] (+ 재고 숫자)
//   구매 가능 ✔ (초록) · 품절 ⧗ (빨강, 다시 들어올 예정) · 판매 완료 ✕ (회색, 판매 끝)
// - showCount: 구매 가능일 때 재고 숫자를 옆에 보여 줘요. 예) [✔ 구매 가능] 1개
// - showLow  : 상점주 화면에서 재고가 적으면(1~3개) '재고 적음' 딱지를 더 붙여요.
import PixelArt from '../harbor/PixelArt.jsx'
import { SALE_STATUS_LABEL, isLowStock, saleStatus } from '../../utils/stock.js'
import './StockBadge.css'

// 7 x 7 칸 도트 아이콘 (색은 글자색을 따라가요)
const icon = (rects) => ({
  viewBox: '0 0 7 7',
  layers: [{ className: null, rects: rects.map(([x, y, w, h]) => [x, y, w, h, 'currentColor']) }],
})

const SALE_ICONS = {
  // 체크 표시
  available: icon([
    [0, 3, 1, 2],
    [1, 4, 1, 2],
    [2, 5, 1, 2],
    [3, 4, 1, 2],
    [4, 3, 1, 2],
    [5, 2, 1, 2],
    [6, 1, 1, 2],
  ]),
  // 모래시계 (다시 들어올 때까지 기다림)
  soldout: icon([
    [0, 0, 7, 1],
    [1, 1, 5, 1],
    [2, 2, 3, 1],
    [3, 3, 1, 1],
    [2, 4, 3, 1],
    [1, 5, 5, 1],
    [0, 6, 7, 1],
  ]),
  // 엑스 표시 (판매 끝)
  ended: icon([
    [0, 0, 2, 1],
    [5, 0, 2, 1],
    [1, 1, 2, 1],
    [4, 1, 2, 1],
    [2, 2, 3, 1],
    [3, 3, 1, 1],
    [2, 4, 3, 1],
    [1, 5, 2, 1],
    [4, 5, 2, 1],
    [0, 6, 2, 1],
    [5, 6, 2, 1],
  ]),
}

function StockBadge({ product, showCount = false, showLow = false, className = '' }) {
  const status = saleStatus(product)

  return (
    <span className={`sale-status ${className}`.trim()}>
      <span className={`sale-badge is-${status}`}>
        <PixelArt scene={SALE_ICONS[status]} className="sale-badge-icon" />
        {SALE_STATUS_LABEL[status]}
      </span>
      {showCount && status === 'available' && <span className="sale-count">{product.stock}개</span>}
      {showLow && isLowStock(product) && <span className="sale-badge is-low">재고 적음</span>}
    </span>
  )
}

export default StockBadge
