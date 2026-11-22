// 회원가입 Step 1 - 인트로 컷신
// 검은 화면 위쪽에 항구 입항 픽셀 아트, 아래쪽에 RPG 대화창 문구가 타자기처럼 출력돼요.
// - 대화창을 클릭하면 문구가 한 번에 모두 표시돼요.
// - 오른쪽 위 [건너뛰기] 또는 [▶ 교역허가증 작성하기]를 누르면 양식(Step 2)으로 넘어가요.
import { useEffect, useState } from 'react'
import HarborPixelArt from './HarborPixelArt.jsx'

const INTRO_TEXT =
  '당신은 대항해시대, 신비의 섬 「안개섬」에 입항한 상인입니다. ' +
  // '하플 상회'는 줄바꿈 없는 공백이라 두 단어가 다른 줄로 갈라지지 않아요.
  '이곳 하플\u00A0상회에서 진귀한 물품을 거래하기 위해서는 정식 교역상인 등록 절차를 거쳐야 합니다.'

const TYPING_SPEED_MS = 45 // 한 글자가 출력되는 간격

// 움직임 줄이기 설정을 켠 사용자에게는 타자기 효과 없이 바로 보여줘요.
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function IntroCutscene({ onStart }) {
  const [shownLength, setShownLength] = useState(() =>
    prefersReducedMotion() ? INTRO_TEXT.length : 0,
  )
  const isDone = shownLength >= INTRO_TEXT.length

  // 타자기 효과: 일정 간격으로 보여줄 글자 수를 1씩 늘려요.
  useEffect(() => {
    if (isDone) return
    const timer = setTimeout(() => setShownLength((n) => n + 1), TYPING_SPEED_MS)
    return () => clearTimeout(timer)
  }, [shownLength, isDone])

  // 대화창 클릭 → 남은 문구를 한 번에 표시
  const showAll = () => setShownLength(INTRO_TEXT.length)

  return (
    <div className="intro">
      <button type="button" className="intro-skip" onClick={onStart}>
        건너뛰기 ▶▶
      </button>

      <div className="intro-scene">
        <div className="intro-art-frame">
          <HarborPixelArt />
        </div>

        {/* 대화창: 클릭하거나 Enter/Space로 문구를 모두 펼쳐요. */}
        <div
          className="intro-dialog"
          onClick={isDone ? undefined : showAll}
          onKeyDown={(e) => {
            if (!isDone && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              showAll()
            }
          }}
          role={isDone ? undefined : 'button'}
          tabIndex={isDone ? undefined : 0}
          aria-label={isDone ? undefined : '안내 문구 모두 보기'}
        >
          {/* 화면 낭독기에는 전체 문구를 한 번에 읽어줘요. */}
          <p className="sr-only">{INTRO_TEXT}</p>
          <p className="intro-text" aria-hidden="true">
            {INTRO_TEXT.slice(0, shownLength)}
            {!isDone && <span className="intro-caret">▌</span>}
          </p>

          {isDone ? (
            <button type="button" className="pixel-btn intro-start" onClick={onStart} autoFocus>
              [ ▶ 교역허가증 작성하기 ]
            </button>
          ) : (
            <span className="intro-hint" aria-hidden="true">
              ▼ 클릭하여 넘기기
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default IntroCutscene
