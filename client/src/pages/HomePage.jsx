// 메인 페이지 - 하플 상회 타이틀 화면
// 옛 게임의 시작 화면처럼, 교역품을 가득 실은 상선이 안개섬 항구로 들어오는 장면과
// "하플 상회" 타이틀을 보여줘요. 버튼을 누르면 항구 화면(/harbor)으로 이동해요.
// - 입항 전: [▶ 입항하기]  /  입항 후(로그인): [▶ 상회로 들어가기]
// ※ 서버 연결 확인은 http://localhost:4000/api/health 에서 할 수 있어요.
import { Link } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser.js'
import PixelArt from '../components/harbor/PixelArt.jsx'
import { TITLE_SCENE } from '../components/harbor/titleScene.js'
import './HomePage.css'

function HomePage() {
  const user = useAuthUser()

  return (
    <section className="title-page">
      <div className="title-screen">
        {/* 그림 + 타이틀 */}
        <div className="title-stage">
          <PixelArt
            scene={TITLE_SCENE}
            className="title-art"
            label="새벽 바다에서 교역품을 가득 실은 큰 상선이 안개섬 항구로 입항하는 픽셀 아트"
          />
          <div className="title-heading">
            <p className="title-en">HAPL TRADING HOUSE</p>
            <h1 className="title-name">하플 상회</h1>
            <p className="title-sub">— 안개섬의 진귀품 교역소 —</p>
          </div>
        </div>

        {/* 안내 창 + 입항 버튼 (넓은 화면에서는 그림 위, 휴대폰에서는 그림 아래) */}
        <div className="title-panel">
          <p className="title-tagline">
            대항해시대, 신기한 물건을 찾아
            <br />
            새로운 도시를 누비는
            <br />
            <strong>상인 여러분을 기다립니다.</strong>
          </p>
          <Link to="/harbor" className="title-start">
            <span className="title-start-cursor" aria-hidden="true">
              ▶
            </span>
            {user ? '상회로 들어가기' : '입항하기'}
          </Link>
        </div>

        <p className="title-copy">© 2026 HAPL TRADING HOUSE · 안개섬 항구</p>
      </div>
    </section>
  )
}

export default HomePage
