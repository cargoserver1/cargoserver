import SectionTitle from '../../../components/common/SectionTitle'
import { formatDate, memberStatusText } from '../../../utils/formatters'

export default function AdminOverviewTab({ controller }) {
  const { adminDashboard, roleTheme, adminAlerts, setDashboardTab } = controller
  if (!adminDashboard) return null

  return (
    <div className="page-stack">
      <section className="role-banner role-banner-admin">
        <div><div className="eyebrow">ADMIN WORKSPACE</div><h2>{roleTheme?.label}</h2><p>{roleTheme?.summary}</p></div>
        <div className="role-banner-notes">{(roleTheme?.bullets || []).map((item) => <span key={item}>{item}</span>)}</div>
      </section>
      <div className="kpi-grid">
        <div className="kpi-card"><span>전체 회원</span><strong>{adminDashboard.totalMembers}</strong></div>
        <div className="kpi-card"><span>화주</span><strong>{adminDashboard.activeShippers}</strong></div>
        <div className="kpi-card"><span>차주</span><strong>{adminDashboard.activeDrivers}</strong></div>
        <div className="kpi-card"><span>실시간 운행</span><strong>{adminDashboard.liveShipments}</strong></div>
        <div className="kpi-card"><span>미답변 문의</span><strong>{adminDashboard.pendingInquiries}</strong></div>
        <div className="kpi-card"><span>오픈 신고</span><strong>{adminDashboard.openReports}</strong></div>
        <div className="kpi-card"><span>오픈 분쟁</span><strong>{adminDashboard.openDisputes}</strong></div>
      </div>
      <div className="admin-grid-2">
        <div className="surface"><SectionTitle title="운영 우선 큐" desc="먼저 처리해야 할 항목을 역할 테마와 함께 묶어서 보여줍니다." /><div className="signal-grid">{adminAlerts.map((item) => <div key={item.title} className="signal-card"><span>{item.title}</span><strong>{item.value}</strong><p>{item.desc}</p></div>)}</div></div>
        <div className="surface"><SectionTitle title="즉시 조치 단축" desc="관리자 운영에서 자주 보는 화면으로 바로 이동합니다." /><div className="shortcut-grid"><button className="shortcut-card" onClick={() => setDashboardTab('inquiries')}><strong>문의 관리</strong><small>미답변 문의와 답변 작성으로 이동</small></button><button className="shortcut-card" onClick={() => setDashboardTab('issues')}><strong>신고 / 분쟁</strong><small>리스크 항목만 모아서 확인</small></button><button className="shortcut-card" onClick={() => setDashboardTab('shipments')}><strong>화물 관리</strong><small>상태 강제 조정과 운행 현황 확인</small></button><button className="shortcut-card" onClick={() => setDashboardTab('members')}><strong>회원 관리</strong><small>권한 / 상태를 한 표에서 조정</small></button></div></div>
      </div>
      <div className="admin-grid-2">
        <div className="surface"><SectionTitle title="최근 가입 회원" /><table className="board-table compact"><thead><tr><th>이름</th><th>역할</th><th>상태</th><th>등록일</th></tr></thead><tbody>{(adminDashboard.recentMembers || []).map(item => <tr key={item.id}><td>{item.name}<small>{item.email}</small></td><td>{item.role}</td><td><span className="badge badge-neutral">{memberStatusText(item.status)}</span></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div>
        <div className="surface"><SectionTitle title="최근 운영 로그" /><div className="list-stack">{(adminDashboard.recentActions || []).map(log => <div key={log.id} className="list-row block"><strong>{log.actionType}</strong><span>{log.description}</span><small>{log.adminName} · {formatDate(log.createdAt)}</small></div>)}</div></div>
      </div>
    </div>
  )
}
