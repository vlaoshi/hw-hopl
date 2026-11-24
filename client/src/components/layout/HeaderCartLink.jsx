// 헤더 장바구니 아이콘 - [도트 장바구니 그림] + 담긴 개수 딱지(빨강)
// - 누르면 /cart 로 가요. 담긴 물건이 없으면 딱지는 숨겨요. (100개 이상은 99+)
// - 넓은 화면용(is-desktop)과 휴대폰용(is-mobile) 두 곳에 놓이고, CSS 가 화면 폭에 맞는 하나만 보여 줘요.
import { NavLink } from 'react-router-dom'
import PixelArt from '../harbor/PixelArt.jsx'

// 14 x 12 칸 도트 장바구니 (색은 글자색을 따라가요)
const CART_ICON = {
  viewBox: '0 0 14 12',
  layers: [
    {
      className: null,
      rects: [
        [0, 0, 3, 1], // 손잡이
        [2, 1, 1, 2],
        [3, 2, 11, 1], // 바구니 윗테
        [3, 3, 1, 3],
        [13, 3, 1, 3],
        [4, 6, 10, 1], // 바구니 아랫테
        [6, 3, 1, 3], // 바구니 살
        [9, 3, 1, 3],
        [4, 4, 9, 1],
        [4, 7, 1, 1],
        [4, 8, 9, 1], // 받침
        [4, 9, 2, 2], // 바퀴
        [11, 9, 2, 2],
      ].map((r) => [...r, 'currentColor']),
    },
  ],
}

function HeaderCartLink({ count, className = '', onClick }) {
  const label = count > 0 ? `장바구니 (${count}개 담김)` : '장바구니'

  return (
    <NavLink
      to="/cart"
      className={({ isActive }) => `site-cart px-window ${className}${isActive ? ' is-active' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <PixelArt scene={CART_ICON} className="site-cart-icon" />
      {count > 0 && (
        <span className="site-cart-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

export default HeaderCartLink
