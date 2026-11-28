// 주문 줄을 펼치면 보이는 상세 - [주문 상품] [배송지·주소 복사] [결제·배송 정보] [상태 변경 기록]
// 서버에서 상세(상태 기록 포함)를 따로 받아 와요. version 이 바뀌면(상태를 바꾼 뒤) 다시 받아요.
import { useEffect, useState } from 'react'
import GoodsSprite from '../../goods/GoodsSprite.jsx'
import { getAdminOrder } from '../../../api/adminOrders.js'
import { formatWon } from '../../../utils/format.js'
import { STATUS_LABEL, formatDateTime } from './orderFlow.js'

const BY_LABEL = { customer: '손님', admin: '상점주', system: '시스템' }

function AdminOrderDetail({ orderNumber, version }) {
  const [state, setState] = useState({ key: null, order: null, error: '' })
  const [copied, setCopied] = useState(false)
  const requestKey = `${orderNumber}:${version}`

  useEffect(() => {
    const controller = new AbortController()
    getAdminOrder(orderNumber, { signal: controller.signal })
      .then((order) => setState({ key: requestKey, order, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ key: requestKey, order: null, error: err.message })
      })
    return () => controller.abort()
  }, [orderNumber, requestKey])

  const { order, error } = state
  if (error) return <p className="admin-error">주문 상세를 불러오지 못했습니다. ({error})</p>
  if (!order) return <p className="admin-empty">주문서를 펼치는 중입니다...</p>

  const { shipping, payment, delivery } = order
  const fullAddress = `(${shipping.zipCode}) ${shipping.address1} ${shipping.address2 ?? ''}`.trim()

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${shipping.recipient} ${shipping.phone}\n${fullAddress}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="aod">
      <section className="aod-block aod-items">
        <h3 className="aod-title">주문 상품 ({order.items.length}종류)</h3>
        <ul className="aod-item-list">
          {order.items.map((item) => (
            <li key={item.product} className="aod-item">
              <span className="admin-product-art aod-item-art">
                <GoodsSprite image={item.image} name={item.name} className="aod-item-sprite" />
              </span>
              <span className="aod-item-name">
                {item.name}
                <small>{item.sku}</small>
              </span>
              <span className="aod-item-qty">
                {formatWon(item.price)}원 × {item.quantity}
              </span>
              <strong className="aod-item-total">{formatWon(item.lineTotal)}원</strong>
            </li>
          ))}
        </ul>
        <p className="aod-sum">
          상품 {formatWon(order.itemsTotal)}원 · 배송비 {order.shippingFee ? `${formatWon(order.shippingFee)}원` : '무료'} ·{' '}
          <strong>결제 {formatWon(order.totalAmount)}원</strong>
        </p>
      </section>

      <section className="aod-block">
        <h3 className="aod-title">
          배송지
          <button type="button" className="admin-small-btn aod-copy" onClick={copyAddress}>
            {copied ? '복사됨 ✔' : '주소 복사'}
          </button>
        </h3>
        <dl className="aod-info">
          <dt>받는 분</dt>
          <dd>{shipping.recipient}</dd>
          <dt>연락처</dt>
          <dd>{shipping.phone}</dd>
          <dt>주소</dt>
          <dd>{fullAddress}</dd>
          {shipping.memo && (
            <>
              <dt>배송 메모</dt>
              <dd className="aod-memo">{shipping.memo}</dd>
            </>
          )}
          <dt>주문자</dt>
          <dd>{order.customer ? `${order.customer.name} (${order.customer.email})` : '탈퇴한 회원'}</dd>
        </dl>
      </section>

      <section className="aod-block">
        <h3 className="aod-title">결제·배송</h3>
        <dl className="aod-info">
          <dt>결제 수단</dt>
          <dd>{payment.method ?? '-'}</dd>
          <dt>결제 시각</dt>
          <dd>{formatDateTime(payment.approvedAt)}</dd>
          {payment.receiptUrl && (
            <>
              <dt>영수증</dt>
              <dd>
                <a href={payment.receiptUrl} target="_blank" rel="noreferrer">
                  카드 영수증 ▶
                </a>
              </dd>
            </>
          )}
          {payment.canceledAt && (
            <>
              <dt>결제 취소</dt>
              <dd>
                {formatDateTime(payment.canceledAt)} · {payment.cancelReason}
              </dd>
            </>
          )}
          {payment.failMessage && (
            <>
              <dt>결제 실패</dt>
              <dd>{payment.failMessage}</dd>
            </>
          )}
          <dt>택배</dt>
          <dd>{delivery?.carrier ? `${delivery.carrier} ${delivery.trackingNumber ?? ''}` : '-'}</dd>
          {delivery?.deliveredAt && (
            <>
              <dt>배송완료</dt>
              <dd>{formatDateTime(delivery.deliveredAt)}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="aod-block">
        <h3 className="aod-title">상태 변경 기록</h3>
        <ol className="aod-history">
          {[...order.statusHistory].reverse().map((h, i) => (
            <li key={`${h.status}-${i}`}>
              <span className="aod-history-time">{formatDateTime(h.at)}</span>
              <span className={`admin-order-badge is-${h.status}`}>{STATUS_LABEL[h.status] ?? h.status}</span>
              <span className="aod-history-by">{BY_LABEL[h.by] ?? h.by}</span>
              {h.note && <span className="aod-history-note">{h.note}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default AdminOrderDetail
