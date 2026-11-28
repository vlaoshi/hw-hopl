// 주문 상세 (/orders/:orderNumber) - 결제를 마치면 오는 곳이자, 내 주문 하나를 보는 곳 (입항한 상인만)
// - 방금 결제했으면(location.state.justPaid) 위쪽에 '주문이 완료되었습니다' 인사가 보여요.
// - [주문 상태 · 주문번호 · 주문 시각] [주문 상품] [배송지] [결제 정보 · 영수증]
// - 결제 완료 상태에서는 손님이 직접 [주문 취소]를 할 수 있어요. (결제 취소 + 재고 되돌림)
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { cancelMyOrder, getMyOrder } from '../api/orders.js'
import { useAuthUser } from '../hooks/useAuthUser.js'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import GoldPrice from '../components/goods/GoldPrice.jsx'
import OrderProgress from '../components/orders/OrderProgress.jsx'
import { formatWon } from '../utils/format.js'
import '../components/goods/Goods.css'
import '../components/cart/Cart.css'
import '../components/checkout/Checkout.css'

const formatDate = (value) =>
  value ? new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }) : '-'

function OrderDetail({ orderNumber }) {
  const location = useLocation()
  const justPaid = location.state?.justPaid === true
  const [state, setState] = useState({ order: null, loading: true, error: '' })
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getMyOrder(orderNumber, { signal: controller.signal })
      .then((order) => setState({ order, loading: false, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ order: null, loading: false, error: err.message })
      })
    return () => controller.abort()
  }, [orderNumber])

  const { order, loading, error } = state
  if (loading) return <p className="cart-message">주문서를 꺼내 오는 중입니다...</p>
  if (error) return <p className="cart-message is-error">주문을 불러오지 못했습니다. ({error})</p>

  const handleCancel = async () => {
    if (!window.confirm('이 주문을 취소할까요?\n결제가 취소되고 되돌릴 수 없습니다.')) return
    setCancelling(true)
    setMessage(null)
    try {
      const cancelled = await cancelMyOrder(order.orderNumber, '고객 요청 취소')
      setState((prev) => ({ ...prev, order: cancelled }))
      setMessage({ type: 'ok', text: '주문을 취소했습니다. 결제도 함께 취소되었습니다.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setCancelling(false)
    }
  }

  const { shipping, payment } = order

  return (
    <>
      {justPaid && order.status === 'paid' && (
        <section className="cart-panel order-thanks" aria-live="polite">
          <p className="order-thanks-title">주문이 완료되었습니다!</p>
          <p>
            하플 상회를 이용해 주셔서 감사합니다. 주문번호 <strong>{order.orderNumber}</strong>
          </p>
        </section>
      )}
      {message && (
        <p className={`cart-notice is-${message.type}`} role="status">
          {message.text}
        </p>
      )}

      {/* 배송 진행 단계 */}
      <section className="cart-panel" aria-label="배송 진행">
        <OrderProgress status={order.status} changedAt={order.statusHistory?.at(-1)?.at ?? order.updatedAt} />
      </section>

      <div className="cart-layout checkout-layout">
        <div className="checkout-main">
          {/* 주문 상품 */}
          <section className="cart-panel" aria-labelledby="order-items-title">
            <h2 id="order-items-title" className="cart-panel-title">
              ◆ 주문 상품 ◆
            </h2>
            <ul className="checkout-items">
              {order.items.map((item) => (
                <li key={item.product} className="checkout-item">
                  <span className="cart-item-art checkout-item-art">
                    <GoodsSprite image={item.image} name={item.name} className="checkout-item-sprite" />
                  </span>
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-qty">
                    {formatWon(item.price)}원 × {item.quantity}개
                  </span>
                  <span className="checkout-item-total">{formatWon(item.lineTotal)}원</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 배송지 */}
          <section className="cart-panel" aria-labelledby="order-shipping-title">
            <h2 id="order-shipping-title" className="cart-panel-title">
              ◆ 배송지 ◆
            </h2>
            <dl className="order-info">
              <div>
                <dt>받는 분</dt>
                <dd>{shipping.recipient}</dd>
              </div>
              <div>
                <dt>연락처</dt>
                <dd>{shipping.phone}</dd>
              </div>
              <div>
                <dt>주소</dt>
                <dd>
                  ({shipping.zipCode}) {shipping.address1} {shipping.address2}
                </dd>
              </div>
              {shipping.memo && (
                <div>
                  <dt>배송 메모</dt>
                  <dd>{shipping.memo}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* 주문 상태 · 결제 정보 */}
        <aside className="cart-panel cart-summary checkout-summary" aria-labelledby="order-status-title">
          <h2 id="order-status-title" className="cart-panel-title">
            ◆ 주문 정보 ◆
          </h2>
          <p className={`order-status is-${order.status}`}>{order.statusLabel}</p>
          <dl className="order-info">
            <div>
              <dt>주문번호</dt>
              <dd className="order-number">{order.orderNumber}</dd>
            </div>
            <div>
              <dt>주문 시각</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            {payment.method && (
              <div>
                <dt>결제 수단</dt>
                <dd>{payment.method}</dd>
              </div>
            )}
            {payment.approvedAt && (
              <div>
                <dt>결제 시각</dt>
                <dd>{formatDate(payment.approvedAt)}</dd>
              </div>
            )}
            {order.delivery?.carrier && (
              <div>
                <dt>택배</dt>
                <dd>
                  {order.delivery.carrier}
                  {order.delivery.trackingNumber ? ` · 송장 ${order.delivery.trackingNumber}` : ''}
                </dd>
              </div>
            )}
            {payment.canceledAt && (
              <div>
                <dt>취소 시각</dt>
                <dd>{formatDate(payment.canceledAt)}</dd>
              </div>
            )}
          </dl>
          <dl className="cart-summary-list">
            <div>
              <dt>상품 합계</dt>
              <dd>{formatWon(order.itemsTotal)}원</dd>
            </div>
            <div>
              <dt>배송비</dt>
              <dd className="checkout-free">{order.shippingFee ? `${formatWon(order.shippingFee)}원` : '무료'}</dd>
            </div>
            <div className="checkout-total-row">
              <dt>{order.status === 'cancelled' ? '취소된 금액' : '결제 금액'}</dt>
              <dd>
                <GoldPrice price={order.totalAmount} className="cart-summary-price" />
              </dd>
            </div>
          </dl>
          {payment.receiptUrl && (
            <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="checkout-edit-link">
              카드 영수증 보기 ▶
            </a>
          )}
          {order.status === 'paid' && (
            <button type="button" className="cart-clear-btn" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? '취소하는 중...' : '주문 취소'}
            </button>
          )}
          <Link to="/harbor" className="pixel-btn pixel-btn-gold cart-order-btn">
            진열장으로 돌아가기
          </Link>
        </aside>
      </div>
    </>
  )
}

function OrderDetailPage() {
  const { orderNumber } = useParams()
  const user = useAuthUser()

  return (
    <section className="cart-page order-page">
      <div className="cart-inner">
        <Link to="/orders" className="cart-back">
          ◀ 주문 내역
        </Link>
        <h1 className="cart-title">주문 상세</h1>
        {user ? (
          <OrderDetail key={orderNumber} orderNumber={orderNumber} />
        ) : (
          <section className="cart-panel cart-empty">
            <p className="cart-empty-title">주문 내역은 입항한 상인만 볼 수 있습니다.</p>
            <Link to="/login" state={{ from: `/orders/${orderNumber}` }} className="pixel-btn pixel-btn-seal cart-empty-btn">
              ⚓ 입항하기
            </Link>
          </section>
        )}
      </div>
    </section>
  )
}

export default OrderDetailPage
