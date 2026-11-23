// ② 마을 지도 창
// 위에서 내려다본 마을 그림 위에 건물마다 누를 수 있는 이름표 버튼을 겹쳐 둬요.
// - 이용 가능한 곳(하플 상회)은 금색 이름표, 준비 중인 곳은 흐린 이름표로 보여요.
// - 누르면 onSelect(place) 로 알려줘요. (어떤 반응을 할지는 PortTown 이 정해요)
import PixelArt from '../harbor/PixelArt.jsx'
import { TOWN_MAP_SCENE } from './townMapScene.js'

const MAP_WIDTH = 120
const MAP_HEIGHT = 150

function TownMap({ places, selectedId, onSelect }) {
  return (
    <section className="port-panel port-town" aria-label="마을 지도">
      <p className="port-panel-title">◆ 마을 ◆</p>
      <div className="port-town-map">
        <PixelArt scene={TOWN_MAP_SCENE} className="port-town-art" />
        {places.map((place) => (
          <button
            key={place.id}
            type="button"
            className={[
              'port-place',
              place.available ? 'is-available' : 'is-locked',
              selectedId === place.id ? 'is-selected' : '',
            ].join(' ')}
            // 그림 좌표(칸)를 % 로 바꿔서, 지도 크기가 바뀌어도 건물 위에 정확히 겹쳐요.
            style={{
              left: `${(place.x / MAP_WIDTH) * 100}%`,
              top: `${(place.y / MAP_HEIGHT) * 100}%`,
              width: `${(place.w / MAP_WIDTH) * 100}%`,
              height: `${(place.h / MAP_HEIGHT) * 100}%`,
            }}
            aria-pressed={selectedId === place.id}
            onClick={() => onSelect(place)}
          >
            <span className="port-place-label">
              {place.available ? '★ ' : ''}
              {place.name}
              {!place.available && <span className="port-place-lock"> · 준비 중</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default TownMap
