import AppLogo from '../../../components/common/AppLogo'
import { roleText } from '../../../utils/formatters'

function LoggedInPanel({ auth, message, openDashboard, logout }) {
  return (
    <div className="landing-authCard">
      <div className="landing-authCard__eyebrow">ACCOUNT</div>
      <h3>{auth.name}님으로 로그인되어 있습니다.</h3>
      <p>공개 메인 페이지를 둘러본 뒤 필요한 순간에 바로 운영 화면으로 이동할 수 있습니다.</p>
      <div className="landing-authCard__info">
        <span>이름</span>
        <strong>{auth.name}</strong>
        <span>권한</span>
        <strong>{roleText(auth.role)}</strong>
        <span>이메일</span>
        <strong>{auth.email}</strong>
      </div>
      <div className="landing-authCard__actions">
        <button className="landing-btn landing-btn--primary" onClick={() => openDashboard('overview')}>대시보드 이동</button>
        <button className="landing-btn landing-btn--light" onClick={logout}>로그아웃</button>
      </div>
      {!!message && <div className="landing-inlineMessage">{message}</div>}
    </div>
  )
}

function AccessPanel({ authMode, setAuthMode, loginForm, setLoginForm, signupForm, setSignupForm, handleLogin, handleSignup, message }) {
  return (
    <div className="landing-authCard">
      <div className="landing-authCard__switch">
        <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>로그인</button>
        <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>회원가입</button>
      </div>
      <div className="landing-authCard__eyebrow">ACCESS</div>
      <h3>{authMode === 'login' ? '운송 운영 계정 로그인' : '서비스 회원가입'}</h3>
      <p>실제 운영 흐름을 확인할 수 있도록 공개 페이지와 역할별 대시보드가 자연스럽게 이어집니다.</p>

      {authMode === 'login' ? (
        <div className="landing-formStack">
          <input placeholder="이메일" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
          <input type="password" placeholder="비밀번호" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button className="landing-btn landing-btn--primary landing-btn--full" onClick={handleLogin}>로그인</button>
          <small className="landing-authHint">샘플 계정: shipper@test.com / driver@test.com / admin@test.com · 비밀번호 1111</small>
        </div>
      ) : (
        <div className="landing-formStack">
          <div className="landing-split2">
            <input placeholder="이름" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
            <select value={signupForm.role} onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}>
              <option value="SHIPPER">화주</option>
              <option value="DRIVER">차주</option>
            </select>
          </div>
          <input placeholder="이메일" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
          <div className="landing-split2">
            <input type="password" placeholder="비밀번호" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
            <input placeholder="연락처" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} />
          </div>
          {signupForm.role === 'SHIPPER' ? (
            <input placeholder="회사명" value={signupForm.companyName} onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })} />
          ) : (
            <input placeholder="차량 종류" value={signupForm.vehicleType} onChange={(e) => setSignupForm({ ...signupForm, vehicleType: e.target.value })} />
          )}
          <button className="landing-btn landing-btn--primary landing-btn--full" onClick={handleSignup}>회원가입</button>
        </div>
      )}
      {!!message && <div className="landing-inlineMessage">{message}</div>}
    </div>
  )
}

export default function PublicHeroSection({ controller }) {
  const {
    isLoggedIn,
    auth,
    authMode,
    setAuthMode,
    setDashboardTab,
    logout,
    message,
    loginForm,
    setLoginForm,
    signupForm,
    setSignupForm,
    publicData,
    handleLogin,
    handleSignup,
  } = controller

  const stats = [
    { label: '등록 화주', value: publicData.totalShippers || 0 },
    { label: '등록 차주', value: publicData.totalDrivers || 0 },
    { label: '진행중 배차', value: publicData.liveShipments || 0 },
    { label: '완료 누적', value: publicData.completedShipments || 0 },
  ]

  return (
    <>
      <section className="landing-hero">
        <div className="landing-hero__bg" />
        <div className="landing-hero__overlay" />
        <div className="landing-hero__inner">
          <div className="landing-hero__copy" data-reveal>
            <div className="landing-kicker">SMART LOGISTICS PLATFORM</div>
            <h1>화주, 차주, 관리자 운영을 한 흐름으로 연결하는 운송 관리 플랫폼</h1>
            <p>
              배차 등록부터 입찰, 운행 추적, 정산, 운영 관리까지 하나의 서비스 경험으로 이어집니다.
              첫 화면은 신뢰감 있게 넓고 단정하게, 운영 화면은 빠르고 실무적으로 설계했습니다.
            </p>
            <div className="landing-hero__actions">
              <button className="landing-btn landing-btn--primary" onClick={() => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' })}>실시간 배차 보기</button>
              {/* <button className="landing-btn landing-btn--light" onClick={() => document.getElementById('landing-solution')?.scrollIntoView({ behavior: 'smooth' })}>서비스 소개</button> */}
            </div>
            {/* <div className="landing-hero__summary"> 
              <div> 
                <span>핵심 가치</span> 
                <strong>배차 · 운행 · 운영 관리 통합</strong> 
              </div> 
              <div> 
                <span>지원 역할</span> 
                <strong>화주 · 차주 · 관리자</strong> 
              </div> 
            </div> */}

          </div>

          <div className="landing-hero__visual" data-reveal>
            <div className="landing-visualCard">
              <div className="landing-visualCard__glow landing-visualCard__glow--blue" />
              <div className="landing-visualCard__glow landing-visualCard__glow--violet" />
              <div className="landing-visualCard__panel">
                <span>운행 모니터링</span>
                <strong>실시간 배차 현황과 ETA</strong>
              </div>
              <div className="landing-visualCard__panel landing-visualCard__panel--wide">
                <span>운영 대시보드</span>
                <strong>입찰 비교, 상태 추적, 공지 · 문의 관리</strong>
              </div>
              <div className="landing-visualCard__orb landing-visualCard__orb--center">AI</div>
              <div className="landing-visualCard__orb landing-visualCard__orb--one">배차</div>
              <div className="landing-visualCard__orb landing-visualCard__orb--two">운행</div>
              <div className="landing-visualCard__orb landing-visualCard__orb--three">정산</div>
              <div className="landing-visualCard__shield">
                <div className="landing-visualCard__shieldCore landing-visualCard__shieldCore--logo"><AppLogo title="want" subtitle="" hideText /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-stats" data-reveal>
        <div className="landing-stats__inner">
          {stats.map((stat) => (
            <article key={stat.label} className="landing-statItem">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-solution" id="landing-solution" data-reveal>
        <div className="landing-sectionHead">
          <span>PLATFORM FLOW</span>
          <h2>메인 페이지는 넓고 단정하게, 운영 화면은 역할별로 빠르게</h2>
          <p>공개 화면에서 서비스 신뢰를 전달하고, 로그인 이후에는 역할별 업무 흐름으로 곧바로 연결됩니다.</p>
        </div>
        <div className="landing-solutionGrid">
          <article>
            <strong>01. 화주 등록</strong>
            <p>출발지, 도착지, 화물 정보 입력 후 공개 배차 보드에 즉시 반영됩니다.</p>
          </article>
          <article>
            <strong>02. 차주 입찰</strong>
            <p>입찰가와 메시지를 비교하고, 확정 이후에는 운행 상태와 ETA가 이어집니다.</p>
          </article>
          <article>
            <strong>03. 관리자 운영</strong>
            <p>회원 상태, 공지, 문의, 분쟁과 같은 운영 항목을 한 화면에서 관리합니다.</p>
          </article>
        </div>
      </section>
      {/* <section className="landing-accessBand" data-reveal>
        <div className="landing-accessBand__inner">
          <div className="landing-accessBand__copy">
            <span>START NOW</span>
            <h2>운영 계정을 바로 연결해 실제 흐름을 확인해보세요.</h2>
            <p>메인 페이지에서 서비스 구조를 확인한 뒤, 로그인 또는 회원가입을 통해 역할별 화면으로 자연스럽게 이동할 수 있습니다.</p>
          </div>
          {isLoggedIn ? (
            <LoggedInPanel auth={auth} message={message} openDashboard={controller.openDashboard} logout={logout} />
          ) : (
            <AccessPanel
              authMode={authMode}
              setAuthMode={setAuthMode}
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              signupForm={signupForm}
              setSignupForm={setSignupForm}
              handleLogin={handleLogin}
              handleSignup={handleSignup}
              message={message}
            />
          )}
        </div>
      </section> */}
    </>
  )
}
