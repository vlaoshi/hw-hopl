// 현재 로그인한 회원 정보를 돌려주는 Hook (로그인 안 했으면 null)
// 입항(로그인)·출항(로그아웃)하면 이 Hook을 쓰는 모든 화면이 자동으로 다시 그려져요.
// 사용 예) const user = useAuthUser()
//         {user ? `${user.name} 상인님` : '입항하기'}
import { useMemo, useSyncExternalStore } from 'react'
import { getAuthSnapshot, subscribeAuth } from '../utils/authStorage.js'

export function useAuthUser() {
  // localStorage(외부 저장소)의 변화를 React 화면과 연결해요.
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => '')

  return useMemo(() => {
    if (!snapshot) return null
    try {
      return JSON.parse(snapshot)
    } catch {
      return null
    }
  }, [snapshot])
}
