// 체험 모드(데모) API
// GitHub Pages처럼 백엔드 서버 없이 프론트엔드만 배포했을 때,
// 서버 대신 브라우저(localStorage) 안에서 회원가입·로그인을 흉내 내요.
//
// - 켜는 방법: 빌드할 때 환경변수 VITE_DEMO_MODE=true (GitHub Actions 배포 설정에 들어 있어요)
// - 내 컴퓨터에서 `npm run dev`로 개발할 때는 꺼져 있어서, 지금처럼 진짜 서버(server/)를 써요.
// - 가입 정보는 체험하는 사람의 브라우저에만 저장되고, 어떤 서버로도 전송되지 않아요.
// - 응답 형식과 검사 규칙은 실제 서버(server/src/controllers, models/User.js)와 같게 맞췄어요.

import { isValidEmail, PASSWORD_MIN_LENGTH } from '../utils/validation.js'
import { DEMO_PRODUCTS } from './demoProducts.js'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const USERS_KEY = 'hapl.demo.users'
const SESSIONS_KEY = 'hapl.demo.sessions'
const CARTS_KEY = 'hapl.demo.carts' // { 회원id: [{ product, quantity, addedAt }] }
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
  else if (!isValidEmail(email)) details.push({ field: 'email', message: '이메일 형식이 올바르지 않아요.' })
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

// --- 장바구니 (서버 controllers/cart.controller.js 와 같은 규칙) ---
const MAX_QUANTITY = 99

function demoUserId(token) {
  const userId = token ? load(SESSIONS_KEY, {})[token] : undefined
  if (!userId) fail(401, '로그인이 필요해요.')
  return userId
}

function saleStatusOf(product) {
  if (product.stock > 0) return 'available'
  return product.discontinued ? 'ended' : 'soldout'
}

function loadCart(userId) {
  return load(CARTS_KEY, {})[userId] ?? []
}

function saveCart(userId, lines) {
  save(CARTS_KEY, { ...load(CARTS_KEY, {}), [userId]: lines })
}

function cartResponse(lines) {
  const items = lines
    .map((line) => {
      const product = DEMO_PRODUCTS.find((p) => p._id === line.product)
      if (!product) return null
      const sale = saleStatusOf(product)
      const status =
        product.isActive === false ? 'hidden' : sale !== 'available' ? sale : line.quantity > product.stock ? 'shortage' : 'ok'
      return {
        product,
        quantity: line.quantity,
        addedAt: line.addedAt,
        status,
        maxQuantity: Math.min(MAX_QUANTITY, Math.max(0, product.stock)),
        lineTotal: status === 'ok' ? product.price * line.quantity : 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
  const okItems = items.filter((item) => item.status === 'ok')
  return {
    success: true,
    data: {
      items,
      summary: {
        itemCount: items.length,
        totalQuantity: okItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: okItems.reduce((sum, item) => sum + item.lineTotal, 0),
        orderable: items.length > 0 && okItems.length === items.length,
      },
    },
  }
}

function readQuantity(value, fallback) {
  const quantity = value === undefined ? fallback : value
  if (!Number.isInteger(quantity) || quantity < 1) fail(400, '수량은 1 이상의 정수로 보내 주세요.')
  return quantity
}

function purchasableProduct(productId) {
  const product = DEMO_PRODUCTS.find((p) => p._id === productId)
  if (!product || product.isActive === false) fail(404, '상품을 찾을 수 없어요.')
  const sale = saleStatusOf(product)
  if (sale === 'soldout') fail(409, `'${product.name}'은(는) 품절이라 담을 수 없어요.`)
  if (sale === 'ended') fail(409, `'${product.name}'은(는) 판매가 끝나 담을 수 없어요.`)
  return product
}

function checkQuantityLimit(product, quantity) {
  if (quantity > product.stock) fail(409, `'${product.name}'은(는) 재고가 ${product.stock}개라 ${product.stock}개까지 담을 수 있어요.`)
  if (quantity > MAX_QUANTITY) fail(400, `한 상품은 ${MAX_QUANTITY}개까지 담을 수 있어요.`)
}

function handleCart(path, method, body, token) {
  const userId = demoUserId(token)
  const lines = loadCart(userId)

  if (path === '/cart' && method === 'GET') return cartResponse(lines)
  if (path === '/cart' && method === 'DELETE') {
    saveCart(userId, [])
    return cartResponse([])
  }
  if (path === '/cart/items' && method === 'POST') {
    const product = purchasableProduct(body?.productId)
    const quantity = readQuantity(body?.quantity, 1)
    const line = lines.find((l) => l.product === product._id)
    checkQuantityLimit(product, (line?.quantity ?? 0) + quantity)
    const next = line
      ? lines.map((l) => (l === line ? { ...l, quantity: l.quantity + quantity } : l))
      : [...lines, { product: product._id, quantity, addedAt: new Date().toISOString() }]
    saveCart(userId, next)
    return cartResponse(next)
  }
  if (path.startsWith('/cart/items/')) {
    const productId = decodeURIComponent(path.slice('/cart/items/'.length))
    const line = lines.find((l) => l.product === productId)
    if (method === 'PATCH') {
      const quantity = readQuantity(body?.quantity)
      if (!line) fail(404, '장바구니에 없는 상품이에요.')
      checkQuantityLimit(purchasableProduct(productId), quantity)
      const next = lines.map((l) => (l === line ? { ...l, quantity } : l))
      saveCart(userId, next)
      return cartResponse(next)
    }
    if (method === 'DELETE') {
      if (!line) fail(404, '장바구니에 없는 상품이에요.')
      const next = lines.filter((l) => l !== line)
      saveCart(userId, next)
      return cartResponse(next)
    }
  }
  return fail(404, '체험 모드에서는 아직 지원하지 않는 기능이에요.')
}

// api/client.js 가 체험 모드일 때 fetch 대신 이 함수를 불러요.
export async function demoRequest(path, { method = 'GET', body, token } = {}) {
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS))

  if (method === 'GET' && path === '/health') return { success: true, status: 'ok', db: 'demo' }
  if (method === 'POST' && path === '/users') return createUser(body)
  if (method === 'POST' && path === '/auth/login') return login(body)
  if (method === 'GET' && path === '/auth/me') return getMe(token)

  // 상품 목록·상세 (DB 대신 demoProducts.js 의 예시 상품)
  if (method === 'GET' && path === '/products') return { success: true, data: DEMO_PRODUCTS }
  if (method === 'GET' && path.startsWith('/products/')) {
    const id = decodeURIComponent(path.slice('/products/'.length))
    const product = DEMO_PRODUCTS.find((p) => p._id === id)
    if (!product) fail(404, '상품을 찾을 수 없어요.')
    return { success: true, data: product }
  }

  // 주문 내역: 체험판에서는 결제를 할 수 없어서 늘 빈 목록이에요.
  if (method === 'GET' && path.startsWith('/orders?')) {
    demoUserId(token)
    const counts = { all: 0, paid: 0, preparing: 0, shipping: 0, delivered: 0, cancelled: 0 }
    return { success: true, data: [], counts, pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } }
  }

  // 장바구니 (브라우저 저장소에 회원별로 저장)
  if (path === '/cart' || path.startsWith('/cart/')) return handleCart(path, method, body, token)

  return fail(404, '체험 모드에서는 아직 지원하지 않는 기능이에요.')
}
