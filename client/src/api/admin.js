// 관리자(하플 상점주) API 함수 - 서버에서 관리자만 호출할 수 있어요. (아니면 401/403)
import { api } from './client.js'

// 대시보드 요약 - GET /api/admin/stats → { merchants, products, orders, revenue, recentOrders }
export async function getAdminStats(options) {
  const res = await api.get('/admin/stats', options)
  return res.data
}
