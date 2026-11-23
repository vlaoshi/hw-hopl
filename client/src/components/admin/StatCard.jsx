// 대시보드 숫자 카드 - [이름 · 큰 숫자 · 보조 설명] + 오른쪽 픽셀 아이콘
import PixelArt from '../harbor/PixelArt.jsx'
import { ADMIN_ICONS } from './adminIcons.js'

function StatCard({ icon, label, value, note }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-text">
        <p className="admin-stat-label">{label}</p>
        <p className="admin-stat-value">{value}</p>
        {note && <p className="admin-stat-note">{note}</p>}
      </div>
      <PixelArt scene={ADMIN_ICONS[icon]} className="admin-stat-icon" />
    </div>
  )
}

export default StatCard
