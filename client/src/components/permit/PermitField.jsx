// 양피지 서류의 입력칸 한 줄 (라벨 + 입력창 + 붉은 인장 오류 메시지)
// 회원가입(교역허가증)·로그인(검문소) 폼이 함께 써요. 앞으로 상품 등록 같은 폼에서도 그대로 쓸 수 있어요.
// 스타일은 styles/retro-theme.css 의 .permit-field, .permit-error 를 따라요.
//
// 사용 예)
//   <PermitField
//     name="email" label="전서구 주소" sub="(이메일)" required
//     type="email" autoComplete="email" placeholder="…"
//     value={form.email} onChange={handleChange} error={errors.email}
//   />
//
// - name: input 의 name·id 로 쓰여요. (handleChange 에서 e.target.name 으로 구분)
// - sub: 라벨 옆 흐린 보조 설명 (예: "(이메일)")
// - required: 라벨 옆에 붉은 ✦ 표시
// - error: 오류 메시지. 있으면 입력칸이 붉게 바뀌고 아래에 인장과 함께 보여요.
// - multiline: true 면 여러 줄 입력칸(textarea)으로 바뀌어요. rows 로 높이를 정해요.
// - hint: 입력칸 아래 흐린 도움말 (예: "영문 소문자·숫자·- 만")
// - inputMode, min, step, maxLength: 숫자·길이 제한이 필요한 입력칸에 써요.

function PermitField({
  name,
  label,
  sub,
  required = false,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  onChange,
  error,
  autoFocus = false,
  multiline = false,
  rows = 3,
  hint,
  inputMode,
  min,
  step,
  maxLength,
}) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="permit-field">
      <label htmlFor={name}>
        {label}
        {sub && (
          <>
            {' '}
            <span className="label-sub">{sub}</span>
          </>
        )}
        {required && (
          <>
            {' '}
            <span className="mark-required">✦</span>
          </>
        )}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          inputMode={inputMode}
          min={min}
          step={step}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
      )}
      {hint && (
        <p id={hintId} className="permit-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="permit-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default PermitField
