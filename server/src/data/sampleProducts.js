// 진열장에 처음 놓을 예시 상품 (npm run seed 로 DB에 넣어요)
// ※ 설명은 임시 값이에요. (가격은 2026-11-23 확정) 이 파일을 고친 뒤 npm run seed 를 다시 실행하면 DB에 반영돼요.
// ※ 체험판(GitHub Pages)용 같은 목록이 client/src/api/demoProducts.js 에도 있어요. 바꿀 때 함께 바꿔 주세요.
// ※ image 는 진열장 도트 그림(client/src/components/goods/goodsSprites.js)의 이름과 짝을 이뤄요.
// ※ SKU 는 적지 않아요. DB에 처음 넣을 때 자동으로 발급돼요.

export const SAMPLE_PRODUCTS = [
  {
    image: 'laptop-sleeve',
    name: '랩탑 슬리브',
    summary: '먼 항해에도 노트북을 지켜 주는 도톰한 펠트 슬리브입니다.',
    description:
      '두꺼운 펠트와 지퍼로 노트북을 감싸 흠집과 충격을 막아 줍니다. 가죽 이름표가 달려 있어 여러 상인들 사이에서도 내 물건을 쉽게 알아볼 수 있습니다.',
    price: 25000,
    stock: 10,
    sortOrder: 1,
  },
  {
    image: 'airport-tower',
    name: '애플 공유기 (타워형)',
    summary: '하얀 등대처럼 우뚝 선 타워형 무선 공유기입니다.',
    description:
      '세로로 길게 선 하얀 탑 모양의 무선 공유기입니다. 상단의 전파가 선실 구석구석까지 닿아, 항구 어디에서나 전서구보다 빠르게 소식을 주고받을 수 있습니다.',
    price: 85000,
    stock: 10,
    sortOrder: 2,
  },
  {
    image: 'ipod-4th',
    name: '아이팟 4세대',
    summary: '손끝으로 돌리는 클릭 휠, 주머니 속 음악 상자입니다.',
    description:
      '둥근 클릭 휠을 손끝으로 돌려 노래를 고르는 휴대용 음악 기기입니다. 흑백 화면과 하얀 몸체가 그 시절 감성을 그대로 간직하고 있습니다.',
    price: 70000,
    stock: 10,
    sortOrder: 3,
  },
  {
    image: 'ipod-dock-speaker',
    name: '아이팟 도킹 스피커',
    summary: '아이팟을 꽂으면 선실 가득 음악이 울리는 도킹 스피커입니다.',
    description:
      '가운데 거치대에 아이팟을 꽂으면 충전과 함께 양쪽 스피커로 음악이 흘러나옵니다. 긴 항해의 밤을 함께할 작은 악단입니다.',
    price: 70000,
    stock: 10,
    sortOrder: 4,
  },
]
