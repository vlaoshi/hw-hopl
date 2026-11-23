// 모든 페이지에 공통으로 들어가는 틀(헤더, 본문, 푸터)이에요.
// <Outlet /> 자리에 현재 주소에 맞는 페이지가 들어가요.
// (회원가입·로그인 페이지는 전체 화면 연출을 위해 이 틀 밖에 있어요. App.jsx 참고)
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { verifySession } from '../api/auth.js'
import SiteHeader from './layout/SiteHeader.jsx'
import SiteFooter from './layout/SiteFooter.jsx'
import '../styles/retro-theme.css'
import './layout/Layout.css'

function Layout() {
  // 처음 들어왔을 때 저장된 토큰이 아직 유효한지 서버에 확인해요.
  // 만료되었거나 잘못된 토큰이면 지워서, 헤더가 자동으로 "입항 전" 상태로 바뀌어요.
  useEffect(() => {
    const controller = new AbortController()
    verifySession({ signal: controller.signal }).catch(() => {
      // 화면을 벗어나 요청이 취소된 경우라 따로 할 일이 없어요.
    })
    return () => controller.abort()
  }, [])

  return (
    <div className="layout retro-scope">
      <SiteHeader />
      <main className="main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

export default Layout
