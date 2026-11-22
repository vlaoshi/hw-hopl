// 체험 모드 표시 - 백엔드 없이 배포한 체험판에서만 화면 왼쪽 아래에 작게 떠요.
// 누르면 설명이 펼쳐지고, 다시 누르면 접혀요.
import { useState } from 'react'
import { DEMO_MODE } from '../api/demoApi.js'
import './DemoModeBadge.css'

function DemoModeBadge() {
  const [open, setOpen] = useState(false)
  if (!DEMO_MODE) return null

  return (
    <aside className="demo-badge" aria-label="체험 모드 안내">
      <button type="button" className="demo-badge-button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        ⚓ 체험 모드 {open ? '▾' : '▴'}
      </button>
      {open && (
        <p className="demo-badge-text">
          서버 없이 화면만 체험하는 판이에요. 교역허가증(회원가입)과 입항 정보는 이 브라우저에만 저장되고, 어디에도
          전송되지 않아요.
        </p>
      )}
    </aside>
  )
}

export default DemoModeBadge
