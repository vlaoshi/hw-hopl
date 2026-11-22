// 아직 만들지 않은 메뉴(진열장, 화물칸 등)에 들어왔을 때 보여주는 "정비 중" 페이지
// 사용 예) <Route path="shop" element={<ComingSoonPage title="진열장" />} />
import { Link } from 'react-router-dom'
import './ComingSoonPage.css'

function ComingSoonPage({ title }) {
  return (
    <section className="coming-soon">
      <p className="coming-soon-badge">⚒ 정비 중</p>
      <h1 className="coming-soon-title">{title}</h1>
      <p className="coming-soon-text">
        이 구역은 아직 정비 중입니다.
        <br />
        곧 문을 열 예정이니 조금만 기다려 주십시오.
      </p>
      <Link to="/" className="coming-soon-link">
        ◀ 하플 상회 입구로 돌아가기
      </Link>
    </section>
  )
}

export default ComingSoonPage
