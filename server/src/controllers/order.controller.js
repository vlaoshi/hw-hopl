// 손님 주문 API - 로그인한 회원이 자기 주문만 다뤄요. (order.routes.js 에서 requireAuth)
//
// 주문 흐름 (토스페이먼츠 결제창 기준)
//   1) POST /api/orders           장바구니 + 배송지 → 주문서(결제 대기). 응답의 orderNumber·orderName·totalAmount 로 결제창을 열어요.
//   2) 결제창에서 성공 → POST /api/orders/confirm { paymentKey, orderId, amount }
//      금액 확인 → 재고 줄이기 → 토스 승인 → 결제 완료 + 장바구니에서 주문한 물건 빼기
//   2') 결제창에서 실패·중단 → POST /api/orders/:orderNumber/fail { code, message } → 결제 실패
//   3) GET /api/orders, GET /api/orders/:orderNumber  내 주문 목록·상세
//   4) POST /api/orders/:orderNumber/cancel { reason }  결제 완료일 때만 취소 (결제 취소 + 재고 되돌림)
import Cart from '../models/Cart.js';
import Order, { CUSTOMER_VISIBLE_STATUSES } from '../models/Order.js';
import { getSaleStatus } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { TossError, confirmPayment } from '../utils/tossPayments.js';
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

// [결제 승인] POST /api/orders/confirm  body: { paymentKey, orderId(=주문번호), amount }
export async function confirmOrder(req, res) {
  const { paymentKey, orderId, amount } = req.body ?? {};
  if (typeof paymentKey !== 'string' || !paymentKey || typeof orderId !== 'string' || !Number.isInteger(amount)) {
    throw new AppError(400, 'paymentKey, orderId, amount 를 모두 보내 주세요.');
  }
  const order = await findMyOrder(req, orderId);

  // 이미 같은 결제로 승인된 주문이면 그대로 돌려줘요. (새로고침으로 두 번 와도 안전하게)
  if (order.status !== 'awaiting_payment') {
    if (order.payment.paymentKey === paymentKey && order.payment.status === 'done') {
      return res.json({ success: true, data: toOrderResponse(order) });
    }
    throw new AppError(409, '이미 처리된 주문이에요.');
  }
  // 금액 확인: 결제창에서 넘어온 금액이 주문서 금액과 다르면 승인하지 않아요. (금액 조작 방지)
  if (amount !== order.totalAmount) throw new AppError(400, '결제 금액이 주문 금액과 맞지 않아요.');

  const fail = async (code, message) => {
    order.payment.status = 'failed';
    order.payment.failCode = code;
    order.payment.failMessage = message;
    order.changeStatus('payment_failed', { by: 'system', note: message });
    await order.save();
  };

  // 1) 재고 줄이기 (모자라면 결제 승인 전에 멈춰요 → 손님 돈은 빠져나가지 않아요)
  try {
    await deductStock(order.items);
  } catch (err) {
    await fail('OUT_OF_STOCK', err.message);
    throw err;
  }

  // 2) 토스 승인 (실패하면 줄였던 재고를 되돌려요)
  let payment;
  try {
    payment = await confirmPayment({ paymentKey, orderId: order.orderNumber, amount: order.totalAmount });
  } catch (err) {
    await restoreStock(order.items);
    if (err instanceof TossError) {
      await fail(err.code, err.message);
      throw new AppError(400, `결제 승인에 실패했어요. (${err.message})`);
    }
    throw err;
  }

  // 3) 결제 완료
  order.payment.status = 'done';
  order.payment.paymentKey = payment.paymentKey ?? paymentKey;
  order.payment.method = payment.method;
  order.payment.approvedAt = payment.approvedAt ? new Date(payment.approvedAt) : new Date();
  order.payment.receiptUrl = payment.receipt?.url;
  order.stockDeducted = true;
  order.changeStatus('paid', { by: 'system', note: '결제 승인' });
  await order.save();

  // 4) 장바구니에서 주문한 물건 빼기 (주문 뒤 새로 담은 물건은 남겨요)
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    order.items.forEach((item) => cart.removeItem(item.product));
    await cart.save();
  }

  res.json({ success: true, data: toOrderResponse(order) });
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

// [내 주문 목록] GET /api/orders?page=1&limit=10 - 결제된 주문만, 최근 순
export async function listMyOrders(req, res) {
  const { page, limit, skip } = readPaging(req.query, 10);
  const filter = { user: req.user._id, status: { $in: CUSTOMER_VISIBLE_STATUSES } };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: orders.map(toOrderSummary),
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

