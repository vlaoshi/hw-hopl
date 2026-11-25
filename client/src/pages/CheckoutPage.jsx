// 주문서 작성 (/checkout) - 장바구니에서 [주문하기]를 누르면 오는 곳 (입항한 상인만)
// [① 주문 상품] [② 배송지] [③ 결제 수단]  |  [결제 금액 · 동의 · 결제하기]
// - 장바구니의 모든 물건이 주문 가능할 때만 주문서를 쓸 수 있어요. (아니면 장바구니로 돌려보내요)
// - 받는 분 성함은 회원 정보로 미리 채워요. 주소는 카카오 주소 검색으로 우편번호와 함께 채워요.
//   (회원 정보의 주소는 우편번호가 없어서, 주소 검색창을 열 때 검색어로 미리 넣어 줘요)
// - 토스페이먼츠 연결 전이라 [결제하기]는 입력값만 확인하고 '결제 연결 준비 중' 안내를 보여 줘요.
//   (주문서를 DB에 만들지 않아요. 토스를 연결하면 여기서 주문서 만들기 → 결제창 열기를 해요)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser.js'
import { useCart } from '../hooks/useCart.js'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import GoldPrice from '../components/goods/GoldPrice.jsx'
import ShippingForm from '../components/checkout/ShippingForm.jsx'
import { formatWon } from '../utils/format.js'
import { SHIPPING_FIELDS, formatPhone, validateShipping } from '../utils/validation.js'
import '../components/goods/Goods.css'
import '../components/cart/Cart.css'
import '../components/checkout/Checkout.css'

const SHIPPING_FEE = 0 // 배송비: 항상 무료 (서버와 같아요)

function CheckoutContent({ user }) {
  const { cart, loading, error } = useCart()
  const [form, setForm] = useState({
    recipient: user.name ?? '',
    phone: '',
    zipCode: '',
    address1: '',
    address2: '',
    memo: '',
  })
  const [errors, setErrors] = useState({})
  const [agreed, setAgreed] = useState(false)
  const [agreeError, setAgreeError] = useState('')
  const [notice, setNotice] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    setNotice('')
  }

  // 주소 검색에서 주소를 고르면 우편번호·기본 주소를 함께 채워요.
  const handleAddressSelect = ({ zipCode, address1 }) => {
    setForm((prev) => ({ ...prev, zipCode, address1 }))
    if (errors.address1) setErrors((prev) => ({ ...prev, address1: undefined }))
    setNotice('')
  }

  // 연락처 칸을 벗어나면 010-1234-5678 모양으로 맞춰 줘요.
  const handlePhoneBlur = () => {
    const formatted = formatPhone(form.phone)
    if (formatted && formatted !== form.phone) setForm((prev) => ({ ...prev, phone: formatted }))
  }

  if (loading) return <p className="cart-message">주문서를 펼치는 중입니다...</p>
  if (error) return <p className="cart-message is-error">장바구니를 불러오지 못했습니다. ({error})</p>

  const items = cart?.items ?? []
  const summary = cart?.summary
  if (!summary?.orderable) {
    return (
      <section className="cart-panel cart-empty">
        <p className="cart-empty-title">
          {items.length === 0 ? '주문할 물건이 없습니다.' : '장바구니에 지금 주문할 수 없는 물건이 있습니다.'}
        </p>
        <p>{items.length === 0 ? '진열장에서 물건을 담은 뒤 주문해 주십시오.' : '장바구니에서 빼거나 수량을 맞춘 뒤 다시 주문해 주십시오.'}</p>
        <Link to={items.length === 0 ? '/harbor' : '/cart'} className="pixel-btn pixel-btn-seal cart-empty-btn">
          {items.length === 0 ? '진열장 둘러보기' : '장바구니로 돌아가기'}
        </Link>
      </section>
    )
  }

  const total = summary.totalPrice + SHIPPING_FEE

  const handlePay = () => {
    const nextErrors = validateShipping(form)
    setErrors(nextErrors)
    setAgreeError(agreed ? '' : '주문 내용 확인과 결제 진행에 동의해 주십시오.')
    if (Object.keys(nextErrors).length > 0) {
      // 오류 표시가 화면에 그려진 뒤, 첫 번째 잘못된 칸으로 커서를 옮겨요. (주소는 [주소 검색] 버튼으로)
      const first = SHIPPING_FIELDS.find((name) => nextErrors[name])
      setTimeout(() => {
        const target = first === 'address1' ? '#address-search-btn' : `.checkout-shipping [name="${first}"]`
        document.querySelector(target)?.focus()
      }, 0)
      return
    }
    if (!agreed) return
    setNotice('결제 연결을 준비하고 있습니다. 토스페이먼츠를 연결하면 이 버튼으로 결제창이 열립니다.')
  }

  return (
    <div className="cart-layout checkout-layout">
      <div className="checkout-main">
        {/* ① 주문 상품 */}
        <section className="cart-panel" aria-labelledby="checkout-items-title">
          <h2 id="checkout-items-title" className="cart-panel-title">
            ◆ 주문 상품 ({summary.itemCount}종류 · {summary.totalQuantity}개) ◆
          </h2>
          <ul className="checkout-items">
            {items.map(({ product, quantity, lineTotal }) => (
              <li key={product._id} className="checkout-item">
                <span className="cart-item-art checkout-item-art">
                  <GoodsSprite image={product.image} name={product.name} className="checkout-item-sprite" />
                </span>
                <span className="checkout-item-name">{product.name}</span>
                <span className="checkout-item-qty">
                  {formatWon(product.price)}원 × {quantity}개
                </span>
                <span className="checkout-item-total">{formatWon(lineTotal)}원</span>
              </li>
            ))}
          </ul>
          <Link to="/cart" className="checkout-edit-link">
            ◀ 장바구니에서 고치기
          </Link>
        </section>

        {/* ② 배송지 */}
        <section className="cart-panel" aria-labelledby="checkout-shipping-title">
          <h2 id="checkout-shipping-title" className="cart-panel-title">
            ◆ 배송지 ◆
          </h2>
          <ShippingForm
            form={form}
            errors={errors}
            onChange={handleChange}
            onPhoneBlur={handlePhoneBlur}
            onAddressSelect={handleAddressSelect}
            memberAddress={user.address}
          />
        </section>

        {/* ③ 결제 수단 */}
        <section className="cart-panel" aria-labelledby="checkout-payment-title">
          <h2 id="checkout-payment-title" className="cart-panel-title">
            ◆ 결제 수단 ◆
          </h2>
          <div className="checkout-payment-box">
            <p className="checkout-payment-name">토스페이먼츠</p>
            <p className="checkout-payment-desc">카드 · 계좌이체 · 간편결제 (토스페이, 카카오페이 등)</p>
            <p className="checkout-payment-ready">결제 연결 준비 중 · 테스트 결제로 연결될 예정입니다.</p>
          </div>
        </section>
      </div>

      {/* 결제 금액 */}
      <aside className="cart-panel cart-summary checkout-summary" aria-labelledby="checkout-summary-title">
        <h2 id="checkout-summary-title" className="cart-panel-title">
          ◆ 결제 금액 ◆
        </h2>
        <dl className="cart-summary-list">
          <div>
            <dt>상품 합계</dt>
            <dd>{formatWon(summary.totalPrice)}원</dd>
          </div>
          <div>
            <dt>배송비</dt>
            <dd className="checkout-free">무료</dd>
          </div>
          <div className="checkout-total-row">
            <dt>총 결제 금액</dt>
            <dd>
              <GoldPrice price={total} className="cart-summary-price" />
            </dd>
          </div>
        </dl>

        <label className="checkout-agree">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              if (e.target.checked) setAgreeError('')
            }}
          />
          <span>주문 내용을 확인했으며, 결제 진행에 동의합니다. (필수)</span>
        </label>
        {agreeError && (
          <p className="cart-summary-warn" role="alert">
            {agreeError}
          </p>
        )}

        <button type="button" className="pixel-btn pixel-btn-seal cart-order-btn" onClick={handlePay}>
          {formatWon(total)}원 결제하기
        </button>
        {notice && (
          <p className="checkout-notice" role="status">
            {notice}
          </p>
        )}
      </aside>
    </div>
  )
}

function CheckoutPage() {
  const user = useAuthUser()

  return (
    <section className="cart-page checkout-page">
      <div className="cart-inner">
        <Link to="/cart" className="cart-back">
          ◀ 장바구니로 돌아가기
        </Link>
        <h1 className="cart-title">주문서 작성</h1>

        {user ? (
          <CheckoutContent user={user} />
        ) : (
          <section className="cart-panel cart-empty">
            <p className="cart-empty-title">주문은 입항한 상인만 할 수 있습니다.</p>
            <Link to="/login" state={{ from: '/checkout' }} className="pixel-btn pixel-btn-seal cart-empty-btn">
              ⚓ 입항하기
            </Link>
          </section>
        )}
      </div>
    </section>
  )
}

export default CheckoutPage
