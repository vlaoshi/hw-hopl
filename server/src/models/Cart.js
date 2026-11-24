// 장바구니(Cart) 스키마 - 회원 한 명당 장바구니 하나
// 구조: { user, items: [{ product, quantity, addedAt }], createdAt, updatedAt }
//
// 설계 원칙
// - 회원마다 장바구니는 하나예요. (user 에 유니크 인덱스)
// - 가격은 장바구니에 저장하지 않아요. 보여 줄 때마다 상품(Product)의 지금 가격을 읽어요.
//   (상점주가 가격을 바꾸면 장바구니에도 바로 반영돼요. 주문할 때의 가격은 주문서에 따로 남겨요)
// - 같은 상품은 한 줄로만 담겨요. 다시 담으면 수량이 늘어나요. (addItem)
// - 수량은 1~99개 정수예요. (재고 기능이 생기면 재고 수량으로도 한 번 더 막아요)
//
// 사용 예)
//   const cart = await Cart.findOrCreate(req.user._id)
//   cart.addItem(productId, 2)
//   await cart.save()
//   await cart.populate('items.product')   // 상품 이름·가격·도트 이미지까지 채워서 응답
import mongoose from 'mongoose';

export const MAX_QUANTITY = 99; // 한 상품을 담을 수 있는 최대 수량
export const MAX_CART_ITEMS = 30; // 장바구니에 담을 수 있는 상품 종류 수

// 장바구니 한 줄 (상품 + 수량)
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '담을 상품은 필수예요.'],
    },
    quantity: {
      type: Number,
      required: [true, '수량은 필수예요.'],
      default: 1,
      min: [1, '수량은 1개 이상이어야 해요.'],
      max: [MAX_QUANTITY, `수량은 ${MAX_QUANTITY}개까지 담을 수 있어요.`],
      validate: {
        validator: Number.isInteger,
        message: '수량은 정수로 써 주세요.',
      },
    },
    // 담은 시각 (장바구니에서 최근 담은 순으로 보여 줄 때 써요)
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }, // 줄마다 따로 _id 를 두지 않고, 상품 id 로 구분해요.
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '장바구니 주인(회원)은 필수예요.'],
      unique: true, // 회원 한 명당 장바구니 하나 (DB 인덱스)
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: [
        {
          validator: (items) => items.length <= MAX_CART_ITEMS,
          message: `장바구니에는 상품을 ${MAX_CART_ITEMS}종류까지 담을 수 있어요.`,
        },
        {
          // 같은 상품이 두 줄로 들어가지 않게 막아요.
          validator: (items) => new Set(items.map((item) => String(item.product?._id ?? item.product))).size === items.length,
          message: '같은 상품이 장바구니에 두 번 담겨 있어요.',
        },
      ],
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

// ----- 장바구니 다루기 (값만 바꿔요. 저장은 부르는 쪽에서 cart.save()) -----

// 상품 id 로 장바구니의 몇 번째 줄인지 찾아요. (populate 된 상태여도 찾을 수 있게)
cartSchema.methods.findItemIndex = function (productId) {
  return this.items.findIndex((item) => String(item.product?._id ?? item.product) === String(productId));
};

// 담기: 이미 있으면 수량을 더하고, 없으면 새 줄로 넣어요. (최대 수량을 넘지 않게 맞춰요)
cartSchema.methods.addItem = function (productId, quantity = 1) {
  const index = this.findItemIndex(productId);
  if (index >= 0) {
    this.items[index].quantity = Math.min(MAX_QUANTITY, this.items[index].quantity + quantity);
  } else {
    this.items.push({ product: productId, quantity: Math.min(MAX_QUANTITY, quantity) });
  }
  return this;
};

// 수량 바꾸기: 0 이하면 그 줄을 빼요. 장바구니에 없는 상품이면 false 를 돌려줘요.
cartSchema.methods.setItemQuantity = function (productId, quantity) {
  const index = this.findItemIndex(productId);
  if (index < 0) return false;
  if (quantity <= 0) this.items.splice(index, 1);
  else this.items[index].quantity = quantity; // 1~99·정수 검사는 save() 때 스키마가 해요.
  return true;
};

// 빼기: 장바구니에 없는 상품이면 false 를 돌려줘요.
cartSchema.methods.removeItem = function (productId) {
  const index = this.findItemIndex(productId);
  if (index < 0) return false;
  this.items.splice(index, 1);
  return true;
};

// 비우기 (주문을 마친 뒤 등)
cartSchema.methods.clear = function () {
  this.items = [];
  return this;
};

// 회원의 장바구니를 찾고, 없으면 빈 장바구니를 만들어요.
// (동시에 두 번 불려도 하나만 생기도록 upsert 로 만들어요)
cartSchema.statics.findOrCreate = function (userId) {
  return this.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
