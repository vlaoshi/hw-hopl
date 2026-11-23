// 상품 등록 (/admin/products/new) · 수정 (/admin/products/:id/edit) - 상점주 전용
// - 등록: 양식을 저장하면 상품 관리 목록으로 돌아가요. (실물 사진은 목록의 [수정]에서 올려요)
// - 수정: [양식] + [실물 사진 관리]
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminProduct } from '../hooks/useAdminProducts.js'
import AdminGuard from '../components/admin/AdminGuard.jsx'
import ProductForm from '../components/admin/ProductForm.jsx'
import ProductPhotoManager from '../components/admin/ProductPhotoManager.jsx'
import './AdminProductsPage.css'

function AdminProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { product, setProduct, loading, error, notFound } = useAdminProduct(id)
  const [notice, setNotice] = useState('')

  const handleSaved = (saved, created) => {
    if (created) {
      // 상품 관리 목록으로 돌아가서 "등록했습니다" 안내를 보여 줘요.
      navigate('/admin/products', { replace: true, state: { created: saved.name } })
    } else {
      setProduct(saved)
      setNotice('수정 내용을 저장했습니다.')
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-inner admin-form-inner">
        <header className="admin-head">
          <div>
            <p className="admin-badge">상점주</p>
            <h1 className="admin-title">{isEdit ? '상품 수정' : '새 상품 등록'}</h1>
            <p className="admin-subtitle">
              {isEdit ? '물건의 정보와 실물 사진을 고칠 수 있습니다.' : '진열장에 놓을 새 물건을 장부에 적습니다.'}
            </p>
          </div>
          <Link to="/admin/products" className="admin-back">
            ◀ 상품 관리
          </Link>
        </header>

        {notice && (
          <p className="admin-message is-ok" role="status">
            {notice}
          </p>
        )}

        {isEdit && loading && <p className="admin-empty">장부를 펼치는 중입니다...</p>}
        {isEdit && notFound && <p className="admin-error">찾으시는 상품이 장부에 없습니다.</p>}
        {isEdit && error && !notFound && <p className="admin-error">상품을 불러오지 못했습니다. ({error})</p>}

        {(!isEdit || product) && (
          <>
            {/* 상품 정보 양식 (양피지 서류) */}
            <div className="permit-sheet admin-sheet">
              <div className="permit-banner">
                <h2 className="permit-title">하플 상회 물품 장부</h2>
                <p className="permit-subtitle">HAPL TRADING HOUSE · GOODS LEDGER</p>
              </div>
              <div className="permit-body">
                {/* key: 다른 상품으로 바뀌면 양식을 새로 채워요 */}
                <ProductForm key={product?._id ?? 'new'} initial={product} onSaved={handleSaved} />
              </div>
            </div>

            {/* 실물 사진 (수정 화면에서만) */}
            {isEdit && (
              <section className="admin-panel" aria-labelledby="admin-photos-title">
                <h2 id="admin-photos-title" className="admin-panel-title">
                  ◆ 실물 사진 (최대 3장) ◆
                </h2>
                <ProductPhotoManager product={product} onChange={setProduct} />
              </section>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function AdminProductFormPage() {
  const { id } = useParams()
  return (
    <AdminGuard>
      {/* key: 다른 상품으로 바뀌면 화면을 새로 만들어요 */}
      <AdminProductForm key={id ?? 'new'} />
    </AdminGuard>
  )
}

export default AdminProductFormPage
