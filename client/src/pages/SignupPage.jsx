// 회원가입 페이지 - 안개섬 하플 상회 "교역허가증 신청"
// 화면 흐름: Step 1 인트로 컷신 → Step 2 교역허가증 신청서(회원가입 폼) → 발급 완료
//
// 서버 API: POST /api/users (server/src/controllers/user.controller.js 의 createUser)
// 서버가 받는 필드: email(필수), name(필수), password(필수, 8자 이상), address(선택)
// ※ user_type 은 보내지 않아요. 보내지 않으면 서버가 기본값 'customer'로 저장해요.
//   (회원가입 화면에서 누구나 관리자(admin)를 고를 수 있으면 안 되기 때문이에요.)
//
// [화면 용어 ↔ 코드 필드명]  화면에 보이는 글자만 세계관 용어이고, 코드는 그대로예요.
//   상인명 = name / 전서구 주소 = email / 교역등록번호 = password
//   교역등록번호 확인 = passwordConfirm / 교역물 인도지 = address
import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import IntroCutscene from '../components/signup/IntroCutscene.jsx'
import PermitIssued from '../components/signup/PermitIssued.jsx'
import '../styles/retro-theme.css'
import './SignupPage.css'

const INITIAL_FORM = {
  email: '',
  name: '',
  password: '',
  passwordConfirm: '',
  address: '',
}

// 서버 스키마(User.js)와 같은 기준으로 먼저 화면에서 검사해요.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8

function validate(form) {
  const errors = {}
  if (!form.email.trim()) errors.email = '전서구 주소를 기재해 주십시오.'
  else if (!EMAIL_PATTERN.test(form.email.trim()))
    errors.email = '전서구 주소의 형식이 올바르지 않습니다.'

  if (!form.name.trim()) errors.name = '상인명을 기재해 주십시오.'

  if (!form.password) errors.password = '교역등록번호를 설정해 주십시오.'
  else if (form.password.length < PASSWORD_MIN_LENGTH)
    errors.password = `교역등록번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`

  if (!form.passwordConfirm) errors.passwordConfirm = '교역등록번호를 한 번 더 기재해 주십시오.'
  else if (form.password !== form.passwordConfirm)
    errors.passwordConfirm = '교역등록번호가 일치하지 않습니다.'

  return errors
}

const STEP_INTRO = 'intro'
const STEP_FORM = 'form'
const FADE_OUT_MS = 500 // 인트로가 사라지는 시간 (SignupPage.css 의 intro-fade-out 과 맞춰요)

function SignupPage() {
  // --- 화면 단계 (인트로 → 신청서) ---
  const [step, setStep] = useState(STEP_INTRO)
  const [leavingIntro, setLeavingIntro] = useState(false)

  // --- 회원가입 폼 상태 (기존 그대로) ---
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({}) // 필드별 오류 메시지
  const [serverError, setServerError] = useState('') // 폼 전체 오류 메시지
  const [submitting, setSubmitting] = useState(false)
  const [signedUpUser, setSignedUpUser] = useState(null) // 가입 완료된 회원 정보

  // 인트로가 서서히 사라진 뒤 신청서로 넘어가요.
  useEffect(() => {
    if (!leavingIntro) return
    const timer = setTimeout(() => setStep(STEP_FORM), FADE_OUT_MS)
    return () => clearTimeout(timer)
  }, [leavingIntro])

  const startForm = () => setLeavingIntro(true)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // 다시 입력하면 해당 칸의 오류 메시지를 지워요.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // 페이지 새로고침 방지
    if (submitting) return // 중복 제출 방지

    const nextErrors = validate(form)
    setErrors(nextErrors)
    setServerError('')
    if (Object.keys(nextErrors).length > 0) return

    // 서버에 보낼 데이터 (passwordConfirm 은 화면 확인용이라 보내지 않아요.)
    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      password: form.password,
    }
    if (form.address.trim()) payload.address = form.address.trim()

    setSubmitting(true)
    try {
      const res = await api.post('/users', payload)
      setSignedUpUser(res.data)
    } catch (err) {
      if (err.status === 409) {
        // 이메일 중복 (서버 응답 409)
        setErrors({ email: '이미 상인 길드에 등록된 전서구 주소입니다.' })
      } else if (err.details?.length) {
        // 서버 검증 실패 (400) → 해당 칸 아래에 메시지 표시
        const fieldErrors = {}
        for (const d of err.details) fieldErrors[d.field] = d.message
        setErrors(fieldErrors)
      } else {
        setServerError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Step 1: 인트로 컷신
  if (step === STEP_INTRO) {
    return (
      <div className={`retro-page signup-page signup-page-dark${leavingIntro ? ' is-leaving' : ''}`}>
        <IntroCutscene onStart={startForm} />
      </div>
    )
  }

  // 발급 완료 화면
  if (signedUpUser) {
    return (
      <div className="retro-page signup-page">
        <PermitIssued user={signedUpUser} />
      </div>
    )
  }

  // Step 2: 교역허가증 신청서 (회원가입 폼)
  return (
    <div className="retro-page signup-page">
      <div className="permit-sheet">
        {/* 양피지 두루마리 배너 */}
        <div className="permit-banner">
          <h1 className="permit-title">안개섬 왕국 교역허가증 신청서</h1>
          <p className="permit-subtitle">APPLICATION FOR TRADE PERMIT · HAPL TRADING HOUSE</p>
        </div>

        <div className="permit-body">
          <p className="permit-intro">
            하플 상회와 거래하실 상인께서는 아래 내용을 빠짐없이 기재해 주십시오.
            <br />
            <span className="mark-required">✦</span> 표시는 반드시 기재해야 하는 항목입니다.
          </p>

          {/* noValidate: 브라우저 기본 검사 대신 위의 validate()로 한국어 메시지를 보여줘요. */}
          <form className="permit-form" onSubmit={handleSubmit} noValidate>
            <div className="permit-field">
              <label htmlFor="name">
                상인명 <span className="mark-required">✦</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="허가증에 기재할 상인명을 입력해 주십시오"
                value={form.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="permit-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="permit-field">
              <label htmlFor="email">
                전서구 주소 <span className="label-sub">(이메일)</span>{' '}
                <span className="mark-required">✦</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="소식을 전달받을 전서구 주소를 입력해 주십시오"
                value={form.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="permit-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="permit-field">
              <label htmlFor="password">
                교역등록번호{' '}
                <span className="label-sub">(비밀번호 · {PASSWORD_MIN_LENGTH}자 이상)</span>{' '}
                <span className="mark-required">✦</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="상인 길드 비밀 교역등록번호를 설정해 주십시오"
                value={form.password}
                onChange={handleChange}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="permit-error">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="permit-field">
              <label htmlFor="passwordConfirm">
                교역등록번호 확인 <span className="mark-required">✦</span>
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="교역등록번호를 한 번 더 입력해 주십시오"
                value={form.passwordConfirm}
                onChange={handleChange}
                aria-invalid={!!errors.passwordConfirm}
                aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
              />
              {errors.passwordConfirm && (
                <p id="passwordConfirm-error" className="permit-error">
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            <div className="permit-field">
              <label htmlFor="address">
                교역물 인도지 <span className="label-sub">(주소 · 선택)</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                autoComplete="street-address"
                placeholder="구입한 물품을 인도받을 곳을 기재해 주십시오"
                value={form.address}
                onChange={handleChange}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'address-error' : undefined}
              />
              {errors.address && (
                <p id="address-error" className="permit-error">
                  {errors.address}
                </p>
              )}
            </div>

            {serverError && (
              <p className="permit-error permit-error-box" role="alert">
                {serverError}
              </p>
            )}

            <button type="submit" className="pixel-btn pixel-btn-seal permit-submit" disabled={submitting}>
              {submitting ? '날인하는 중...' : '교역허가증 발급 신청 (날인하기)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
