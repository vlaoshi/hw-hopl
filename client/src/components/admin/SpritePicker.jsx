// 도트 이미지 고르기 - 상품 등록·수정 양식에서 진열장에 보일 도트 그림을 골라요.
// - 그림 목록은 components/goods/goodsSprites.js 의 GOODS_IMAGE_OPTIONS 예요.
// - 라디오 버튼이라 키보드(화살표)로도 고를 수 있어요.
// - 목록에 없는 값(예: 예전에 직접 적은 이름)이 들어오면 맨 앞에 "지금 값"으로 보여 줘요.
import GoodsSprite from '../goods/GoodsSprite.jsx'
import { GOODS_IMAGE_OPTIONS } from '../goods/goodsSprites.js'

function SpritePicker({ name, label, required = false, value, onChange, error }) {
  const errorId = `${name}-error`
  const known = GOODS_IMAGE_OPTIONS.some((option) => option.value === value)
  const options = value && !known ? [{ value, label: `지금 값 (${value})` }, ...GOODS_IMAGE_OPTIONS] : GOODS_IMAGE_OPTIONS

  return (
    <fieldset className="permit-field sprite-picker" aria-describedby={error ? errorId : undefined}>
      <legend>
        {label}
        {required && (
          <>
            {' '}
            <span className="mark-required">✦</span>
          </>
        )}
      </legend>
      <div className="sprite-picker-grid">
        {options.map((option) => (
          <label key={option.value} className={`sprite-picker-item${option.value === value ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={onChange}
            />
            <span className="sprite-picker-art">
              <GoodsSprite image={option.value} className="sprite-picker-sprite" />
            </span>
            <span className="sprite-picker-label">{option.label}</span>
          </label>
        ))}
      </div>
      <p className="permit-hint">아직 그림이 없는 물건은 '물음표 상자'를 골라 두고, 그림이 생기면 바꿔 주세요.</p>
      {error && (
        <p id={errorId} className="permit-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

export default SpritePicker
