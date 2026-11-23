// 금화 + 가격 패 (예: 🪙 129,000)
// 금액은 원(₩) 단위이고, 화면 낭독기에는 "129,000원"으로 읽혀요.
import PixelArt from '../harbor/PixelArt.jsx'
import { formatWon } from '../../utils/format.js'

// 겹쳐 놓인 둥근 금화 두 닢 (15 x 12 칸, 직접 그린 픽셀 아트)
const GOLD_COINS = {
  viewBox: '0 0 15 12',
  layers: [
    {
      className: null,
      rects: [
        // 뒤 금화 (오른쪽 위)
        [7, 0, 6, 1, '#7a4e12'],
        [6, 1, 8, 1, '#7a4e12'],
        [5, 2, 10, 5, '#7a4e12'],
        [6, 7, 8, 1, '#7a4e12'],
        [7, 1, 6, 1, '#e0a030'],
        [6, 2, 8, 5, '#e0a030'],
        [7, 2, 3, 1, '#ffd36b'],
        // 앞 금화 (왼쪽 아래)
        [2, 3, 6, 1, '#7a4e12'],
        [1, 4, 8, 1, '#7a4e12'],
        [0, 5, 10, 5, '#7a4e12'],
        [1, 10, 8, 1, '#7a4e12'],
        [2, 11, 6, 1, '#7a4e12'],
        [2, 4, 6, 1, '#f2b544'],
        [1, 5, 8, 5, '#f2b544'],
        [2, 10, 6, 1, '#f2b544'],
        [2, 5, 3, 1, '#ffe27a'],
        [1, 6, 1, 2, '#ffe27a'],
        [4, 6, 2, 3, '#c98a1e'],
      ],
    },
  ],
}

function GoldPrice({ price, className = '' }) {
  return (
    <span className={`gold-price ${className}`.trim()}>
      <PixelArt scene={GOLD_COINS} className="gold-price-coin" />
      <span className="gold-price-amount" aria-label={`${formatWon(price)}원`}>
        {formatWon(price)}
      </span>
    </span>
  )
}

export default GoldPrice
