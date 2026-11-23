// 하플 상점주 대시보드(관리자) 로직
// admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 여기로 와요.
import User from '../models/User.js';
import Product from '../models/Product.js';

// [대시보드 요약] GET /api/admin/stats
// - merchants: 총 교역 상인 (일반 회원 수, 관리자는 빼요)
// - products: 총 상품 (판매 중지 상품 포함)
// - orders, revenue, recentOrders: 주문 기능이 아직 없어서 0 / 빈 목록이에요.
//   (주문(Order) 모델을 만들면 여기서 함께 계산해요)
export async function getStats(req, res) {
  const [merchants, products] = await Promise.all([
    User.countDocuments({ user_type: 'customer' }),
    Product.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      merchants,
      products,
      orders: 0,
      revenue: 0,
      recentOrders: [],
    },
  });
}
