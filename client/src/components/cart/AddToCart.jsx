// 상세 페이지의 [장바구니에 담기] 구역
// - 구매 가능: [ − 1 + ] [장바구니에 담기]  (수량은 재고와 99개 중 작은 수까지)
// - 품절·판매 완료: 버튼이 잠겨요.
// - 입항(로그인) 전: [입항하고 담기] → 로그인 후 이 상품 페이지로 돌아와요.
// - 담기에 성공하면 '장바구니에 담았습니다' 팝업이 떠요. (실패하면 버튼 아래에 붉은 안내)
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { addToCart } from '../../api/cart.js'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import { saleStatus } from '../../utils/stock.js'
import QuantityStepper from './QuantityStepper.jsx'
import AddedToCartDialog from './AddedToCartDialog.jsx'
import './Cart.css'

const MAX_QUANTITY = 99 // 서버 Cart 모델의 MAX_QUANTITY 와 같아요.

function AddToCart({ product }) {
  const user = useAuthUser()
  const location = useLocation()
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('') // 담기 실패 안내
  const [added, setAdded] = useState(null) // 방금 담은 수량 (있으면 팝업이 열려요)

  const status = saleStatus(product)
  const max = Math.max(1, Math.min(MAX_QUANTITY, product.stock))

  if (status !== 'available') {
    return (
      <div className="add-to-cart">
        <button type="button" className="pixel-btn add-to-cart-btn" disabled>
          {status === 'ended' ? '판매가 끝난 물건입니다' : '품절 · 다시 들어오면 담을 수 있습니다'}
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="add-to-cart">
        <Link to="/login" state={{ from: location.pathname }} className="pixel-btn pixel-btn-seal add-to-cart-btn">
          ⚓ 입항하고 장바구니에 담기
        </Link>
      </div>
    )
  }

  const handleAdd = async () => {
    setBusy(true)
    setError('')
    try {
      await addToCart(product._id, quantity)
      setAdded(quantity)
      setQuantity(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="add-to-cart">
      <div className="add-to-cart-row">
        <QuantityStepper value={quantity} max={max} onChange={setQuantity} disabled={busy} />
        <button type="button" className="pixel-btn pixel-btn-seal add-to-cart-btn" onClick={handleAdd} disabled={busy}>
          {busy ? '담는 중...' : '장바구니에 담기'}
        </button>
      </div>
      {error && (
        <p className="add-to-cart-message is-error" role="alert">
          {error}
        </p>
      )}
      <AddedToCartDialog product={product} quantity={added ?? 0} open={added !== null} onClose={() => setAdded(null)} />
    </div>
  )
}

export default AddToCart
