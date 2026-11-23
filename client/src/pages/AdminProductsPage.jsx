// 상품 관리 (/admin/products) - 상점주 전용
// 숨긴 상품까지 전부 보여주고, 상품마다 [수정] [숨기기/다시 진열] [삭제]를 할 수 있어요.
// - 숨기기: 손님 진열장에서 빠지지만 상품 정보와 사진은 그대로 남아요.
// - 삭제: 상품과 올려 둔 사진 파일까지 지워져요. (되돌릴 수 없어서 한 번 더 확인해요)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminProducts } from '../hooks/useAdminProducts.js'
import { deleteProduct, updateProduct } from '../api/adminProducts.js'
import AdminGuard from '../components/admin/AdminGuard.jsx'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import { formatWon } from '../utils/format.js'
import './AdminProductsPage.css'

const MAX_PHOTOS = 3

function AdminProducts() {
  const { products, loading, error, replaceProduct, removeProduct } = useAdminProducts()
  const [busyId, setBusyId] = useState(null) // 처리 중인 상품 (버튼 잠금)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }

  const handleToggle = async (product) => {
    setBusyId(product._id)
    setMessage(null)
    try {
      const updated = await updateProduct(product._id, { isActive: !product.isActive })
      replaceProduct(updated)
      setMessage({
        type: 'ok',
        text: updated.isActive ? `'${updated.name}'을(를) 다시 진열했습니다.` : `'${updated.name}'을(를) 진열장에서 숨겼습니다.`,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (product) => {
    const ok = window.confirm(
      `'${product.name}'을(를) 삭제할까요?\n올려 둔 실물 사진도 함께 지워지고 되돌릴 수 없습니다.\n(잠시 내리려는 거라면 [숨기기]를 써 주세요.)`,
    )
    if (!ok) return
    setBusyId(product._id)
    setMessage(null)
    try {
      await deleteProduct(product._id)
      removeProduct(product._id)
      setMessage({ type: 'ok', text: `'${product.name}'을(를) 삭제했습니다.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-inner">
        <header className="admin-head">
          <div>
            <p className="admin-badge">상점주</p>
            <h1 className="admin-title">상품 관리</h1>
            <p className="admin-subtitle">진열장의 물건을 등록하고, 고치고, 숨길 수 있습니다.</p>
          </div>
          <div className="admin-head-actions">
            <Link to="/admin" className="admin-back">
              ◀ 대시보드
            </Link>
            <Link to="/admin/products/new" className="admin-action is-primary admin-new-button">
              <span className="admin-action-mark" aria-hidden="true">
                +
              </span>
              새 상품 등록
            </Link>
          </div>
        </header>

        {message && (
          <p className={`admin-message ${message.type === 'error' ? 'is-error' : 'is-ok'}`} role="status">
            {message.text}
          </p>
        )}

        <section className="admin-panel" aria-label="상품 목록">
          {loading && <p className="admin-empty">장부를 펼치는 중입니다...</p>}
          {error && <p className="admin-error">상품을 불러오지 못했습니다. ({error})</p>}
          {!loading && !error && products.length === 0 && (
            <p className="admin-empty">등록된 상품이 없습니다. [새 상품 등록]으로 첫 물건을 진열해 보세요.</p>
          )}

          {products.length > 0 && (
            <ul className="admin-product-list">
              {products.map((product) => (
                <li key={product._id} className={`admin-product${product.isActive ? '' : ' is-hidden'}`}>
                  <span className="admin-product-art">
                    <GoodsSprite image={product.image} className="admin-product-sprite" />
                  </span>
                  <div className="admin-product-info">
                    <p className="admin-product-name">
                      {product.name}
                      <span className={`admin-product-state ${product.isActive ? 'is-on' : 'is-off'}`}>
                        {product.isActive ? '진열 중' : '숨김'}
                      </span>
                    </p>
                    <p className="admin-product-meta">
                      <span>{formatWon(product.price)}원</span>
                      <span>사진 {product.photos.length}/{MAX_PHOTOS}</span>
                      <span>순서 {product.sortOrder}</span>
                      <span className="admin-product-sku">{product.sku}</span>
                    </p>
                  </div>
                  <div className="admin-product-buttons">
                    <Link to={`/admin/products/${product._id}/edit`} className="admin-small-btn">
                      수정
                    </Link>
                    <button
                      type="button"
                      className="admin-small-btn"
                      onClick={() => handleToggle(product)}
                      disabled={busyId === product._id}
                    >
                      {product.isActive ? '숨기기' : '다시 진열'}
                    </button>
                    <button
                      type="button"
                      className="admin-small-btn is-danger"
                      onClick={() => handleDelete(product)}
                      disabled={busyId === product._id}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  )
}

function AdminProductsPage() {
  return (
    <AdminGuard>
      <AdminProducts />
    </AdminGuard>
  )
}

export default AdminProductsPage
