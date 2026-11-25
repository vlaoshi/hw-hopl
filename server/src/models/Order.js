// 주문(Order) 스키마 - 장바구니로 주문하고 토스페이먼츠(테스트 모드)로 결제하는 주문서
//
// 설계 원칙
// - 주문 당시의 상품 이름·가격·이미지를 주문서에 복사해 둬요(스냅샷).
//   상점주가 나중에 가격을 바꾸거나 상품을 지워도 주문서는 그대로 남아요.
// - 금액은 서버가 계산하고, 저장 전에 한 번 더 맞는지 확인해요. (lineTotal·itemsTotal·totalAmount)
//   결제 승인 때는 토스가 돌려준 금액이 totalAmount 와 같은지도 확인해요. (금액 조작 방지)
// - 주문 상태는 정해진 순서로만 바뀌어요. (ORDER_STATUS_FLOW) 바뀔 때마다 statusHistory 에 기록이 남아요.
// - 주문은 거래 기록이라 회원이 탈퇴해도 지우지 않아요.
//
// 사용 예)
//   const order = await Order.create({ user, orderName, items, itemsTotal, totalAmount, shipping })
//   order.changeStatus('paid', { by: 'system', note: '결제 승인' }); await order.save()
import mongoose from 'mongoose';
import { randomCode } from '../utils/sku.js';

export const MAX_ORDER_ITEMS = 30; // 한 주문에 담을 수 있는 상품 종류 (장바구니와 같아요)
export const MAX_ORDER_QUANTITY = 99; // 한 상품 최대 수량 (장바구니와 같아요)
export const ORDER_NUMBER_PATTERN = /^ORD-\d{8}-[A-Za-z0-9]{8}$/;

// 주문 상태 (코드 → 화면 이름)
export const ORDER_STATUS_LABEL = {
  awaiting_payment: '결제 대기', // 주문서만 만들고 결제창으로 간 상태
  paid: '결제 완료',
  preparing: '상품 준비중',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '주문 취소',
  payment_failed: '결제 실패',
};
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL);

// 상태가 바뀔 수 있는 길 (여기 없는 이동은 저장할 때 막아요)
export const ORDER_STATUS_FLOW = {
  awaiting_payment: ['paid', 'payment_failed'],
  paid: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
  payment_failed: [],
};

// 손님 주문 내역에 보여 주는 상태 (결제가 안 된 주문은 빼요)
export const CUSTOMER_VISIBLE_STATUSES = ['paid', 'preparing', 'shipping', 'delivered', 'cancelled'];

export const PAYMENT_STATUSES = ['ready', 'done', 'failed', 'canceled']; // 결제 전 · 승인 · 실패 · 결제 취소

// 0 이상 정수 칸 (subject 는 조사까지 붙여서: '수량은', '배송비는')
const integerMin = (min, subject) => ({
  type: Number,
  required: [true, `${subject} 필수예요.`],
  min: [min, `${subject} ${min} 이상이어야 해요.`],
  validate: { validator: Number.isInteger, message: `${subject} 정수로 써 주세요.` },
});

// 연락처를 010-1234-5678 모양으로 맞춰요. (01012345678 처럼 붙여 써도 같은 모양으로 저장)
function formatPhone(value) {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (!/^01[016789]\d{7,8}$/.test(digits)) return value.trim(); // 형식이 틀리면 그대로 두고 검사에서 막아요.
  const middle = digits.length === 11 ? 4 : 3;
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middle)}-${digits.slice(3 + middle)}`;
}

// 주문한 물건 한 줄 (주문 당시 값을 복사해서 저장)
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, '상품은 필수예요.'] },
    sku: { type: String, required: [true, '상품 코드(SKU)는 필수예요.'] },
    name: { type: String, required: [true, '상품 이름은 필수예요.'], trim: true },
    image: { type: String, required: [true, '도트 이미지는 필수예요.'] },
    price: integerMin(0, '가격은'),
    quantity: {
      ...integerMin(1, '수량은'),
      max: [MAX_ORDER_QUANTITY, `수량은 ${MAX_ORDER_QUANTITY}개까지 주문할 수 있어요.`],
    },
    lineTotal: integerMin(0, '줄 합계는'),
  },
  { _id: false },
);

// 배송지 (주문할 때마다 입력, 그때 값을 그대로 저장)
const shippingSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: [true, '받는 사람은 필수예요.'],
      trim: true,
      maxlength: [20, '받는 사람은 20자 이하로 써 주세요.'],
    },
    phone: {
      type: String,
      required: [true, '연락처는 필수예요.'],
      set: formatPhone,
      match: [/^01[016789]-\d{3,4}-\d{4}$/, '연락처는 010-1234-5678 형식으로 써 주세요.'],
    },
    // 우편번호 (주소 검색으로 채워요, 5자리 국가기초구역번호)
    zipCode: {
      type: String,
      required: [true, '우편번호는 필수예요. 주소 검색으로 채워 주세요.'],
      trim: true,
      match: [/^\d{5}$/, '우편번호는 숫자 5자리예요.'],
    },
    // 기본 주소 (주소 검색 결과: 도로명 또는 지번 주소)
    address1: {
      type: String,
      required: [true, '주소는 필수예요.'],
      trim: true,
      maxlength: [200, '주소는 200자 이하로 써 주세요.'],
    },
    address2: { type: String, trim: true, maxlength: [100, '상세 주소는 100자 이하로 써 주세요.'] },
    memo: { type: String, trim: true, maxlength: [100, '배송 메모는 100자 이하로 써 주세요.'] },
  },
  { _id: false },
);

// 결제 정보 (토스페이먼츠)
const paymentSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'tosspayments' },
    status: {
      type: String,
      enum: { values: PAYMENT_STATUSES, message: '결제 상태가 올바르지 않아요.' },
      default: 'ready',
    },
    paymentKey: { type: String }, // 승인 후 토스가 주는 결제 키 (비어 있으면 저장하지 않아요)
    method: { type: String }, // 카드, 간편결제 등 (토스 응답 값)
    approvedAt: { type: Date },
    receiptUrl: { type: String },
    failCode: { type: String },
    failMessage: { type: String },
    canceledAt: { type: Date },
    cancelReason: { type: String },
  },
  { _id: false },
);

// 상태가 바뀐 기록 한 줄
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, enum: ['customer', 'admin', 'system'], default: 'system' }, // 누가 바꿨는지
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    // 주문번호: ORD-YYYYMMDD-영문·숫자 8자리 (예: ORD-20261125-a7K2m9Qx)
    // 저장할 때 자동으로 만들고 바꿀 수 없어요. 토스페이먼츠 orderId 로도 그대로 써요.
    orderNumber: {
      type: String,
      required: [true, '주문번호는 필수예요.'],
      unique: true,
      immutable: true,
      match: [ORDER_NUMBER_PATTERN, '주문번호 형식이 올바르지 않아요.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '주문한 회원은 필수예요.'],
      immutable: true,
    },
    // 결제창·주문 목록에 보이는 이름 (예: "랩탑 슬리브 외 2건")
    orderName: {
      type: String,
      required: [true, '주문 이름은 필수예요.'],
      trim: true,
      maxlength: [100, '주문 이름은 100자 이하로 써 주세요.'],
    },
    items: {
      type: [orderItemSchema],
      validate: [
        { validator: (items) => items.length >= 1, message: '주문할 물건이 없어요.' },
        {
          validator: (items) => items.length <= MAX_ORDER_ITEMS,
          message: `한 번에 ${MAX_ORDER_ITEMS}종류까지 주문할 수 있어요.`,
        },
        {
          validator: (items) => new Set(items.map((item) => String(item.product))).size === items.length,
          message: '같은 상품이 주문서에 두 번 들어 있어요.',
        },
      ],
    },
    itemsTotal: integerMin(0, '상품 합계는'),
    shippingFee: { ...integerMin(0, '배송비는'), default: 0 }, // 지금은 항상 무료(0원)
    totalAmount: integerMin(0, '결제 금액은'),
    shipping: { type: shippingSchema, required: [true, '배송지는 필수예요.'] },
    payment: { type: paymentSchema, default: () => ({}) },
    status: {
      type: String,
      enum: { values: ORDER_STATUSES, message: '주문 상태가 올바르지 않아요.' },
      default: 'awaiting_payment',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    // 재고를 이미 줄였는지 - 취소할 때 재고를 한 번만 되돌리기 위해 기억해요.
    stockDeducted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt(주문 시각), updatedAt 자동 관리
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// 인덱스: 내 주문 내역(최근 순), 상점주 주문 관리(상태별 최근 순), 결제 키 중복 방지
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.paymentKey': 1 }, { unique: true, sparse: true });

// 오늘 날짜(한국 시간) YYYYMMDD
function todayKST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date())
    .replaceAll('-', '');
}

// DB에 없는 주문번호를 만들 때까지 다시 뽑아요.
async function generateUniqueOrderNumber(exists) {
  for (let i = 0; i < 10; i++) {
    const orderNumber = `ORD-${todayKST()}-${randomCode(8)}`;
    if (!(await exists(orderNumber))) return orderNumber;
  }
  throw new Error('주문번호를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
}

// DB에서 읽어 온 주문의 원래 상태를 기억해요. (상태 이동 검사에 써요)
orderSchema.post('init', function () {
  this.$locals.loadedStatus = this.status;
});

// 상태 바꾸기: 상태를 바꾸고 기록을 남겨요. (허용되지 않는 이동은 저장할 때 막혀요)
orderSchema.methods.changeStatus = function (next, { by = 'system', note } = {}) {
  this.status = next;
  this.statusHistory.push({ status: next, by, note });
  return this;
};

// 이 상태에서 저 상태로 갈 수 있는지
orderSchema.methods.canChangeTo = function (next) {
  return (ORDER_STATUS_FLOW[this.status] ?? []).includes(next);
};

orderSchema.pre('validate', async function () {
  // 1) 새 주문: 주문번호 발급, 처음 상태는 '결제 대기'만, 첫 기록 남기기
  if (this.isNew) {
    if (!this.orderNumber) {
      this.orderNumber = await generateUniqueOrderNumber((value) => this.constructor.exists({ orderNumber: value }));
    }
    if (this.status !== 'awaiting_payment') {
      this.invalidate('status', '새 주문은 결제 대기 상태로만 만들 수 있어요.');
    }
    if (this.statusHistory.length === 0) {
      this.statusHistory.push({ status: this.status, by: 'customer', note: '주문서 작성' });
    }
  }

  // 2) 상태 이동 검사: 정해진 길(ORDER_STATUS_FLOW)로만
  if (!this.isNew && this.isModified('status')) {
    const from = this.$locals.loadedStatus;
    if (from && !(ORDER_STATUS_FLOW[from] ?? []).includes(this.status)) {
      this.invalidate(
        'status',
        `'${ORDER_STATUS_LABEL[from]}'에서 '${ORDER_STATUS_LABEL[this.status] ?? this.status}'(으)로 바꿀 수 없어요.`,
      );
    }
  }

  // 3) 금액 검사: 줄 합계 = 가격 × 수량, 상품 합계 = 줄 합계의 합, 결제 금액 = 상품 합계 + 배송비
  this.items.forEach((item, index) => {
    if (Number.isInteger(item.price) && Number.isInteger(item.quantity) && item.lineTotal !== item.price * item.quantity) {
      this.invalidate(`items.${index}.lineTotal`, `'${item.name}'의 줄 합계가 가격 × 수량과 맞지 않아요.`);
    }
  });
  const sum = this.items.reduce((total, item) => total + (item.lineTotal ?? 0), 0);
  if (this.itemsTotal !== sum) this.invalidate('itemsTotal', '상품 합계가 주문한 물건의 합과 맞지 않아요.');
  if (this.totalAmount !== this.itemsTotal + this.shippingFee) {
    this.invalidate('totalAmount', '결제 금액이 상품 합계 + 배송비와 맞지 않아요.');
  }
});

// 저장한 뒤에는 지금 상태를 '원래 상태'로 기억해요. (같은 문서를 이어서 바꿀 때를 위해)
orderSchema.post('save', function () {
  this.$locals.loadedStatus = this.status;
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
