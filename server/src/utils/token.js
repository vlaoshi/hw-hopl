// JWT 토큰 발급·검증 함수
// 토큰 안에는 회원 id(sub)와 회원 유형(user_type)만 넣어요.
// (토큰은 누구나 내용을 열어볼 수 있으니 비밀번호 같은 민감 정보는 절대 넣지 않아요.)
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// 로그인 성공 시 토큰 발급
export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), user_type: user.user_type }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// 요청에 담긴 토큰 검증 (실패하면 jwt 에러를 던져요)
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
