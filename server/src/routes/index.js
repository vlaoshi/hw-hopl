// 모든 API 라우트를 모아 /api 아래에 연결해요.
// 새 기능을 만들면 여기에 라우터를 추가하세요.
// 예) router.use('/users', userRoutes); router.use('/orders', orderRoutes);
import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './user.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// 회원 CRUD
router.use('/users', userRoutes);

// 인증 (로그인, 내 정보)
router.use('/auth', authRoutes);

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
