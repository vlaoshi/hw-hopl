// 대시보드 '빠른 작업' 구역 - 자주 쓰는 관리 화면으로 바로 가는 버튼
// (새 상품 등록·상품 관리 외의 화면은 아직 "정비 중"이에요. 단계별로 하나씩 만들어요)
import { Link } from 'react-router-dom'

const ACTIONS = [
  { to: '/admin/products/new', label: '새 상품 등록', mark: '+', primary: true },
  { to: '/admin/products', label: '상품 관리', mark: '▶' },
  { to: '/admin/orders', label: '주문 관리', mark: '▶' },
  { to: '/admin/sales', label: '매출 분석', mark: '▶' },
  { to: '/admin/merchants', label: '교역 상인 관리', mark: '▶' },
]

function QuickActions() {
  return (
    <section className="admin-panel" aria-labelledby="admin-quick-title">
      <h2 id="admin-quick-title" className="admin-panel-title">
        ◆ 빠른 작업 ◆
      </h2>
      <ul className="admin-actions">
        {ACTIONS.map((action) => (
          <li key={action.to}>
            <Link to={action.to} className={`admin-action${action.primary ? ' is-primary' : ''}`}>
              <span className="admin-action-mark" aria-hidden="true">
                {action.mark}
              </span>
              {action.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default QuickActions
