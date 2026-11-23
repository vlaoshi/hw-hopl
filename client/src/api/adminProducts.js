// 관리자(상점주) 상품 관리 API 함수 - 서버에서 관리자만 호출할 수 있어요.
import { api } from './client.js'

const BASE = '/admin/products'

// 전체 목록 (숨긴 상품 포함)
export async function listAdminProducts(options) {
  return (await api.get(BASE, options)).data
}

// 상품 하나
export async function getAdminProduct(id, options) {
  return (await api.get(`${BASE}/${encodeURIComponent(id)}`, options)).data
}

// 등록 → 등록된 상품
export async function createProduct(fields) {
  return (await api.post(BASE, fields)).data
}

// 수정 (보낸 필드만) → 수정된 상품. 진열 숨기기: updateProduct(id, { isActive: false })
export async function updateProduct(id, fields) {
  return (await api.patch(`${BASE}/${encodeURIComponent(id)}`, fields)).data
}

// 삭제
export async function deleteProduct(id) {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`)
}

// 실물 사진 올리기 (File 목록, 합계 최대 3장) → 수정된 상품
export async function uploadProductPhotos(id, files) {
  const form = new FormData()
  for (const file of files) form.append('photos', file)
  return (await api.post(`${BASE}/${encodeURIComponent(id)}/photos`, form)).data
}

// 실물 사진 지우기 → 수정된 상품
export async function removeProductPhoto(id, url) {
  return (await api.delete(`${BASE}/${encodeURIComponent(id)}/photos`, { body: { url } })).data
}
