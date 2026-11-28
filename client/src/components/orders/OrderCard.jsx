// 주문 내역 카드 한 장
// [주문일 · 주문번호 ················ 주문 상세 ▶]
// [도트 그림] [상태 · 주문명 · 수량·금액]        [다시 담기] [주문 취소]
// [배송 진행 단계]
import { Link } from 'react-router-dom'
import GoodsSprite from '../goods/GoodsSprite.jsx'
import { formatWon } from '../../utils/format.js'
import OrderProgress from './OrderProgress.jsx'

// 주문일: 2026.11.27
const formatDate = (value) => {
  const d = new Date(value)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function OrderCard({ order, busy, onReorder, onCancel }) {
  const others = order.itemCount - 1

  return (
    <li className={`order-card is-${order.status}`}>
      <div className="order-card-head">
        <p className="order-card-date">
          <strong>{formatDate(order.createdAt)}</strong> 주문
          <span className="order-card-number">{order.orderNumber}</span>
        </p>
        <Link to={`/orders/${order.orderNumber}`} className="order-card-detail">
          주문 상세 ▶
        </Link>
      </div>

      <div className="order-card-body">
        <Link to={`/orders/${order.orderNumber}`} className="cart-item-art order-card-art" aria-label={`${order.orderName} 주문 상세`}>
          <GoodsSprite image={order.image} name={order.items[0]?.name} className="order-card-sprite" />
          {others > 0 && <span className="order-card-more">+{others}</span>}
        </Link>

        <div className="order-card-info">
          <p className={`order-card-status is-${order.status}`}>{order.statusLabel}</p>
          <p className="order-card-name">{order.orderName}</p>
          <p className="order-card-meta">
            {order.totalQuantity}개 · <strong>{formatWon(order.totalAmount)}원</strong>
          </p>
        </div>

        <div className="order-card-actions">
          <button type="button" className="order-card-btn" onClick={() => onReorder(order)} disabled={busy}>
            다시 담기
          </button>
          {order.status === 'paid' && (
            <button type="button" className="order-card-btn is-danger" onClick={() => onCancel(order)} disabled={busy}>
              주문 취소
            </button>
          )}
        </div>
      </div>

      <OrderProgress status={order.status} changedAt={order.statusChangedAt} compact />
    </li>
  )
}

export default OrderCard
