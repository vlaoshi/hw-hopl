// 주문 API 함수 - 로그인한 회원의 주문 (서버: /api/orders)
import { api } from './client.js'

const path = (orderNumber) => `/orders/${encodeURIComponent(orderNumber)}`

// 장바구니 + 배송지로 주문서 만들기 → 주문서(결제 대기). orderNumber 가 포트원 paymentId 예요.
export async function createOrder(shipping) {
  return (await api.post('/orders', { shipping })).data
}

// 결제창에서 결제가 끝난 뒤 서버에 확인 요청 → 결제 완료된 주문
export async function completeOrder(paymentId) {
  return (await api.post('/orders/complete', { paymentId })).data
}

// 결제창 실패·취소 기록 → 결제 실패
export async function failOrder(orderNumber, { code, message } = {}) {
  return (await api.post(`${path(orderNumber)}/fail`, { code, message })).data
}

// 내 주문 상세
export async function getMyOrder(orderNumber, options) {
  return (await api.get(path(orderNumber), options)).data
}

// 내 주문 목록 → { orders, counts, pagination }
// - status: 'all' | 'paid' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
// - counts: 상태별 건수 { all, paid, preparing, shipping, delivered, cancelled }
export async function listMyOrders({ status = 'all', page = 1, limit = 10 } = {}, options) {
  const query = new URLSearchParams({ status, page: String(page), limit: String(limit) })
  const res = await api.get(`/orders?${query}`, options)
  return { orders: res.data, counts: res.counts, pagination: res.pagination }
}

// 주문 취소 (결제 완료일 때만)
export async function cancelMyOrder(orderNumber, reason) {
  return (await api.post(`${path(orderNumber)}/cancel`, { reason })).data
}
