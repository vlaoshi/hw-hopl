import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 서버(.env의 CLIENT_ORIGIN)에서 허용한 주소와 맞추기 위해 5173번 포트를 고정해요.
    // 포트가 이미 사용 중이면 다른 포트로 바꾸지 않고 오류를 내요.
    port: 5173,
    strictPort: true,
    // 개발 중 /api 로 시작하는 요청을 백엔드 서버(기본 4000번)로 전달해요.
    // 덕분에 프론트 코드에서는 fetch('/api/...')처럼 짧게 쓸 수 있고 CORS 문제도 생기지 않아요.
    proxy: {
      '/api': {
        // 다른 주소의 백엔드에 붙여 볼 때만 API_PROXY_TARGET 으로 바꿔요. (예: API_PROXY_TARGET=http://localhost:4100 npm run dev)
        target: process.env.API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
