// 상품(Product) 스키마 - 하플 상회 진열장에 놓이는 물건
// 필수: sku(자동 발급·유니크·변경 불가), name, price, image(도트 이미지), description, stock(재고)
// 선택: summary 는 진열장 카드용 한두 줄 설명(필수), photos 는 실물 사진(선택, 최대 3장)
import mongoose from 'mongoose';
import { SKU_PATTERN, generateUniqueSku } from '../utils/sku.js';

export const MAX_PHOTOS = 3; // 상세 페이지 실물 사진 최대 장수
// 판매 상태 (재고와 판매 종료 여부로 정해져요)
// - 구매 가능: 재고 1개 이상
// - 품절     : 재고 0개 + 다시 들여올 예정 (discontinued: false)
// - 판매 완료: 재고 0개 + 더 들여올 계획 없음 (discontinued: true)
export const LOW_STOCK_THRESHOLD = 3; // 재고가 이 수 이하(1개 이상)면 상점주 대시보드에 '재고 적음' 알림

// 판매 상태 계산: 'available'(구매 가능) | 'soldout'(품절) | 'ended'(판매 완료)
// (client/src/utils/stock.js 의 saleStatus 와 같은 기준)
export function getSaleStatus(product) {
  if ((product?.stock ?? 0) > 0) return 'available';
  return product?.discontinued ? 'ended' : 'soldout';
}

const productSchema = new mongoose.Schema(
  {
    // 상품 고유 코드: HAPL- + 영문 대·소문자·숫자 8자리 (예: HAPL-a7K2m9Qx)
    // 등록할 때 서버가 자동으로 만들어요. 한 번 정해지면 바꿀 수 없어요. (immutable)
    sku: {
      type: String,
      required: [true, 'SKU는 필수예요.'],
      unique: true, // DB 유니크 인덱스: 같은 SKU는 절대 두 번 저장되지 않아요.
      immutable: true,
      match: [SKU_PATTERN, 'SKU 형식이 올바르지 않아요. (HAPL- + 영문·숫자 8자리)'],
    },
    name: {
      type: String,
      required: [true, '상품 이름은 필수예요.'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, '가격은 필수예요.'],
      min: [0, '가격은 0원 이상이어야 해요.'],
      validate: {
        validator: Number.isInteger,
        message: '가격은 원 단위 정수로 써 주세요.',
      },
    },
    // 재고 수량 - 0이면 품절 또는 판매 완료 (장바구니에 담을 수 없어요)
    stock: {
      type: Number,
      required: [true, '재고 수량은 필수예요.'],
      default: 0,
      min: [0, '재고는 0개 이상이어야 해요.'],
      validate: {
        validator: Number.isInteger,
        message: '재고는 정수(개)로 써 주세요.',
      },
    },
    // 판매 종료(재입고 계획 없음) - true 면 재고가 0일 때 '품절' 대신 '판매 완료'로 보여요.
    discontinued: {
      type: Boolean,
      default: false,
    },
    // 도트 이미지 이름 - 진열장·상세 페이지에 보이는 픽셀 그림
    // (client/src/components/goods/goodsSprites.js 의 그림 이름과 짝을 이뤄요. 예: 'ipod-4th')
    image: {
      type: String,
      required: [true, '도트 이미지는 필수예요.'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, '도트 이미지 이름은 영문 소문자, 숫자, - 만 쓸 수 있어요.'],
    },
    // 상세 페이지 '물건 이야기'에 보이는 설명
    description: {
      type: String,
      required: [true, '설명은 필수예요.'],
      trim: true,
    },
    // 진열장 카드에 보이는 한두 줄 설명
    summary: {
      type: String,
      required: [true, '간단한 설명은 필수예요.'],
      trim: true,
      maxlength: [120, '간단한 설명은 120자 이하로 써 주세요.'],
    },
    // 상세 페이지 실물 사진 주소 (선택, 최대 3장)
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_PHOTOS,
        message: `실물 사진은 최대 ${MAX_PHOTOS}장까지 넣을 수 있어요.`,
      },
    },
    // 진열장에 놓는 순서 (작을수록 앞)
    sortOrder: {
      type: Number,
      default: 0,
    },
    // false 면 진열장에서 숨겨요 (판매 중지 등)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 관리
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// 새 상품을 저장하기 전에 SKU가 없으면 겹치지 않는 SKU를 발급해요.
productSchema.pre('validate', async function () {
  if (this.isNew && !this.sku) {
    this.sku = await generateUniqueSku((sku) => this.constructor.exists({ sku }));
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
