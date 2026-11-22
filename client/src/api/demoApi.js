// 체험 모드(데모) API
// GitHub Pages처럼 백엔드 서버 없이 프론트엔드만 배포했을 때,
// 서버 대신 브라우저(localStorage) 안에서 회원가입·로그인을 흉내 내요.
//
// - 켜는 방법: 빌드할 때 환경변수 VITE_DEMO_MODE=true (GitHub Actions 배포 설정에 들어 있어요)
// - 내 컴퓨터에서 `npm run dev`로 개발할 때는 꺼져 있어서, 지금처럼 진짜 서버(server/)를 써요.
// - 가입 정보는 체험하는 사람의 브라우저에만 저장되고, 어떤 서버로도 전송되지 않아요.
// - 응답 형식과 검사 규칙은 실제 서버(server/src/controllers, models/User.js)와 같게 맞췄어요.

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const USERS_KEY = 'hapl.demo.users'
const SESSIONS_KEY = 'hapl.demo.sessions'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const FAKE_DELAY_MS = 350 // 서버와 통신하는 듯한 짧은 지연

// --- 브라우저 저장소 읽기·쓰기 (막힌 환경에서도 화면이 깨지지 않게) ---
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장소를 쓸 수 없으면 이번 화면에서만 유지돼요.
  }
}

// 실제 서버처럼 status·details 를 담은 에러를 던져요. (api/client.js 와 같은 모양)
function fail(status, message, details) {
  const error = new Error(message)
  error.status = status
  if (details) error.details = details
  throw error
}

// 체험용이라도 비밀번호를 원문 그대로 저장하지 않도록 해시(SHA-256)로 바꿔 저장해요.
async function hashPassword(password) {
  const bytes = new TextEncoder().encode(`hapl-demo:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomId(bytes = 12) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 응답에는 비밀번호 해시를 넣지 않아요.
function publicUser(user) {
  const copy = { ...user }
  delete copy.passwordHash
  return copy
}

// --- 각 API 흉내 ---

// POST /api/users (회원가입)
async function createUser(body = {}) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''

  const details = []
  if (!email) details.push({ field: 'email', message: '이메일은 필수예요.' })
  else if (!EMAIL_PATTERN.test(email)) details.push({ field: 'email', message: '이메일 형식이 올바르지 않아요.' })
  if (!name) details.push({ field: 'name', message: '이름은 필수예요.' })
  if (!password) details.push({ field: 'password', message: '비밀번호는 필수예요.' })
  else if (password.length < PASSWORD_MIN_LENGTH)
    details.push({ field: 'password', message: '비밀번호는 8자 이상이어야 해요.' })
  if (details.length) fail(400, '입력값이 올바르지 않아요.', details)

  const users = load(USERS_KEY, [])
  if (users.some((u) => u.email === email)) fail(409, '이미 존재하는 값이에요: email')

  const now = new Date().toISOString()
  const user = {
    _id: randomId(),
    email,
    name,
    user_type: 'customer',
    ...(address && { address }),
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  }
  save(USERS_KEY, [...users, user])
  return { success: true, data: publicUser(user) }
}

// POST /api/auth/login (로그인)
async function login(body = {}) {
  const { email, password } = body
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    fail(400, '이메일과 비밀번호를 모두 입력하세요.')
  }

  const user = load(USERS_KEY, []).find((u) => u.email === email.trim().toLowerCase())
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    fail(401, '이메일 또는 비밀번호가 올바르지 않아요.')
  }

  const token = `demo.${randomId(24)}`
  save(SESSIONS_KEY, { ...load(SESSIONS_KEY, {}), [token]: user._id })
  return { success: true, message: '로그인되었어요.', data: { token, user: publicUser(user) } }
}

// GET /api/auth/me (내 정보)
function getMe(token) {
  const userId = token ? load(SESSIONS_KEY, {})[token] : undefined
  if (!userId) fail(401, token ? '유효하지 않은 토큰이에요. 다시 로그인하세요.' : '로그인이 필요해요.')
  const user = load(USERS_KEY, []).find((u) => u._id === userId)
  if (!user) fail(401, '회원 정보를 찾을 수 없어요. 다시 로그인하세요.')
  return { success: true, data: publicUser(user) }
}

// api/client.js 가 체험 모드일 때 fetch 대신 이 함수를 불러요.
export async function demoRequest(path, { method = 'GET', body, token } = {}) {
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS))

  if (method === 'GET' && path === '/health') return { success: true, status: 'ok', db: 'demo' }
  if (method === 'POST' && path === '/users') return createUser(body)
  if (method === 'POST' && path === '/auth/login') return login(body)
  if (method === 'GET' && path === '/auth/me') return getMe(token)

  return fail(404, '체험 모드에서는 아직 지원하지 않는 기능이에요.')
}
