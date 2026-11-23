// 상품(Product) 라우터 - /api/products 아래 경로를 담당해요.
// 실제 처리 로직은 controllers/product.controller.js 에 있어요.
import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts); //        GET /api/products      진열장 상품 목록
router.get('/:id', getProductById); //  GET /api/products/:id  상품 상세

export default router;
