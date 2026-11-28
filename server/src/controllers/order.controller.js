// 손님 주문 API - 로그인한 회원이 자기 주문만 다뤄요. (order.routes.js 에서 requireAuth)
//
// 주문 흐름 (포트원 V2 · KG이니시스 결제창 기준)
//   1) POST /api/orders           장바구니 + 배송지 → 주문서(결제 대기). 응답의 orderNumber(=포트원 paymentId)·orderName·totalAmount 로 결제창을 열어요.
//   2) 결제창에서 결제 끝 → POST /api/orders/complete { paymentId }
//      포트원 결제 조회 → 상태·금액 확인 → 재고 줄이기 → 결제 완료 + 장바구니에서 주문한 물건 빼기
//      (금액이 다르거나 재고가 모자라면 결제를 자동 취소(환불)하고 결제 실패)
//   2') 결제창에서 실패·중단 → POST /api/orders/:orderNumber/fail { code, message } → 결제 실패
//   3) GET /api/orders, GET /api/orders/:orderNumber  내 주문 목록·상세
//   4) POST /api/orders/:orderNumber/cancel { reason }  결제 완료일 때만 취소 (결제 취소 + 재고 되돌림)
import Cart from '../models/Cart.js';
import Order, { CUSTOMER_VISIBLE_STATUSES, MIN_PAYMENT_AMOUNT } from '../models/Order.js';
import { getSaleStatus } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { PortOneError, cancelPayment, describePaymentMethod, getPayment } from '../utils/portone.js';
import {
  cancelOrder as cancelOrderFlow,
  deductStock,
  readPaging,
  restoreStock,
  toOrderResponse,
  toOrderSummary,
} from '../services/orderService.js';

// 내 주문 찾기 (주문번호로, 다른 회원 주문은 없는 것처럼 404)
async function findMyOrder(req, orderNumber) {
  const order = await Order.findOne({ orderNumber, user: req.user._id });
  if (!order) throw new AppError(404, '주문을 찾을 수 없어요.');
  return order;
}

// 배송지 읽기 (문자열만 받아요. 형식 검사는 Order 스키마가 해요)
function readShipping(body = {}) {
  const pick = (key) => (typeof body[key] === 'string' ? body[key] : undefined);
  return {
    recipient: pick('recipient'),
    phone: pick('phone'),
    zipCode: pick('zipCode'),
    address1: pick('address1'),
    address2: pick('address2'),
    memo: pick('memo'),
  };
}

// [주문서 만들기] POST /api/orders  body: { shipping: { recipient, phone, zipCode, address1, address2?, memo? } }
// 장바구니의 모든 물건이 주문 가능해야 해요. (품절·재고 부족 등이 있으면 장바구니에서 먼저 정리)
export async function createOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const lines = (cart?.items ?? []).filter((line) => line.product); // 지워진 상품은 빼요
  if (lines.length === 0) throw new AppError(400, '장바구니가 비어 있어요.');

  const items = [];
  for (const { product, quantity } of lines) {
    if (!product.isActive || getSaleStatus(product) !== 'available') {
      throw new AppError(409, `'${product.name}'은(는) 지금 주문할 수 없어요. 장바구니를 확인해 주세요.`);
    }
    if (quantity > product.stock) {
      throw new AppError(409, `'${product.name}'은(는) 재고가 ${product.stock}개예요. 장바구니에서 수량을 맞춰 주세요.`);
    }
    items.push({
      product: product._id,
      sku: product.sku,
      name: product.name,
      image: product.image,
      price: product.price, // 가격은 지금 상품 가격으로 서버가 정해요.
      quantity,
      lineTotal: product.price * quantity,
    });
  }

  const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = 0; // 배송비: 항상 무료
  // 결제창을 열기 전에 최소 금액을 확인해요. (KG이니시스 카드 결제는 1,000원부터)
  if (itemsTotal + shippingFee < MIN_PAYMENT_AMOUNT) {
    throw new AppError(400, `카드 결제는 ${MIN_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 이상부터 할 수 있어요. 물건을 더 담아 주세요.`);
  }
  const order = await Order.create({
    user: req.user._id,
    orderName: items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0].name,
    items,
    itemsTotal,
    shippingFee,
    totalAmount: itemsTotal + shippingFee,
    shipping: readShipping(req.body?.shipping),
  });

  res.status(201).json({ success: true, data: toOrderResponse(order) });
}

// [결제 완료 확인] POST /api/orders/complete  body: { paymentId(=주문번호) }
// 결제창(포트원 KG이니시스)에서 결제가 끝나면 화면이 이 주소를 불러요.
// 화면이 받은 결과는 믿지 않고, 서버가 포트원에 직접 조회해서 확인해요.
//   1) 포트원 결제 조회 → 상태가 PAID 인가?
//   2) 결제 금액·통화가 주문서와 같은가? (다르면 결제를 취소하고 결제 실패)
//   3) 재고 줄이기 (모자라면 결제를 취소(환불)하고 결제 실패)
//   4) 결제 완료 + 장바구니에서 주문한 물건 빼기
export async function completeOrder(req, res) {
  const { paymentId } = req.body ?? {};
  if (typeof paymentId !== 'string' || !paymentId) throw new AppError(400, 'paymentId 를 보내 주세요.');
  const order = await findMyOrder(req, paymentId);

  // 이미 처리된 주문 (새로고침, 결제창 결과와 모바일 돌아오기가 함께 온 경우 등)
  if (order.status !== 'awaiting_payment') {
    if (order.status === 'paid' || order.payment.status === 'done') return res.json({ success: true, data: toOrderResponse(order) });
    throw new AppError(409, '이미 처리된 주문이에요.');
  }

  // 1) 포트원에서 결제 조회
  let payment;
  try {
    payment = await getPayment(order.orderNumber);
  } catch (err) {
    if (err instanceof PortOneError && err.status === 404) throw new AppError(400, '결제 정보를 찾을 수 없어요. 결제를 다시 진행해 주세요.');
    if (err instanceof PortOneError) throw new AppError(502, `결제를 확인하지 못했어요. (${err.message})`);
    throw err;
  }
  if (payment.status === 'READY' || payment.status === 'PAY_PENDING') {
    throw new AppError(409, '결제가 아직 끝나지 않았어요. 결제창에서 결제를 마쳐 주세요.');
  }
  if (payment.status !== 'PAID') {
    await markFailed(order, payment.status, payment.failure?.pgMessage || payment.failure?.reason || '결제가 완료되지 않았어요.');
    throw new AppError(400, '결제가 완료되지 않았어요. 다시 시도해 주세요.');
  }

  // 같은 주문을 두 군데서 동시에 확인하지 않도록 '확인 중'으로 먼저 잡아 둬요. (한 번만 처리)
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: 'awaiting_payment', 'payment.status': { $in: ['ready', 'failed'] } },
    { $set: { 'payment.status': 'processing' } },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    const latest = await Order.findById(order._id);
    if (latest.status === 'paid') return res.json({ success: true, data: toOrderResponse(latest) });
    throw new AppError(409, '결제를 확인하는 중이에요. 잠시 후 주문 내역을 확인해 주세요.');
  }

  // 2) 금액·통화 확인 (다르면 결제를 되돌려요)
  if (payment.amount?.total !== claimed.totalAmount || payment.currency !== 'KRW') {
    await refundAndFail(claimed, 'AMOUNT_MISMATCH', '결제 금액이 주문 금액과 맞지 않아 결제를 취소했어요.');
    throw new AppError(400, '결제 금액이 주문 금액과 맞지 않아 결제를 취소했어요.');
  }

  // 3) 재고 줄이기 (모자라면 결제를 되돌려요)
  try {
    await deductStock(claimed.items);
  } catch (err) {
    if (!(err instanceof AppError)) throw err;
    await refundAndFail(claimed, 'OUT_OF_STOCK', `${err.message} 결제는 자동으로 취소했어요.`);
    throw new AppError(409, `${err.message} 결제는 자동으로 취소했어요.`);
  }

  // 4) 결제 완료
  claimed.payment.status = 'done';
  claimed.payment.transactionId = payment.transactionId;
  claimed.payment.pgTxId = payment.pgTxId;
  claimed.payment.method = describePaymentMethod(payment.method);
  claimed.payment.approvedAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  claimed.payment.receiptUrl = payment.receiptUrl;
  claimed.stockDeducted = true;
  claimed.changeStatus('paid', { by: 'system', note: '결제 완료' });
  await claimed.save();

  // 장바구니에서 주문한 물건 빼기 (주문 뒤 새로 담은 물건은 남겨요)
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    claimed.items.forEach((item) => cart.removeItem(item.product));
    await cart.save();
  }

  res.json({ success: true, data: toOrderResponse(claimed) });
}

// 결제 실패로 정리 (결제가 안 된 경우)
async function markFailed(order, code, message) {
  order.payment.status = 'failed';
  order.payment.failCode = String(code).slice(0, 100);
  order.payment.failMessage = String(message).slice(0, 200);
  order.changeStatus('payment_failed', { by: 'system', note: message });
  await order.save();
}

// 결제는 됐지만 주문을 받을 수 없을 때: 포트원 결제 취소(환불) → 결제 실패로 정리
async function refundAndFail(order, code, message) {
  let refunded = true;
  try {
    await cancelPayment(order.orderNumber, { reason: message, requester: 'ADMIN' });
  } catch (err) {
    refunded = err instanceof PortOneError && err.type === 'PAYMENT_ALREADY_CANCELLED';
    console.error('[ORDER] 자동 결제 취소 실패:', order.orderNumber, err.message);
  }
  order.payment.status = refunded ? 'canceled' : 'done'; // 환불을 못 했으면 상점주가 확인할 수 있게 결제 완료로 남겨요.
  order.payment.failCode = code;
  order.payment.failMessage = refunded ? message : `${message} (자동 환불 실패 - 상점주 확인 필요)`;
  if (refunded) {
    order.payment.canceledAt = new Date();
    order.payment.cancelReason = message;
  }
  order.changeStatus('payment_failed', { by: 'system', note: order.payment.failMessage });
  await order.save();
}

// [결제 실패 기록] POST /api/orders/:orderNumber/fail  body: { code?, message? }
// 결제창에서 실패하거나 손님이 창을 닫으면 토스가 실패 주소로 보내요. 그때 주문을 '결제 실패'로 정리해요.
export async function failOrder(req, res) {
  const order = await findMyOrder(req, req.params.orderNumber);
  if (order.status !== 'awaiting_payment') throw new AppError(409, '이미 처리된 주문이에요.');
  const code = typeof req.body?.code === 'string' ? req.body.code.slice(0, 100) : 'PAY_PROCESS_ABORTED';
  const message = typeof req.body?.message === 'string' ? req.body.message.slice(0, 200) : '결제를 마치지 않았어요.';
  order.payment.status = 'failed';
  order.payment.failCode = code;
  order.payment.failMessage = message;
  order.changeStatus('payment_failed', { by: 'customer', note: message });
  await order.save();
  res.json({ success: true, data: toOrderResponse(order) });
}

// [내 주문 목록] GET /api/orders?status=&page=1&limit=10 - 결제된 주문만, 최근 순
// - status: paid·preparing·shipping·delivered·cancelled 중 하나로 거르기 (없거나 all 이면 전체)
// - counts: 상태별 건수 { all, paid, preparing, shipping, delivered, cancelled } (주문 내역 탭에 써요)
export async function listMyOrders(req, res) {
  const { page, limit, skip } = readPaging(req.query, 10);
  const { status } = req.query;
  if (status && status !== 'all' && !CUSTOMER_VISIBLE_STATUSES.includes(status)) {
    throw new AppError(400, `주문 상태는 ${CUSTOMER_VISIBLE_STATUSES.join(', ')}, all 중 하나로 보내 주세요.`);
  }
  const mine = { user: req.user._id, status: { $in: CUSTOMER_VISIBLE_STATUSES } };
  const filter = status && status !== 'all' ? { user: req.user._id, status } : mine;

  const [orders, total, grouped] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: mine }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(CUSTOMER_VISIBLE_STATUSES.map((key) => [key, 0]));
  grouped.forEach(({ _id, count }) => (counts[_id] = count));
  counts.all = Object.values(counts).reduce((sum, n) => sum + n, 0);

  res.json({
    success: true,
    data: orders.map(toOrderSummary),
    counts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// [내 주문 상세] GET /api/orders/:orderNumber
export async function getMyOrder(req, res) {
  res.json({ success: true, data: toOrderResponse(await findMyOrder(req, req.params.orderNumber)) });
}

// [주문 취소] POST /api/orders/:orderNumber/cancel  body: { reason? }
// 손님은 '결제 완료'일 때만 취소할 수 있어요. (상품 준비중부터는 상점주에게 문의)
export async function cancelMyOrder(req, res) {
  const order = await findMyOrder(req, req.params.orderNumber);
  if (order.status !== 'paid') {
    throw new AppError(409, '결제 완료 상태에서만 직접 취소할 수 있어요. 상품 준비가 시작된 주문은 상점에 문의해 주세요.');
  }
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 200) : undefined;
  await cancelOrderFlow(order, { by: 'customer', reason });
  res.json({ success: true, data: toOrderResponse(order) });
}

