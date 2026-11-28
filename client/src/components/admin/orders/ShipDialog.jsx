// '배송 시작' 팝업 - 택배사와 송장번호를 넣어요. (직접 배송은 송장번호 없이)
// order 가 있으면 열리고, 닫으면 onClose. 넣은 값은 onSubmit({ carrier, trackingNumber })
import { useEffect, useRef, useState } from 'react'

function ShipDialog({ order, carriers, busy, onSubmit, onClose }) {
  const dialogRef = useRef(null)
  const [carrier, setCarrier] = useState(carriers[0] ?? '')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (order && !dialog.open) dialog.showModal()
    if (!order && dialog.open) dialog.close()
  }, [order])

  const needsTracking = carrier !== '직접 배송'

  const handleSubmit = (e) => {
    e.preventDefault()
    const number = trackingNumber.trim()
    if (!carrier) return setError('택배사를 골라 주십시오.')
    if (needsTracking && !/^[0-9-]{6,30}$/.test(number)) return setError('송장번호는 숫자와 - 만 6~30자로 넣어 주십시오.')
    setError('')
    onSubmit({ carrier, trackingNumber: needsTracking ? number : '' })
  }

  return (
    <dialog ref={dialogRef} className="admin-dialog" aria-labelledby="ship-dialog-title" onClose={onClose}>
      <form className="admin-dialog-body" onSubmit={handleSubmit}>
        <h2 id="ship-dialog-title" className="admin-dialog-title">
          ◆ 배송 시작 ◆
        </h2>
        {order && (
          <p className="admin-dialog-desc">
            <strong>{order.orderNumber}</strong> · {order.recipient}님 · {order.orderName}
          </p>
        )}
        <label className="admin-dialog-field">
          <span>택배사</span>
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {carriers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-dialog-field">
          <span>송장번호 {needsTracking ? '' : '(직접 배송은 생략)'}</span>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            inputMode="numeric"
            placeholder={needsTracking ? '예) 6012-3456-7890' : '송장번호 없음'}
            disabled={!needsTracking}
            autoFocus
          />
        </label>
        {error && (
          <p className="admin-dialog-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-dialog-actions">
          <button type="button" className="admin-small-btn" onClick={onClose} disabled={busy}>
            닫기
          </button>
          <button type="submit" className="admin-small-btn is-primary" disabled={busy}>
            {busy ? '처리 중...' : '배송 시작'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default ShipDialog
