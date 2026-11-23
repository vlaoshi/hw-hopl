// 상품 실물 사진 관리 (최대 3장) - Cloudinary 업로드 위젯 사용
// 흐름: [사진 올리기] → Cloudinary 위젯에서 사진 선택 → 브라우저가 Cloudinary로 바로 업로드
//       → 올라간 사진은 바로 아래 칸에 미리보기("저장 중") → 우리 서버에 사진 주소 저장 → 미리보기 확정
// - 올린 사진은 상세 페이지 '실물 사진' 칸에 순서대로 보여요.
// - 바뀐 상품은 onChange(수정된 상품) 으로 알려줘요.
// - 필요한 환경변수: VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET (client/.env)
import { useRef, useState } from 'react'
import { addProductPhotos, removeProductPhoto } from '../../api/adminProducts.js'
import { useCloudinaryUploadWidget } from '../../hooks/useCloudinaryUploadWidget.js'
import { PHOTO_LARGE, PHOTO_SQUARE, PRODUCT_PHOTO_FOLDER, cloudinaryImage } from '../../utils/cloudinary.js'

const MAX_PHOTOS = 3
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const THUMB = PHOTO_SQUARE(480) // 미리보기: 정사각형 칸에 사진 전체가 보이게 (흰 여백)

function ProductPhotoManager({ product, onChange }) {
  const [pending, setPending] = useState([]) // Cloudinary에는 올라갔지만 아직 서버에 저장 안 된 사진 주소
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false) // 지우는 중
  const [freshUrls, setFreshUrls] = useState([]) // 이번에 새로 올린 사진 ("새 사진" 표시)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }
  const pendingRef = useRef([]) // 위젯 콜백에서 최신 목록을 읽기 위한 ref
  const savingRef = useRef(false)

  const remaining = MAX_PHOTOS - product.photos.length - pending.length

  const setPendingList = (list) => {
    pendingRef.current = list
    setPending(list)
  }

  // Cloudinary에 올라간 사진 주소들을 우리 서버(상품)에 저장해요. 여러 번 불려도 한 번만 저장해요.
  const savePending = async () => {
    const urls = pendingRef.current
    if (urls.length === 0 || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      onChange(await addProductPhotos(product._id, urls))
      setFreshUrls((prev) => [...prev, ...urls])
      setPendingList([])
      setMessage({ type: 'ok', text: `사진 ${urls.length}장을 올렸습니다.` })
    } catch (err) {
      // 실패한 사진은 미리보기에 남겨 두고 [다시 저장]을 누를 수 있게 해요.
      setMessage({ type: 'error', text: `사진 주소를 저장하지 못했습니다. (${err.message})` })
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const widget = useCloudinaryUploadWidget({
    onUpload: (info) => {
      setPendingList([...pendingRef.current, info.secure_url])
      setMessage(null)
    },
    onQueuesEnd: savePending,
    onClose: savePending, // 다 올리기 전에 닫아도, 이미 올라간 사진은 저장해요.
    onError: (text) => setMessage({ type: 'error', text }),
  })

  const handleOpen = () => {
    setMessage(null)
    widget.open({
      sources: ['local', 'url', 'camera'],
      multiple: remaining > 1,
      maxFiles: remaining,
      resourceType: 'image',
      clientAllowedFormats: ALLOWED_FORMATS,
      maxFileSize: MAX_SIZE,
      folder: PRODUCT_PHOTO_FOLDER,
      cropping: false,
      showAdvancedOptions: false,
    })
  }

  const handleRemove = async (url, index) => {
    if (!window.confirm(`${index + 1}번 사진을 뺄까요?`)) return
    setBusy(true)
    setMessage(null)
    try {
      onChange(await removeProductPhoto(product._id, url))
      setMessage({ type: 'ok', text: '사진을 뺐습니다.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  // 칸 3개: 저장된 사진 → 저장 중인 사진 → 빈 칸
  const slots = [
    ...product.photos.map((url) => ({ url, state: 'saved' })),
    ...pending.map((url) => ({ url, state: 'pending' })),
  ]

  const locked = saving || busy || widget.loading

  return (
    <div className="admin-photos">
      {!widget.configured && (
        <p className="admin-message is-error" role="alert">
          Cloudinary 설정이 없어 사진을 올릴 수 없습니다. client/.env 에 VITE_CLOUDINARY_CLOUD_NAME 과
          VITE_CLOUDINARY_UPLOAD_PRESET 을 넣고 개발 서버를 다시 켜 주세요.
        </p>
      )}

      <ul className="admin-photo-grid">
        {Array.from({ length: MAX_PHOTOS }, (_, i) => {
          const slot = slots[i]
          if (!slot) {
            return (
              <li key={`empty-${i}`} className="admin-photo">
                <span className="admin-photo-empty">{i + 1}번 사진 자리</span>
              </li>
            )
          }
          const isFresh = slot.state === 'saved' && freshUrls.includes(slot.url)
          return (
            <li key={slot.url} className={`admin-photo${slot.state === 'pending' ? ' is-pending' : ''}`}>
              <a href={cloudinaryImage(slot.url, PHOTO_LARGE)} target="_blank" rel="noreferrer" className="admin-photo-link" title="원본 크게 보기">
                <img src={cloudinaryImage(slot.url, THUMB)} alt={`${product.name} 실물 사진 ${i + 1}`} />
              </a>
              <span className="admin-photo-badge">
                {slot.state === 'pending' ? (saving ? '저장 중...' : '저장 대기') : isFresh ? `${i + 1}번 · 새 사진` : `${i + 1}번`}
              </span>
              {slot.state === 'saved' && (
                <button
                  type="button"
                  className="admin-small-btn is-danger admin-photo-remove"
                  onClick={() => handleRemove(slot.url, i)}
                  disabled={locked}
                >
                  빼기
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="admin-photo-actions">
        <div className="admin-photo-buttons">
          <button
            type="button"
            className="pixel-btn admin-photo-button"
            onClick={handleOpen}
            disabled={locked || remaining <= 0 || !widget.configured}
          >
            {widget.loading
              ? '위젯 여는 중...'
              : saving
                ? '저장 중...'
                : remaining <= 0
                  ? '사진 3장 모두 올림'
                  : `＋ 사진 올리기 (${remaining}장 더 가능)`}
          </button>
          {pending.length > 0 && !saving && (
            <button type="button" className="pixel-btn admin-photo-button" onClick={savePending}>
              다시 저장
            </button>
          )}
        </div>
        <p className="permit-hint">jpg · png · webp · gif, 한 장에 5MB까지 · 내 컴퓨터, 사진 주소(URL), 카메라에서 고를 수 있어요</p>
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
