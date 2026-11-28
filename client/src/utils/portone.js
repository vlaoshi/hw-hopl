// 포트원 V2 결제창 (KG이니시스) - 공식 SDK @portone/browser-sdk 사용
// 공식 문서: https://developers.portone.io/opi/ko/integration/start/v2/checkout
//
// 필요한 환경변수 (client/.env, 브라우저에 드러나도 되는 값)
//   VITE_PORTONE_STORE_ID    : 상점 아이디 (관리자 콘솔 > 결제 연동 > 연동 정보 > 식별코드·API Keys > V2 API)
//   VITE_PORTONE_CHANNEL_KEY : 채널 키 (관리자 콘솔 > 결제 연동 > 연동 정보 > 채널 관리 > KG이니시스 채널)
// ※ V1(아임포트)의 IMP.init·IMP.request_pay·index.html 스크립트는 쓰지 않아요.
//
// KG이니시스에서 '파라미터 오류'가 나지 않게 지키는 것 (포트원 V2 KG이니시스 문서 기준)
// - paymentId: 영문·숫자 같은 ASCII 문자만, 결제마다 고유 → 우리 주문번호(ORD-YYYYMMDD-8자리)를 그대로 써요.
// - totalAmount: 원 단위 정수 → 서버가 계산한 주문서 금액을 그대로 써요. (화면에서 다시 계산하지 않아요)
// - currency: 'KRW', payMethod: 'CARD'
// - customer: PC 결제는 구매자 이름(fullName)·휴대폰(phoneNumber)·이메일(email)이 모두 필요해요.
// - redirectUrl: 모바일은 결제사 페이지로 이동했다가 돌아오는 방식이라 꼭 필요해요.

export const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID ?? ''
export const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? ''
export const isPortOneConfigured = Boolean(PORTONE_STORE_ID && PORTONE_CHANNEL_KEY)

// KG이니시스 카드 결제 최소 금액 (서버 Order 모델의 MIN_PAYMENT_AMOUNT 와 같아요)
export const MIN_PAYMENT_AMOUNT = 1000

// 모바일에서 결제 후 돌아올 주소 (예: http://localhost:5173/payment/complete)
export function paymentRedirectUrl() {
  return new URL('payment/complete', `${window.location.origin}${import.meta.env.BASE_URL}`).href
}

// 결제창 열기 → { paymentId, txId } 또는 { code, message } (실패·취소), 모바일 리디렉션이면 undefined
// order: 서버가 만든 주문서 / buyer: { name, phone, email }
export async function requestPortOnePayment(order, buyer) {
  // SDK 는 결제할 때만 불러와요. (다른 페이지는 결제 스크립트를 받지 않아요)
  const PortOne = await import('@portone/browser-sdk/v2')
  return PortOne.requestPayment({
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY,
    paymentId: order.orderNumber,
    orderName: order.orderName,
    totalAmount: order.totalAmount,
    currency: 'KRW',
    payMethod: 'CARD',
    customer: {
      fullName: buyer.name,
      phoneNumber: buyer.phone.replace(/\D/g, ''), // 숫자만 (010-1234-5678 → 01012345678)
      email: buyer.email,
    },
    redirectUrl: paymentRedirectUrl(),
  })
}
