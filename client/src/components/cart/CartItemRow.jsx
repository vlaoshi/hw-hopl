// 장바구니 한 줄 - [도트 그림] [이름 · 가격 · 상태 안내] [수량] [줄 합계] [빼기]
// status 가 'ok' 가 아니면 줄이 흐려지고 안내 문구가 붙어요. (합계에서도 빠져요)
//   shortage(재고 부족) → [N개로 맞추기] 버튼 / soldout·ended·hidden → 빼기만 할 수 있어요.
import { Link } from 'react-router-dom'
import GoodsSprite from '../goods/GoodsSprite.jsx'
import { formatWon } from '../../utils/format.js'
import QuantityStepper from './QuantityStepper.jsx'

const STATUS_NOTE = {
  soldout: '품절된 물건입니다. 다시 들어오면 주문할 수 있습니다.',
  ended: '판매가 끝난 물건입니다.',
  hidden: '지금은 진열하지 않는 물건입니다.',
}

function CartItemRow({ item, busy, onChangeQuantity, onRemove }) {
  const { product, quantity, status, maxQuantity, lineTotal } = item
  const canChange = status === 'ok' || status === 'shortage'

  return (
    <li className={`cart-item${status === 'ok' ? '' : ' is-problem'}`}>
      <Link to={`/products/${product._id}`} className="cart-item-art" aria-label={`${product.name} 상세 보기`}>
        <GoodsSprite image={product.image} name={product.name} className="cart-item-sprite" />
      </Link>

      <div className="cart-item-info">
        <Link to={`/products/${product._id}`} className="cart-item-name">
          {product.name}
        </Link>
        <p className="cart-item-price">{formatWon(product.price)}원</p>
        {status === 'shortage' && (
          <p className="cart-item-note">
            재고가 {maxQuantity}개로 줄었습니다.{' '}
            <button
              type="button"
              className="cart-item-fix"
              onClick={() => onChangeQuantity(product, maxQuantity)}
              disabled={busy}
            >
              {maxQuantity}개로 맞추기
            </button>
          </p>
        )}
        {STATUS_NOTE[status] && <p className="cart-item-note">{STATUS_NOTE[status]}</p>}
      </div>

      <div className="cart-item-qty">
        {canChange ? (
          <QuantityStepper
            value={quantity}
            // 재고 부족이면 지금 수량에서 줄이기만 할 수 있게 해요.
            max={status === 'shortage' ? quantity : maxQuantity}
            onChange={(next) => onChangeQuantity(product, next)}
            disabled={busy}
            label={`${product.name} 수량`}
          />
        ) : (
          <span className="cart-item-qty-text">{quantity}개</span>
        )}
      </div>

      <p className="cart-item-total">{status === 'ok' ? `${formatWon(lineTotal)}원` : '—'}</p>

      <button type="button" className="cart-item-remove" onClick={() => onRemove(product)} disabled={busy}>
        빼기
      </button>
    </li>
  )
}

export default CartItemRow
