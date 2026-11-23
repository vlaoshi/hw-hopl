// 관리자(상점주) 상품 관리 로직
// admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 여기로 와요.
// - 진열 숨기기: isActive 를 false 로 바꾸면 손님 진열장(GET /api/products)에서 빠져요.
// - 사진은 uploadPhotos / removePhoto 로만 바꿔요. (등록·수정 요청으로는 바꾸지 않아요)
import mongoose from 'mongoose';
import Product, { MAX_PHOTOS } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { PRODUCT_PHOTO_URL, deleteProductPhotoFile } from '../middlewares/upload.js';

// 등록·수정할 수 있는 필드
// (sku 는 서버가 자동 발급하고 바꿀 수 없어서 여기 없어요)
const EDITABLE_FIELDS = ['image', 'name', 'summary', 'description', 'price', 'sortOrder', 'isActive'];

function pickEditable(body = {}) {
  const result = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

async function findProductOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, '상품을 찾을 수 없어요.');
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, '상품을 찾을 수 없어요.');
  return product;
}

// [목록] GET /api/admin/products - 숨긴 상품까지 전부
export async function listProducts(req, res) {
  const products = await Product.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: products });
}

// [상세] GET /api/admin/products/:id
export async function getProduct(req, res) {
  res.json({ success: true, data: await findProductOrThrow(req.params.id) });
}

// [등록] POST /api/admin/products
export async function createProduct(req, res) {
  const product = await Product.create(pickEditable(req.body));
  res.status(201).json({ success: true, data: product });
}

// [수정] PATCH /api/admin/products/:id - 보낸 필드만 바꿔요. (진열 숨기기도 여기로: { isActive: false })
// "찾기 → 값 변경 → save()" 방식이라 스키마 검사가 그대로 적용돼요.
export async function updateProduct(req, res) {
  const updates = pickEditable(req.body);
  if (Object.keys(updates).length === 0) {
    throw new AppError(400, `수정할 값이 없어요. (가능한 필드: ${EDITABLE_FIELDS.join(', ')})`);
  }
  const product = await findProductOrThrow(req.params.id);
  product.set(updates);
  await product.save();
  res.json({ success: true, data: product });
}

// [삭제] DELETE /api/admin/products/:id - 올려 둔 사진 파일도 함께 지워요.
export async function deleteProduct(req, res) {
  const product = await findProductOrThrow(req.params.id);
  await product.deleteOne();
  product.photos.forEach(deleteProductPhotoFile);
  res.json({ success: true, message: '상품을 삭제했어요.', data: { _id: product._id } });
}

// [사진 올리기] POST /api/admin/products/:id/photos (form-data, 필드 이름 photos, 최대 3장)
// 이미 올린 사진과 합쳐서 3장을 넘으면 거부하고, 방금 올린 파일은 지워요.
export async function uploadPhotos(req, res) {
  const files = req.files ?? [];
  const removeUploaded = () => files.forEach((f) => deleteProductPhotoFile(`${PRODUCT_PHOTO_URL}/${f.filename}`));

  try {
    if (files.length === 0) throw new AppError(400, '올릴 사진을 골라 주세요.');
    const product = await findProductOrThrow(req.params.id);
    if (product.photos.length + files.length > MAX_PHOTOS) {
      throw new AppError(
        400,
        `실물 사진은 최대 ${MAX_PHOTOS}장이에요. 지금 ${product.photos.length}장이 있어서 ${MAX_PHOTOS - product.photos.length}장까지 더 올릴 수 있어요.`,
      );
    }
    product.photos.push(...files.map((f) => `${PRODUCT_PHOTO_URL}/${f.filename}`));
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    removeUploaded();
    throw err;
  }
}

// [사진 지우기] DELETE /api/admin/products/:id/photos  body: { url }
export async function removePhoto(req, res) {
  const { url } = req.body ?? {};
  const product = await findProductOrThrow(req.params.id);
  if (typeof url !== 'string' || !product.photos.includes(url)) {
    throw new AppError(400, '이 상품에 없는 사진이에요.');
  }
  product.photos = product.photos.filter((photo) => photo !== url);
  await product.save();
  deleteProductPhotoFile(url);
  res.json({ success: true, data: product });
}
