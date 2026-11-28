// 주문 관리 (/admin/orders?status=&q=&period=&page=) - 상점주 전용 (판매자 센터 '주문·배송 관리' 구성)
// [오늘 요약: 오늘 주문 · 오늘 매출 · 처리할 새 주문]
// [상태 탭(건수)] [검색: 주문번호·주문자·받는 분·연락처] [기간: 오늘·7일·30일·전체]
// [선택 일괄 처리: 상품 준비 시작 · 배송 완료 처리]
// [주문 표: 선택 · 주문일시 · 주문번호 · 주문자 · 상품 · 금액 · 결제 수단 · 상태 · 처리]  ← 줄을 누르면 상세가 펼쳐져요
// [페이지 이동]
// - 걸러 보는 조건은 모두 주소에 담겨서 새로고침·뒤로 가기에도 유지돼요.
// - 배송 시작은 송장번호를 주문마다 넣어야 해서 한 건씩, 나머지는 여러 건을 한 번에 처리할 수 있어요.
import { Fragment, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { updateAdminOrderStatus } from '../api/adminOrders.js'
import { useAdminOrders } from '../hooks/useAdminOrders.js'
import AdminGuard from '../components/admin/AdminGuard.jsx'
import AdminOrderDetail from '../components/admin/orders/AdminOrderDetail.jsx'
import CancelDialog from '../components/admin/orders/CancelDialog.jsx'
import ShipDialog from '../components/admin/orders/ShipDialog.jsx'
import Pagination from '../components/common/Pagination.jsx'
import GoodsSprite from '../components/goods/GoodsSprite.jsx'
import { CANCELLABLE, NEXT_ACTION, ORDER_TABS, PERIODS, formatDateTime } from '../components/admin/orders/orderFlow.js'
import { formatWon } from '../utils/format.js'
import './AdminProductsPage.css'
import './AdminOrdersPage.css'

const PAGE_SIZE = 10
const TAB_KEYS = ORDER_TABS.map((tab) => tab.key)
const PERIOD_KEYS = PERIODS.map((p) => p.key)
const BULK_ACTIONS = [
  { from: 'paid', to: 'preparing', label: '상품 준비 시작' },
  { from: 'shipping', to: 'delivered', label: '배송 완료 처리' },
]

function readParams(sp) {
  const page = Number.parseInt(sp.get('page'), 10)
  return {
    status: TAB_KEYS.includes(sp.get('status')) ? sp.get('status') : 'active',
    q: (sp.get('q') ?? '').slice(0, 50),
    period: PERIOD_KEYS.includes(sp.get('period')) ? sp.get('period') : 'all',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = readParams(searchParams)
  const { orders, counts, summary, carriers, pagination, loading, error, reload } = useAdminOrders({ ...params, limit: PAGE_SIZE })
  const [keyword, setKeyword] = useState(params.q)
  const [openNumber, setOpenNumber] = useState(null) // 펼친 주문
  const [detailVersion, setDetailVersion] = useState(0) // 상태를 바꾸면 펼친 상세를 다시 받아요
  const [selected, setSelected] = useState(() => new Set()) // 선택한 주문번호
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }
  const [shipTarget, setShipTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  // 조건 바꾸기 (페이지는 1쪽으로, 선택은 비워요)
  const update = (changes) => {
    const next = { ...params, page: 1, ...changes }
    const sp = {}
    if (next.status !== 'active') sp.status = next.status
    if (next.q) sp.q = next.q
    if (next.period !== 'all') sp.period = next.period
    if (next.page > 1) sp.page = String(next.page)
    setSearchParams(sp)
    if ('q' in changes) setKeyword(changes.q)
    setSelected(new Set())
    setOpenNumber(null)
  }

  // 없는 쪽이면 마지막 쪽으로
  const { totalPages } = pagination
  useEffect(() => {
    if (!loading && !error && totalPages > 0 && params.page > totalPages) {
      const sp = Object.fromEntries(searchParams)
      setSearchParams({ ...sp, page: String(totalPages) }, { replace: true })
    }
  }, [loading, error, totalPages, params.page, searchParams, setSearchParams])

  const afterChange = (text) => {
    setMessage({ type: 'ok', text })
    setDetailVersion((v) => v + 1)
    setSelected(new Set())
    reload()
  }

  // 다음 단계 (배송 시작은 송장 팝업으로)
  const handleNext = async (order) => {
    const next = NEXT_ACTION[order.status]
    if (!next) return
    if (next.status === 'shipping') return setShipTarget(order)
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminOrderStatus(order.orderNumber, { status: next.status })
      afterChange(`${order.orderNumber} → '${next.label}' 처리했습니다.`)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const handleShip = async ({ carrier, trackingNumber }) => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminOrderStatus(shipTarget.orderNumber, { status: 'shipping', carrier, trackingNumber })
      const number = shipTarget.orderNumber
      setShipTarget(null)
      afterChange(`${number} 배송을 시작했습니다. (${carrier}${trackingNumber ? ` ${trackingNumber}` : ''})`)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async (reason) => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminOrderStatus(cancelTarget.orderNumber, { status: 'cancelled', note: reason })
      const number = cancelTarget.orderNumber
      setCancelTarget(null)
      afterChange(`${number} 주문을 취소했습니다. 결제가 환불되고 재고가 되돌아갔습니다.`)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  // 선택 일괄 처리: 고른 주문 중 그 단계가 가능한 것만 차례로 처리하고 결과를 알려 줘요.
  const handleBulk = async (action) => {
    const targets = orders.filter((o) => selected.has(o.orderNumber) && o.status === action.from)
    if (targets.length === 0) return
    if (!window.confirm(`선택한 주문 ${targets.length}건을 '${action.label}' 할까요?`)) return
    setBusy(true)
    setMessage(null)
    const failed = []
    for (const order of targets) {
      try {
        await updateAdminOrderStatus(order.orderNumber, { status: action.to })
      } catch (err) {
        failed.push(`${order.orderNumber}: ${err.message}`)
      }
    }
    setBusy(false)
    const done = targets.length - failed.length
    if (failed.length) setMessage({ type: 'error', text: `${done}건 처리, ${failed.length}건 실패 - ${failed.join(' / ')}` })
    else afterChange(`${done}건을 '${action.label}' 처리했습니다.`)
    if (failed.length) reload()
  }

  const toggleSelect = (orderNumber) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(orderNumber)) next.delete(orderNumber)
      else next.add(orderNumber)
      return next
    })
  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.orderNumber))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.orderNumber)))
  const selectedOrders = orders.filter((o) => selected.has(o.orderNumber))

  return (
    <section className="admin-page">
      <div className="admin-inner admin-orders-inner">
        <header className="admin-head">
          <div>
            <p className="admin-badge">상점주</p>
            <h1 className="admin-title">주문 관리</h1>
            <p className="admin-subtitle">새 주문을 확인하고, 포장·발송·배송 완료까지 처리합니다.</p>
          </div>
          <Link to="/admin" className="admin-back">
            ◀ 대시보드
          </Link>
        </header>

        {/* 오늘 요약 */}
        <div className="ao-summary">
          <div className="ao-summary-card">
            <span className="ao-summary-label">오늘 주문</span>
            <strong className="ao-summary-value">{summary ? `${summary.todayOrders}건` : '…'}</strong>
          </div>
          <div className="ao-summary-card">
            <span className="ao-summary-label">오늘 매출</span>
            <strong className="ao-summary-value">{summary ? `${formatWon(summary.todayRevenue)}원` : '…'}</strong>
          </div>
          <button
            type="button"
            className={`ao-summary-card is-todo${summary?.newOrders ? ' has-todo' : ''}`}
            onClick={() => update({ status: 'paid', q: '', period: 'all' })}
          >
            <span className="ao-summary-label">처리할 새 주문 ▶</span>
            <strong className="ao-summary-value">{summary ? `${summary.newOrders}건` : '…'}</strong>
          </button>
        </div>

        {/* 상태 탭 */}
        <nav className="ao-tabs" aria-label="주문 상태">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ao-tab${tab.key === params.status ? ' is-current' : ''}`}
              onClick={() => update({ status: tab.key })}
              title={tab.hint}
              aria-current={tab.key === params.status ? 'page' : undefined}
            >
              {tab.label}
              <span className="ao-tab-count">{counts ? counts[tab.key] : '·'}</span>
            </button>
          ))}
        </nav>

        {/* 검색 · 기간 */}
        <div className="ao-filters">
          <form
            className="ao-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              update({ q: keyword.trim() })
            }}
          >
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="주문번호 · 주문자 · 받는 분 · 연락처"
              aria-label="주문 검색"
              maxLength={50}
            />
            <button type="submit" className="admin-small-btn is-primary">
              검색
            </button>
            {params.q && (
              <button
                type="button"
                className="admin-small-btn"
                onClick={() => {
                  setKeyword('')
                  update({ q: '' })
                }}
              >
                검색 지우기
              </button>
            )}
          </form>
          <div className="ao-periods" role="group" aria-label="기간">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`ao-period${p.key === params.period ? ' is-current' : ''}`}
                onClick={() => update({ period: p.key })}
                aria-pressed={p.key === params.period}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className={`admin-message ${message.type === 'error' ? 'is-error' : 'is-ok'}`} role="status">
            {message.text}
          </p>
        )}

        <section className="admin-panel ao-panel" aria-label="주문 목록">
          {/* 선택 일괄 처리 */}
          <div className="ao-bulk">
            <span className="ao-bulk-count">
              {selected.size > 0 ? `${selected.size}건 선택` : `전체 ${pagination.total}건${params.q ? ` · '${params.q}' 검색` : ''}`}
            </span>
            {BULK_ACTIONS.map((action) => {
              const n = selectedOrders.filter((o) => o.status === action.from).length
              return (
                <button
                  key={action.to}
                  type="button"
                  className="admin-small-btn"
                  onClick={() => handleBulk(action)}
                  disabled={busy || n === 0}
                  title={`선택한 주문 중 '${action.from === 'paid' ? '결제 완료' : '배송중'}' 상태만 처리해요`}
                >
                  선택 {action.label} {n > 0 ? `(${n})` : ''}
                </button>
              )
            })}
          </div>

          {error && <p className="admin-error">주문을 불러오지 못했습니다. ({error})</p>}
          {loading && orders.length === 0 && !error && <p className="admin-empty">주문 장부를 펼치는 중입니다...</p>}
          {!loading && !error && orders.length === 0 && (
            <p className="admin-empty">
              {params.q || params.period !== 'all' ? '조건에 맞는 주문이 없습니다.' : '이 상태의 주문이 없습니다.'}
            </p>
          )}

          {orders.length > 0 && (
            <div className="ao-table-wrap">
              <table className={`ao-table${loading ? ' is-loading' : ''}`}>
                <thead>
                  <tr>
                    <th scope="col" className="ao-col-check">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="이 쪽 주문 모두 선택" />
                    </th>
                    <th scope="col">주문일시 · 주문번호</th>
                    <th scope="col">주문자</th>
                    <th scope="col">상품</th>
                    <th scope="col" className="ao-col-num">
                      결제 금액
                    </th>
                    <th scope="col">상태</th>
                    <th scope="col" className="ao-col-action">
                      처리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const next = NEXT_ACTION[order.status]
                    const open = openNumber === order.orderNumber
                    return (
                      <Fragment key={order._id}>
                        <tr className={`ao-row${open ? ' is-open' : ''}${selected.has(order.orderNumber) ? ' is-selected' : ''}`}>
                          <td className="ao-col-check" data-label="선택">
                            <input
                              type="checkbox"
                              checked={selected.has(order.orderNumber)}
                              onChange={() => toggleSelect(order.orderNumber)}
                              aria-label={`${order.orderNumber} 선택`}
                            />
                          </td>
                          <td data-label="주문">
                            <button
                              type="button"
                              className="ao-open"
                              onClick={() => setOpenNumber(open ? null : order.orderNumber)}
                              aria-expanded={open}
                            >
                              <span className="ao-date">{formatDateTime(order.createdAt)}</span>
                              <span className="ao-number">
                                {open ? '▼' : '▶'} {order.orderNumber}
                              </span>
                            </button>
                          </td>
                          <td data-label="주문자">
                            <span className="ao-customer">{order.customer?.name ?? '탈퇴한 회원'}</span>
                            <span className="ao-sub">받는 분 {order.recipient}</span>
                          </td>
                          <td data-label="상품">
                            <span className="ao-goods">
                              <span className="admin-product-art ao-goods-art">
                                <GoodsSprite image={order.image} className="ao-goods-sprite" />
                              </span>
                              <span>
                                <span className="ao-goods-name">{order.orderName}</span>
                                <span className="ao-sub">{order.totalQuantity}개</span>
                              </span>
                            </span>
                          </td>
                          <td className="ao-col-num" data-label="결제 금액">
                            <strong>{formatWon(order.totalAmount)}원</strong>
                            <span className="ao-sub">{order.paymentMethod ?? '-'}</span>
                          </td>
                          <td data-label="상태">
                            <span className={`admin-order-badge is-${order.status}`}>{order.statusLabel}</span>
                            {order.delivery && (
                              <span className="ao-sub">
                                {order.delivery.carrier} {order.delivery.trackingNumber ?? ''}
                              </span>
                            )}
                          </td>
                          <td className="ao-col-action" data-label="처리">
                            {next && (
                              <button
                                type="button"
                                className="admin-small-btn is-primary"
                                onClick={() => handleNext(order)}
                                disabled={busy}
                              >
                                {next.label}
                              </button>
                            )}
                            {CANCELLABLE.includes(order.status) && (
                              <button
                                type="button"
                                className="admin-small-btn is-danger"
                                onClick={() => setCancelTarget(order)}
                                disabled={busy}
                              >
                                취소
                              </button>
                            )}
                            {!next && !CANCELLABLE.includes(order.status) && <span className="ao-sub">처리 끝</span>}
                          </td>
                        </tr>
                        {open && (
                          <tr className="ao-detail-row">
                            <td colSpan={7}>
                              <AdminOrderDetail orderNumber={order.orderNumber} version={detailVersion} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={params.page} totalPages={totalPages} onChange={(page) => update({ page })} disabled={loading} />
        </section>
      </div>

      {/* key: 다른 주문을 열면 입력값을 새로 시작해요 */}
      <ShipDialog
        key={`ship-${shipTarget?._id ?? 'none'}`}
        order={shipTarget}
        carriers={carriers}
        busy={busy}
        onSubmit={handleShip}
        onClose={() => setShipTarget(null)}
      />
      <CancelDialog
        key={`cancel-${cancelTarget?._id ?? 'none'}`}
        order={cancelTarget}
        busy={busy}
        onSubmit={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </section>
  )
}

function AdminOrdersPage() {
  return (
    <AdminGuard>
      <AdminOrders />
    </AdminGuard>
  )
}

export default AdminOrdersPage
