import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import DemoModeBadge from './components/DemoModeBadge.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 주소(URL)에 따라 화면을 바꾸는 라우터
        basename: GitHub Pages처럼 주소 앞에 저장소 이름(/hw-mall/ 등)이 붙는 곳에서도 동작하게 해요.
        (개발 중에는 BASE_URL 이 '/' 라서 영향이 없어요) */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      {/* 체험판(백엔드 없이 배포)에서만 보이는 안내 */}
      <DemoModeBadge />
    </BrowserRouter>
  </StrictMode>,
)
