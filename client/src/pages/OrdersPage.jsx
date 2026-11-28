// 주문 내역 (/orders?status=&page=) - 입항한 상인의 지난 주문 (대형 쇼핑몰 주문 내역 구성 + 도트 감성)
// [상태 탭: 전체 · 결제 완료 · 상품 준비중 · 배송중 · 배송완료 · 주문 취소 (건수)]
// [주문 카드 × 5: 주문일·주문번호 / 대표 상품·상태·금액 / 다시 담기·주문 취소 / 배송 진행 단계]
// [페이지 이동]
// - 탭·페이지는 주소(?status=shipping&page=2)에 담겨서 새로고침·뒤로 가기에도 유지돼요.
// - 다시 담기: 그 주문의 물건을 같은 수량으로 장바구니에 담아요. (품절·판매 완료 물건은 건너뛰고 알려 줘요)
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addToCart } from '../api/cart.js'
import { cancelMyOrder } from '../api/orders.js'
import { useAuthUser } from '../hooks/useAuthUser.js'
import { useMyOrders } from '../hooks/useMyOrders.js'
import OrderCard from '../components/orders/OrderCard.jsx'
import Pagination from '../components/common/Pagination.jsx'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import '../components/goods/Goods.css'
import '../components/cart/Cart.css'
import '../components/orders/Orders.css'

const PAGE_SIZE = 5
const TABS = [
  { status: 'all', label: '전체' },
  { status: 'paid', label: '결제 완료' },
  { status: 'preparing', label: '상품 준비중' },
  { status: 'shipping', label: '배송중' },
  { status: 'delivered', label: '배송완료' },
  { status: 'cancelled', label: '주문 취소' },
]
const TAB_KEYS = TABS.map((tab) => tab.status)

function readParams(searchParams) {
  const status = TAB_KEYS.includes(searchParams.get('status')) ? searchParams.get('status') : 'all'
  const page = Number.parseInt(searchParams.get('page'), 10)
  return { status, page: Number.isInteger(page) && page >= 1 ? page : 1 }
}

function OrdersContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { status, page } = readParams(searchParams)
  const { orders, counts, pagination, loading, error, reload } = useMyOrders({ status, page, limit: PAGE_SIZE })
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text, cartLink? }

  const go = (nextStatus, nextPage = 1) => {
    const params = {}
    if (nextStatus !== 'all') params.status = nextStatus
    if (nextPage > 1) params.page = String(nextPage)
    setSearchParams(params)
    setMessage(null)
  }

  // 다시 담기: 물건마다 장바구니에 담아 보고, 담은 것·못 담은 것을 알려 줘요.
  const handleReorder = async (order) => {
    setBusyId(order._id)
    setMessage(null)
    const added = []
    const failed = []
    for (const item of order.items) {
      try {
        await addToCart(item.product, item.quantity)
        added.push(item.name)
      } catch (err) {
        failed.push(`${item.name}: ${err.message}`)
      }
    }
    setBusyId(null)
    if (added.length === 0) {
      setMessage({ type: 'error', text: `장바구니에 담지 못했습니다. ${failed.join(' / ')}` })
    } else {
      setMessage({
        type: failed.length ? 'error' : 'ok',
        text: `${added.length}종류를 장바구니에 담았습니다.${failed.length ? ` 담지 못한 물건 - ${failed.join(' / ')}` : ''}`,
        cartLink: true,
      })
    }
  }

  const handleCancel = async (order) => {
    if (!window.confirm(`'${order.orderName}' 주문을 취소할까요?\n결제가 취소되고 되돌릴 수 없습니다.`)) return
    setBusyId(order._id)
    setMessage(null)
    try {
      await cancelMyOrder(order.orderNumber, '고객 요청 취소')
      setMessage({ type: 'ok', text: `'${order.orderName}' 주문을 취소했습니다. 결제도 함께 취소되었습니다.` })
      reload()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  const total = counts?.all ?? 0

  // 없는 쪽(예: ?page=9)이면 마지막 쪽으로 옮겨요.
  const { totalPages } = pagination
  useEffect(() => {
    if (!loading && !error && totalPages > 0 && page > totalPages) {
      setSearchParams(status === 'all' ? { page: String(totalPages) } : { status, page: String(totalPages) }, { replace: true })
    }
  }, [loading, error, totalPages, page, status, setSearchParams])

  return (
    <>
      {/* 상태 탭 */}
      <nav className="orders-tabs" aria-label="주문 상태">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            className={`orders-tab${tab.status === status ? ' is-current' : ''}`}
            onClick={() => go(tab.status)}
            aria-current={tab.status === status ? 'page' : undefined}
          >
            <span className="orders-tab-label">{tab.label}</span>
            <span className="orders-tab-count">{counts ? counts[tab.status] : '·'}</span>
          </button>
        ))}
      </nav>

      {message && (
        <p className={`cart-notice is-${message.type}`} role="status">
          {message.text}{' '}
          {message.cartLink && (
            <Link to="/cart" className="orders-cart-link">
              장바구니 보기 ▶
            </Link>
          )}
        </p>
      )}

      {error && <p className="cart-message is-error">주문 내역을 불러오지 못했습니다. ({error})</p>}
      {loading && orders.length === 0 && !error && <p className="cart-message">주문 장부를 펼치는 중입니다...</p>}

      {!loading && !error && orders.length === 0 && (
        <section className="cart-panel cart-empty orders-empty">
          <span className="cart-item-art orders-empty-art" aria-hidden="true">
            <GoodsSprite image="mystery-crate" className="orders-empty-sprite" />
          </span>
          <p className="cart-empty-title">
            {total === 0 ? '아직 주문한 물건이 없습니다.' : `'${TABS.find((t) => t.status === status).label}' 주문이 없습니다.`}
          </p>
          <p>{total === 0 ? '진열장에서 마음에 드는 물건을 골라 보십시오.' : '다른 탭에서 주문을 확인해 보십시오.'}</p>
          {total === 0 ? (
            <Link to="/harbor" className="pixel-btn pixel-btn-seal cart-empty-btn">
              진열장 둘러보기
            </Link>
          ) : (
            <button type="button" className="pixel-btn pixel-btn-gold cart-empty-btn" onClick={() => go('all')}>
              전체 주문 보기
            </button>
          )}
        </section>
      )}

      {orders.length > 0 && (
        <ul className={`orders-list${loading ? ' is-loading' : ''}`}>
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              busy={busyId !== null}
              onReorder={handleReorder}
              onCancel={handleCancel}
            />
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={pagination.totalPages} onChange={(next) => go(status, next)} disabled={loading} />
    </>
  )
}

function OrdersPage() {
  const user = useAuthUser()

  return (
    <section className="cart-page orders-page">
      <div className="cart-inner orders-inner">
        <Link to="/harbor" className="cart-back">
          ◀ 진열장으로 돌아가기
        </Link>
        <div className="orders-head">
          <h1 className="cart-title">주문 내역</h1>
          {user && <p className="orders-subtitle">{user.name} 상인님이 하플 상회와 거래한 기록입니다.</p>}
        </div>
        {user ? (
          <OrdersContent />
        ) : (
          <section className="cart-panel cart-empty">
            <p className="cart-empty-title">주문 내역은 입항한 상인만 볼 수 있습니다.</p>
            <Link to="/login" state={{ from: '/orders' }} className="pixel-btn pixel-btn-seal cart-empty-btn">
              ⚓ 입항하기
            </Link>
          </section>
        )}
      </div>
    </section>
  )
}

export default OrdersPage
