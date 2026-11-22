// 회원가입 완료 화면 - 교역허가증 발급
// 서버가 돌려준 회원 정보(user)로 허가증을 보여주고, 붉은 인장이 찍히는 효과를 줘요.
import { Link } from 'react-router-dom'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function PermitIssued({ user }) {
  return (
    <div className="permit-sheet permit-issued">
      <div className="permit-banner">
        <h1 className="permit-title">교역허가증</h1>
        <p className="permit-subtitle">TRADE PERMIT · HAPL TRADING HOUSE</p>
      </div>

      <div className="permit-body">
        <p className="issued-headline">교역허가증이 발급되었습니다!</p>

        {/* 발급 정보 + 붉은 인장 (인장이 글자를 가리지 않게 옆 칸에 찍어요) */}
        <div className="issued-record">
          <dl className="issued-info">
            <div>
              <dt>상인명</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>전서구 주소</dt>
              <dd>{user.email}</dd>
            </div>
            {user.address && (
              <div>
                <dt>교역물 인도지</dt>
                <dd>{user.address}</dd>
              </div>
            )}
            <div>
              <dt>발급일</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>

          {/* 붉은 인장 (화면에 찍히는 애니메이션) */}
          <div className="seal-stamp" aria-hidden="true">
            <span>
              안개섬
              <br />
              교역인가
            </span>
          </div>
        </div>

        <p className="issued-message">
          {user.name} 상인님, 안개섬 하플 상회에 오신 것을 환영합니다.
          <br />
          입항 심사를 받으시면 진귀한 물품을 자유롭게 거래하실 수 있습니다.
        </p>

        {/* 가입만으로는 입항(로그인)이 되지 않아요. 로그인 페이지로 보내면서 전서구 주소를 미리 채워 줘요.
            (이메일은 주소창에 드러나지 않도록 state로 넘겨요) */}
        <Link to="/login" state={{ email: user.email }} className="pixel-btn pixel-btn-seal permit-submit">
          입항 심사 받으러 가기
        </Link>
      </div>
    </div>
  )
}

export default PermitIssued
