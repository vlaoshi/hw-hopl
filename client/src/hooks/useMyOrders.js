// 내 주문 목록 Hook (주문 내역 페이지)
// useMyOrders({ status, page, limit }) → { orders, counts, pagination, loading, error, reload }
import { useCallback, useEffect, useState } from 'react'
import { listMyOrders } from '../api/orders.js'

const EMPTY = { orders: [], counts: null, pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } }

export function useMyOrders({ status = 'all', page = 1, limit = 5 } = {}) {
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${status}:${page}:${limit}:${reloadKey}`
  // key: 이 목록이 어느 요청의 결과인지. requestKey 와 다르면 아직 불러오는 중이에요.
  const [state, setState] = useState({ key: null, ...EMPTY, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    listMyOrders({ status, page, limit }, { signal: controller.signal })
      .then((data) => setState({ key: requestKey, ...data, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState((prev) => ({ ...prev, key: requestKey, orders: [], error: err.message }))
      })
    return () => controller.abort()
  }, [status, page, limit, requestKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  const { orders, counts, pagination, error } = state
  return { orders, counts, pagination, error, loading: state.key !== requestKey, reload }
}
