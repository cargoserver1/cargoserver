import AppLogo from '../../../components/common/AppLogo';

function moveToMain(controller, targetId = null) {
  if (targetId) {
    controller.goToMainSection(targetId);
    return;
  }

  controller.setRoutePage('main');
  controller.setDashboardTab('home');
  if (!controller.isLoggedIn) {
    controller.setAuthMode('signup');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function PublicHeader({
  isLoggedIn,
  authMode,
  setAuthMode,
  setDashboardTab,
  logout,
  controller,
}) {
  const currentRoute = controller.routePage;
  const currentDashboard = controller.dashboardTab;

  const navButtonClass = (isActive) =>
    isActive ? 'is-active' : '';

  return (
    <header className="landing-header">
      <div className="landing-header__inner">

        {/* 로고 */}
        <button
          type="button"
          className="landing-brand"
          onClick={() => moveToMain(controller)}
          aria-label="메인 페이지로 이동"
        >
          <AppLogo subtitle="운송 운영 플랫폼" hideTitle />
        </button>

        {/* 메뉴 */}
        <nav className="landing-nav">
          <button
            type="button"
            onClick={() => moveToMain(controller, 'landing-solution')}
          >
            서비스 소개
          </button>

          <button
            type="button"
            onClick={() => moveToMain(controller, 'board')}
          >
            배차보드
          </button>

          <button
            type="button"
            onClick={() => moveToMain(controller, 'notice-faq')}
          >
            FAQ · 문의
          </button>
        </nav>

        {/* 오른쪽 버튼 */}
        <div className="landing-header__actions">
          {isLoggedIn ? (
            <>
              <button
                className="landing-btn landing-btn--light"
                onClick={() => {
                  controller.setRoutePage('dashboard');
                  setDashboardTab('overview');
                }}
              >
                마이페이지
              </button>
              <button
                className="landing-btn landing-btn--primary"
                onClick={logout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                className="landing-btn landing-btn--primary"
                onClick={() => controller.setRoutePage('login')}
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
