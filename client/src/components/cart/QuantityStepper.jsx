// 수량 고르기 [ − ] 3 [ + ] - 상세 페이지 담기, 장바구니 수량 바꾸기에서 함께 써요.
// - min~max 사이에서만 움직여요. 숫자를 직접 입력해도 범위 밖이면 가장 가까운 값으로 맞춰요.
// - onChange(새 수량) 는 값이 실제로 바뀔 때만 불려요.
import { useState } from 'react'
import './Cart.css'

function QuantityStepper({ value, min = 1, max, onChange, disabled = false, label = '수량' }) {
  const [draft, setDraft] = useState(null) // 직접 입력하는 중인 글자 (입력이 끝나면 null)

  const clamp = (n) => Math.min(max, Math.max(min, n))
  const commit = (n) => {
    const next = clamp(n)
    if (next !== value) onChange(next)
  }

  const finishTyping = () => {
    if (draft === null) return
    const n = Number.parseInt(draft, 10)
    setDraft(null)
    if (Number.isInteger(n)) commit(n)
  }

  return (
    <span className={`qty-stepper${disabled ? ' is-disabled' : ''}`}>
      <button
        type="button"
        className="qty-btn"
        onClick={() => commit(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`${label} 하나 줄이기`}
      >
        −
      </button>
      <input
        className="qty-input"
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
        onBlur={finishTyping}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        disabled={disabled}
      />
      <button
        type="button"
        className="qty-btn"
        onClick={() => commit(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`${label} 하나 늘리기`}
      >
        +
      </button>
    </span>
  )
}

export default QuantityStepper
