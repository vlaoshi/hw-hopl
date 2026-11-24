// 장바구니 API 함수 - 로그인한 회원의 장바구니 (서버: /api/cart)
// 모든 함수가 장바구니 전체를 돌려줘요.
//   { items: [{ product, quantity, addedAt, status, maxQuantity, lineTotal }],
//     summary: { itemCount, totalQuantity, totalPrice, orderable } }
// 응답을 받을 때마다 헤더의 장바구니 개수도 함께 갱신해요.
import { api } from './client.js'
import { countCartItems, setCartCount } from '../utils/cartStore.js'

function withCount(res) {
  setCartCount(countCartItems(res.data))
  return res.data
}

const itemPath = (productId) => `/cart/items/${encodeURIComponent(productId)}`

// 내 장바구니 보기
export async function getCart(options) {
  return withCount(await api.get('/cart', options))
}

// 담기 (이미 담긴 상품이면 수량을 더해요)
export async function addToCart(productId, quantity = 1) {
  return withCount(await api.post('/cart/items', { productId, quantity }))
}

// 수량 바꾸기 (1 이상)
export async function updateCartItem(productId, quantity) {
  return withCount(await api.patch(itemPath(productId), { quantity }))
}

// 한 상품 빼기
export async function removeCartItem(productId) {
  return withCount(await api.delete(itemPath(productId)))
}

// 비우기
export async function clearCart() {
  return withCount(await api.delete('/cart'))
}
