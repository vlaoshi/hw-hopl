// 로그인 페이지 - 안개섬 "신비의 섬 입항 검문소"
// [1단계] 검문소 레이아웃 + 기본 로그인 폼 + 입력값 검사
// [2단계] 제휴 상회 통행증(소셜 로그인) 버튼
// [로그인 연동] api/auth.js 의 login() → 서버 POST /api/auth/login
//   성공 { token, user } / 실패 400·401
//   성공하면 토큰을 저장(utils/authStorage.js)하고 항구 화면(/harbor)으로 이동해요.
// [로그인 상태 확인] 저장된 토큰이 있으면 api/auth.js 의 verifySession() 으로 확인해서
//   유효하면 로그인 폼 대신 항구 화면으로 바로 보내요.
//
// [화면 용어 ↔ 코드 필드명]
//   전서구 주소 = email / 교역등록번호 = password
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, verifySession } from '../api/auth.js'
import { getToken, saveAuth } from '../utils/authStorage.js'
import { isValidEmail } from '../utils/validation.js'
import PermitField from '../components/permit/PermitField.jsx'
import GatekeeperPortrait from '../components/login/GatekeeperPortrait.jsx'
import SocialLoginButtons from '../components/login/SocialLoginButtons.jsx'
import '../styles/retro-theme.css'
import './LoginPage.css'

const INITIAL_FORM = {
  email: '',
  password: '',
}

// 이메일 형식은 회원가입과 같은 기준(utils/validation.js)을 써요.
// 로그인에서는 비밀번호 길이 같은 가입 규칙은 검사하지 않아요.
// (틀린 비밀번호인지는 서버가 판단해요.)
function validate(form) {
  const errors = {}
  if (!form.email.trim()) errors.email = '전서구 주소를 기재해 주십시오.'
  else if (!isValidEmail(form.email)) errors.email = '전서구 주소의 형식이 올바르지 않습니다.'

  if (!form.password) errors.password = '교역등록번호를 기재해 주십시오.'

  return errors
}

const NPC_NAME = '항구 검문관'
const NPC_LINE = '낯이 익은 상인이구먼! 신비의 섬에 들어오려면 교역허가증을 제시하겠나?'
const NPC_LINE_FAIL = '흠… 허가증 내용이 장부와 맞지 않는구먼. 다시 확인해 보겠나?'
const npcLineWelcome = (name) => `어서 오게, ${name} 상인! 입항을 허가하네. 좋은 거래 하게나!`

const REDIRECT_DELAY_MS = 1500 // 환영 대사를 보여준 뒤 이동하기까지의 시간
// 입항(로그인) 후 이동할 곳: 상단 비서가 맞이하는 항구 화면
const AFTER_LOGIN_PATH = '/harbor'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 교역허가증 발급(회원가입) 직후에 오면, 가입한 전서구 주소를 미리 채워 줘요.
  const prefilledEmail = typeof location.state?.email === 'string' ? location.state.email : ''
  // 장바구니 등에서 "입항하고 담기"로 왔다면 로그인 후 그 페이지로 돌아가요. (우리 사이트 안 주소만)
  const from = location.state?.from
  const afterLoginPath = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : AFTER_LOGIN_PATH
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, email: prefilledEmail }))
  const [errors, setErrors] = useState({}) // 필드별 오류 메시지
  const [notice, setNotice] = useState('') // 안내 메시지 (소셜 로그인 준비 중 등)
  const [serverError, setServerError] = useState('') // 서버 로그인 실패 메시지
  const [submitting, setSubmitting] = useState(false)
  const [npcLine, setNpcLine] = useState(NPC_LINE) // 검문관 대사 (결과에 따라 바뀜)
  const [loggedInUser, setLoggedInUser] = useState(null) // 로그인 성공한 회원
  // 저장된 토큰이 있으면 처음에 "확인 중" 상태로 시작해요. (폼이 깜빡 보였다 사라지지 않게)
  const [checkingSession, setCheckingSession] = useState(() => !!getToken())

  // 이미 로그인된 상태인지 확인 → 유효한 토큰이면 항구 화면으로 이동
  useEffect(() => {
    if (!getToken()) return
    const controller = new AbortController()

    // 유효하면 회원 정보, 만료·확인 불가면 null (만료된 토큰은 verifySession 이 지워요)
    verifySession({ signal: controller.signal })
      .then((user) => {
        if (user) navigate(afterLoginPath, { replace: true })
        else setCheckingSession(false)
      })
      .catch(() => {
        // 화면을 벗어나 요청이 취소된 경우라 따로 할 일이 없어요.
      })

    return () => controller.abort()
  }, [navigate, afterLoginPath])

  // 로그인 성공 → 환영 대사를 잠깐 보여준 뒤 항구 화면으로 이동
  useEffect(() => {
    if (!loggedInUser) return
    const timer = setTimeout(() => navigate(afterLoginPath, { replace: true }), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [loggedInUser, navigate, afterLoginPath])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // 다시 입력하면 해당 칸의 오류 메시지를 지워요.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (notice) setNotice('')
    if (serverError) setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // 페이지 새로고침 방지
    if (submitting || loggedInUser) return // 중복 제출 방지

    const nextErrors = validate(form)
    setErrors(nextErrors)
    setServerError('')
    setNotice('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const { token, user } = await login({ email: form.email.trim(), password: form.password })
      saveAuth({ token, user }) // 토큰 저장 → 이후 API 요청에 자동으로 붙어요.
      setLoggedInUser(user)
      setNpcLine(npcLineWelcome(user.name))
    } catch (err) {
      if (err.status === 401) {
        // 이메일이 없거나 비밀번호가 틀림 (서버는 어느 쪽인지 알려주지 않아요)
        setServerError('전서구 주소 또는 교역등록번호가 장부와 일치하지 않습니다.')
        setNpcLine(NPC_LINE_FAIL)
        setForm((prev) => ({ ...prev, password: '' })) // 비밀번호만 비워 다시 입력하게 해요.
      } else if (err.status === 400) {
        setServerError('전서구 주소와 교역등록번호를 모두 기재해 주십시오.')
      } else {
        // 서버 꺼짐, 네트워크 오류 등
        setServerError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // [2단계] 제휴 상회 특급 통행증 (소셜 로그인)
  // TODO: 카카오 개발자 앱 등록 후 카카오 로그인(OAuth) 페이지로 이동하도록 연결
  const handleKakaoLogin = () => {
    setNotice('카카오 상회 통행증 심사는 아직 준비 중입니다.')
  }

  // TODO: 구글 클라우드 콘솔에서 OAuth 클라이언트 등록 후 구글 로그인 연결
  const handleGoogleLogin = () => {
    setNotice('구글 상회 통행증 심사는 아직 준비 중입니다.')
  }

  // 저장된 토큰을 서버에 확인하는 동안 잠깐 보여주는 화면
  if (checkingSession) {
    return (
      <div className="retro-page login-page">
        <p className="login-checking" role="status">
          ⚓ 기존 교역허가증을 확인하는 중입니다...
        </p>
      </div>
    )
  }

  return (
    <div className="retro-page login-page">
      <div className="login-layout">
        {/* 상단: 검문관 초상화 + RPG 대화창 */}
        <section className="checkpoint" aria-label="입항 검문소">
          <div className="checkpoint-portrait">
            <GatekeeperPortrait />
          </div>
          <div className="checkpoint-dialog">
            <p className="checkpoint-name">{NPC_NAME}</p>
            {/* 대사가 바뀌면 화면 낭독기도 읽어줘요. key로 대사가 바뀔 때마다 등장 효과를 다시 줘요. */}
            <p className="checkpoint-line" key={npcLine} aria-live="polite">
              “{npcLine}”
            </p>
            <span className="checkpoint-next" aria-hidden="true">
              ▼
            </span>
          </div>
        </section>

        {/* 하단: 양피지 로그인 폼 */}
        <div className="permit-sheet">
          <div className="permit-banner">
            <h1 className="permit-title">신비의 섬 입항 검문소</h1>
            <p className="permit-subtitle">HARBOR CHECKPOINT · HAPL TRADING HOUSE</p>
          </div>

          <div className="permit-body">
            <p className="permit-intro">
              교역허가증에 기재된 전서구 주소와 교역등록번호로 입항 허가를 요청해 주십시오.
            </p>

            {/* noValidate: 브라우저 기본 검사 대신 validate()로 한국어 메시지를 보여줘요. */}
            <form className="permit-form" onSubmit={handleSubmit} noValidate>
              <PermitField
                name="email"
                label="전서구 주소"
                sub="(이메일)"
                type="email"
                autoComplete="email"
                placeholder="등록된 전서구 주소를 입력해 주십시오"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />

              {/* 회원가입 직후라 이메일이 채워져 있으면 바로 비밀번호를 입력하게 해요. (autoFocus) */}
              <PermitField
                name="password"
                label="교역등록번호"
                sub="(비밀번호)"
                type="password"
                autoComplete="current-password"
                autoFocus={!!prefilledEmail}
                placeholder="비밀 교역등록번호를 입력해 주십시오"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />

              {notice && (
                <p className="login-notice" role="status">
                  {notice}
                </p>
              )}

              {serverError && (
                <p className="permit-error permit-error-box" role="alert">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                className="pixel-btn pixel-btn-seal permit-submit"
                disabled={submitting || !!loggedInUser}
              >
                {loggedInUser
                  ? '입항 허가 완료!'
                  : submitting
                    ? '입항 심사 중...'
                    : '입항 허가 요청 (로그인)'}
              </button>
            </form>

            {/* [2단계] 소셜 로그인 */}
            <SocialLoginButtons onKakao={handleKakaoLogin} onGoogle={handleGoogleLogin} />

            <p className="login-signup-link">
              아직 교역허가증이 없으십니까? <Link to="/signup">교역허가증 발급받기 ▶</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
