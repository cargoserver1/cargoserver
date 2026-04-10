import AppLogo from '../../../components/common/AppLogo'
import { roleText } from "../../../utils/formatters";

export default function UserSidebar({
  auth,
  dashboardTab,
  setDashboardTab,
  summary,
  logout,
  goToMain,
}) {
  const navItems = [
    ["overview", "마이페이지"],
    ["board", "배차 보드"],
    ["register", auth.role === "SHIPPER" ? "화물 등록" : "입찰 가이드"],
    ["finance", "돈 관리"],
    ["penalty", "패널티 관리"],
    ["ratings", "평점 관리"],
    ["bookmarks", "즐겨찾기"],
  ];

  return (
    <aside className="console-sidebar">
      <div className="console-logo"><AppLogo title="want" subtitle="운송 운영 플랫폼" compact hideText /></div>
      <div className="sidebar-profile">
        <strong>{auth.name}</strong>
        <span>{roleText(auth.role)}</span>
        <small>{auth.email}</small>
      </div>
      <nav className="sidebar-nav">
        <button
          className="btn btn-ghost block"
          onClick={() => goToMain?.() ?? setDashboardTab("home")}
        >
          메인 페이지로 이동
        </button>
        {navItems.map(([key, label]) => (
          <button
            key={key}
            className={dashboardTab === key ? "nav-link active" : "nav-link"}
            onClick={() => setDashboardTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="side-mini-kpis">
        <div>
          <span>전체</span>
          <strong>{summary.total}</strong>
        </div>
        <div>
          <span>입찰중</span>
          <strong>{summary.bidding}</strong>
        </div>
        <div>
          <span>운행중</span>
          <strong>{summary.live}</strong>
        </div>
        <div>
          <span>완료</span>
          <strong>{summary.completed}</strong>
        </div>
      </div>
      <button className="btn btn-secondary block" onClick={logout}>
        로그아웃
      </button>
    </aside>
  );
}
