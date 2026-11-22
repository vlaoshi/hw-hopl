// 로그인이 필요한 API 앞에 붙이는 미들웨어
// 요청 헤더의 "Authorization: Bearer <토큰>"을 확인해서
// 올바르면 req.user 에 회원 정보를 넣고, 아니면 401 에러를 보내요.
//
// 사용 예) router.get('/me', requireAuth, getMe);
//         router.delete('/:id', requireAuth, requireAdmin, deleteUser);
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, '로그인이 필요해요.');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, '로그인이 만료되었어요. 다시 로그인하세요.');
    }
    throw new AppError(401, '유효하지 않은 토큰이에요. 다시 로그인하세요.');
  }

  // 토큰 발급 후 탈퇴한 회원일 수 있으니 DB에서 다시 확인해요.
  // (id 형식이 잘못된 토큰도 인증 실패(401)로 처리해요.)
  const user = mongoose.isValidObjectId(payload.sub) ? await User.findById(payload.sub) : null;
  if (!user) {
    throw new AppError(401, '회원 정보를 찾을 수 없어요. 다시 로그인하세요.');
  }

  req.user = user;
  next();
}

// 관리자만 쓸 수 있는 API 앞에 붙여요. (반드시 requireAuth 뒤에 사용)
export function requireAdmin(req, res, next) {
  if (req.user?.user_type !== 'admin') {
    throw new AppError(403, '관리자만 사용할 수 있어요.');
  }
  next();
}
