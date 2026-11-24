// 장바구니 페이지용 Hook
// → { cart, loading, error, busyId, message, changeQuantity, remove, clear }
// - busyId: 처리 중인 상품 id (그 줄의 버튼을 잠가요). 'all' 이면 비우기 중
// - message: { type: 'ok' | 'error', text } 마지막 작업 결과 안내
import { useCallback, useEffect, useState } from 'react'
import { clearCart, getCart, removeCartItem, updateCartItem } from '../api/cart.js'

export function useCart(enabled = true) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    getCart({ signal: controller.signal })
      .then((data) => {
        setCart(data)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })
    return () => controller.abort()
  }, [enabled])

  // 작업 하나를 실행하고, 받은 장바구니로 화면을 바꿔요.
  const run = useCallback(async (id, action, okText) => {
    setBusyId(id)
    setMessage(null)
    try {
      setCart(await action())
      if (okText) setMessage({ type: 'ok', text: okText })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }, [])

  const changeQuantity = useCallback(
    (product, quantity) => run(product._id, () => updateCartItem(product._id, quantity)),
    [run],
  )
  const remove = useCallback(
    (product) => run(product._id, () => removeCartItem(product._id), `'${product.name}'을(를) 장바구니에서 뺐습니다.`),
    [run],
  )
  const clear = useCallback(() => run('all', () => clearCart(), '장바구니를 비웠습니다.'), [run])

  return { cart, loading, error, busyId, message, changeQuantity, remove, clear }
}
