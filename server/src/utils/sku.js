// SKU(상품 고유 코드) 만들기
// 형식: HAPL- + 영문 대·소문자와 숫자를 섞은 8자리 (예: HAPL-a7K2m9Qx)
// - 대·소문자를 구분해요. (HAPL-aB12cD34 와 HAPL-Ab12cD34 는 서로 다른 SKU)
import crypto from 'node:crypto';

export const SKU_PREFIX = 'HAPL-';
export const SKU_PATTERN = /^HAPL-[A-Za-z0-9]{8}$/;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_TRIES = 10;

// 무작위 SKU 하나 (겹치는지는 확인하지 않아요)
export function randomSku() {
  let code = '';
  // crypto.randomInt: 고르게 섞인 무작위 숫자 (Math.random 보다 예측하기 어려워요)
  for (let i = 0; i < 8; i++) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return SKU_PREFIX + code;
}

// DB에 없는 SKU를 만들 때까지 다시 뽑아요. exists(sku) 는 이미 있으면 true 를 돌려주는 함수예요.
// (8자리 62가지 조합이라 겹칠 일은 거의 없지만, 혹시 겹쳐도 다시 뽑아요)
export async function generateUniqueSku(exists) {
  for (let i = 0; i < MAX_TRIES; i++) {
    const sku = randomSku();
    if (!(await exists(sku))) return sku;
  }
  throw new Error('SKU를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
}
