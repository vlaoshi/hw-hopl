// 토스페이먼츠 결제 API 호출 (서버 전용 - 시크릿 키를 쓰기 때문에 브라우저에서 부르면 안 돼요)
// - 결제 승인: confirmPayment({ paymentKey, orderId, amount })
// - 결제 취소: cancelPayment(paymentKey, cancelReason)
// 인증: Authorization: Basic base64("시크릿키:")  (시크릿 키 뒤에 콜론을 붙여 인코딩)
// 실패하면 토스가 돌려준 { code, message } 를 담은 TossError 를 던져요.
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export class TossError extends Error {
  constructor(status, code, message, options) {
    super(message, options);
    this.name = 'TossError';
    this.status = status;
    this.code = code;
  }
}

async function tossRequest(path, body, idempotencyKey) {
  if (!env.tossSecretKey) {
    throw new AppError(503, '서버에 TOSS_SECRET_KEY 설정이 없어서 결제를 처리할 수 없어요.');
  }
  const headers = {
    Authorization: `Basic ${Buffer.from(`${env.tossSecretKey}:`).toString('base64')}`,
    'Content-Type': 'application/json',
  };
  // 같은 요청이 두 번 가도 한 번만 처리되게 하는 열쇠 (네트워크 재시도 대비)
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let res;
  try {
    res = await fetch(`${env.tossApiBase}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (err) {
    throw new TossError(502, 'NETWORK_ERROR', '결제 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', { cause: err });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new TossError(res.status, data.code ?? 'UNKNOWN', data.message ?? '결제 처리에 실패했어요.');
  return data;
}

// 결제 승인 - 결제창에서 성공하고 돌아온 뒤 서버가 최종 승인해요.
export function confirmPayment({ paymentKey, orderId, amount }) {
  return tossRequest('/v1/payments/confirm', { paymentKey, orderId, amount }, `confirm-${orderId}`);
}

// 결제 취소 (전액)
export function cancelPayment(paymentKey, cancelReason) {
  return tossRequest(`/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, { cancelReason }, `cancel-${paymentKey}`);
}
