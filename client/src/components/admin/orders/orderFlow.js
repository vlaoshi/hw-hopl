// 상점주 주문 처리 규칙 (서버 Order 모델의 ORDER_STATUS_FLOW 와 같은 순서)
// 결제 완료 → [상품 준비 시작] → 상품 준비중 → [배송 시작: 택배사·송장번호] → 배송중 → [배송 완료 처리] → 배송완료
// 취소는 결제 완료·상품 준비중일 때만 (배송중부터는 취소 불가)

// 상태 코드 → 화면 이름 (서버 ORDER_STATUS_LABEL 과 같아요)
export const STATUS_LABEL = {
  awaiting_payment: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비중',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '주문 취소',
  payment_failed: '결제 실패',
}

export const NEXT_ACTION = {
  paid: { status: 'preparing', label: '상품 준비 시작' },
  preparing: { status: 'shipping', label: '배송 시작' },
  shipping: { status: 'delivered', label: '배송 완료 처리' },
}

export const CANCELLABLE = ['paid', 'preparing']

// 상태 탭 (key = 서버 status 값)
export const ORDER_TABS = [
  { key: 'active', label: '처리 중', hint: '결제 완료 + 상품 준비중 + 배송중' },
  { key: 'paid', label: '결제 완료', hint: '새 주문 - 상품 준비를 시작해 주세요' },
  { key: 'preparing', label: '상품 준비중' },
  { key: 'shipping', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'cancelled', label: '주문 취소' },
  { key: 'unpaid', label: '결제 실패·대기', hint: '결제가 끝나지 않은 주문' },
  { key: 'all', label: '전체' },
]

export const PERIODS = [
  { key: 'today', label: '오늘' },
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' },
  { key: 'all', label: '전체' },
]

export const CANCEL_REASONS = ['재고 부족', '고객 요청', '배송 불가 지역', '상품 파손', '기타']

// 주문일시: 2026.11.27 14:05
export function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
