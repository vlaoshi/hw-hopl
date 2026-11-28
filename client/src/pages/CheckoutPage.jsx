// 주문서 작성 (/checkout) - 장바구니에서 [주문하기]를 누르면 오는 곳 (입항한 상인만)
// [① 주문 상품] [② 배송지] [③ 결제 수단]  |  [결제 금액 · 동의 · 결제하기]
// - 장바구니의 모든 물건이 주문 가능할 때만 주문서를 쓸 수 있어요. (아니면 장바구니로 돌려보내요)
// - 받는 분 성함은 회원 정보로 미리 채워요. 주소는 카카오 주소 검색으로 우편번호와 함께 채워요.
//   (회원 정보의 주소는 우편번호가 없어서, 주소 검색창을 열 때 검색어로 미리 넣어 줘요)
// - [결제하기]: 입력 확인 → 서버에 주문서 만들기(결제 대기) → 포트원 결제창(KG이니시스)
//   → 결제가 끝나면 서버가 포트원에 다시 조회해서 확인(/api/orders/complete) → 주문 완료 페이지
//   · 결제창을 닫거나 실패하면 그 주문서는 '결제 실패'로 정리하고, 다시 [결제하기]를 누르면 새 주문서로 결제해요.
//   · 모바일은 결제사 페이지로 갔다가 /payment/complete 로 돌아와서 같은 확인을 해요.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { completeOrder, createOrder, failOrder } from '../api/orders.js'
import { DEMO_MODE } from '../api/demoApi.js'
import { MIN_PAYMENT_AMOUNT, isPortOneConfigured, requestPortOnePayment } from '../utils/portone.js'
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
  const [notice, setNotice] = useState(null) // { type: 'info' | 'error', text }
  const [paying, setPaying] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    setNotice(null)
  }

  // 주소 검색에서 주소를 고르면 우편번호·기본 주소를 함께 채워요.
  const handleAddressSelect = ({ zipCode, address1 }) => {
    setForm((prev) => ({ ...prev, zipCode, address1 }))
    if (errors.address1) setErrors((prev) => ({ ...prev, address1: undefined }))
    setNotice(null)
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
  const belowMinimum = total < MIN_PAYMENT_AMOUNT // 카드 결제 최소 금액보다 적으면 결제할 수 없어요.

  const handlePay = async () => {
    if (paying) return
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

    if (belowMinimum) {
      setNotice({ type: 'error', text: `카드 결제는 ${formatWon(MIN_PAYMENT_AMOUNT)}원 이상부터 할 수 있습니다. 물건을 더 담아 주십시오.` })
      return
    }
    if (DEMO_MODE) {
      setNotice({ type: 'info', text: '체험판에서는 실제 결제를 할 수 없습니다. 내 컴퓨터에서 서버를 켜고 결제해 주십시오.' })
      return
    }
    if (!isPortOneConfigured) {
      setNotice({
        type: 'error',
        text: '결제 설정이 없습니다. client/.env 에 VITE_PORTONE_STORE_ID 와 VITE_PORTONE_CHANNEL_KEY 를 넣고 개발 서버를 다시 켜 주십시오.',
      })
      return
    }

    setPaying(true)
    setNotice(null)
    let order
    try {
      // 1) 주문서 만들기 (금액·주문명은 서버가 정해요)
      order = await createOrder({
        recipient: form.recipient.trim(),
        phone: formatPhone(form.phone) ?? form.phone,
        zipCode: form.zipCode,
        address1: form.address1,
        address2: form.address2.trim(),
        memo: form.memo.trim(),
      })

      // 2) 포트원 결제창 (KG이니시스). 구매자 = 주문한 회원 (연락처는 배송지 연락처)
      const result = await requestPortOnePayment(order, { name: user.name, phone: form.phone, email: user.email })
      if (!result) return // 모바일: 결제사 페이지로 이동했어요. 돌아오면 /payment/complete 에서 이어서 처리해요.

      // 3) 결제창 실패·취소
      if (result.code) {
        await failOrder(order.orderNumber, { code: result.code, message: result.message }).catch(() => {})
        setNotice({ type: 'error', text: `결제를 마치지 못했습니다. ${result.message ?? ''}`.trim() })
        return
      }

      // 4) 서버 확인 → 주문 완료 페이지
      const paid = await completeOrder(result.paymentId)
      navigate(`/orders/${paid.orderNumber}`, { replace: true, state: { justPaid: true } })
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setPaying(false)
    }
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
            <p className="checkout-payment-name">신용·체크카드</p>
            <p className="checkout-payment-desc">결제하기를 누르면 KG이니시스 결제창이 열립니다.</p>
            <p className="checkout-payment-ready">
              포트원 · KG이니시스 {isPortOneConfigured ? '테스트 결제' : '(결제 설정 필요)'}
            </p>
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

        {belowMinimum && (
          <p className="cart-summary-warn">카드 결제는 {formatWon(MIN_PAYMENT_AMOUNT)}원 이상부터 할 수 있습니다.</p>
        )}

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

        <button type="button" className="pixel-btn pixel-btn-seal cart-order-btn" onClick={handlePay} disabled={paying}>
          {paying ? '결제 진행 중...' : `${formatWon(total)}원 결제하기`}
        </button>
        {notice && (
          <p className={`checkout-notice is-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
            {notice.text}
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
