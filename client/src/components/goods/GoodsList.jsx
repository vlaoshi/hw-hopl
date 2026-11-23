// 진열장 상품 목록
// 카드 한 장 = [도트 그림 액자] + [이름 · 간단한 설명 · 금화 가격 패]
// 카드를 누르면 상품 상세 페이지(/products/:id)로 가요.
import { Link } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts.js'
import GoodsSprite from './GoodsSprite.jsx'
import GoldPrice from './GoldPrice.jsx'
import './Goods.css'

function GoodsList() {
  const { products, loading, error } = useProducts()

  if (loading) return <p className="goods-message">진열장을 정리하는 중입니다...</p>
  if (error) return <p className="goods-message is-error">물건을 불러오지 못했습니다. ({error})</p>
  if (products.length === 0) return <p className="goods-message">아직 진열된 물건이 없습니다.</p>

  return (
    <ul className="goods-list">
      {products.map((product) => (
        <li key={product._id}>
          <Link to={`/products/${product._id}`} className="goods-card">
            <span className="goods-card-art">
              <GoodsSprite image={product.image} name={product.name} className="goods-card-sprite" />
            </span>
            <span className="goods-card-body">
              <span className="goods-card-name">{product.name}</span>
              <span className="goods-card-summary">{product.summary}</span>
              <GoldPrice price={product.price} className="goods-card-price" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default GoodsList
