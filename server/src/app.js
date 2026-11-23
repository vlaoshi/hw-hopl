// Express 앱 설정 (미들웨어, 라우트, 에러 처리)
// 서버 실행(listen)은 server.js에서 해요. 이렇게 나누면 테스트하기 쉬워요.
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env, isProduction } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { UPLOAD_ROOT } from './middlewares/upload.js';

const app = express();

// 응답 헤더에서 Express 사용 사실을 숨겨요.
app.disable('x-powered-by');

// 프론트엔드(client)에서 오는 요청 허용
app.use(cors({ origin: env.clientOrigins, credentials: true }));

// 요청 로그 출력
app.use(morgan(isProduction ? 'combined' : 'dev'));

// 요청 본문 파싱 (JSON, 폼 데이터)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 올린 사진 파일 (예: /uploads/products/파일이름.jpg)
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '1d', index: false }));

// API 라우트
app.use('/api', apiRoutes);

// 404 처리 → 에러 처리 (반드시 라우트들보다 뒤에 있어야 해요)
app.use(notFound);
app.use(errorHandler);

export default app;
