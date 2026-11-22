// 인증(Auth) 라우터 - /api/auth 아래 경로를 담당해요.
// 실제 처리 로직은 controllers/auth.controller.js 에 있어요.
import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login); //         POST /api/auth/login  로그인 (토큰 발급)
router.get('/me', requireAuth, getMe); // GET  /api/auth/me     내 정보 (토큰 필요)

export default router;
