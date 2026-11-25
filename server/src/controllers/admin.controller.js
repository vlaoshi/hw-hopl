// 하플 상점주 대시보드(관리자) 로직
// admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 여기로 와요.
import User from '../models/User.js';
import Product, { LOW_STOCK_THRESHOLD } from '../models/Product.js';
import Order, { ORDER_STATUS_LABEL } from '../models/Order.js';

// [대시보드 요약] GET /api/admin/stats
// - merchants: 총 교역 상인 (일반 회원 수, 관리자는 빼요)
// - products: 총 상품 (판매 중지 상품 포함)
// - stock: 재고 알림
//   { soldOut: 품절(재입고 예정) 수, lowStock: 재고 적음(1~3개) 수, ended: 판매 완료 수, threshold,
//     alerts: 채워야 할 상품(품절·재고 적음) 재고 적은 순 최대 5개 }
//   판매 종료(discontinued) 상품은 더 들여오지 않으니 알림에서 빼요.
// - orders: 총 주문 (결제된 주문 - 결제 완료·상품 준비중·배송중·배송완료, 취소 제외)
// - revenue: 총 매출 (위 주문들의 결제 금액 합)
// - recentOrders: 최근 주문 5개 (취소 포함) { _id, orderNumber, customerName, status, statusLabel, total, createdAt }
export async function getStats(req, res) {
  const restockable = { discontinued: { $ne: true } };
  const SALES_STATUSES = ['paid', 'preparing', 'shipping', 'delivered'];
  const [merchants, products, soldOut, lowStock, ended, alerts, orders, revenueRows, recent] = await Promise.all([
    User.countDocuments({ user_type: 'customer' }),
    Product.countDocuments(),
    Product.countDocuments({ ...restockable, stock: { $lte: 0 } }),
    Product.countDocuments({ ...restockable, stock: { $gte: 1, $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ discontinued: true, stock: { $lte: 0 } }),
    Product.find({ ...restockable, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, sortOrder: 1, _id: 1 })
      .limit(5)
      .select('name image stock discontinued isActive sku'),
    Order.countDocuments({ status: { $in: SALES_STATUSES } }),
    Order.aggregate([{ $match: { status: { $in: SALES_STATUSES } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.find({ status: { $in: [...SALES_STATUSES, 'cancelled'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name'),
  ]);
  const recentOrders = recent.map((order) => ({
    _id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.user?.name ?? '탈퇴한 회원',
    status: order.status,
    statusLabel: ORDER_STATUS_LABEL[order.status],
    total: order.totalAmount,
    createdAt: order.createdAt,
  }));

  res.json({
    success: true,
    data: {
      merchants,
      products,
      stock: { soldOut, lowStock, ended, threshold: LOW_STOCK_THRESHOLD, alerts },
      orders,
      revenue: revenueRows[0]?.total ?? 0,
      recentOrders,
    },
  });
}
