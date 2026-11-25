// 주문서 ② 배송지 입력 (양피지 서류 칸 - PermitField 재사용)
// - 받는 분 성함 · 연락처 · [우편번호][주소 검색] · 기본 주소 · 상세 주소 · 배송 메모
// - 우편번호·기본 주소는 직접 쓰지 않고 카카오 주소 검색으로 채워요. (읽기 전용)
// - form / errors / onChange 는 주문서 페이지가 관리해요.
import { useState } from 'react'
import PermitField from '../permit/PermitField.jsx'
import AddressSearch from './AddressSearch.jsx'
import { SHIPPING_LIMITS } from '../../utils/validation.js'

function ShippingForm({ form, errors, onChange, onPhoneBlur, onAddressSelect, memberAddress }) {
  const [searching, setSearching] = useState(false)

  const handleSelect = (address) => {
    setSearching(false)
    onAddressSelect(address)
    // 주소를 고르면 상세 주소 칸으로 커서를 옮겨요.
    setTimeout(() => document.querySelector('[name="address2"]')?.focus(), 0)
  }

  return (
    <div className="permit-form checkout-shipping">
      <div className="checkout-form-row">
        <PermitField
          name="recipient"
          label="받는 분 성함"
          required
          autoComplete="name"
          maxLength={SHIPPING_LIMITS.recipient}
          placeholder="예) 홍길동"
          value={form.recipient}
          onChange={onChange}
          error={errors.recipient}
        />
        <div onBlur={onPhoneBlur}>
          <PermitField
            name="phone"
            label="연락처"
            sub="(휴대폰)"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={13}
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={onChange}
            error={errors.phone}
          />
        </div>
      </div>
      {/* 우편번호 + 주소 검색 */}
      <div className="permit-field">
        <label htmlFor="zipCode">
          주소 <span className="mark-required">✦</span>
        </label>
        <div className="address-zip-row">
          <input
            id="zipCode"
            name="zipCode"
            className="address-zip-input"
            value={form.zipCode}
            placeholder="우편번호"
            readOnly
            tabIndex={-1}
            aria-invalid={!!errors.address1}
            aria-describedby={errors.address1 ? 'address1-error' : undefined}
          />
          <button
            type="button"
            id="address-search-btn"
            className="pixel-btn pixel-btn-gold address-search-btn"
            onClick={() => setSearching((open) => !open)}
            aria-expanded={searching}
          >
            {searching ? '검색 닫기' : form.zipCode ? '주소 다시 검색' : '주소 검색'}
          </button>
        </div>
        <input
          id="address1"
          name="address1"
          className="address-base-input"
          value={form.address1}
          placeholder="[주소 검색]을 누르면 기본 주소가 채워집니다"
          readOnly
          onClick={() => setSearching(true)}
          aria-label="기본 주소"
          aria-invalid={!!errors.address1}
        />
        {errors.address1 && (
          <p id="address1-error" className="permit-error">
            {errors.address1}
          </p>
        )}
        {searching && (
          <AddressSearch onSelect={handleSelect} onClose={() => setSearching(false)} initialQuery={memberAddress} />
        )}
      </div>
      <PermitField
        name="address2"
        label="상세 주소"
        sub="(동·호수 등, 선택)"
        maxLength={SHIPPING_LIMITS.address2}
        placeholder="예) 2층 선실 3호"
        value={form.address2}
        onChange={onChange}
        error={errors.address2}
      />
      <PermitField
        name="memo"
        label="배송 메모"
        sub="(선택)"
        maxLength={SHIPPING_LIMITS.memo}
        placeholder="예) 문 앞에 두고 가 주세요"
        value={form.memo}
        onChange={onChange}
        error={errors.memo}
      />
    </div>
  )
}

export default ShippingForm
