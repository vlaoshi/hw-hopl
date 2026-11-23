// 상품 등록·수정 양식 (양피지 서류)
// - initial 이 있으면 수정, 없으면 새 상품 등록이에요.
// - 저장에 성공하면 onSaved(저장된 상품, 새로 만들었는지) 를 불러요.
// - 사진은 여기서 다루지 않아요. (수정 화면의 ProductPhotoManager 에서 올려요)
// - SKU 는 서버가 등록할 때 자동 발급하고 바꿀 수 없어서, 수정 화면에서 읽기 전용으로만 보여 줘요.
// - 필수: 상품 이름, 도트 이미지, 간단한 설명, 자세한 설명, 가격
import { useState } from 'react'
import { createProduct, updateProduct } from '../../api/adminProducts.js'
import PermitField from '../permit/PermitField.jsx'
import SpritePicker from './SpritePicker.jsx'

const SUMMARY_MAX = 120 // 서버 Product 모델과 같은 기준

function toForm(product) {
  return {
    image: product?.image ?? '',
    name: product?.name ?? '',
    summary: product?.summary ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    sortOrder: product ? String(product.sortOrder ?? 0) : '0',
    isActive: product?.isActive ?? true,
  }
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = '상품 이름을 기재해 주십시오.'

  if (!form.image) errors.image = '진열장에 보일 도트 그림을 골라 주십시오.'

  if (!form.summary.trim()) errors.summary = '간단한 설명을 기재해 주십시오.'
  else if (form.summary.trim().length > SUMMARY_MAX)
    errors.summary = `간단한 설명은 ${SUMMARY_MAX}자 이하로 써 주십시오.`

  if (!form.description.trim()) errors.description = '자세한 설명을 기재해 주십시오.'

  if (form.price.trim() === '') errors.price = '가격을 기재해 주십시오.'
  else if (!/^\d+$/.test(form.price.trim())) errors.price = '가격은 0 이상의 숫자(원)로 써 주십시오.'

  if (!/^-?\d+$/.test(form.sortOrder.trim())) errors.sortOrder = '진열 순서는 정수로 써 주십시오.'

  return errors
}

function ProductForm({ initial, onSaved }) {
  const isEdit = !!initial
  const [form, setForm] = useState(() => toForm(initial))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (serverError) setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const nextErrors = validate(form)
    setErrors(nextErrors)
    setServerError('')
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      image: form.image,
      name: form.name.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    }

    setSubmitting(true)
    try {
      const saved = isEdit ? await updateProduct(initial._id, payload) : await createProduct(payload)
      onSaved(saved, !isEdit)
    } catch (err) {
      if (err.details?.length) {
        const fieldErrors = {}
        for (const d of err.details) fieldErrors[d.field] = d.message
        setErrors(fieldErrors)
      } else setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="permit-form" onSubmit={handleSubmit} noValidate>
      <PermitField
        name="name"
        label="상품 이름"
        required
        placeholder="예) 아이팟 4세대"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
      />

      {/* SKU: 수정 화면에서만 보여요 (등록할 때 서버가 자동 발급) */}
      {isEdit && (
        <div className="permit-field">
          <label htmlFor="sku">
            상품 코드 <span className="label-sub">(SKU · 자동 발급, 변경 불가)</span>
          </label>
          <input id="sku" className="admin-sku-input" value={initial.sku ?? ''} readOnly />
        </div>
      )}

      <SpritePicker name="image" label="도트 이미지" required value={form.image} onChange={handleChange} error={errors.image} />

      <PermitField
        name="summary"
        label="간단한 설명"
        sub={`(진열장 카드 · ${SUMMARY_MAX}자 이하)`}
        required
        multiline
        rows={2}
        maxLength={SUMMARY_MAX}
        placeholder="진열장 카드에 보일 한두 줄 설명"
        value={form.summary}
        onChange={handleChange}
        error={errors.summary}
      />

      <PermitField
        name="description"
        label="자세한 설명"
        sub="(상세 페이지)"
        required
        multiline
        rows={5}
        placeholder="상세 페이지 '물건 이야기'에 보일 설명"
        value={form.description}
        onChange={handleChange}
        error={errors.description}
      />

      <div className="admin-form-row">
        <PermitField
          name="price"
          label="가격"
          sub="(원)"
          required
          inputMode="numeric"
          placeholder="예) 70000"
          value={form.price}
          onChange={handleChange}
          error={errors.price}
        />
        <PermitField
          name="sortOrder"
          label="진열 순서"
          sub="(작을수록 앞)"
          inputMode="numeric"
          value={form.sortOrder}
          onChange={handleChange}
          error={errors.sortOrder}
        />
      </div>

      <label className="admin-checkbox">
        <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
        <span>진열장에 진열하기</span>
        <span className="admin-checkbox-note">끄면 손님 진열장에서 숨겨져요</span>
      </label>

      {serverError && (
        <p className="permit-error permit-error-box" role="alert">
          {serverError}
        </p>
      )}

      <button type="submit" className="pixel-btn pixel-btn-seal permit-submit" disabled={submitting}>
        {submitting ? '장부에 적는 중...' : isEdit ? '수정 내용 저장' : '상품 등록'}
      </button>
    </form>
  )
}

export default ProductForm
