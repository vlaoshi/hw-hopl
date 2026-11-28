// 상점주 주문 목록 Hook
// useAdminOrders({ status, q, period, page, limit }) → { orders, counts, summary, carriers, pagination, loading, error, reload }
import { useCallback, useEffect, useState } from 'react'
import { listAdminOrders } from '../api/adminOrders.js'

const EMPTY = {
  orders: [],
  counts: null,
  summary: null,
  carriers: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
}

export function useAdminOrders({ status = 'active', q = '', period = 'all', page = 1, limit = 10 } = {}) {
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = JSON.stringify([status, q, period, page, limit, reloadKey])
  // key: 이 목록이 어느 요청의 결과인지. requestKey 와 다르면 아직 불러오는 중이에요.
  const [state, setState] = useState({ key: null, ...EMPTY, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    listAdminOrders({ status, q, period, page, limit }, { signal: controller.signal })
      .then((data) => setState({ key: requestKey, ...data, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState((prev) => ({ ...prev, key: requestKey, orders: [], error: err.message }))
      })
    return () => controller.abort()
  }, [status, q, period, page, limit, requestKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  const { orders, counts, summary, carriers, pagination, error } = state
  return { orders, counts, summary, carriers, pagination, error, loading: state.key !== requestKey, reload }
}
