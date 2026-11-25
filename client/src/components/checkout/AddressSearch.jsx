// 주소 검색 (카카오 우편번호) - 배송지 칸 바로 아래에 펼쳐지는 검색창
// - 팝업 대신 페이지 안에 끼워 넣어요. (카카오 공식 안내: 휴대폰에서는 떠 있는 창보다 끼워 넣기가 안정적)
// - 주소를 고르면 onSelect({ zipCode, address1 }) 를 부르고 닫혀요.
// - initialQuery: 처음 열 때 검색어를 미리 넣어요. (예: 회원 정보에 적어 둔 주소)
import { useEffect, useRef, useState } from 'react'
import { loadKakaoPostcode, toShippingAddress } from '../../utils/kakaoPostcode.js'

const MIN_HEIGHT = 420 // 카카오 검색창 최소 높이(400) + 여유

function AddressSearch({ onSelect, onClose, initialQuery }) {
  const wrapRef = useRef(null)
  const handlersRef = useRef({ onSelect, onClose })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    handlersRef.current = { onSelect, onClose }
  })

  useEffect(() => {
    let cancelled = false
    loadKakaoPostcode()
      .then((kakao) => {
        if (cancelled || !wrapRef.current) return
        setLoading(false)
        new kakao.Postcode({
          oncomplete: (data) => handlersRef.current.onSelect(toShippingAddress(data)),
          onresize: (size) => {
            if (wrapRef.current) wrapRef.current.style.height = `${Math.max(MIN_HEIGHT, size.height)}px`
          },
          width: '100%',
          height: '100%',
        }).embed(wrapRef.current, { q: initialQuery || undefined, autoClose: true })
      })
      .catch((err) => {
        if (!cancelled) {
          setLoading(false)
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [initialQuery])

  return (
    <div className="address-search" role="region" aria-label="주소 검색">
      <div className="address-search-head">
        <span>도로명·건물명·지번으로 검색해 주십시오. (예: 판교역로 166, 분당 주공)</span>
        <button type="button" className="address-search-close" onClick={() => handlersRef.current.onClose()}>
          ✕ 닫기
        </button>
      </div>
      {loading && <p className="address-search-message">주소 검색을 여는 중입니다...</p>}
      {error && (
        <p className="address-search-message is-error" role="alert">
          {error}
        </p>
      )}
      <div ref={wrapRef} className="address-search-frame" style={{ height: MIN_HEIGHT }} hidden={!!error} />
    </div>
  )
}

export default AddressSearch
