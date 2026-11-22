// 항구 화면 (/harbor) - 메인 타이틀 화면에서 [▶ 입항하기]를 누르면 오는 곳
// 옛 게임의 교역소 화면처럼 [장면 창 + 명령 창 + 인물 대화창]으로 구성해요.
// - 입항 전(손님): 부두 장면 + 항구 검문관이 교역허가증 발급(회원가입)을 권해요.
// - 입항 후(상단주): 배를 대고 부두에 내려선 상단주·비서 장면 + 상단 비서가 다음 명령을 물어봐요.
import { Link } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser.js'
import PixelArt from '../components/harbor/PixelArt.jsx'
import SecretaryPortrait from '../components/harbor/SecretaryPortrait.jsx'
import GatekeeperPortrait from '../components/login/GatekeeperPortrait.jsx'
import { DOCK_SCENE } from '../components/harbor/dockScene.js'
import { ARRIVAL_SCENE } from '../components/harbor/arrivalScene.js'
import './HarborPage.css'

// 입항 전 명령 (첫 줄에 커서가 깜빡여요)
const GUEST_COMMANDS = [
  { to: '/signup', label: '교역허가증 발급', note: '회원가입' },
  { to: '/login', label: '입항 심사 받기', note: '로그인' },
  { to: '/shop', label: '진열장 구경하기' },
]

// 입항 후 명령
const MEMBER_COMMANDS = [
  { to: '/shop', label: '물건 보기' },
  { to: '/picks', label: '점장 추천상품' },
  { to: '/cart', label: '장바구니' },
  { to: '/orders', label: '주문 내역' },
]

const GATEKEEPER_LINE =
  '신비의 섬에 잘 왔네! 하플 상회에는 진귀한 물건들이 진열장을 채우고 있지. 그런데 교역허가증은 발급받았나?'

function HarborPage() {
  const user = useAuthUser()
  const isMember = !!user

  const commands = isMember ? MEMBER_COMMANDS : GUEST_COMMANDS
  const speakerName = isMember ? '상단 비서' : '항구 검문관'
  const line = isMember ? `${user.name} 상단주님, 다음엔 무엇을 할까요?` : GATEKEEPER_LINE

  return (
    <section className="harbor-page">
      <div className="harbor-inner">
        {/* 상단 두루마리 현판 */}
        <p className="harbor-plaque">
          <span className="harbor-plaque-side">◆ 안개섬 항구 ◆</span>
          <strong>{isMember ? '상단 선박 입항 완료' : '하플 상회 앞 부두'}</strong>
          <span className="harbor-plaque-side">◆ 맑음 · 순풍 ◆</span>
        </p>

        <div className="harbor-main">
          {/* 장면 창 */}
          <div className="harbor-scene">
            {isMember ? (
              <PixelArt
                scene={ARRIVAL_SCENE}
                className="harbor-art"
                label="하플 상회 앞 부두에 배를 대고 상단주와 상단 비서가 부두에 내려선 픽셀 아트"
              />
            ) : (
              <PixelArt
                scene={DOCK_SCENE}
                className="harbor-art"
                label="하플 상회 앞 부두에 정박해 교역품을 내리는 상선 픽셀 아트"
              />
            )}
          </div>

          {/* 명령 창 */}
          <div className="harbor-command">
            <p className="harbor-command-title">◆ 명령 ◆</p>
            <nav className="harbor-command-list" aria-label="명령">
              {commands.map((command, i) => (
                <Link
                  key={command.to}
                  to={command.to}
                  className={`harbor-command-link${i === 0 ? ' is-default' : ''}`}
                >
                  {command.label}
                  {command.note && <span className="harbor-command-note">{command.note}</span>}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* 인물 대화창 */}
        <div className="harbor-dialog">
          <div className="harbor-portrait">{isMember ? <SecretaryPortrait /> : <GatekeeperPortrait />}</div>
          <div className="harbor-dialog-box">
            <p className="harbor-speaker">{speakerName}</p>
            <p className="harbor-line" aria-live="polite">
              “{line}”
            </p>
            <span className="harbor-next" aria-hidden="true">
              ▼
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HarborPage
