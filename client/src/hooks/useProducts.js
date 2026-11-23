// 상품 데이터를 불러오는 Hook
// - useProducts(): 진열장 상품 목록 → { products, loading, error }
// - useProduct(id): 상품 하나 → { product, loading, error, notFound }
// 화면을 벗어나면 진행 중인 요청을 취소해요.
import { useEffect, useState } from 'react'
import { getProduct, getProducts } from '../api/products.js'

export function useProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    getProducts({ signal: controller.signal })
      .then((products) => setState({ products, loading: false, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ products: [], loading: false, error: err.message })
      })
    return () => controller.abort()
  }, [])

  return state
}

export function useProduct(id) {
  const [state, setState] = useState({ product: null, loading: true, error: '', notFound: false })

  useEffect(() => {
    const controller = new AbortController()
    getProduct(id, { signal: controller.signal })
      .then((product) => setState({ product, loading: false, error: '', notFound: false }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setState({ product: null, loading: false, error: err.message, notFound: err.status === 404 })
      })
    return () => controller.abort()
  }, [id])

  return state
}
