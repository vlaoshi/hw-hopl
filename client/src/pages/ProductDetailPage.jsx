// 상품 상세 페이지 (/products/:id) - 진열장에서 상품 카드를 누르면 오는 곳
// [도트 그림 액자] + [이름 · 간단한 설명 · 금화 가격] → [자세한 설명] → [실물 사진 최대 3장]
// 실물 사진이 없으면 "사진 준비 중" 칸으로 보여요. (사진 올리기는 나중에 '상회 관리'에서)
import { Link, useParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts.js'
import { PHOTO_SQUARE, cloudinaryImage } from '../utils/cloudinary.js'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import GoldPrice from '../components/goods/GoldPrice.jsx'
import StockBadge from '../components/goods/StockBadge.jsx'
import '../components/goods/Goods.css'
import './ProductDetailPage.css'

const MAX_PHOTOS = 3 // 서버 Product 모델의 MAX_PHOTOS 와 같아요.

function ProductDetailPage() {
  const { id } = useParams()
  const { product, loading, error, notFound } = useProduct(id)

  return (
    <section className="product-page">
      <div className="product-inner">
        <Link to="/harbor" className="product-back">
          ◀ 진열장으로 돌아가기
        </Link>

        {loading && <p className="product-message">물건을 꺼내 오는 중입니다...</p>}
        {!loading && notFound && <p className="product-message">찾으시는 물건이 진열장에 없습니다.</p>}
        {!loading && error && !notFound && (
          <p className="product-message is-error">물건 정보를 불러오지 못했습니다. ({error})</p>
        )}

        {product && (
          <>
            {/* 위: 도트 그림 + 기본 정보 */}
            <div className="product-head">
              <div className="product-art">
                <GoodsSprite image={product.image} name={product.name} className="product-sprite" />
              </div>
              <div className="product-info">
                <h1 className="product-name">{product.name}</h1>
                <p className="product-sku">상품 코드 {product.sku}</p>
                <p className="product-summary">{product.summary}</p>
                <GoldPrice price={product.price} className="product-price" />
                <StockBadge product={product} showCount className="product-stock" />
              </div>
            </div>

            {/* 자세한 설명 */}
            {product.description && (
              <section className="product-section" aria-labelledby="product-description-title">
                <h2 id="product-description-title" className="product-section-title">
                  ◆ 물건 이야기 ◆
                </h2>
                <p className="product-description">{product.description}</p>
              </section>
            )}

            {/* 실물 사진 (최대 3장) */}
            <section className="product-section" aria-labelledby="product-photos-title">
              <h2 id="product-photos-title" className="product-section-title">
                ◆ 실물 사진 ◆
              </h2>
              <ul className="product-photos">
                {Array.from({ length: MAX_PHOTOS }, (_, i) => {
                  const src = product.photos?.[i]
                  return (
                    <li key={i} className="product-photo">
                      {src ? (
                        <img src={cloudinaryImage(src, PHOTO_SQUARE(600))} alt={`${product.name} 실물 사진 ${i + 1}`} loading="lazy" />
                      ) : (
                        <span className="product-photo-empty">사진 준비 중</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          </>
        )}
      </div>
    </section>
  )
}

export default ProductDetailPage
