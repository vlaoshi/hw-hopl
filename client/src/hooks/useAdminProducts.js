// 상점주 상품 관리용 Hook
// - useAdminProducts({ page, limit }): 상품 목록 한 페이지(숨김 포함)
//   → { products, pagination, loading, error, replaceProduct, reload }
// - useAdminProduct(id): 상품 하나 → { product, setProduct, loading, error, notFound } (id 가 없으면 새 상품)
import { useCallback, useEffect, useState } from 'react'
import { getAdminProduct, listAdminProducts } from '../api/adminProducts.js'

const EMPTY_PAGINATION = { page: 1, limit: 5, total: 0, totalPages: 0 }

export function useAdminProducts({ page = 1, limit = 5 } = {}) {
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${page}:${limit}:${reloadKey}` // 지금 화면이 원하는 목록
  // key: 이 목록이 어느 요청의 결과인지. requestKey 와 다르면 아직 불러오는 중이에요.
  const [state, setState] = useState({ key: null, products: [], pagination: EMPTY_PAGINATION, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    listAdminProducts({ page, limit }, { signal: controller.signal })
      .then(({ products, pagination }) => setState({ key: requestKey, products, pagination, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState((prev) => ({ ...prev, key: requestKey, products: [], error: err.message }))
      })
    return () => controller.abort()
  }, [page, limit, requestKey])

  // 수정된 상품 하나를 목록에서 바꿔 끼워요. (진열 숨기기 등 - 순서·개수가 그대로라 다시 받지 않아요)
  const replaceProduct = useCallback((updated) => {
    setState((prev) => ({ ...prev, products: prev.products.map((p) => (p._id === updated._id ? updated : p)) }))
  }, [])

  // 지금 페이지를 서버에서 다시 받아요. (삭제하면 다음 페이지 상품이 앞으로 당겨지니까)
  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const { products, pagination, error } = state
  return { products, pagination, error, loading: state.key !== requestKey, replaceProduct, reload }
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
