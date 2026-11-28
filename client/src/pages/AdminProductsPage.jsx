// 상품 관리 (/admin/products?page=1) - 상점주 전용
// 숨긴 상품까지 5개씩 페이지로 나눠 보여주고, 상품마다 [수정] [숨기기/다시 진열] [삭제]를 할 수 있어요.
// - 페이지 번호는 주소(?page=2)에 담겨서, 새로고침·뒤로 가기·수정 후 돌아오기에도 유지돼요.
// - 숨기기: 손님 진열장에서 빠지지만 상품 정보와 사진은 그대로 남아요.
// - 삭제: 상품 정보가 지워져요. (되돌릴 수 없어서 한 번 더 확인해요)
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminProducts } from '../hooks/useAdminProducts.js'
import { deleteProduct, updateProduct } from '../api/adminProducts.js'
import AdminGuard from '../components/admin/AdminGuard.jsx'
import Pagination from '../components/common/Pagination.jsx'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import StockBadge from '../components/goods/StockBadge.jsx'
import { formatWon } from '../utils/format.js'
import './AdminProductsPage.css'

const MAX_PHOTOS = 3
const PAGE_SIZE = 5 // 한 페이지에 보여 줄 상품 수

// 주소의 ?page= 값을 1 이상의 정수로 읽어요. (이상한 값이면 1)
function readPage(searchParams) {
  const page = Number.parseInt(searchParams.get('page'), 10)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams)
  const { products, pagination, loading, error, replaceProduct, reload } = useAdminProducts({ page, limit: PAGE_SIZE })
  const [busyId, setBusyId] = useState(null) // 처리 중인 상품 (버튼 잠금)
  const location = useLocation()
  const navigate = useNavigate()
  const { total, totalPages } = pagination

  const goToPage = (next, options) => {
    setSearchParams(next === 1 ? {} : { page: String(next) }, options)
  }

  // 없는 페이지(예: 마지막 상품을 지워 페이지가 줄었을 때)면 마지막 페이지로 옮겨요.
  useEffect(() => {
    if (!loading && !error && totalPages > 0 && page > totalPages) goToPage(totalPages, { replace: true })
  })
  // 등록·수정 화면에서 저장하고 넘어온 경우 안내 (location.state.saved = { name, created })
  const [message, setMessage] = useState(() => {
    const saved = location.state?.saved
    if (!saved) return null
    return {
      type: 'ok',
      text: saved.created
        ? `'${saved.name}'을(를) 장부에 올렸습니다. 실물 사진은 [수정]에서 올릴 수 있습니다.`
        : `'${saved.name}'의 수정 내용을 저장했습니다.`,
    }
  }) // { type: 'ok' | 'error', text }

  // 안내를 한 번 보여 준 뒤 기록을 지워요. (새로고침하면 다시 안 보이게)
  useEffect(() => {
    if (location.state?.saved) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })
  }, [location.state, location.pathname, location.search, navigate])

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
      `'${product.name}'을(를) 삭제할까요?\n삭제하면 되돌릴 수 없습니다.\n(잠시 내리려는 거라면 [숨기기]를 써 주세요.)`,
    )
    if (!ok) return
    setBusyId(product._id)
    setMessage(null)
    try {
      await deleteProduct(product._id)
      reload() // 다음 페이지 상품이 앞으로 당겨지니 지금 페이지를 다시 받아요.
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
          {loading && products.length === 0 && <p className="admin-empty">장부를 펼치는 중입니다...</p>}
          {error && <p className="admin-error">상품을 불러오지 못했습니다. ({error})</p>}
          {!loading && !error && total === 0 && (
            <p className="admin-empty">등록된 상품이 없습니다. [새 상품 등록]으로 첫 물건을 진열해 보세요.</p>
          )}
          {total > 0 && (
            <p className="admin-list-summary">
              전체 <strong>{total}</strong>개 · {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}번째 ({page}/
              {totalPages}쪽)
            </p>
          )}

          {products.length > 0 && (
            <ul className={`admin-product-list${loading ? ' is-loading' : ''}`}>
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
                      <StockBadge product={product} showLow />
                    </p>
                    <p className="admin-product-meta">
                      <span>{formatWon(product.price)}원</span>
                      <span>재고 {product.stock}개</span>
                      <span>사진 {product.photos.length}/{MAX_PHOTOS}</span>
                      <span>순서 {product.sortOrder}</span>
                      <span className="admin-product-sku">{product.sku}</span>
                    </p>
                  </div>
                  <div className="admin-product-buttons">
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      state={{ returnTo: `/admin/products${location.search}` }}
                      className="admin-small-btn"
                    >
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

          <Pagination page={page} totalPages={totalPages} onChange={(next) => goToPage(next)} disabled={loading} />
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
