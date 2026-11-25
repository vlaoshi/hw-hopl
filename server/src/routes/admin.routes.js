// 관리자(상점주) 라우터 - /api/admin 아래 경로를 담당해요.
// 이 라우터의 모든 경로는 로그인(requireAuth) + 관리자(requireAdmin)만 쓸 수 있어요.
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { getStats } from '../controllers/admin.controller.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addPhotos,
  removePhoto,
} from '../controllers/adminProduct.controller.js';
import { listOrders, getOrder, updateOrderStatus } from '../controllers/adminOrder.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', getStats); // GET /api/admin/stats  대시보드 요약 숫자

// 상품 관리
router.route('/products')
  .get(listProducts) //   GET  /api/admin/products?page=1&limit=5  목록 (숨긴 상품 포함, 페이지 단위)
  .post(createProduct); // POST /api/admin/products  등록

router.route('/products/:id')
  .get(getProduct) //       GET    /api/admin/products/:id  상세
  .patch(updateProduct) //  PATCH  /api/admin/products/:id  수정 (진열 숨기기: { isActive: false })
  .delete(deleteProduct); // DELETE /api/admin/products/:id  삭제

router.route('/products/:id/photos')
  .post(addPhotos) //     POST   사진 추가 { urls } (Cloudinary에 올린 사진 주소)
  .delete(removePhoto); // DELETE 사진 빼기 { url }

// 주문 관리
router.get('/orders', listOrders); //                          GET   /api/admin/orders?status=&page=  주문 목록
router.get('/orders/:orderNumber', getOrder); //               GET   /api/admin/orders/:orderNumber   주문 상세
router.patch('/orders/:orderNumber/status', updateOrderStatus); // PATCH /api/admin/orders/:orderNumber/status { status, note }

export default router;
