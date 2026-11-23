// 화면 표시용 보조 함수

// 금액을 천 단위 쉼표로 (예: 129000 → "129,000")
export function formatWon(price) {
  return Number(price).toLocaleString('ko-KR')
}
