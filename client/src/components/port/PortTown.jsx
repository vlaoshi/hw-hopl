// 안개섬 무역항 - 입항 후 주 화면의 기본 틀
// [왼쪽] ① 항구 정경(날씨 창)  ② 마을 지도
// [오른쪽] 현판(항구 이름·오늘 날짜) → ③ 상품 리스트 구역 + ④ 명령 창 → ⑤ 대화창
//
// ※ 지금 단계
//   - ③ 상품 리스트: 서버 상품 API(GET /api/products)로 진열해요. 카드를 누르면 상세 페이지로 가요.
//   - ⑤ 대화창: 상점 주인 캐릭터가 생기기 전까지 상단 비서가 맡아요.
//   - ① 날씨: 예시 값이에요. (실제 날씨 연동 예정)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import SecretaryPortrait from '../harbor/SecretaryPortrait.jsx'
import WeatherVista from './WeatherVista.jsx'
import TownMap from './TownMap.jsx'
import GoodsList from '../goods/GoodsList.jsx'
import { PORT_NAME, TOWN_PLACES, WEATHER_SAMPLE } from './portData.js'
import './PortTown.css'

// ④ 명령 창 (첫 줄에 커서가 깜빡여요)
const COMMANDS = [
  { to: '/shop', label: '물건 보기' },
  { to: '/picks', label: '점장 추천상품' },
  { to: '/cart', label: '장바구니' },
  { to: '/orders', label: '주문 내역' },
]

function formatToday() {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function PortTown({ user }) {
  const [selectedPlaceId, setSelectedPlaceId] = useState('shop')
  const [line, setLine] = useState(`${user.name} 상단주님, 다음엔 무엇을 할까요?`)

  // 마을 지도에서 장소를 고르면: 이용 가능한 곳은 선택, 준비 중인 곳은 안내 대사
  const handleSelectPlace = (place) => {
    if (place.available) {
      setSelectedPlaceId(place.id)
      setLine(`${place.name}에 들렀습니다. 진열장의 물건을 둘러보시지요.`)
    } else {
      setLine(place.notice)
    }
  }

  return (
    <div className="port-inner">
      {/* 왼쪽 열: 항구 정경 + 마을 지도 */}
      <div className="port-side">
        <WeatherVista weather={WEATHER_SAMPLE} />
        <TownMap places={TOWN_PLACES} selectedId={selectedPlaceId} onSelect={handleSelectPlace} />
      </div>

      {/* 오른쪽 열 */}
      <div className="port-main">
        <p className="harbor-plaque port-plaque">
          <span className="harbor-plaque-side">◆ {formatToday()} ◆</span>
          <strong>{PORT_NAME}</strong>
          <span className="harbor-plaque-side">◆ 하플 상회 ◆</span>
        </p>

        <div className="port-center">
          {/* ③ 상품 리스트 (하플 상회 진열장) */}
          <section className="port-panel port-goods" aria-label="하플 상회 진열장">
            <GoodsList />
          </section>

          {/* ④ 명령 창 */}
          <div className="harbor-command port-orders">
            <p className="harbor-command-title">◆ 명령 ◆</p>
            <nav className="harbor-command-list" aria-label="명령">
              {COMMANDS.map((command, i) => (
                <Link
                  key={command.to}
                  to={command.to}
                  className={`harbor-command-link${i === 0 ? ' is-default' : ''}`}
                >
                  {command.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* ⑤ 대화창 (상점 주인 캐릭터가 생기기 전까지 상단 비서) */}
        <div className="harbor-dialog port-dialog">
          <div className="harbor-portrait">
            <SecretaryPortrait />
          </div>
          <div className="harbor-dialog-box">
            <p className="harbor-speaker">상단 비서</p>
            <p className="harbor-line" key={line} aria-live="polite">
              “{line}”
            </p>
            <span className="harbor-next" aria-hidden="true">
              ▼
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortTown
