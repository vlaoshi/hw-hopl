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
