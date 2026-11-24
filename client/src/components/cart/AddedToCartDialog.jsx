// '장바구니에 담았습니다' 팝업 - 상세 페이지에서 담기에 성공하면 화면 가운데에 떠요.
// [도트 그림] [이름 · 담은 수량]
// [장바구니 보기] (금화 버튼) [계속 둘러보기] (닫기)
// - 브라우저 기본 대화창(<dialog>.showModal)이라 뒤 화면은 누를 수 없고, Esc·바깥 누르기로 닫혀요.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import GoodsSprite from '../goods/GoodsSprite.jsx'
import './Cart.css'

function AddedToCartDialog({ product, quantity, open, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="cart-dialog"
      aria-labelledby="cart-dialog-title"
      onClose={onClose} // Esc 로 닫았을 때도 상태를 맞춰요.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // 바깥(어두운 배경)을 누르면 닫기
      }}
    >
      <div className="cart-dialog-body">
        <h2 id="cart-dialog-title" className="cart-dialog-title">
          ◆ 장바구니에 담았습니다 ◆
        </h2>

        <div className="cart-dialog-item">
          <span className="cart-item-art">
            <GoodsSprite image={product.image} name={product.name} className="cart-item-sprite" />
          </span>
          <div>
            <p className="cart-dialog-name">{product.name}</p>
            <p className="cart-dialog-qty">
              <strong>{quantity}개</strong> 담았습니다.
            </p>
          </div>
        </div>

        <div className="cart-dialog-actions">
          {/* autoFocus: 팝업이 열리면 [장바구니 보기]에 바로 초점이 가요. (Enter 로 바로 이동) */}
          <Link to="/cart" className="pixel-btn pixel-btn-gold add-to-cart-btn" autoFocus>
            장바구니 보기
          </Link>
          <button type="button" className="pixel-btn add-to-cart-btn cart-dialog-close" onClick={onClose}>
            계속 둘러보기
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default AddedToCartDialog
