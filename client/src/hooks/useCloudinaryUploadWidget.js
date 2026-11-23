// Cloudinary 업로드 위젯 훅
// - 위젯 스크립트는 처음 열 때 한 번만 불러와요. (사진 관리 화면에 들어가지 않으면 불러오지 않아요)
// - open(옵션) 으로 위젯을 열고, 일어난 일은 아래 콜백으로 알려줘요.
//   onUpload(info)  : 사진 한 장이 Cloudinary에 올라감 (info.secure_url = 사진 주소)
//   onQueuesEnd()   : 고른 사진이 모두 올라감
//   onClose()       : 위젯을 닫음 (다 올리기 전에 닫아도 불려요)
//   onError(message): 위젯을 불러오거나 올리다가 실패함
// 공식 문서: https://cloudinary.com/documentation/upload_widget
import { useCallback, useEffect, useRef, useState } from 'react'
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, isCloudinaryConfigured } from '../utils/cloudinary.js'

const WIDGET_SCRIPT_URL = 'https://upload-widget.cloudinary.com/latest/global/all.js'

let scriptPromise = null

// 위젯 스크립트 불러오기 (여러 번 불러도 한 번만 받아요)
function loadWidgetScript() {
  if (window.cloudinary?.createUploadWidget) return Promise.resolve(window.cloudinary)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = WIDGET_SCRIPT_URL
      script.async = true
      script.onload = () =>
        window.cloudinary?.createUploadWidget ? resolve(window.cloudinary) : reject(new Error('위젯을 준비하지 못했습니다.'))
      script.onerror = () => {
        scriptPromise = null // 다음에 다시 시도할 수 있게
        script.remove()
        reject(new Error('Cloudinary 위젯을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

// 하플 상회 색깔에 맞춘 위젯 색상
const WIDGET_STYLES = {
  palette: {
    window: '#1b1030',
    windowBorder: '#e8c25a',
    tabIcon: '#e8c25a',
    menuIcons: '#f4ecd8',
    textDark: '#1e1b18',
    textLight: '#ffffff',
    link: '#e8c25a',
    action: '#9b1c1c',
    inactiveTabIcon: '#8f99c4',
    error: '#c94a3a',
    inProgress: '#4a7ad9',
    complete: '#4ade80',
    sourceBg: '#2a1a40',
  },
}

export function useCloudinaryUploadWidget(handlers) {
  const handlersRef = useRef(handlers)
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(false)

  // 콜백은 항상 최신 것을 쓰도록 ref 에 담아 둬요.
  useEffect(() => {
    handlersRef.current = handlers
  })

  // 화면을 떠나면 위젯을 정리해요.
  useEffect(() => () => widgetRef.current?.destroy?.(), [])

  const open = useCallback(async (options = {}) => {
    if (!isCloudinaryConfigured) {
      handlersRef.current.onError?.('Cloudinary 설정(VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)이 없습니다.')
      return
    }
    setLoading(true)
    try {
      const cloudinary = await loadWidgetScript()
      // 남은 장수 같은 옵션이 매번 달라서, 열 때마다 위젯을 새로 만들어요.
      await widgetRef.current?.destroy?.()
      const widget = cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          styles: WIDGET_STYLES,
          ...options,
        },
        (error, result) => {
          if (error) {
            handlersRef.current.onError?.(error.statusText || error.message || '사진을 올리지 못했습니다.')
            return
          }
          if (result?.event === 'success') handlersRef.current.onUpload?.(result.info)
          if (result?.event === 'queues-end') {
            handlersRef.current.onQueuesEnd?.()
            widget.close({ quiet: true }) // 다 올라가면 위젯을 닫고 화면의 미리보기로 돌아와요.
          }
          if (result?.event === 'close') handlersRef.current.onClose?.()
        },
      )
      widgetRef.current = widget
      widget.open()
    } catch (err) {
      handlersRef.current.onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { open, loading, configured: isCloudinaryConfigured }
}
