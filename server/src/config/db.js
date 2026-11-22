// MongoDB 연결을 담당해요.
import mongoose from 'mongoose';
import { env, isProduction } from './env.js';

export async function connectDB() {
  // 스키마에 정의되지 않은 필드로 조회할 때 조용히 무시되는 실수를 막아요.
  mongoose.set('strictQuery', true);
  // 운영 환경에서는 인덱스 자동 생성을 끄고, 개발 중에는 켜 둬요.
  mongoose.set('autoIndex', !isProduction);

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB 연결이 끊어졌어요.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB 오류:', err.message);
  });

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 5000, // 5초 안에 연결 못 하면 실패 처리
  });
  console.log(`[DB] MongoDB 연결 완료: ${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.connection.close();
  console.log('[DB] MongoDB 연결을 종료했어요.');
}
