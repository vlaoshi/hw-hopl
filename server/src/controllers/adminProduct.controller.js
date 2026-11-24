// 관리자(상점주) 상품 관리 로직
// admin.routes.js 에서 requireAuth + requireAdmin 을 거친 요청만 여기로 와요.
// - 진열 숨기기: isActive 를 false 로 바꾸면 손님 진열장(GET /api/products)에서 빠져요.
// - 사진은 addPhotos / removePhoto 로만 바꿔요. (등록·수정 요청으로는 바꾸지 않아요)
//   사진 파일 자체는 브라우저가 Cloudinary에 올리고, 서버는 주소만 저장해요.
import mongoose from 'mongoose';
import Product, { MAX_PHOTOS } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { isOurCloudinaryUrl } from '../utils/cloudinary.js';

// 등록·수정할 수 있는 필드
// (sku 는 서버가 자동 발급하고 바꿀 수 없어서 여기 없어요)
const EDITABLE_FIELDS = ['image', 'name', 'summary', 'description', 'price', 'stock', 'discontinued', 'sortOrder', 'isActive'];

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

// [목록] GET /api/admin/products?page=1&limit=5 - 숨긴 상품까지, 페이지 단위로
// - page: 몇 번째 페이지 (1부터, 기본 1) / limit: 한 페이지 개수 (기본 5, 최대 50)
// - 응답: { data: 상품 목록, pagination: { page, limit, total, totalPages } }
// - 정렬: 진열 순서 → 등록 순 → _id (같은 값이어도 페이지마다 순서가 흔들리지 않게)
export async function listProducts(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 5));

  const [products, total] = await Promise.all([
    Product.find()
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
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

// [삭제] DELETE /api/admin/products/:id
export async function deleteProduct(req, res) {
  const product = await findProductOrThrow(req.params.id);
  await product.deleteOne();
  res.json({ success: true, message: '상품을 삭제했어요.', data: { _id: product._id } });
}

// [사진 추가] POST /api/admin/products/:id/photos  body: { urls: ['https://res.cloudinary.com/...', ...] }
// 사진 파일은 브라우저가 Cloudinary 업로드 위젯으로 이미 올렸고, 여기서는 주소만 상품에 붙여요.
export async function addPhotos(req, res) {
  if (!env.cloudinaryCloudName) {
    throw new AppError(503, '서버에 CLOUDINARY_CLOUD_NAME 설정이 없어서 사진을 저장할 수 없어요.');
  }
  const { urls } = req.body ?? {};
  if (!Array.isArray(urls) || urls.length === 0) throw new AppError(400, '저장할 사진 주소(urls)를 보내 주세요.');
  if (!urls.every(isOurCloudinaryUrl)) throw new AppError(400, '우리 Cloudinary 계정에 올라간 사진 주소만 저장할 수 있어요.');

  const product = await findProductOrThrow(req.params.id);
  const newUrls = [...new Set(urls)].filter((url) => !product.photos.includes(url));
  if (product.photos.length + newUrls.length > MAX_PHOTOS) {
    throw new AppError(
      400,
      `실물 사진은 최대 ${MAX_PHOTOS}장이에요. 지금 ${product.photos.length}장이 있어서 ${MAX_PHOTOS - product.photos.length}장까지 더 넣을 수 있어요.`,
    );
  }
  product.photos.push(...newUrls);
  await product.save();
  res.status(201).json({ success: true, data: product });
}

// [사진 빼기] DELETE /api/admin/products/:id/photos  body: { url }
// 상품에서 사진 주소만 빼요. (Cloudinary에 올라간 원본 파일은 Cloudinary 관리 화면에서 지워요)
export async function removePhoto(req, res) {
  const { url } = req.body ?? {};
  const product = await findProductOrThrow(req.params.id);
  if (typeof url !== 'string' || !product.photos.includes(url)) {
    throw new AppError(400, '이 상품에 없는 사진이에요.');
  }
  product.photos = product.photos.filter((photo) => photo !== url);
  await product.save();
  res.json({ success: true, data: product });
}
