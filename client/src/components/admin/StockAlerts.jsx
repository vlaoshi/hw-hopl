// 대시보드 '재고 알림' 구역 - 채워야 할 상품(품절·재고 적음)을 재고 적은 순으로 보여 줘요. (최대 5개)
// 판매 완료(재입고 계획 없음) 상품은 알림에서 빠지고, 개수만 보여 줘요.
// stock = { soldOut, lowStock, ended, threshold, alerts: [{ _id, name, image, stock, discontinued, isActive, sku }] }
import { Link } from 'react-router-dom'
import GoodsSprite from '../goods/GoodsSprite.jsx'
import StockBadge from '../goods/StockBadge.jsx'

function StockAlerts({ stock, loading }) {
  const alerts = stock?.alerts ?? []

  return (
    <section className="admin-panel admin-stock-panel" aria-labelledby="admin-stock-title">
      <div className="admin-panel-head">
        <h2 id="admin-stock-title" className="admin-panel-title">
          ◆ 재고 알림 ◆
        </h2>
        <Link to="/admin/products" className="admin-panel-more">
          상품 관리 ▶
        </Link>
      </div>

      {loading || !stock ? (
        <p className="admin-empty">재고 장부를 확인하는 중입니다...</p>
      ) : (
        <>
          <p className="admin-stock-summary">
            <span>
              품절 <strong className="is-soldout">{stock.soldOut}</strong>개
            </span>
            <span>
              재고 적음 <strong className="is-low">{stock.lowStock}</strong>개
            </span>
            <span>
              판매 완료 <strong className="is-ended">{stock.ended ?? 0}</strong>개
            </span>
            <span className="admin-stock-rule">(재고 {stock.threshold}개 이하면 재고 적음)</span>
          </p>

          {alerts.length === 0 ? (
            <p className="admin-empty">모든 물건의 재고가 넉넉합니다.</p>
          ) : (
            <ul className="admin-stock-list">
              {alerts.map((product) => (
                <li key={product._id} className="admin-stock-item">
                  <span className="admin-product-art admin-stock-art">
                    <GoodsSprite image={product.image} className="admin-stock-sprite" />
                  </span>
                  <span className="admin-stock-name">
                    {product.name}
                    {!product.isActive && <span className="admin-stock-hidden">(숨김)</span>}
                  </span>
                  <StockBadge product={product} showLow />
                  <span className="admin-stock-count">재고 {product.stock}개</span>
                  <Link to={`/admin/products/${product._id}/edit`} className="admin-small-btn">
                    재고 채우기
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

export default StockAlerts
