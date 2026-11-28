// 상점주 주문 관리 API - admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 와요.
// - 목록: 상태·검색어·기간으로 거르고 페이지 단위로, 상태별 건수와 오늘 요약도 함께
// - 상세: 주문서 + 주문한 회원 이름·이메일 (탈퇴한 회원이면 customer: null)
// - 상태 바꾸기: 결제 완료 → 상품 준비중 → 배송중(택배사·송장번호) → 배송완료, 취소(결제 취소 + 재고 되돌림)
import User from '../models/User.js';
import Order, { DELIVERY_CARRIERS, ORDER_STATUSES, ORDER_STATUS_LABEL } from '../models/Order.js';
import { AppError } from '../utils/AppError.js';
import { cancelOrder, readPaging, toOrderResponse, toOrderSummary } from '../services/orderService.js';

const CUSTOMER_FIELDS = 'name email';

// 상태 탭 묶음
// - active: 처리 중 (결제 완료·상품 준비중·배송중) ← 기본 탭
// - paid_all: 결제된 주문 전부 (취소 포함)
// - unpaid: 결제 대기·결제 실패 (결제가 안 된 주문, 문제 확인용)
const STATUS_GROUPS = {
  active: ['paid', 'preparing', 'shipping'],
  paid_all: ['paid', 'preparing', 'shipping', 'delivered', 'cancelled'],
  unpaid: ['awaiting_payment', 'payment_failed'],
};
const SALES_STATUSES = ['paid', 'preparing', 'shipping', 'delivered']; // 매출로 세는 상태 (취소 제외)
const PERIOD_DAYS = { today: 0, '7d': 7, '30d': 30 };

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

// 오늘 0시 (한국 시간)
function startOfTodayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000);
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 3600_000);
}

// 정규식 특수문자를 글자 그대로 찾도록 바꿔요. (검색어에 . * ( 등이 있어도 안전하게)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 검색어·기간 조건 (상태 조건은 빼고) - 상태별 건수도 같은 조건으로 세요.
async function buildBaseFilter({ q, period }) {
  const filter = {};
  if (period && period !== 'all') {
    if (!(period in PERIOD_DAYS)) throw new AppError(400, '기간은 today, 7d, 30d, all 중 하나로 보내 주세요.');
    const from = startOfTodayKST();
    from.setTime(from.getTime() - PERIOD_DAYS[period] * 86400_000);
    filter.createdAt = { $gte: from };
  }
  const keyword = typeof q === 'string' ? q.trim().slice(0, 50) : '';
  if (keyword) {
    const re = new RegExp(escapeRegex(keyword), 'i');
    const digits = keyword.replace(/\D/g, '');
    const users = await User.find({ $or: [{ name: re }, { email: re }] }).select('_id').limit(200);
    filter.$or = [
      { orderNumber: re },
      { 'shipping.recipient': re },
      { user: { $in: users.map((u) => u._id) } },
      ...(digits.length >= 4 ? [{ 'shipping.phone': new RegExp(digits.split('').join('-?')) }] : []), // 01012345678 로 찾아도 010-1234-5678 이 나와요
    ];
  }
  return filter;
}

function statusCondition(status) {
  if (!status || status === 'active') return { $in: STATUS_GROUPS.active };
  if (status === 'all') return undefined;
  if (STATUS_GROUPS[status]) return { $in: STATUS_GROUPS[status] };
  if (ORDER_STATUSES.includes(status)) return status;
  throw new AppError(400, `주문 상태는 ${[...Object.keys(STATUS_GROUPS), 'all', ...ORDER_STATUSES].join(', ')} 중 하나로 보내 주세요.`);
}

// 목록 한 줄 (상점주 표에 필요한 값)
function toAdminRow(order) {
  return {
    ...toOrderSummary(order),
    customer: order.user ? { _id: order.user._id, name: order.user.name, email: order.user.email } : null, // null = 탈퇴한 회원
    recipient: order.shipping?.recipient,
    phone: order.shipping?.phone,
    paymentMethod: order.payment?.method,
    delivery: order.delivery?.carrier ? { carrier: order.delivery.carrier, trackingNumber: order.delivery.trackingNumber } : null,
  };
}

// [목록] GET /api/admin/orders?status=active&q=&period=all&page=1&limit=10
// - status: active(처리 중, 기본) | paid_all | unpaid | all | 상태 코드(paid·preparing·shipping·delivered·cancelled·awaiting_payment·payment_failed)
// - q: 주문번호·주문자 이름/이메일·받는 분·연락처 검색 / period: today | 7d | 30d | all
// - 응답: data(주문 줄), counts(상태별 건수, 검색·기간 조건 안에서), summary(오늘 주문 수·매출, 처리할 새 주문 수), pagination
export async function listOrders(req, res) {
  const { page, limit, skip } = readPaging(req.query, 10);
  const base = await buildBaseFilter(req.query);
  const condition = statusCondition(req.query.status);
  const filter = condition ? { ...base, status: condition } : base;
  const today = startOfTodayKST();

  const [orders, total, grouped, todayRows, newCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).populate('user', CUSTOMER_FIELDS),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $in: SALES_STATUSES } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ status: 'paid' }),
  ]);

  const counts = Object.fromEntries(ORDER_STATUSES.map((key) => [key, 0]));
  grouped.forEach(({ _id, count }) => (counts[_id] = count));
  const sum = (keys) => keys.reduce((n, key) => n + counts[key], 0);
  counts.active = sum(STATUS_GROUPS.active);
  counts.paid_all = sum(STATUS_GROUPS.paid_all);
  counts.unpaid = sum(STATUS_GROUPS.unpaid);
  counts.all = sum(ORDER_STATUSES);

  res.json({
    success: true,
    data: orders.map(toAdminRow),
    counts,
    summary: {
      todayOrders: todayRows[0]?.count ?? 0,
      todayRevenue: todayRows[0]?.revenue ?? 0,
      newOrders: newCount, // 처리할 새 주문 (결제 완료, 아직 상품 준비 전)
    },
    carriers: DELIVERY_CARRIERS,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// [상세] GET /api/admin/orders/:orderNumber
export async function getOrder(req, res) {
  const data = withCustomer(await findOrder(req.params.orderNumber));
  res.json({ success: true, data: { ...data, carriers: DELIVERY_CARRIERS } });
}

// [상태 바꾸기] PATCH /api/admin/orders/:orderNumber/status  body: { status, note?, carrier?, trackingNumber? }
// - preparing(상품 준비중) / shipping(배송중: 택배사 필수, 송장번호 필수 - '직접 배송'은 송장번호 없이) / delivered(배송완료) / cancelled(주문 취소)
// - 정해진 순서로만 바뀌어요. (예: 결제 완료 → 배송완료로 바로 건너뛸 수 없어요)
export async function updateOrderStatus(req, res) {
  const { status, carrier } = req.body ?? {};
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 200) : undefined;
  const trackingNumber = typeof req.body?.trackingNumber === 'string' ? req.body.trackingNumber.trim() : '';
  if (!['preparing', 'shipping', 'delivered', 'cancelled'].includes(status)) {
    throw new AppError(400, '바꿀 상태는 preparing, shipping, delivered, cancelled 중 하나로 보내 주세요.');
  }
  const order = await findOrder(req.params.orderNumber);

  if (status === 'cancelled') {
    await cancelOrder(order, { by: 'admin', reason: note });
    return res.json({ success: true, data: withCustomer(order) });
  }

  if (!order.canChangeTo(status)) {
    throw new AppError(409, `'${ORDER_STATUS_LABEL[order.status]}'에서 '${ORDER_STATUS_LABEL[status]}'(으)로 바꿀 수 없어요.`);
  }
  if (status === 'shipping') {
    if (!DELIVERY_CARRIERS.includes(carrier)) throw new AppError(400, '택배사를 골라 주세요.');
    if (carrier !== '직접 배송' && !trackingNumber) throw new AppError(400, '송장번호를 넣어 주세요.');
    order.delivery.carrier = carrier;
    order.delivery.trackingNumber = trackingNumber || undefined;
    order.delivery.shippedAt = new Date();
  }
  if (status === 'delivered') order.delivery.deliveredAt = new Date();

  const autoNote = status === 'shipping' ? `${carrier}${trackingNumber ? ` ${trackingNumber}` : ''}` : undefined;
  order.changeStatus(status, { by: 'admin', note: note || autoNote });
  await order.save();
  res.json({ success: true, data: withCustomer(order) });
}
