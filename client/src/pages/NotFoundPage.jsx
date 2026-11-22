// 없는 주소로 들어왔을 때 보여주는 페이지예요.
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section>
      <h1>페이지를 찾을 수 없어요</h1>
      <p>
        <Link to="/">메인으로 돌아가기</Link>
      </p>
    </section>
  )
}

export default NotFoundPage
