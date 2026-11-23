// ① 항구 정경 창 (날씨 창)
// 위: 항구 그림 + 날씨에 맞는 비·눈 알갱이 / 아래: 날씨·기온·바람 정보 줄
// - 지금은 진눈깨비(snow-rain) 장면만 있어요. 날씨별 그림은 앞으로 하나씩 추가해요.
// - weather 는 portData.js 의 WEATHER_SAMPLE 모양 (나중에 실제 날씨 API 결과로 교체)
import { useId } from 'react'
import PixelArt from '../harbor/PixelArt.jsx'
import { RAINY_HARBOR_SCENE } from './rainyHarborScene.js'

function WeatherVista({ weather }) {
  const uid = `wx${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const showRain = weather.condition === 'rain' || weather.condition === 'snow-rain'
  const showSnow = weather.condition === 'snow' || weather.condition === 'snow-rain'

  return (
    <section className="port-panel port-vista" aria-label="항구 정경과 날씨">
      <div className="port-vista-art">
        <PixelArt
          scene={RAINY_HARBOR_SCENE}
          className="port-vista-scene"
          label="흐리고 진눈깨비가 내리는 안개섬 무역항에 상선이 정박한 픽셀 아트"
        />
        {/* 비·눈 알갱이: 그림 위에 겹쳐서 위에서 아래로 떨어져요 (장식이라 화면 낭독기에서는 숨겨요) */}
        <svg className="port-vista-weather" viewBox="0 0 160 100" shapeRendering="crispEdges" aria-hidden="true">
          <defs>
            <pattern id={`${uid}-rain`} width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="3" y="0" width="1" height="2" fill="#c7d4e0" />
              <rect x="2" y="2" width="1" height="2" fill="#c7d4e0" />
              <rect x="13" y="8" width="1" height="2" fill="#c7d4e0" />
              <rect x="12" y="10" width="1" height="2" fill="#c7d4e0" />
              <rect x="8" y="14" width="1" height="2" fill="#aebfcd" />
              <rect x="7" y="16" width="1" height="2" fill="#aebfcd" />
            </pattern>
            <pattern id={`${uid}-snow`} width="25" height="25" patternUnits="userSpaceOnUse">
              <rect x="5" y="3" width="1" height="1" fill="#ffffff" />
              <rect x="17" y="10" width="1" height="1" fill="#ffffff" />
              <rect x="10" y="18" width="1" height="1" fill="#f2f5f8" />
              <rect x="21" y="22" width="1" height="1" fill="#ffffff" />
            </pattern>
          </defs>
          {/* 한 칸(패턴 높이)만큼 내려갔다가 처음으로 돌아가며 끊김 없이 반복돼요 */}
          {showRain && (
            <rect className="port-rain" x="0" y="-20" width="160" height="120" fill={`url(#${uid}-rain)`} />
          )}
          {showSnow && (
            <rect className="port-snow" x="-25" y="-25" width="210" height="125" fill={`url(#${uid}-snow)`} />
          )}
        </svg>
      </div>

      {/* 날씨 정보 줄 */}
      <dl className="port-weather-info">
        <div>
          <dt>날씨</dt>
          <dd>{weather.label}</dd>
        </div>
        <div>
          <dt>기온</dt>
          <dd>{weather.temperature}°C</dd>
        </div>
        <div>
          <dt>바람</dt>
          <dd>{weather.wind}</dd>
        </div>
      </dl>
      {weather.isSample && <p className="port-weather-note">※ 예시 날씨예요. 실제 날씨 연동 예정</p>}
    </section>
  )
}

export default WeatherVista
