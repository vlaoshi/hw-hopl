// 회원(User) CRUD 로직
// Express 5는 async 함수에서 발생한 에러를 자동으로 errorHandler로 넘겨줘요.
// (검증 실패 400, 잘못된 id 400, 이메일 중복 409 는 errorHandler가 처리해요.)
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import { AppError } from '../utils/AppError.js';

// 클라이언트가 보낼 수 있는 필드만 허용해요.
// (_id, createdAt 등을 마음대로 바꾸지 못하게 막아요.)
const ALLOWED_FIELDS = ['email', 'name', 'password', 'user_type', 'address'];

function pickAllowed(body = {}) {
  const result = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

// id로 회원을 찾고, 없으면 404 에러를 던져요.
async function findUserOrThrow(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, '회원을 찾을 수 없어요.');
  return user;
}

// [C] 회원 생성 - POST /api/users
export async function createUser(req, res) {
  const user = await User.create(pickAllowed(req.body));
  res.status(201).json({ success: true, data: user });
}

// [R] 회원 목록 조회 - GET /api/users?page=1&limit=20
export async function getUsers(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

  const [users, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 }) // 최근 가입 순
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// [R] 회원 한 명 조회 - GET /api/users/:id
export async function getUserById(req, res) {
  const user = await findUserOrThrow(req.params.id);
  res.json({ success: true, data: user });
}

// [U] 회원 정보 수정 - PATCH(또는 PUT) /api/users/:id
// 보낸 필드만 바꿔요.
// findByIdAndUpdate 대신 "찾기 → 값 변경 → save()" 방식을 써야
// 비밀번호 해시(pre save)와 스키마 검증이 모두 실행돼요.
export async function updateUser(req, res) {
  const updates = pickAllowed(req.body);
  if (Object.keys(updates).length === 0) {
    throw new AppError(400, `수정할 값이 없어요. (가능한 필드: ${ALLOWED_FIELDS.join(', ')})`);
  }

  const user = await findUserOrThrow(req.params.id);
  user.set(updates);
  await user.save();

  res.json({ success: true, data: user });
}

// [D] 회원 삭제 - DELETE /api/users/:id
export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError(404, '회원을 찾을 수 없어요.');
  await Cart.deleteOne({ user: user._id }); // 그 회원의 장바구니도 함께 지워요.
  res.json({ success: true, message: '회원이 삭제되었어요.', data: { _id: user._id } });
}
