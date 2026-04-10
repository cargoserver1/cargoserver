import { statusText } from './formatters'

export function buildUserAlerts(role, shipments, selected) {
  const live = shipments.filter(item => item.status === 'IN_TRANSIT' || item.status === 'CONFIRMED')
  const bidding = shipments.filter(item => item.status === 'BIDDING')
  if (role === 'SHIPPER') {
    return [
      { title: '입찰 검토가 필요한 배차', value: `${bidding.length}건`, desc: '제안이 모이는 배차를 먼저 비교해 보세요.' },
      { title: '운행중 / 확정 건', value: `${live.length}건`, desc: '도착 예정이 가까운 순서로 확인하는 것이 좋습니다.' },
      { title: '현재 선택 배차', value: selected ? statusText(selected.status) : '선택 없음', desc: selected ? `${selected.title}` : '보드에서 배차를 선택하면 상세와 지도, 액션이 함께 열립니다.' },
    ]
  }
  const assigned = shipments.filter(item => item.assignedDriverName)
  const completable = shipments.filter(item => item.tracking?.completable)
  return [
    { title: '입찰 가능한 배차', value: `${bidding.length}건`, desc: '입찰중 상태의 공개 배차에 바로 제안할 수 있습니다.' },
    { title: '내가 맡은 운행', value: `${assigned.length}건`, desc: '확정된 건만 운반 시작과 완료 버튼이 열립니다.' },
    { title: '완료 가능 건', value: `${completable.length}건`, desc: '예상 도착 시간이 지난 건만 완료 처리됩니다.' },
  ]
}

export function buildAdminAlerts(adminDashboard, reports, disputes, inquiries) {
  if (!adminDashboard) return []
  return [
    { title: '즉시 확인이 필요한 문의', value: `${adminDashboard.pendingInquiries}건`, desc: '미답변 문의는 운영 체감 품질에 바로 영향을 줍니다.' },
    { title: '오픈 신고 / 분쟁', value: `${adminDashboard.openReports + adminDashboard.openDisputes}건`, desc: '운영 리스크는 신고와 분쟁을 함께 보며 대응하는 편이 좋습니다.' },
    { title: '실시간 운행', value: `${adminDashboard.liveShipments}건`, desc: '운행중 건은 관리자 보드에서도 지도와 상태를 함께 확인하세요.' },
    { title: '최근 접수', value: `${(inquiries || []).slice(0, 3).length}건`, desc: (inquiries || [])[0]?.title || '신규 문의가 들어오면 이 영역에 우선 표시됩니다.' },
  ]
}
