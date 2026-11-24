// 장바구니(Cart) 라우터 - /api/cart 아래 경로를 담당해요.
// 모든 경로는 로그인한 회원만 쓸 수 있고, 자기 장바구니만 다뤄요. (requireAuth)
// 실제 처리 로직은 controllers/cart.controller.js 에 있어요.
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../controllers/cart.controller.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(getCart) //       GET    /api/cart  내 장바구니 보기
  .delete(clearCart); // DELETE /api/cart  비우기

router.post('/items', addItem); //                 POST   /api/cart/items             담기 { productId, quantity }
router.route('/items/:productId')
  .patch(updateItem) //  PATCH  /api/cart/items/:productId  수량 바꾸기 { quantity }
  .delete(removeItem); // DELETE /api/cart/items/:productId  빼기

export default router;
