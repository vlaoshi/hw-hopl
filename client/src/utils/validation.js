// 입력값 검사 규칙 (회원가입·로그인·체험 모드가 함께 써요)
// 서버 스키마(server/src/models/User.js)와 같은 기준이에요. 규칙을 바꿀 때는 서버도 같이 바꿔 주세요.

// 이메일 형식: 공백 없이 "아이디@도메인.끝" 모양
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 비밀번호 최소 길이
export const PASSWORD_MIN_LENGTH = 8

// 이메일 형식이 맞는지 (앞뒤 공백은 무시)
export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email).trim())
}

// --- 주문 배송지 (서버 server/src/models/Order.js 의 shipping 과 같은 기준) ---
// 칸 순서 (오류가 나면 이 순서로 첫 번째 칸에 커서를 옮겨요)
export const SHIPPING_FIELDS = ['recipient', 'phone', 'address1', 'address2', 'memo']
export const SHIPPING_LIMITS = { recipient: 20, address1: 200, address2: 100, memo: 100 }

// 연락처를 010-1234-5678 모양으로 맞춰요. (01012345678 처럼 붙여 써도 같은 모양으로)
// 휴대폰 번호 모양이 아니면 null
export function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null
  const middle = digits.length === 11 ? 4 : 3
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middle)}-${digits.slice(3 + middle)}`
}

// 배송지 검사 → { 칸 이름: 오류 문구 } (문제없으면 빈 객체)
export function validateShipping(form) {
  const errors = {}
  const recipient = form.recipient.trim()
  if (!recipient) errors.recipient = '받는 분 성함을 기재해 주십시오.'
  else if (recipient.length > SHIPPING_LIMITS.recipient)
    errors.recipient = `받는 분 성함은 ${SHIPPING_LIMITS.recipient}자 이하로 써 주십시오.`

  if (!form.phone.trim()) errors.phone = '연락처를 기재해 주십시오.'
  else if (!formatPhone(form.phone)) errors.phone = '연락처는 010-1234-5678 형식의 휴대폰 번호로 써 주십시오.'

  // 우편번호·기본 주소는 주소 검색으로 함께 채워요.
  const address1 = form.address1.trim()
  if (!/^\d{5}$/.test(form.zipCode ?? '') || !address1) errors.address1 = '[주소 검색]으로 우편번호와 주소를 채워 주십시오.'
  else if (address1.length > SHIPPING_LIMITS.address1) errors.address1 = `주소는 ${SHIPPING_LIMITS.address1}자 이하로 써 주십시오.`

  if (form.address2.trim().length > SHIPPING_LIMITS.address2)
    errors.address2 = `상세 주소는 ${SHIPPING_LIMITS.address2}자 이하로 써 주십시오.`
  if (form.memo.trim().length > SHIPPING_LIMITS.memo) errors.memo = `배송 메모는 ${SHIPPING_LIMITS.memo}자 이하로 써 주십시오.`
  return errors
}
