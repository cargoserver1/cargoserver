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

export default function DriverHeader({ controller }) {
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
                        className={navButtonClass(currentDashboard === 'quotes')}
                        onClick={() => controller.setDashboardTab('quotes')}
                    >
                        견적 목록 보기
                    </button>
                    <button
                        type="button"
                        className={navButtonClass(currentRoute === 'status')}
                        onClick={() => controller.setRoutePage('status')}
                    >
                        운송 현황
                    </button>

                    <button
                        type="button"
                        className={navButtonClass(currentRoute === 'shippers')}
                        onClick={() => controller.openPublicUserPage('SHIPPER')}
                    >
                        화주 찾기
                    </button>
                </nav>

                {/* 오른쪽 버튼 */}
                <div className="landing-header__actions">
                    <button
                        className="landing-btn landing-btn--light"
                        onClick={() => {
                            controller.setRoutePage('dashboard');
                            controller.setDashboardTab('overview');
                        }}
                    >
                        마이페이지
                    </button>

                    <button
                        className="landing-btn landing-btn--primary"
                        onClick={controller.logout}
                    >
                        로그아웃
                    </button>
                </div>

            </div>
        </header>
    );
}