// 하플 상회 공통 헤더 (16비트 도트 게임 스타일)
// - 왼쪽: 사슬에 매달린 나무 간판 로고 + RPG 명령 창 메뉴(진열장)
// - 오른쪽: 입항 전 [⚓ 입항] [교역허가증 발급]
//          입항 후 [⚓ ○○ 상인님 입항 중 ▾] [출항]
//            └ 이름에 마우스를 올리거나 누르면 드롭다운: 장바구니 / 주문 내역 / 내 정보 (+ 관리자: 상회 관리)
// - 좁은 화면(휴대폰)에서는 [☰ 항해 메뉴] 버튼으로 메뉴를 펼치고 접어요. (드롭다운 항목은 목록으로 펼쳐 보여줘요)
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import { clearAuth } from '../../utils/authStorage.js'
import PixelShipIcon from './PixelShipIcon.jsx'

// 왼쪽 주 메뉴
const MAIN_MENU = [{ to: '/shop', label: '진열장', hint: '상품 목록' }]

// 상인 이름 드롭다운 메뉴 (adminOnly: 관리자에게만 보여요)
const ACCOUNT_MENU = [
  { to: '/cart', label: '장바구니' },
  { to: '/orders', label: '주문 내역' },
  { to: '/mypage', label: '내 정보' },
  { to: '/admin', label: '상회 관리', adminOnly: true },
]

const navLinkClass = (base) => ({ isActive }) => `${base}${isActive ? ' is-active' : ''}`

function SiteHeader() {
  const user = useAuthUser()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false) // 휴대폰 메뉴 펼침
  const [accountOpen, setAccountOpen] = useState(false) // 드롭다운 펼침 (터치·키보드용)

  const isAdmin = user?.user_type === 'admin'
  const memberItems = ACCOUNT_MENU.filter((item) => !item.adminOnly)
  const adminItems = isAdmin ? ACCOUNT_MENU.filter((item) => item.adminOnly) : []

  // 메뉴를 고른 뒤: 휴대폰 메뉴·드롭다운을 닫고, 포커스도 풀어서 드롭다운이 열린 채로 남지 않게 해요.
  const closeMenus = () => {
    setMenuOpen(false)
    setAccountOpen(false)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  // 출항(로그아웃): 토큰을 지우고 메인으로 이동
  const handleLogout = () => {
    clearAuth()
    closeMenus()
    navigate('/')
  }

  const renderDropdownLink = (item) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        className={navLinkClass(`site-dropdown-link${item.adminOnly ? ' site-dropdown-admin' : ''}`)}
        onClick={closeMenus}
      >
        {item.label}
      </NavLink>
    </li>
  )

  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* 사슬에 매달린 나무 간판 로고 */}
        <Link to="/" className="site-logo" onClick={closeMenus} aria-label="하플 상회 처음으로">
          <span className="site-chains" aria-hidden="true">
            <span className="site-chain">
              <span />
              <span />
            </span>
            <span className="site-chain">
              <span />
              <span />
            </span>
          </span>
          <span className="site-sign">
            <PixelShipIcon className="site-logo-icon" />
            <span className="site-logo-text">
              <span className="site-logo-name">하플 상회</span>
              <span className="site-logo-sub">안개섬 항구 · HAPL</span>
            </span>
          </span>
        </Link>

        {/* 휴대폰 화면용 메뉴 펼치기 버튼 */}
        <button
          type="button"
          className="site-menu-toggle px-window"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '✕ 닫기' : '☰ 항해 메뉴'}
        </button>

        <div id="site-menu" className={`site-menu${menuOpen ? ' is-open' : ''}`}>
          {/* RPG 명령 창 메뉴 */}
          <nav className="site-nav px-window" aria-label="주 메뉴">
            {MAIN_MENU.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass('site-nav-link')}
                title={item.hint}
                onClick={closeMenus}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-auth">
            {user ? (
              <>
                {/* 상태 창 + 드롭다운 (마우스를 올리거나, 누르거나, Tab으로 이동하면 열려요) */}
                <div
                  className={`site-account${accountOpen ? ' is-open' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeMenus()
                  }}
                >
                  <button
                    type="button"
                    className="site-user px-window"
                    aria-haspopup="true"
                    aria-expanded={accountOpen}
                    aria-controls="site-account-menu"
                    onClick={() => setAccountOpen((open) => !open)}
                  >
                    ⚓ <strong>{user.name}</strong> 상인님 입항 중
                    <span className="site-user-caret" aria-hidden="true">
                      ▾
                    </span>
                  </button>

                  <div className="site-dropdown">
                    <ul id="site-account-menu" className="site-dropdown-list px-window">
                      {memberItems.map(renderDropdownLink)}
                      {adminItems.length > 0 && <li className="site-dropdown-sep" aria-hidden="true" />}
                      {adminItems.map(renderDropdownLink)}
                    </ul>
                  </div>
                </div>

                <button type="button" className="site-btn site-btn-seal" onClick={handleLogout}>
                  출항
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="site-btn site-btn-gold" onClick={closeMenus}>
                  ⚓ 입항
                </Link>
                <Link to="/signup" className="site-btn px-window" onClick={closeMenus}>
                  교역허가증 발급
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
