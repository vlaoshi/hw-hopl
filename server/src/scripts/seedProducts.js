// 예시 상품을 DB에 넣는 스크립트 - 실행: server 폴더에서 `npm run seed`
// - 기본: DB에 없는 상품(도트 이미지 image 기준)만 새로 넣어요. 이미 있는 상품은 건드리지 않아요.
//   (상점주가 관리 화면에서 고친 가격·설명이 파일 값으로 되돌아가지 않게)
// - `npm run seed -- --overwrite`: 이미 있는 상품도 파일 내용으로 덮어써요. (사진·SKU는 그대로)
// - 새로 넣는 상품에는 겹치지 않는 SKU를 발급해요.
//   (updateOne 은 모델의 pre('validate') 훅을 거치지 않아서 여기서 직접 발급해요)
import { connectDB, disconnectDB } from '../config/db.js';
import Product from '../models/Product.js';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts.js';
import { generateUniqueSku } from '../utils/sku.js';

const overwrite = process.argv.includes('--overwrite');

async function seed() {
  await connectDB();
  console.log(`[SEED] ${overwrite ? '덮어쓰기 모드: 이미 있는 상품도 파일 내용으로 바꿔요.' : '기본 모드: 없는 상품만 새로 넣어요.'}`);

  for (const item of SAMPLE_PRODUCTS) {
    const sku = await generateUniqueSku((value) => Product.exists({ sku: value }));
    const update = overwrite
      ? { $set: { ...item, isActive: true }, $setOnInsert: { sku, photos: [] } }
      : { $setOnInsert: { ...item, sku, isActive: true, photos: [] } };

    const result = await Product.updateOne({ image: item.image }, update, { upsert: true, runValidators: true });
    const status = result.upsertedCount ? `새로 진열 (SKU ${sku})` : overwrite ? '내용 덮어씀' : '이미 있어서 그대로 둠';
    console.log(`[SEED] ${item.name}: ${status}`);
  }

  console.log(`[SEED] 전체 상품 ${await Product.countDocuments()}개 (진열 중 ${await Product.countDocuments({ isActive: true })}개)`);
  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('[SEED] 실패:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
