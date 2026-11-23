// 상품 실물 사진 관리 (최대 3장 올리기·지우기)
// - 올린 사진은 상세 페이지 '실물 사진' 칸에 순서대로 보여요.
// - 바뀐 상품은 onChange(수정된 상품) 으로 알려줘요.
import { useRef, useState } from 'react'
import { removeProductPhoto, uploadProductPhotos } from '../../api/adminProducts.js'

const MAX_PHOTOS = 3
const MAX_SIZE = 5 * 1024 * 1024 // 5MB (서버와 같은 기준)
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

function ProductPhotoManager({ product, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }

  const remaining = MAX_PHOTOS - product.photos.length

  const handleUpload = async (e) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = '' // 같은 파일을 다시 고를 수 있게 비워요.
    if (files.length === 0) return

    // 서버에 보내기 전에 먼저 확인해요. (서버도 같은 기준으로 다시 확인해요)
    if (files.length > remaining) {
      setMessage({ type: 'error', text: `사진은 ${remaining}장까지 더 올릴 수 있습니다.` })
      return
    }
    const wrong = files.find((f) => !ACCEPT.split(',').includes(f.type))
    if (wrong) return setMessage({ type: 'error', text: `'${wrong.name}'은(는) 사진 파일(jpg, png, webp, gif)이 아닙니다.` })
    const big = files.find((f) => f.size > MAX_SIZE)
    if (big) return setMessage({ type: 'error', text: `'${big.name}'이(가) 5MB를 넘습니다.` })

    setBusy(true)
    setMessage(null)
    try {
      onChange(await uploadProductPhotos(product._id, files))
      setMessage({ type: 'ok', text: `사진 ${files.length}장을 올렸습니다.` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (url, index) => {
    if (!window.confirm(`${index + 1}번 사진을 지울까요?`)) return
    setBusy(true)
    setMessage(null)
    try {
      onChange(await removeProductPhoto(product._id, url))
      setMessage({ type: 'ok', text: '사진을 지웠습니다.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-photos">
      <ul className="admin-photo-grid">
        {Array.from({ length: MAX_PHOTOS }, (_, i) => {
          const url = product.photos[i]
          return (
            <li key={url ?? `empty-${i}`} className="admin-photo">
              {url ? (
                <>
                  <img src={url} alt={`${product.name} 실물 사진 ${i + 1}`} />
                  <button
                    type="button"
                    className="admin-small-btn is-danger admin-photo-remove"
                    onClick={() => handleRemove(url, i)}
                    disabled={busy}
                  >
                    지우기
                  </button>
                </>
              ) : (
                <span className="admin-photo-empty">{i + 1}번 사진 자리</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="admin-photo-actions">
        <input
          ref={inputRef}
          id="photo-input"
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={handleUpload}
          disabled={busy || remaining === 0}
        />
        <button
          type="button"
          className="pixel-btn admin-photo-button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || remaining === 0}
        >
          {busy ? '처리 중...' : remaining === 0 ? '사진 3장 모두 올림' : `＋ 사진 올리기 (${remaining}장 더 가능)`}
        </button>
        <p className="permit-hint">jpg · png · webp · gif, 한 장에 5MB까지</p>
      </div>

      {message && (
        <p className={`admin-message ${message.type === 'error' ? 'is-error' : 'is-ok'}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  )
}

export default ProductPhotoManager
