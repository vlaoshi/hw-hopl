// 상품 실물 사진 업로드 처리 (multer)
// - 저장 위치: server/uploads/products/ (git 에는 올라가지 않아요)
// - 이미지 파일(jpg, png, webp, gif)만, 한 장에 5MB까지, 한 번에 최대 3장
// - 브라우저에서는 /uploads/products/파일이름 주소로 보여요. (app.js 에서 정적 파일로 내보내요)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 업로드 폴더 (server/uploads)
export const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
export const PRODUCT_PHOTO_DIR = path.join(UPLOAD_ROOT, 'products');
export const PRODUCT_PHOTO_URL = '/uploads/products'; // 브라우저에서 쓰는 주소 앞부분

fs.mkdirSync(PRODUCT_PHOTO_DIR, { recursive: true });

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: PRODUCT_PHOTO_DIR,
  // 원래 파일 이름은 쓰지 않고 무작위 이름으로 저장해요. (이름 겹침·이상한 문자 방지)
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED_TYPES[file.mimetype]}`);
  },
});

export const uploadProductPhotos = multer({
  storage,
  limits: { fileSize: MAX_PHOTO_SIZE, files: 3 },
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
    else cb(new AppError(400, '사진은 jpg, png, webp, gif 파일만 올릴 수 있어요.'));
  },
}).array('photos', 3);

// 사진 주소(/uploads/products/파일이름)로 저장된 파일을 지워요.
// 파일 이름만 꺼내 써서, 다른 폴더의 파일을 지우는 일이 없게 해요.
export function deleteProductPhotoFile(url) {
  if (typeof url !== 'string' || !url.startsWith(`${PRODUCT_PHOTO_URL}/`)) return;
  const filePath = path.join(PRODUCT_PHOTO_DIR, path.basename(url));
  fs.promises.unlink(filePath).catch(() => {
    // 이미 지워진 파일이면 무시해요.
  });
}
