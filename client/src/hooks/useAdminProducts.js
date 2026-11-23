// 상점주 상품 관리용 Hook
// - useAdminProducts(): 전체 상품 목록(숨김 포함) → { products, loading, error, replaceProduct, removeProduct }
// - useAdminProduct(id): 상품 하나 → { product, setProduct, loading, error, notFound } (id 가 없으면 새 상품)
import { useCallback, useEffect, useState } from 'react'
import { getAdminProduct, listAdminProducts } from '../api/adminProducts.js'

export function useAdminProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    listAdminProducts({ signal: controller.signal })
      .then((products) => setState({ products, loading: false, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ products: [], loading: false, error: err.message })
      })
    return () => controller.abort()
  }, [])

  // 수정된 상품 하나를 목록에서 바꿔 끼워요. (진열 숨기기 등)
  const replaceProduct = useCallback((updated) => {
    setState((prev) => ({ ...prev, products: prev.products.map((p) => (p._id === updated._id ? updated : p)) }))
  }, [])

  // 삭제한 상품을 목록에서 빼요.
  const removeProduct = useCallback((id) => {
    setState((prev) => ({ ...prev, products: prev.products.filter((p) => p._id !== id) }))
  }, [])

  return { ...state, replaceProduct, removeProduct }
}

export function useAdminProduct(id) {
  const [state, setState] = useState({ product: null, loading: !!id, error: '', notFound: false })

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    getAdminProduct(id, { signal: controller.signal })
      .then((product) => setState({ product, loading: false, error: '', notFound: false }))
      .catch((err) => {
        if (err.name !== 'AbortError')
          setState({ product: null, loading: false, error: err.message, notFound: err.status === 404 })
      })
    return () => controller.abort()
  }, [id])

  const setProduct = useCallback((product) => setState((prev) => ({ ...prev, product })), [])

  return { ...state, setProduct }
}
