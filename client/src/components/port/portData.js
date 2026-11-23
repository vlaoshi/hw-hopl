// 안개섬 무역항(입항 후 주 화면)에서 쓰는 데이터 (분위기 컨셉: 고려의 국제 무역항 벽란도)
// - 화면 코드와 분리해 두어서, 나중에 실제 날씨 API·새 건물을 붙일 때 이 파일만 바꾸면 돼요.

// 항구 이름 (현판에 표시)
export const PORT_NAME = '안개섬 무역항'

// 날씨 정보 (지금은 예시 값이에요. 다음 단계에서 실제 날씨 API로 바꿀 예정)
// condition: 'snow-rain'(진눈깨비) | 'rain' | 'snow' | 'cloudy' | 'clear'
export const WEATHER_SAMPLE = {
  condition: 'snow-rain',
  label: '흐림 · 진눈깨비',
  temperature: 1, // °C
  wind: '북서풍 6m/s',
  isSample: true,
}

// 마을 지도의 장소들
// - available: true 인 곳만 들어갈 수 있어요. (지금은 하플 상회만)
// - x, y, w, h: 마을 지도 그림(120 x 150 칸) 안에서 건물이 차지하는 영역 → 누르는 버튼 위치로 써요.
// - notice: 준비 중인 곳을 눌렀을 때 대화창에 나오는 안내
export const TOWN_PLACES = [
  {
    id: 'shop',
    name: '하플 상회',
    available: true,
    x: 18,
    y: 68,
    w: 34,
    h: 26,
  },
  {
    id: 'opera',
    name: '오페라하우스',
    available: false,
    x: 66,
    y: 4,
    w: 48,
    h: 42,
    notice: '오페라하우스는 아직 공연 준비 중이에요. 곧 옛 믹스테이프를 들으실 수 있을 거예요.',
  },
  {
    id: 'tavern',
    name: '주점',
    available: false,
    x: 6,
    y: 12,
    w: 30,
    h: 26,
    notice: '주점은 아직 문을 열지 않았어요. 뱃사람들의 소문은 조금 더 기다려 주세요.',
  },
  {
    id: 'library',
    name: '서고',
    available: false,
    x: 70,
    y: 70,
    w: 34,
    h: 26,
    notice: '서고는 아직 책을 정리하는 중이에요.',
  },
  {
    id: 'shipyard',
    name: '조선소',
    available: false,
    x: 4,
    y: 96,
    w: 40,
    h: 22,
    notice: '조선소는 아직 준비 중이에요. 배를 손볼 날이 곧 올 거예요.',
  },
]
