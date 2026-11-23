// 상품(Product) 조회 로직
// 지금은 손님·상인 누구나 볼 수 있는 조회만 있어요.
// (상품 등록·수정·사진 올리기는 나중에 '상회 관리'(관리자 전용) 기능으로 만들어요.)
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

// [R] 진열장 상품 목록 - GET /api/products
// 판매 중(isActive)인 상품만, 진열 순서대로 보내요.
export async function getProducts(req, res) {
  const products = await Product.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: products });
}

// [R] 상품 상세 - GET /api/products/:id
export async function getProductById(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, '상품을 찾을 수 없어요.');

  const product = await Product.findOne({ _id: id, isActive: true });
  if (!product) throw new AppError(404, '상품을 찾을 수 없어요.');

  res.json({ success: true, data: product });
}
