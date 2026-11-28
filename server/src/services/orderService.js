// 주문 규칙 모음 - 손님 주문 API(order.controller)와 상점주 주문 관리(adminOrder.controller)가 함께 써요.
// - 재고 줄이기·되돌리기
// - 주문 취소 (포트원 결제 취소 → 재고 되돌리기 → 주문 취소 상태)
// - 응답 모양 맞추기
//
// ※ 로컬 MongoDB 는 트랜잭션을 쓸 수 없는 단독 서버라,
//   "재고가 충분할 때만 줄이기(조건부 업데이트)" + "실패하면 줄인 만큼 되돌리기"로 맞춰요.
import Product from '../models/Product.js';
import { ORDER_STATUS_LABEL } from '../models/Order.js';
import { AppError } from '../utils/AppError.js';
import { PortOneError, cancelPayment } from '../utils/portone.js';

// 주문한 물건만큼 재고를 줄여요. 하나라도 모자라면 이미 줄인 것을 되돌리고 409 를 던져요.
export async function deductStock(items) {
  const done = [];
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } }, // 재고가 충분할 때만
      { $inc: { stock: -item.quantity } },
    );
    if (result.modifiedCount !== 1) {
      await restoreStock(done);
      throw new AppError(409, `'${item.name}'의 재고가 모자라 결제를 마칠 수 없어요.`);
    }
    done.push(item);
  }
}

// 줄였던 재고를 되돌려요. (상품이 지워졌으면 그 상품은 건너뛰어요)
export async function restoreStock(items) {
  for (const item of items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
  }
}

// 주문 취소: 결제 취소(포트원) → 재고 되돌리기(한 번만) → '주문 취소'
// by: 'customer' | 'admin'
export async function cancelOrder(order, { by, reason }) {
  if (!order.canChangeTo('cancelled')) {
    throw new AppError(409, `'${ORDER_STATUS_LABEL[order.status]}' 상태의 주문은 취소할 수 없어요.`);
  }
  const cancelReason = reason?.trim() || (by === 'admin' ? '상점주 취소' : '고객 요청 취소');

  // 1) 결제 취소 (결제 완료된 주문만). 포트원 결제 ID = 주문번호
  if (order.payment?.status === 'done') {
    try {
      await cancelPayment(order.orderNumber, { reason: cancelReason, requester: by === 'admin' ? 'ADMIN' : 'CUSTOMER' });
    } catch (err) {
      // 이미 포트원에서 취소된 결제면 계속 진행해요. (관리자 콘솔에서 먼저 취소한 경우 등)
      if (err instanceof PortOneError && err.type === 'PAYMENT_ALREADY_CANCELLED') {
        // 그대로 아래로
      } else if (err instanceof PortOneError) {
        throw new AppError(502, `결제를 취소하지 못했어요. (${err.message})`);
      } else {
        throw err;
      }
    }
    order.payment.status = 'canceled';
    order.payment.canceledAt = new Date();
    order.payment.cancelReason = cancelReason;
  }

  // 2) 재고 되돌리기 (줄였던 주문만, 한 번만)
  if (order.stockDeducted) {
    await restoreStock(order.items);
    order.stockDeducted = false;
  }

  // 3) 상태 바꾸기
  order.changeStatus('cancelled', { by, note: cancelReason });
  await order.save();
  return order;
}

// 응답 모양: 주문서 + 화면 이름(statusLabel)
export function toOrderResponse(order) {
  const json = order.toJSON();
  return { ...json, statusLabel: ORDER_STATUS_LABEL[json.status] };
}

// 목록용 요약 (상품 줄 대신 대표 이미지·종류 수만)
export function toOrderSummary(order) {
  const json = order.toJSON();
  return {
    _id: json._id,
    orderNumber: json.orderNumber,
    orderName: json.orderName,
    image: json.items[0]?.image,
    itemCount: json.items.length,
    totalQuantity: json.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: json.totalAmount,
    status: json.status,
    statusLabel: ORDER_STATUS_LABEL[json.status],
    createdAt: json.createdAt,
    // 주문 상품 (목록 카드·다시 담기용: 이름·이미지·가격·수량만)
    items: json.items.map(({ product, name, image, price, quantity }) => ({ product, name, image, price, quantity })),
    // 마지막으로 상태가 바뀐 시각 (예: 배송완료 날짜, 취소 날짜)
    statusChangedAt: json.statusHistory?.at(-1)?.at ?? json.updatedAt,
    ...(json.user && typeof json.user === 'object' && 'name' in json.user
      ? { customer: { _id: json.user._id, name: json.user.name, email: json.user.email } }
      : {}),
  };
}

// 페이지 번호 읽기 (상품 관리 목록과 같은 규칙)
export function readPaging(query, defaultLimit = 10) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
