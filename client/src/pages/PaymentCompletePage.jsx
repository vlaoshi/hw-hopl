// 결제 결과 (/payment/complete) - 모바일에서 결제사(KG이니시스) 페이지를 다녀온 뒤 돌아오는 곳
// 포트원이 주소 뒤에 결과를 붙여서 보내요. 예) /payment/complete?paymentId=ORD-...&code=...&message=...
// - code 가 있으면 실패·취소 → 주문서를 '결제 실패'로 정리하고 안내
// - 없으면 성공 → 서버가 포트원에 다시 조회해서 확인 → 주문 상세 페이지로 이동
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { completeOrder, failOrder } from '../api/orders.js'
import '../components/cart/Cart.css'

// 주소의 결과로 처음 보여 줄 상태를 정해요.
function initialResult(params) {
  if (!params.get('paymentId')) return { status: 'error', text: '결제 정보가 없습니다.' }
  if (params.get('code')) return { status: 'error', text: `결제를 마치지 못했습니다. ${params.get('message') ?? ''}`.trim() }
  return { status: 'checking', text: '' }
}

function PaymentCompletePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(() => initialResult(params))
  const started = useRef(false) // 개발 모드에서 두 번 실행되지 않게

  useEffect(() => {
    if (started.current) return
    started.current = true
    const paymentId = params.get('paymentId')
    const code = params.get('code')
    if (!paymentId) return
    if (code) {
      failOrder(paymentId, { code, message: params.get('message') ?? undefined }).catch(() => {})
      return
    }
    completeOrder(paymentId)
      .then((order) => navigate(`/orders/${order.orderNumber}`, { replace: true, state: { justPaid: true } }))
      .catch((err) => setResult({ status: 'error', text: err.message }))
  }, [params, navigate])

  return (
    <section className="cart-page">
      <div className="cart-inner">
        <h1 className="cart-title">결제 확인</h1>
        <section className="cart-panel cart-empty">
          {result.status === 'checking' ? (
            <p className="cart-empty-title">결제를 확인하는 중입니다...</p>
          ) : (
            <>
              <p className="cart-empty-title">{result.text}</p>
              <Link to="/checkout" className="pixel-btn pixel-btn-seal cart-empty-btn">
                주문서로 돌아가기
              </Link>
            </>
          )}
        </section>
      </div>
    </section>
  )
}

export default PaymentCompletePage
