// 인증(로그인) 로직
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';

// 이메일이 없거나 비밀번호가 틀렸을 때 똑같은 메시지를 보내요.
// (어느 쪽이 틀렸는지 알려주면 가입된 이메일을 알아내는 데 악용될 수 있어요.)
const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호가 올바르지 않아요.';

// 가입되지 않은 이메일일 때도 비밀번호 비교를 한 번 해서
// 응답 시간 차이로 가입 여부를 추측하지 못하게 하는 용도의 가짜 해시예요.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

// [로그인] POST /api/auth/login
// 요청 본문: { email, password }
// 성공(200): { success: true, data: { token, user } }
// 실패: 400 (입력 누락·형식 오류) / 401 (이메일 또는 비밀번호 불일치)
export async function login(req, res) {
  const { email, password } = req.body ?? {};

  // 문자열인지 꼭 확인해요.
  // { "email": { "$ne": null } } 같은 객체를 보내 DB 조회를 조작하는 공격(NoSQL 인젝션)을 막아요.
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new AppError(400, '이메일과 비밀번호를 모두 입력하세요.');
  }

  // 스키마에서 password 는 select: false 라서 로그인할 때만 명시적으로 가져와요.
  // 이메일은 가입 때처럼 소문자·공백 제거 후 찾아요.
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  const isMatch = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH); // 시간 맞추기용 (결과는 항상 false)

  if (!user || !isMatch) {
    throw new AppError(401, LOGIN_FAILED_MESSAGE);
  }

  const token = signToken(user);

  // user 는 toJSON 설정 덕분에 응답에서 password 가 자동으로 빠져요.
  res.json({
    success: true,
    message: '로그인되었어요.',
    data: { token, user },
  });
}

// [내 정보] GET /api/auth/me  (로그인 필요)
// requireAuth 미들웨어가 토큰을 확인하고 req.user 에 회원 정보를 넣어줘요.
export async function getMe(req, res) {
  res.json({ success: true, data: req.user });
}
