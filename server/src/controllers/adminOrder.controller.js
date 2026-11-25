// 상점주 주문 관리 API - admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 와요.
// - 목록: 상태별로 거르고 페이지 단위로 (기본: 결제된 주문만)
// - 상세: 주문서 + 주문한 회원 이름·이메일 (탈퇴한 회원이면 customer: null)
// - 상태 바꾸기: 결제 완료 → 상품 준비중 → 배송중 → 배송완료, 취소(결제 취소 + 재고 되돌림)
import Order, { CUSTOMER_VISIBLE_STATUSES, ORDER_STATUSES, ORDER_STATUS_LABEL } from '../models/Order.js';
import { AppError } from '../utils/AppError.js';
import { cancelOrder, readPaging, toOrderResponse, toOrderSummary } from '../services/orderService.js';

const CUSTOMER_FIELDS = 'name email';

async function findOrder(orderNumber) {
  const order = await Order.findOne({ orderNumber }).populate('user', CUSTOMER_FIELDS);
  if (!order) throw new AppError(404, '주문을 찾을 수 없어요.');
  return order;
}

function withCustomer(order) {
  const data = toOrderResponse(order);
  data.customer = order.user ? { _id: order.user._id, name: order.user.name, email: order.user.email } : null; // null = 탈퇴한 회원
  data.user = order.user?._id ?? null;
  return data;
}

// [목록] GET /api/admin/orders?status=paid&page=1&limit=10
// - status 를 주지 않으면 결제된 주문(결제 완료·상품 준비중·배송중·배송완료·주문 취소)을 모두 보여 줘요.
// - status=all 이면 결제 대기·결제 실패까지 전부
export async function listOrders(req, res) {
  const { page, limit, skip } = readPaging(req.query, 10);
  const { status } = req.query;
  let filter;
  if (!status) filter = { status: { $in: CUSTOMER_VISIBLE_STATUSES } };
  else if (status === 'all') filter = {};
  else if (ORDER_STATUSES.includes(status)) filter = { status };
  else throw new AppError(400, `주문 상태는 ${ORDER_STATUSES.join(', ')}, all 중 하나로 보내 주세요.`);

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).populate('user', CUSTOMER_FIELDS),
    Order.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: orders.map((order) => ({ customer: null, ...toOrderSummary(order) })), // customer: null = 탈퇴한 회원
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// [상세] GET /api/admin/orders/:orderNumber
export async function getOrder(req, res) {
  res.json({ success: true, data: withCustomer(await findOrder(req.params.orderNumber)) });
}

// [상태 바꾸기] PATCH /api/admin/orders/:orderNumber/status  body: { status, note? }
// - preparing(상품 준비중) / shipping(배송중) / delivered(배송완료) / cancelled(주문 취소)
// - 정해진 순서로만 바뀌어요. (예: 결제 완료 → 배송완료로 바로 건너뛸 수 없어요)
export async function updateOrderStatus(req, res) {
  const { status } = req.body ?? {};
  const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 200) : undefined;
  if (!['preparing', 'shipping', 'delivered', 'cancelled'].includes(status)) {
    throw new AppError(400, '바꿀 상태는 preparing, shipping, delivered, cancelled 중 하나로 보내 주세요.');
  }
  const order = await findOrder(req.params.orderNumber);

  if (status === 'cancelled') {
    await cancelOrder(order, { by: 'admin', reason: note });
  } else {
    if (!order.canChangeTo(status)) {
      throw new AppError(
        409,
        `'${ORDER_STATUS_LABEL[order.status]}'에서 '${ORDER_STATUS_LABEL[status]}'(으)로 바꿀 수 없어요.`,
      );
    }
    order.changeStatus(status, { by: 'admin', note });
    await order.save();
  }
  res.json({ success: true, data: withCustomer(order) });
}
