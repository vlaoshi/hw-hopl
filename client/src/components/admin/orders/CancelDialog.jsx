// '주문 취소' 팝업 - 사유를 고르거나 직접 써요. 취소하면 결제 취소(환불) + 재고 되돌림.
// order 가 있으면 열리고, 넣은 사유는 onSubmit(reason)
import { useEffect, useRef, useState } from 'react'
import { CANCEL_REASONS } from './orderFlow.js'
import { formatWon } from '../../../utils/format.js'

function CancelDialog({ order, busy, onSubmit, onClose }) {
  const dialogRef = useRef(null)
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  const [detail, setDetail] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (order && !dialog.open) dialog.showModal()
    if (!order && dialog.open) dialog.close()
  }, [order])

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = [reason, detail.trim()].filter(Boolean).join(' - ')
    onSubmit(text.slice(0, 200))
  }

  return (
    <dialog ref={dialogRef} className="admin-dialog" aria-labelledby="cancel-dialog-title" onClose={onClose}>
      <form className="admin-dialog-body" onSubmit={handleSubmit}>
        <h2 id="cancel-dialog-title" className="admin-dialog-title is-danger">
          ◆ 주문 취소 ◆
        </h2>
        {order && (
          <p className="admin-dialog-desc">
            <strong>{order.orderNumber}</strong> · {order.recipient}님 · {formatWon(order.totalAmount)}원
            <br />
            취소하면 <strong>결제가 환불</strong>되고 재고가 되돌아갑니다. 되돌릴 수 없습니다.
          </p>
        )}
        <fieldset className="admin-dialog-field admin-dialog-reasons">
          <legend>취소 사유</legend>
          {CANCEL_REASONS.map((item) => (
            <label key={item} className={`admin-reason${item === reason ? ' is-selected' : ''}`}>
              <input type="radio" name="cancel-reason" value={item} checked={item === reason} onChange={() => setReason(item)} />
              {item}
            </label>
          ))}
        </fieldset>
        <label className="admin-dialog-field">
          <span>자세한 사유 (선택, 손님에게도 보여요)</span>
          <input value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={150} placeholder="예) 다음 입고 예정일 12월 5일" />
        </label>
        <div className="admin-dialog-actions">
          <button type="button" className="admin-small-btn" onClick={onClose} disabled={busy}>
            닫기
          </button>
          <button type="submit" className="admin-small-btn is-danger" disabled={busy}>
            {busy ? '취소하는 중...' : '주문 취소'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default CancelDialog
