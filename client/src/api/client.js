// 백엔드 API를 호출하는 공통 함수예요.
// 서버 응답 형식: 성공 { success: true, ... } / 실패 { success: false, message }
// 사용 예) const data = await api.get('/products')
//         await api.post('/orders', { items })

import { getToken } from '../utils/authStorage.js'
import { DEMO_MODE, demoRequest } from './demoApi.js'

const BASE_URL = '/api' // vite.config.js의 proxy가 http://localhost:4000/api 로 전달해요.

async function request(path, { method = 'GET', body, signal } = {}) {
  // 체험 모드(백엔드 없이 배포한 프론트엔드)에서는 서버 대신 브라우저 안에서 처리해요.
  if (DEMO_MODE) return demoRequest(path, { method, body, token: getToken() })

  const options = {
    method,
    headers: {},
    credentials: 'include', // 로그인 쿠키를 사용할 경우를 대비해요.
    signal,
  }
  // 로그인 상태면 토큰을 헤더에 붙여요. (서버의 requireAuth 미들웨어가 확인해요)
  const token = getToken()
  if (token) options.headers.Authorization = `Bearer ${token}`

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, options)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('서버에 연결할 수 없어요. 백엔드 서버가 켜져 있는지 확인하세요.', {
      cause: err, // 원래 에러 정보를 함께 남겨 디버깅할 때 확인할 수 있게 해요.
    })
  }

  // 본문이 JSON이 아닐 수도 있으니(예: 프록시 오류) 안전하게 읽어요.
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(data?.message || `요청에 실패했어요. (${res.status})`)
    error.status = res.status
    error.details = data?.details
    throw error
  }
  return data
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
