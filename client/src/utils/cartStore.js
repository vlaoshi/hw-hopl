// 장바구니에 담긴 물건 개수를 화면 여러 곳(헤더 등)이 함께 쓰는 작은 저장소
// - 장바구니 API(api/cart.js)를 부를 때마다 setCartCount 로 개수가 갱신돼요.
// - 입항(로그인)·출항(로그아웃)하면 개수를 비워서(null) 다시 받아 오게 해요.
// - 화면에서는 hooks/useCartCount.js 를 써요.
import { subscribeAuth } from './authStorage.js'

let count = null // null = 아직 모름 (서버에서 받아 와야 함)
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getCartCount() {
  return count
}

export function setCartCount(next) {
  if (count === next) return
  count = next
  emit()
}

export function subscribeCartCount(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// 장바구니 응답에서 개수 계산 (담긴 모든 줄의 수량 합)
export function countCartItems(cart) {
  return (cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
}

// 로그인 상태가 바뀌면 다른 사람의 개수가 남지 않게 비워요.
subscribeAuth(() => setCartCount(null))
