// 회원(User) 라우터 - /api/users 아래 경로를 담당해요.
// 실제 처리 로직은 controllers/user.controller.js 에 있어요.
import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

router
  .route('/')
  .post(createUser) // POST   /api/users      회원 생성
  .get(getUsers); //   GET    /api/users      회원 목록

router
  .route('/:id')
  .get(getUserById) // GET    /api/users/:id  회원 한 명 조회
  .patch(updateUser) // PATCH /api/users/:id  회원 정보 수정 (보낸 필드만)
  .put(updateUser) //  PUT    /api/users/:id  PATCH와 동일하게 동작
  .delete(deleteUser); // DELETE /api/users/:id 회원 삭제

export default router;
