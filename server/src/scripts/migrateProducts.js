// 상품 데이터 정리 스크립트 (한 번만 실행) - 실행: server 폴더에서 `npm run migrate:products`
// 상품 스키마가 바뀌기 전(slug 사용)에 넣은 상품을 새 형식으로 옮겨요.
//   1) 더 이상 쓰지 않는 slug 유니크 인덱스(slug_1) 삭제 (먼저 지워야 slug 를 옮길 수 있어요)
//   2) slug 필드 → image 필드로 이름 변경
//   3) SKU가 없는 상품에 겹치지 않는 SKU 발급
//   4) sku 유니크 인덱스 생성
//   5) 재고(stock) 값이 없는 상품에 기본 재고 10개 넣기 (재고 기능을 추가하기 전에 넣은 상품)
// 여러 번 실행해도 안전해요. (이미 옮긴 상품은 건드리지 않아요)
import { connectDB, disconnectDB } from '../config/db.js';
import Product from '../models/Product.js';
import { generateUniqueSku } from '../utils/sku.js';

async function migrate() {
  await connectDB();
  const collection = Product.collection;

  // 1) 옛 slug 인덱스 삭제
  if ((await collection.indexes()).some((index) => index.name === 'slug_1')) {
    await collection.dropIndex('slug_1');
    console.log('[MIGRATE] 옛 slug 인덱스(slug_1) 삭제');
  }

  // 2) slug → image (image 가 아직 없는 문서만)
  const renamed = await collection.updateMany(
    { slug: { $exists: true }, image: { $exists: false } },
    { $rename: { slug: 'image' } },
  );
  // image 가 이미 있는데 slug 가 남은 문서는 slug 만 지워요.
  await collection.updateMany({ slug: { $exists: true } }, { $unset: { slug: '' } });
  console.log(`[MIGRATE] slug → image 이름 변경: ${renamed.modifiedCount}개`);

  // 3) SKU 발급
  const noSku = await collection.find({ $or: [{ sku: { $exists: false } }, { sku: null }, { sku: '' }] }).toArray();
  for (const doc of noSku) {
    const sku = await generateUniqueSku((value) => Product.exists({ sku: value }));
    await collection.updateOne({ _id: doc._id }, { $set: { sku } });
    console.log(`[MIGRATE] ${doc.name}: SKU ${sku} 발급`);
  }
  console.log(`[MIGRATE] SKU 새로 발급: ${noSku.length}개`);

  // 4) 인덱스 정리
  await Product.syncIndexes(); // 스키마에 적힌 인덱스(sku 유니크)를 DB에 맞춰요.
  console.log('[MIGRATE] 인덱스 정리 완료:', (await collection.indexes()).map((index) => index.name).join(', '));

  // 5) 재고 기본값
  const DEFAULT_STOCK = 10;
  const stocked = await collection.updateMany({ stock: { $exists: false } }, { $set: { stock: DEFAULT_STOCK } });
  console.log(`[MIGRATE] 재고가 없던 상품에 기본 재고 ${DEFAULT_STOCK}개: ${stocked.modifiedCount}개`);

  // 확인: 새 스키마 검사를 통과하는지
  const products = await Product.find();
  let invalid = 0;
  for (const product of products) {
    try {
      await product.validate();
    } catch (error) {
      invalid++;
      const messages = error.errors ? Object.values(error.errors).map((e) => e.message) : [error.message];
      console.log(`[MIGRATE] ⚠ ${product.name}: ${messages.join(' / ')}`);
    }
  }
  console.log(`[MIGRATE] 전체 상품 ${products.length}개, 검사 통과 ${products.length - invalid}개`);

  await disconnectDB();
}

migrate().catch(async (err) => {
  console.error('[MIGRATE] 실패:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
