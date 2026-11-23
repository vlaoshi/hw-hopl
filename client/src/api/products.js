// 상품 API 함수
// 사용 예) const products = await getProducts()
//         const product = await getProduct(id)
import { api } from './client.js'

// 진열장 상품 목록 - GET /api/products
export async function getProducts(options) {
  const res = await api.get('/products', options)
  return res.data
}

// 상품 상세 - GET /api/products/:id
export async function getProduct(id, options) {
  const res = await api.get(`/products/${encodeURIComponent(id)}`, options)
  return res.data
}
