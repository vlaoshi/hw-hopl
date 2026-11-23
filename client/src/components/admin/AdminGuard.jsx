// 상점주(관리자)만 들어올 수 있는 화면을 감싸는 출입 관리 부품
// - 관리자: children 을 그대로 보여줘요.
// - 입항 전: "상점주 계정으로 입항해 주십시오." + [입항하기]
// - 일반 회원: "상점주만 들어올 수 있는 장부실입니다." + [항구로 돌아가기]
// ※ 화면에서 막는 것과 별개로, 서버(/api/admin/*)도 관리자만 응답해요.
// 사용 예) <AdminGuard><AdminProducts /></AdminGuard>
import { Link } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import './Admin.css'

function AdminGuard({ children }) {
  const user = useAuthUser()

  if (user?.user_type === 'admin') return children

  return (
    <section className="admin-page">
      <div className="admin-inner admin-denied">
        <p className="admin-denied-badge">⚿ 출입 제한</p>
        <h1 className="admin-title">하플 상점주 대시보드</h1>
        <p className="admin-subtitle">
          {user ? '이곳은 하플 상회 상점주만 들어올 수 있는 장부실입니다.' : '상점주 계정으로 입항해 주십시오.'}
        </p>
        <Link to={user ? '/harbor' : '/login'} className="admin-denied-link">
          {user ? '◀ 항구로 돌아가기' : '⚓ 입항하기'}
        </Link>
      </div>
    </section>
  )
}

export default AdminGuard
