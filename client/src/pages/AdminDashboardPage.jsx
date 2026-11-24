// 하플 상점주 대시보드 (/admin) - 관리자(상점주)만 들어올 수 있어요. (AdminGuard)
// [제목] → [숫자 카드 4개: 총 교역 상인 · 총 상품 · 총 주문 · 총 매출] → [재고 알림] → [빠른 작업 | 최근 주문]
// ※ 호칭: 상점주 = 관리자, 상단주 = 손님(회원)
import { Link } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser.js'
import { useAdminStats } from '../hooks/useAdminStats.js'
import AdminGuard from '../components/admin/AdminGuard.jsx'
import StatCard from '../components/admin/StatCard.jsx'
import QuickActions from '../components/admin/QuickActions.jsx'
import RecentOrders from '../components/admin/RecentOrders.jsx'
import StockAlerts from '../components/admin/StockAlerts.jsx'
import { formatWon } from '../utils/format.js'

function AdminDashboard() {
  const user = useAuthUser()
  const { stats, loading, error } = useAdminStats()

  const value = (n, format = (v) => v.toLocaleString('ko-KR')) => (loading || !stats ? '…' : format(n))

  return (
    <section className="admin-page">
      <div className="admin-inner">
        <header className="admin-head">
          <div>
            <p className="admin-badge">상점주</p>
            <h1 className="admin-title">하플 상점주 대시보드</h1>
            <p className="admin-subtitle">하플 상회 관리 장부에 오신 것을 환영합니다, {user.name} 상점주님.</p>
          </div>
          <Link to="/harbor" className="admin-back">
            ◀ 하플 상회로 돌아가기
          </Link>
        </header>

        {error && <p className="admin-error">장부를 불러오지 못했습니다. ({error})</p>}

        {/* 숫자 카드 */}
        <div className="admin-stats">
          <StatCard icon="merchants" label="총 교역 상인" value={value(stats?.merchants)} note="가입한 상인 수" />
          <StatCard icon="products" label="총 상품" value={value(stats?.products)} note="등록된 물건 수" />
          <StatCard icon="orders" label="총 주문" value={value(stats?.orders)} note="주문 기능 준비 중" />
          <StatCard
            icon="revenue"
            label="총 매출"
            value={value(stats?.revenue, (v) => `${formatWon(v)}원`)}
            note="주문 기능 준비 중"
          />
        </div>

        {/* 품절 · 품절 임박 상품 */}
        <StockAlerts stock={stats?.stock} loading={loading} />

        {/* 빠른 작업 | 최근 주문 */}
        <div className="admin-columns">
          <QuickActions />
          <RecentOrders orders={stats?.recentOrders} />
        </div>
      </div>
    </section>
  )
}

function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  )
}

export default AdminDashboardPage
