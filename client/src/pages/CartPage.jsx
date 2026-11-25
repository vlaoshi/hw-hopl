// 장바구니 (/cart) - 입항(로그인)한 상인만 쓸 수 있어요.
// [담은 물건 목록: 수량 바꾸기 · 빼기] + [계산서: 총 수량 · 합계 금액 · 주문하기 · 비우기]
// - [주문하기]는 모든 물건이 주문 가능할 때만 눌리고, 주문서 작성(/checkout)으로 가요.
// - 담은 뒤 품절·판매 완료·숨김이 되었거나 재고가 줄어든 물건은 안내와 함께 표시되고 합계에서 빠져요.
import { Link } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser.js'
import { useCart } from '../hooks/useCart.js'
import CartItemRow from '../components/cart/CartItemRow.jsx'
import GoldPrice from '../components/goods/GoldPrice.jsx'
import '../components/goods/Goods.css'
import '../components/cart/Cart.css'

function CartContent() {
  const { cart, loading, error, busyId, message, changeQuantity, remove, clear } = useCart()
  const items = cart?.items ?? []
  const summary = cart?.summary
  const hasProblem = items.some((item) => item.status !== 'ok')

  const handleClear = () => {
    if (window.confirm('장바구니에 담은 물건을 모두 뺄까요?')) clear()
  }

  if (loading) return <p className="cart-message">장바구니를 열어 보는 중입니다...</p>
  if (error) return <p className="cart-message is-error">장바구니를 불러오지 못했습니다. ({error})</p>

  return (
    <>
      {message && (
        <p className={`cart-notice is-${message.type}`} role="status">
          {message.text}
        </p>
      )}

      {items.length === 0 ? (
        <section className="cart-panel cart-empty">
          <p className="cart-empty-title">장바구니가 비어 있습니다.</p>
          <p>진열장에서 마음에 드는 물건을 골라 담아 보십시오.</p>
          <Link to="/harbor" className="pixel-btn pixel-btn-seal cart-empty-btn">
            진열장 둘러보기
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          {/* 담은 물건 */}
          <section className="cart-panel" aria-labelledby="cart-items-title">
            <h2 id="cart-items-title" className="cart-panel-title">
              ◆ 담은 물건 ({summary.itemCount}종류) ◆
            </h2>
            <ul className="cart-items">
              {items.map((item) => (
                <CartItemRow
                  key={item.product._id}
                  item={item}
                  busy={busyId !== null}
                  onChangeQuantity={changeQuantity}
                  onRemove={remove}
                />
              ))}
            </ul>
          </section>

          {/* 계산서 */}
          <aside className="cart-panel cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title" className="cart-panel-title">
              ◆ 계산서 ◆
            </h2>
            <dl className="cart-summary-list">
              <div>
                <dt>주문할 물건</dt>
                <dd>{summary.totalQuantity}개</dd>
              </div>
              <div>
                <dt>합계</dt>
                <dd>
                  <GoldPrice price={summary.totalPrice} className="cart-summary-price" />
                </dd>
              </div>
            </dl>
            {hasProblem && <p className="cart-summary-warn">주문할 수 없는 물건은 합계에서 뺐습니다. 빼거나 수량을 맞춰 주십시오.</p>}
            {summary.orderable ? (
              <Link to="/checkout" className="pixel-btn pixel-btn-seal cart-order-btn">
                주문하기
              </Link>
            ) : (
              <button type="button" className="pixel-btn pixel-btn-seal cart-order-btn" disabled>
                주문하기
              </button>
            )}
            <p className="cart-summary-note">배송비는 무료입니다.</p>
            <button type="button" className="cart-clear-btn" onClick={handleClear} disabled={busyId !== null}>
              장바구니 비우기
            </button>
          </aside>
        </div>
      )}
    </>
  )
}

function CartPage() {
  const user = useAuthUser()

  return (
    <section className="cart-page">
      <div className="cart-inner">
        <Link to="/harbor" className="cart-back">
          ◀ 진열장으로 돌아가기
        </Link>
        <h1 className="cart-title">장바구니</h1>

        {user ? (
          <CartContent />
        ) : (
          <section className="cart-panel cart-empty">
            <p className="cart-empty-title">장바구니는 입항한 상인만 쓸 수 있습니다.</p>
            <p>교역허가증으로 입항하시면 담아 둔 물건을 볼 수 있습니다.</p>
            <Link to="/login" state={{ from: '/cart' }} className="pixel-btn pixel-btn-seal cart-empty-btn">
              ⚓ 입항하기
            </Link>
          </section>
        )}
      </div>
    </section>
  )
}

export default CartPage
