// 주문(Order) 라우터 - /api/orders 아래 경로를 담당해요.
// 모든 경로는 로그인한 회원만 쓸 수 있고, 자기 주문만 다뤄요. (requireAuth)
// 실제 처리 로직은 controllers/order.controller.js 에 있어요.
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  createOrder,
  confirmOrder,
  failOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
} from '../controllers/order.controller.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(listMyOrders) //  GET  /api/orders   내 주문 목록 (결제된 주문만)
  .post(createOrder); // POST /api/orders   장바구니로 주문서 만들기 (결제 대기)

router.post('/confirm', confirmOrder); //                 POST /api/orders/confirm             결제 승인 { paymentKey, orderId, amount }
router.get('/:orderNumber', getMyOrder); //               GET  /api/orders/:orderNumber        내 주문 상세
router.post('/:orderNumber/fail', failOrder); //          POST /api/orders/:orderNumber/fail   결제 실패 기록 { code, message }
router.post('/:orderNumber/cancel', cancelMyOrder); //    POST /api/orders/:orderNumber/cancel 주문 취소 { reason } (결제 완료일 때만)

export default router;
