// 회원·인증 API 함수
// 페이지에서는 서버 주소('/users', '/auth/login' 등)를 직접 쓰지 않고 이 함수들을 불러요.
// 서버 주소나 요청 모양이 바뀌면 이 파일만 고치면 돼요.
//
// 사용 예) const { token, user } = await login({ email, password })
//         const user = await verifySession({ signal })   // 유효하면 회원 정보, 아니면 null
import { api } from './client.js'
import { clearAuth, getToken } from '../utils/authStorage.js'

// 교역허가증 발급(회원가입) - POST /api/users
// payload: { email, name, password, address? } → 가입된 회원 정보
export async function signup(payload) {
  const res = await api.post('/users', payload)
  return res.data
}

// 입항 심사(로그인) - POST /api/auth/login → { token, user }
export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

// 내 정보 - GET /api/auth/me (요청 헤더의 토큰으로 확인)
export async function getMe(options) {
  const res = await api.get('/auth/me', options)
  return res.data
}

// 저장된 토큰이 아직 유효한지 서버에 확인해요.
// - 유효함: 회원 정보를 돌려줘요.
// - 토큰 없음: null
// - 만료·잘못된 토큰(401): 저장된 토큰을 지우고 null (헤더가 자동으로 "입항 전"으로 바뀌어요)
// - 서버 꺼짐 등 확인 불가: 토큰은 그대로 두고 null (서버 문제로 로그인이 풀리지 않게)
// - 화면을 벗어나 요청이 취소되면(AbortError) 그대로 던져요.
export async function verifySession(options) {
  if (!getToken()) return null
  try {
    return await getMe(options)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    if (err.status === 401) clearAuth()
    return null
  }
}
