// 포트원(PortOne) V2 결제 API 호출 (서버 전용 - API Secret 을 쓰기 때문에 브라우저에서 부르면 안 돼요)
// 공식 문서: https://developers.portone.io/api/rest-v2
// - 결제 조회: getPayment(paymentId)          GET  /payments/{paymentId}
// - 결제 취소: cancelPayment(paymentId, {...}) POST /payments/{paymentId}/cancel  { reason(필수), requester }
// 인증: Authorization: PortOne <V2 API Secret>
// 실패하면 포트원이 돌려준 { type, message } 를 담은 PortOneError 를 던져요.
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export class PortOneError extends Error {
  constructor(status, type, message, options) {
    super(message, options);
    this.name = 'PortOneError';
    this.status = status;
    this.type = type; // 예) PAYMENT_NOT_FOUND, PAYMENT_ALREADY_CANCELLED
  }
}

async function portoneRequest(method, path, body) {
  if (!env.portoneApiSecret) {
    throw new AppError(503, '서버에 PORTONE_API_SECRET 설정이 없어서 결제를 확인할 수 없어요.');
  }
  let res;
  try {
    res = await fetch(`${env.portoneApiBase}${path}`, {
      method,
      headers: { Authorization: `PortOne ${env.portoneApiSecret}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60_000), // 포트원 권장: 60초 이상 기다리기
    });
  } catch (err) {
    throw new PortOneError(502, 'NETWORK_ERROR', '결제 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', { cause: err });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PortOneError(res.status, data.type ?? 'UNKNOWN', data.message ?? '결제 처리에 실패했어요.');
  return data;
}

// 결제 조회 → { status: 'PAID' | 'FAILED' | 'CANCELLED' | 'READY' | 'PAY_PENDING' | ..., amount: { total }, currency, ... }
export function getPayment(paymentId) {
  return portoneRequest('GET', `/payments/${encodeURIComponent(paymentId)}`);
}

// 결제 취소 (전액). requester: 'CUSTOMER'(고객 요청) | 'ADMIN'(상점주)
export function cancelPayment(paymentId, { reason, requester = 'ADMIN' }) {
  return portoneRequest('POST', `/payments/${encodeURIComponent(paymentId)}/cancel`, { reason, requester });
}

// 결제 수단을 사람이 읽는 이름으로 (예: '카드 · 신한카드', '간편결제 · KAKAOPAY')
export function describePaymentMethod(method) {
  if (!method?.type) return undefined;
  if (method.type === 'PaymentMethodCard') return ['카드', method.card?.name].filter(Boolean).join(' · ');
  if (method.type === 'PaymentMethodEasyPay') return ['간편결제', method.provider].filter(Boolean).join(' · ');
  if (method.type === 'PaymentMethodTransfer') return '계좌이체';
  if (method.type === 'PaymentMethodVirtualAccount') return '가상계좌';
  if (method.type === 'PaymentMethodMobile') return '휴대폰';
  return method.type.replace('PaymentMethod', '');
}
