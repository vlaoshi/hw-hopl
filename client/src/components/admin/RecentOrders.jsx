// 대시보드 '최근 주문' 구역
// 주문 기능이 아직 없어서 지금은 빈 안내만 보여요. (주문 모델을 만들면 orders 에 목록이 들어와요)
import { Link } from 'react-router-dom'
import { formatWon } from '../../utils/format.js'

function RecentOrders({ orders = [] }) {
  return (
    <section className="admin-panel" aria-labelledby="admin-orders-title">
      <div className="admin-panel-head">
        <h2 id="admin-orders-title" className="admin-panel-title">
          ◆ 최근 주문 ◆
        </h2>
        <Link to="/admin/orders" className="admin-panel-more">
          전체 보기 ▶
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="admin-empty">
          아직 교역 기록이 없습니다.
          <br />
          주문 기능이 열리면 이곳에 최근 주문이 쌓입니다.
        </p>
      ) : (
        <ul className="admin-orders">
          {orders.map((order) => (
            <li key={order._id} className="admin-order">
              <span className="admin-order-id">{order.orderNumber}</span>
              <span className="admin-order-name">{order.customerName}</span>
              <span className="admin-order-status">{order.statusLabel}</span>
              <span className="admin-order-total">{formatWon(order.total)}원</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RecentOrders
