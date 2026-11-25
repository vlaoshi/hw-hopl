// 모든 API 라우트를 모아 /api 아래에 연결해요.
// 새 기능을 만들면 여기에 라우터를 추가하세요.
// 예) router.use('/users', userRoutes); router.use('/orders', orderRoutes);
import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './user.routes.js';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import adminRoutes from './admin.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';

const router = Router();

// 회원 CRUD
router.use('/users', userRoutes);

// 인증 (로그인, 내 정보)
router.use('/auth', authRoutes);

// 상품 (진열장 목록, 상세)
router.use('/products', productRoutes);

// 장바구니 (로그인한 회원 자기 것만)
router.use('/cart', cartRoutes);

// 주문 (로그인한 회원 자기 것만)
router.use('/orders', orderRoutes);

// 관리자 (하플 상점주 대시보드) - 관리자만
router.use('/admin', adminRoutes);

// 서버와 DB 상태 확인용
router.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    status: 'ok',
    db: dbStates[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

export default router;
