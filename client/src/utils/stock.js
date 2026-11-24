// 판매 상태 계산 (서버 Product 모델과 같은 기준)
// - 'available' 구매 가능 : 재고 1개 이상
// - 'soldout'   품절      : 재고 0개 + 다시 들여올 예정
// - 'ended'     판매 완료 : 재고 0개 + 더 들여올 계획 없음 (discontinued)
export const LOW_STOCK_THRESHOLD = 3 // 상점주 화면 '재고 적음' 기준 (1~3개)

export const SALE_STATUS_LABEL = {
  available: '구매 가능',
  soldout: '품절',
  ended: '판매 완료',
}

export function saleStatus(product) {
  const stock = Number(product?.stock) || 0
  if (stock > 0) return 'available'
  return product?.discontinued ? 'ended' : 'soldout'
}

// 상점주에게 '재고 적음'을 알려야 하는지 (판매 종료 상품은 더 들여오지 않으니 빼요)
export function isLowStock(product) {
  const stock = Number(product?.stock) || 0
  return !product?.discontinued && stock >= 1 && stock <= LOW_STOCK_THRESHOLD
}
