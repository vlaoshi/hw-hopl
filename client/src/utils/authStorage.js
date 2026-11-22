// 로그인 토큰·회원 정보를 브라우저(localStorage)에 저장하고 꺼내는 함수
// - 저장: 로그인 성공 시 saveAuth({ token, user })
// - 사용: api/client.js 가 getToken()으로 요청 헤더에 토큰을 붙여요.
// - 삭제: 로그아웃(출항)하거나 토큰이 만료되면 clearAuth()
// - 구독: 헤더처럼 로그인 상태를 화면에 보여주는 곳은 hooks/useAuthUser.js 를 써요.
//         저장·삭제할 때마다 알림(이벤트)을 보내서, 화면 여러 곳이 동시에 바뀌어요.
//
// ※ 시크릿 창이나 저장소가 막힌 환경에서는 localStorage 접근이 실패할 수 있어서
//   모든 접근을 try/catch로 감싸요. (실패해도 화면이 깨지지 않게)

const TOKEN_KEY = 'hapl.token'
const USER_KEY = 'hapl.user'
const AUTH_EVENT = 'hapl:auth-change' // 로그인 상태가 바뀌었을 때 보내는 알림 이름

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function saveAuth({ token, user }) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // 저장소를 쓸 수 없는 환경: 이번 화면에서만 로그인 상태가 유지돼요.
  }
  notifyAuthChange()
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // 무시
  }
  notifyAuthChange()
}

// 로그인 상태 변화를 구독해요. (같은 탭의 저장·삭제 + 다른 탭에서의 변경)
// 반환값은 구독을 해제하는 함수예요.
export function subscribeAuth(callback) {
  const onStorage = (e) => {
    if (e.key === null || e.key === TOKEN_KEY || e.key === USER_KEY) callback()
  }
  window.addEventListener(AUTH_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(AUTH_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

// 현재 로그인 상태를 문자열 하나로 돌려줘요. (값이 같으면 같은 문자열이라 불필요한 다시 그리기를 막아요)
export function getAuthSnapshot() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? localStorage.getItem(USER_KEY) || '' : ''
  } catch {
    return ''
  }
}
