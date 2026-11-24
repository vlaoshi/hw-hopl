// 장바구니에 담긴 물건 개수 (헤더 표시용)
// - 로그인 안 했으면 null, 아직 모르면 서버에서 한 번 받아 와요.
// - 담기·빼기를 하면 api/cart.js 가 개수를 갱신해서, 이 Hook 을 쓰는 화면이 함께 바뀌어요.
import { useEffect, useSyncExternalStore } from 'react'
import { getCart } from '../api/cart.js'
import { getCartCount, subscribeCartCount } from '../utils/cartStore.js'
import { useAuthUser } from './useAuthUser.js'

let loading = false // 여러 화면이 동시에 불러도 한 번만 요청해요.

export function useCartCount() {
  const user = useAuthUser()
  const count = useSyncExternalStore(subscribeCartCount, getCartCount, () => null)

  useEffect(() => {
    if (!user || count !== null || loading) return
    loading = true
    getCart()
      .catch(() => {}) // 개수는 보조 정보라 실패해도 조용히 넘어가요.
      .finally(() => {
        loading = false
      })
  }, [user, count])

  return user ? count : null
}
