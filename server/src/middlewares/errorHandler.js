// 모든 에러를 한 곳에서 받아 일정한 JSON 형식으로 응답해요.
// Express 5는 async 핸들러에서 throw한 에러도 자동으로 여기까지 전달해요.
import mongoose from 'mongoose';
import multer from 'multer';
import { isProduction } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || '서버 내부 오류가 발생했어요.';
  let details;

  // Mongoose 스키마 검증 실패 (필수값 누락, 형식 오류 등)
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = '입력값이 올바르지 않아요.';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  // 잘못된 ObjectId 형식 (예: /api/products/abc)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `잘못된 값이에요: ${err.path}`;
  }
  // unique 인덱스 중복 (예: 이미 가입된 이메일)
  else if (err.code === 11000) {
    statusCode = 409;
    message = `이미 존재하는 값이에요: ${Object.keys(err.keyValue || {}).join(', ')}`;
  }
  // 잘못된 JSON 본문
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = '요청 본문(JSON) 형식이 올바르지 않아요.';
  }
  // 사진 업로드 제한 (multer)
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? '사진 한 장은 5MB까지 올릴 수 있어요.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? '사진은 한 번에 최대 3장까지, photos 필드로 올려 주세요.'
          : '사진을 올리지 못했어요.';
  }

  if (statusCode >= 500) {
    console.error('[ERROR]', err);
    // 운영 환경에서는 내부 오류 내용을 숨겨요.
    if (isProduction) message = '서버 내부 오류가 발생했어요.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(!isProduction && statusCode >= 500 && { stack: err.stack }),
  });
}
