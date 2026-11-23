// 하플 상점주 대시보드 요약 숫자를 불러오는 Hook → { stats, loading, error }
// (AdminGuard 안에서만 쓰여서, 관리자일 때만 서버에 요청해요)
import { useEffect, useState } from 'react'
import { getAdminStats } from '../api/admin.js'

export function useAdminStats() {
  const [state, setState] = useState({ stats: null, loading: true, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    getAdminStats({ signal: controller.signal })
      .then((stats) => setState({ stats, loading: false, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ stats: null, loading: false, error: err.message })
      })
    return () => controller.abort()
  }, [])

  return state
}
