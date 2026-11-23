// 페이지 이동 버튼 (상점주 화면 공용)
// - 사용 예) <Pagination page={2} totalPages={7} onChange={(next) => ...} />
// - 버튼: [« 처음] [‹ 이전] [1] [2] [3] [4] [5] [다음 ›] [끝 »]
//   번호는 지금 페이지를 가운데에 두고 최대 5개까지 보여 줘요.
// - 페이지가 1개 이하면 아무것도 그리지 않아요.
const WINDOW = 5

function pageNumbers(page, totalPages) {
  const half = Math.floor(WINDOW / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(totalPages, start + WINDOW - 1)
  start = Math.max(1, end - WINDOW + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function Pagination({ page, totalPages, onChange, disabled = false }) {
  if (totalPages <= 1) return null

  const go = (next) => {
    if (next < 1 || next > totalPages || next === page) return
    onChange(next)
  }

  return (
    <nav className="admin-pagination" aria-label="페이지 이동">
      <button type="button" className="admin-page-btn" onClick={() => go(1)} disabled={disabled || page === 1} aria-label="첫 페이지">
        «
      </button>
      <button type="button" className="admin-page-btn" onClick={() => go(page - 1)} disabled={disabled || page === 1} aria-label="이전 페이지">
        ‹ 이전
      </button>
      {pageNumbers(page, totalPages).map((n) => (
        <button
          key={n}
          type="button"
          className={`admin-page-btn admin-page-number${n === page ? ' is-current' : ''}`}
          onClick={() => go(n)}
          disabled={disabled}
          aria-label={`${n}페이지`}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        className="admin-page-btn"
        onClick={() => go(page + 1)}
        disabled={disabled || page === totalPages}
        aria-label="다음 페이지"
      >
        다음 ›
      </button>
      <button
        type="button"
        className="admin-page-btn"
        onClick={() => go(totalPages)}
        disabled={disabled || page === totalPages}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  )
}

export default Pagination
