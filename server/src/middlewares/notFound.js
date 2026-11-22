// 어떤 라우트에도 해당하지 않는 요청을 404로 처리해요.
import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(404, `요청한 경로를 찾을 수 없어요: ${req.method} ${req.originalUrl}`));
}
