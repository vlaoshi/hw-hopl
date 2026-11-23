// Cloudinary 설정과 사진 주소 도우미
// - 환경변수는 client/.env 에 적어요. (예시: client/.env.example)
//   VITE_CLOUDINARY_CLOUD_NAME    : Cloudinary 클라우드 이름
//   VITE_CLOUDINARY_UPLOAD_PRESET : 서명 없이(Unsigned) 올릴 수 있는 업로드 프리셋 이름
// - VITE_ 로 시작하는 값은 브라우저에 그대로 드러나요. API Secret 같은 비밀값은 절대 넣지 마세요.

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? ''
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? ''

// 두 값이 모두 있어야 업로드 위젯을 쓸 수 있어요.
export const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)

// 올린 사진을 모아 둘 Cloudinary 폴더
export const PRODUCT_PHOTO_FOLDER = 'hapl-mall/products'

// Cloudinary 이미지 주소에 변환 옵션을 끼워 넣어요. (원본은 그대로, 보여 줄 때만 줄이고 가볍게)
//   예) cloudinaryImage(url, PHOTO_SQUARE(480))
//   → https://res.cloudinary.com/<이름>/image/upload/c_pad,b_white,w_480,h_480,cs_srgb,f_auto,q_auto/v123/파일.jpg
// - cs_srgb: 아이폰·맥의 HDR(Display P3 + PQ) 사진을 일반 화면 색(sRGB)으로 바꿔요.
//            HDR 사진을 그대로 보여 주면 브라우저에서 흰 배경이 회색처럼 탁하게 보여요.
// - f_auto: 브라우저에 맞는 가벼운 형식(webp 등), q_auto: 눈에 띄지 않게 용량 줄이기
// - Cloudinary 주소가 아니면 그대로 돌려줘요.
export function cloudinaryImage(url, transform = '') {
  const marker = '/image/upload/'
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/') || !url.includes(marker)) return url
  const options = [transform, 'cs_srgb', 'f_auto', 'q_auto'].filter(Boolean).join(',')
  return url.replace(marker, `${marker}${options}/`)
}

// 정사각형 칸에 사진 전체가 보이게 맞춰요. (잘라내지 않고 남는 곳은 흰 여백으로 채워요)
export const PHOTO_SQUARE = (size) => `c_pad,b_white,w_${size},h_${size}`

// 원본 크게 보기용 (긴 쪽을 최대 1600px로, 작은 사진은 그대로)
export const PHOTO_LARGE = 'c_limit,w_1600,h_1600'
