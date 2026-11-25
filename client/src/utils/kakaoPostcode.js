// 카카오 우편번호 서비스 - 스크립트 불러오기 + 검색 결과를 주소로 바꾸기
// 공식 안내: https://postcode.map.kakao.com/guide
// - 키·가입이 필요 없고, 사용량 제한 없이 상업적으로도 무료로 쓸 수 있어요.
// - 쓰는 규칙: 검색창 아래쪽 카카오 로고를 가리거나, 스크립트를 고쳐 쓰면 안 돼요.
// - 주소 데이터는 행정안전부 도로명주소 데이터를 카카오가 갱신해요.

const SCRIPT_URL = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let scriptPromise = null

// 스크립트를 한 번만 불러와요. (주소 검색을 처음 누를 때)
export function loadKakaoPostcode() {
  if (window.kakao?.Postcode) return Promise.resolve(window.kakao)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () =>
        window.kakao?.Postcode ? resolve(window.kakao) : reject(new Error('주소 검색을 준비하지 못했습니다.'))
      script.onerror = () => {
        scriptPromise = null // 다음에 다시 시도할 수 있게
        script.remove()
        reject(new Error('주소 검색을 불러오지 못했습니다. 인터넷 연결을 확인해 주십시오.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// 검색 결과(oncomplete 의 data) → { zipCode, address1 }
// - 손님이 고른 쪽(도로명 R / 지번 J)의 주소를 써요.
// - 도로명 주소에는 공식 안내 예시처럼 참고 항목을 괄호로 붙여요. 예) "판교역로 166 (백현동, 카카오판교아지트)"
//   · 법정동 이름이 '동·로·가'로 끝나면 붙여요. (리 단위는 빼요)
//   · 공동주택(아파트 등)이면 건물 이름을 붙여요.
export function toShippingAddress(data) {
  const isRoad = data.userSelectedType === 'R'
  let address = isRoad ? data.roadAddress : data.jibunAddress
  if (!address) address = data.address // 1:N 관계로 비어 있으면 기본 주소를 써요.

  if (isRoad) {
    const extras = []
    if (data.bname && /[동로가]$/.test(data.bname)) extras.push(data.bname)
    if (data.buildingName && data.apartment === 'Y') extras.push(data.buildingName)
    if (extras.length > 0) address += ` (${extras.join(', ')})`
  }
  return { zipCode: data.zonecode, address1: address }
}
