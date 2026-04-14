export default function UserTopbar({ auth, title, roleTheme, shipmentKeyword, setShipmentKeyword, driverBoardTag, setDriverBoardTag, shipmentFilter, setShipmentFilter }) {
  return (
    <div className="console-topbar">
      <div>
        <div className="eyebrow">USER OPERATIONS</div>
        <h1>{title}</h1>
        <p className="section-desc">{roleTheme?.tone}을 적용해 {auth.role === 'SHIPPER' ? '요청과 확정' : '주행과 ETA'}를 더 빠르게 읽을 수 있도록 조정했습니다.</p>
      </div>
      <div className="toolbar-inline">
        <span className={`role-chip role-chip-${roleTheme?.accent || 'shipper'}`}>{roleTheme?.label}</span>
        <input className="toolbar-search" placeholder="제목, 지역, 화물 종류 검색" value={shipmentKeyword} onChange={(e) => setShipmentKeyword(e.target.value)} />
        {auth.role === 'DRIVER' && <div className="chip-group"><button className={driverBoardTag === 'ALL' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('ALL')}>전체</button><button className={driverBoardTag === 'BIDDING' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('BIDDING')}>입찰중</button><button className={driverBoardTag === 'MY_BIDS' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('MY_BIDS')}>내 입찰</button><button className={driverBoardTag === 'MY_ASSIGNED' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('MY_ASSIGNED')}>내 확정</button><button className={driverBoardTag === 'MY_TRANSIT' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('MY_TRANSIT')}>내 운반중</button></div>}
        <select value={shipmentFilter} onChange={(e) => setShipmentFilter(e.target.value)}><option value="ALL">전체 상태</option><option value="BIDDING">입찰중</option><option value="CONFIRMED">확정</option><option value="IN_TRANSIT">운반중</option><option value="COMPLETED">완료</option></select>
      </div>
    </div>
  )
}
