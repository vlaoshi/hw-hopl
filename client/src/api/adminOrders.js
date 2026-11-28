// 상점주 주문 관리 API 함수 (서버: /api/admin/orders, 관리자만)
import { api } from './client.js'

const path = (orderNumber) => `/admin/orders/${encodeURIComponent(orderNumber)}`

// 주문 목록 → { orders, counts, summary, carriers, pagination }
// - status: active(처리 중) | paid_all | unpaid | all | 상태 코드
// - q: 검색어 (주문번호·주문자·받는 분·연락처) / period: today | 7d | 30d | all
export async function listAdminOrders({ status = 'active', q = '', period = 'all', page = 1, limit = 10 } = {}, options) {
  const query = new URLSearchParams({ status, period, page: String(page), limit: String(limit) })
  if (q) query.set('q', q)
  const res = await api.get(`/admin/orders?${query}`, options)
  return { orders: res.data, counts: res.counts, summary: res.summary, carriers: res.carriers, pagination: res.pagination }
}

// 주문 상세 (상태 기록·배송지·결제 정보 포함)
export async function getAdminOrder(orderNumber, options) {
  return (await api.get(path(orderNumber), options)).data
}

// 상태 바꾸기 → 바뀐 주문
// - { status: 'preparing' } / { status: 'shipping', carrier, trackingNumber } / { status: 'delivered' } / { status: 'cancelled', note }
export async function updateAdminOrderStatus(orderNumber, body) {
  return (await api.patch(`${path(orderNumber)}/status`, body)).data
}
