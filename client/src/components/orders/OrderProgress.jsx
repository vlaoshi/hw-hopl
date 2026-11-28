// 배송 진행 단계 - [결제 완료]─[상품 준비중]─[배송중]─[배송완료] 를 도트 칸으로 보여 줘요.
// - 지난 단계: 금화색 칸 + ✔ / 지금 단계: 붉은 인장 칸(반짝) / 남은 단계: 회색 칸
// - 배송완료면 모든 칸이 금화색이에요. (끝난 주문이라 반짝이는 칸이 없어요)
// - 주문 취소면 단계 대신 붉은 '주문 취소' 띠를 보여 줘요.
// - compact: 주문 내역 카드처럼 좁은 곳에서는 칸을 작게
import './Orders.css'

const ORDER_STEPS = [
  { status: 'paid', label: '결제 완료' },
  { status: 'preparing', label: '상품 준비중' },
  { status: 'shipping', label: '배송중' },
  { status: 'delivered', label: '배송완료' },
]

const formatShortDate = (value) =>
  value ? new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '' // 예) 11월 27일

function OrderProgress({ status, changedAt, compact = false }) {
  if (status === 'cancelled') {
    return (
      <p className={`order-progress-cancelled${compact ? ' is-compact' : ''}`}>
        ✕ 주문 취소{changedAt ? ` · ${formatShortDate(changedAt)}` : ''} · 결제가 취소되었습니다
      </p>
    )
  }

  // 배송완료는 모든 단계를 마친 것으로 봐요. (지금 단계 = 마지막 다음)
  const current = status === 'delivered' ? ORDER_STEPS.length : ORDER_STEPS.findIndex((step) => step.status === status)
  return (
    <ol className={`order-progress${compact ? ' is-compact' : ''}`} aria-label={`배송 진행: ${ORDER_STEPS[current]?.label ?? '배송완료'}`}>
      {ORDER_STEPS.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo'
        return (
          <li key={step.status} className={`order-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="order-step-box" aria-hidden="true">
              {state === 'done' ? '✔' : index + 1}
            </span>
            <span className="order-step-label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default OrderProgress
