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
}) {
  const errorId = `${name}-error`

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
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="permit-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default PermitField
