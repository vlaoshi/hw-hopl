// 서버 진입점: DB 연결 → 서버 실행 → 종료 신호 처리
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function start() {
  try {
    // DB 연결이 성공한 뒤에만 요청을 받아요.
    await connectDB();

    const server = app.listen(env.port);

    // 실제로 포트를 연 뒤에만 "실행 중"을 출력해요.
    server.on('listening', () => {
      console.log(`[SERVER] http://localhost:${env.port} 에서 실행 중 (${env.nodeEnv})`);
    });

    // 포트를 열지 못하면(예: 이미 다른 서버가 사용 중) 오류를 알리고 종료해요.
    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[SERVER] ${env.port}번 포트를 이미 다른 프로그램이 사용 중이에요. ` +
            '켜져 있는 서버를 끄거나(Ctrl + C) .env의 PORT를 바꾸세요.',
        );
      } else {
        console.error('[SERVER] 서버 오류:', err.message);
      }
      await disconnectDB();
      process.exit(1);
    });

    // Ctrl+C 등으로 종료할 때 진행 중인 요청과 DB 연결을 정리해요.
    const shutdown = (signal) => {
      console.log(`\n[SERVER] ${signal} 신호를 받아 종료해요...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[SERVER] 시작 실패:', err.message);
    process.exit(1);
  }
}

start();
