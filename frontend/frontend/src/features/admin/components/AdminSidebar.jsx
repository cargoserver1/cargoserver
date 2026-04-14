import AppLogo from '../../../components/common/AppLogo'
import { roleText } from '../../../utils/formatters'
import { ADMIN_NAV_ITEMS } from './adminConfig'

export default function AdminSidebar({ auth, dashboardTab, setDashboardTab, logout, goToMain }) {
  return (
    <aside className="console-sidebar">
      <div className="console-logo"><AppLogo title="want" subtitle="운송 운영 플랫폼" compact hideText /></div>
      <div className="sidebar-profile"><strong>{auth.name}</strong><span>{roleText(auth.role)}</span><small>{auth.email}</small></div>
      <nav className="sidebar-nav">
        <button className="btn btn-ghost block" onClick={() => goToMain?.() ?? setDashboardTab('home')}>메인 페이지로 이동</button>
        {ADMIN_NAV_ITEMS.map(([key, label]) => <button key={key} className={dashboardTab === key ? 'nav-link active' : 'nav-link'} onClick={() => setDashboardTab(key)}>{label}</button>)}
      </nav>
      <button className="btn btn-secondary block" onClick={logout}>로그아웃</button>
    </aside>
  )
}
