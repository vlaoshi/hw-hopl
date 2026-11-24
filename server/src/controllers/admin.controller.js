// 하플 상점주 대시보드(관리자) 로직
// admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 여기로 와요.
import User from '../models/User.js';
import Product, { LOW_STOCK_THRESHOLD } from '../models/Product.js';

// [대시보드 요약] GET /api/admin/stats
// - merchants: 총 교역 상인 (일반 회원 수, 관리자는 빼요)
// - products: 총 상품 (판매 중지 상품 포함)
// - stock: 재고 알림
//   { soldOut: 품절(재입고 예정) 수, lowStock: 재고 적음(1~3개) 수, ended: 판매 완료 수, threshold,
//     alerts: 채워야 할 상품(품절·재고 적음) 재고 적은 순 최대 5개 }
//   판매 종료(discontinued) 상품은 더 들여오지 않으니 알림에서 빼요.
// - orders, revenue, recentOrders: 주문 기능이 아직 없어서 0 / 빈 목록이에요.
//   (주문(Order) 모델을 만들면 여기서 함께 계산해요)
export async function getStats(req, res) {
  const restockable = { discontinued: { $ne: true } };
  const [merchants, products, soldOut, lowStock, ended, alerts] = await Promise.all([
    User.countDocuments({ user_type: 'customer' }),
    Product.countDocuments(),
    Product.countDocuments({ ...restockable, stock: { $lte: 0 } }),
    Product.countDocuments({ ...restockable, stock: { $gte: 1, $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ discontinued: true, stock: { $lte: 0 } }),
    Product.find({ ...restockable, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, sortOrder: 1, _id: 1 })
      .limit(5)
      .select('name image stock discontinued isActive sku'),
  ]);

  res.json({
    success: true,
    data: {
      merchants,
      products,
      stock: { soldOut, lowStock, ended, threshold: LOW_STOCK_THRESHOLD, alerts },
      orders: 0,
      revenue: 0,
      recentOrders: [],
    },
  });
}
