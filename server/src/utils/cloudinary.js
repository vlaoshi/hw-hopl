// Cloudinary 사진 주소 확인
// 상품 실물 사진은 브라우저(Cloudinary 업로드 위젯)가 Cloudinary에 바로 올리고, 서버에는 주소만 보내요.
// 아무 주소나 저장되지 않게, 우리 Cloudinary 계정에 올라간 이미지 주소인지 확인해요.
//   허용 예) https://res.cloudinary.com/<클라우드이름>/image/upload/v1712345678/hapl/products/abc.jpg
import { env } from '../config/env.js';

export function isOurCloudinaryUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.hostname === 'res.cloudinary.com' &&
    url.pathname.startsWith(`/${env.cloudinaryCloudName}/image/upload/`) &&
    !url.search && // ?로 붙는 값 없이 깔끔한 주소만
    !url.hash
  );
}
