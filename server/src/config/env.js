// 환경변수를 한 곳에서 읽고 검증해요.
// 다른 파일에서는 process.env 대신 이 모듈의 env 객체를 사용해요.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// 명령을 실행한 폴더와 상관없이 항상 server/.env 파일을 읽도록 이 파일 위치를 기준으로 경로를 정해요.
// (src/config/env.js → ../../.env = server/.env)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

// 반드시 있어야 하는 환경변수 목록
const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`필수 환경변수가 없어요: ${missing.join(', ')} (.env 파일을 확인하세요)`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export const isProduction = env.nodeEnv === 'production';
