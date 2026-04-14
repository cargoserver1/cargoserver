export default function AdminTopbar({ title }) {
  return (
    <div className="console-topbar">
      <div>
        <div className="eyebrow">ADMIN CONTROL</div>
        <h1>{title}</h1>
        <p className="section-desc">바이올렛 계열 테마로 리스크, 문의, 분쟁, 전체 운영 상황을 빠르게 구분하도록 조정했습니다.</p>
      </div>
      <div className="toolbar-inline"><span className="role-chip role-chip-admin">관리자 테마</span></div>
    </div>
  )
}
