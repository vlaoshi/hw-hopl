// 장바구니(Cart) 로직 - 로그인한 회원이 자기 장바구니만 다뤄요.
// cart.routes.js 에서 requireAuth 를 거친 요청만 여기로 와요. (req.user = 로그인한 회원)
//
// 응답 모양 (모든 요청이 같은 모양으로 장바구니 전체를 돌려줘요)
// {
//   items: [{
//     product: { _id, sku, name, price, image, stock, discontinued, isActive },
//     quantity, addedAt,
//     status: 'ok' | 'soldout' | 'ended' | 'hidden' | 'shortage',
//     maxQuantity,   // 지금 담을 수 있는 최대 수량 (재고와 99 중 작은 값)
//     lineTotal,     // 가격 × 수량 (주문할 수 없는 줄은 0)
//   }],
//   summary: { itemCount, totalQuantity, totalPrice, orderable }
// }
// - status 'ok' 가 아닌 줄은 합계에서 빠지고, orderable 이 false 가 돼요.
//   (담은 뒤에 품절·판매 완료·숨김이 되었거나, 재고가 담은 수량보다 줄어든 경우)
import mongoose from 'mongoose';
import Cart, { MAX_QUANTITY } from '../models/Cart.js';
import Product, { getSaleStatus } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

const PRODUCT_FIELDS = 'sku name price image stock discontinued isActive';

// 장바구니 한 줄의 상태
function itemStatus(product, quantity) {
  if (!product.isActive) return 'hidden'; // 상점주가 진열장에서 숨김
  const sale = getSaleStatus(product);
  if (sale !== 'available') return sale; // 'soldout' | 'ended'
  if (quantity > product.stock) return 'shortage'; // 재고가 담은 수량보다 적어짐
  return 'ok';
}

// 상품 정보를 채우고(populate), 삭제된 상품 줄은 정리한 뒤, 응답 모양으로 바꿔요.
async function toCartResponse(cart) {
  await cart.populate('items.product', PRODUCT_FIELDS);

  // 상점주가 삭제한 상품(populate 결과가 null)은 장바구니에서 빼고 저장해요.
  const before = cart.items.length;
  cart.items = cart.items.filter((item) => item.product);
  if (cart.items.length !== before) {
    await cart.save();
    await cart.populate('items.product', PRODUCT_FIELDS);
  }

  const items = cart.items
    .map((item) => {
      const product = item.product;
      const status = itemStatus(product, item.quantity);
      return {
        product: product.toJSON(),
        quantity: item.quantity,
        addedAt: item.addedAt,
        status,
        maxQuantity: Math.min(MAX_QUANTITY, Math.max(0, product.stock)),
        lineTotal: status === 'ok' ? product.price * item.quantity : 0,
      };
    })
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)); // 최근 담은 순

  const okItems = items.filter((item) => item.status === 'ok');
  return {
    items,
    summary: {
      itemCount: items.length, // 담긴 상품 종류
      totalQuantity: okItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: okItems.reduce((sum, item) => sum + item.lineTotal, 0),
      orderable: items.length > 0 && okItems.length === items.length, // 모든 줄이 주문 가능할 때만
    },
  };
}

// 요청 본문의 수량 읽기: 1 이상 정수만 (없으면 기본값)
function readQuantity(value, fallback) {
  const quantity = value === undefined ? fallback : value;
  if (!Number.isInteger(quantity) || quantity < 1) throw new AppError(400, '수량은 1 이상의 정수로 보내 주세요.');
  return quantity;
}

// 담을 수 있는 상품인지 확인하고, 상품을 돌려줘요.
async function findPurchasableProduct(productId) {
  if (!mongoose.isValidObjectId(productId)) throw new AppError(404, '상품을 찾을 수 없어요.');
  const product = await Product.findById(productId).select(PRODUCT_FIELDS);
  if (!product || !product.isActive) throw new AppError(404, '상품을 찾을 수 없어요.');
  const sale = getSaleStatus(product);
  if (sale === 'soldout') throw new AppError(409, `'${product.name}'은(는) 품절이라 담을 수 없어요.`);
  if (sale === 'ended') throw new AppError(409, `'${product.name}'은(는) 판매가 끝나 담을 수 없어요.`);
  return product;
}

// 수량이 재고·최대 수량을 넘지 않는지 확인해요.
function checkQuantityLimit(product, quantity) {
  if (quantity > product.stock) {
    throw new AppError(409, `'${product.name}'은(는) 재고가 ${product.stock}개라 ${product.stock}개까지 담을 수 있어요.`);
  }
  if (quantity > MAX_QUANTITY) throw new AppError(400, `한 상품은 ${MAX_QUANTITY}개까지 담을 수 있어요.`);
}

// [보기] GET /api/cart
export async function getCart(req, res) {
  const cart = await Cart.findOrCreate(req.user._id);
  res.json({ success: true, data: await toCartResponse(cart) });
}

// [담기] POST /api/cart/items  body: { productId, quantity = 1 }
// 이미 담긴 상품이면 수량을 더해요. (합친 수량이 재고를 넘으면 거부)
export async function addItem(req, res) {
  const { productId } = req.body ?? {};
  const quantity = readQuantity(req.body?.quantity, 1);
  const product = await findPurchasableProduct(productId);

  const cart = await Cart.findOrCreate(req.user._id);
  const index = cart.findItemIndex(product._id);
  const current = index >= 0 ? cart.items[index].quantity : 0;
  checkQuantityLimit(product, current + quantity);

  cart.addItem(product._id, quantity);
  await cart.save();
  res.status(201).json({ success: true, data: await toCartResponse(cart) });
}

// [수량 바꾸기] PATCH /api/cart/items/:productId  body: { quantity }
export async function updateItem(req, res) {
  const quantity = readQuantity(req.body?.quantity);
  const cart = await Cart.findOrCreate(req.user._id);
  if (cart.findItemIndex(req.params.productId) < 0) throw new AppError(404, '장바구니에 없는 상품이에요.');

  const product = await findPurchasableProduct(req.params.productId);
  checkQuantityLimit(product, quantity);

  cart.setItemQuantity(product._id, quantity);
  await cart.save();
  res.json({ success: true, data: await toCartResponse(cart) });
}

// [빼기] DELETE /api/cart/items/:productId
// (품절·숨김·삭제된 상품도 뺄 수 있어야 해서 상품 상태는 확인하지 않아요)
export async function removeItem(req, res) {
  const cart = await Cart.findOrCreate(req.user._id);
  if (!cart.removeItem(req.params.productId)) throw new AppError(404, '장바구니에 없는 상품이에요.');
  await cart.save();
  res.json({ success: true, data: await toCartResponse(cart) });
}

// [비우기] DELETE /api/cart
export async function clearCart(req, res) {
  const cart = await Cart.findOrCreate(req.user._id);
  cart.clear();
  await cart.save();
  res.json({ success: true, data: await toCartResponse(cart) });
}
