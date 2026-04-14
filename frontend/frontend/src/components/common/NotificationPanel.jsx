import { formatDate } from '../../utils/formatters'

const notificationTypeLabel = (type) => {
  switch (type) {
    case 'PAYMENT': return '결제'
    case 'OFFER': return '입찰'
    case 'OFFER_ACCEPTED': return '선택됨'
    case 'OFFER_REJECTED': return '미선택'
    case 'BLOCK': return '차단'
    default: return '알림'
  }
}

export default function NotificationPanel({
  open,
  summary,
  onClose,
  onMarkAllRead,
  onOpenLink,
  onOpenNotificationsPage,
}) {
  if (!open) return null

  const items = (summary?.items || []).filter((item) => !item.isRead)

  return (
    <div className="chat-inbox-backdrop" onClick={onClose}>
      <aside className="chat-inbox-panel notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="chat-inbox-panel__head">
          <div>
            <strong>알림</strong>
            <p>거래 진행, 제안 선택, 결제 완료 알림을 확인할 수 있습니다.</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>×</button>
        </div>

        <div className="chat-inbox-panel__body">
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="notification-item is-unread"
                onClick={() => onOpenLink?.(item)}
              >
                <div className="notification-item__top">
                  <span className="notification-item__type">{notificationTypeLabel(item.type)}</span>
                  <span className="notification-item__date">
                    {item.createdAt ? formatDate(item.createdAt) : ''}
                  </span>
                </div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </button>
            ))
          ) : (
            <div className="empty-box small">새 알림이 없습니다.</div>
          )}
        </div>

        <div className="chat-inbox-panel__foot">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onMarkAllRead}
            disabled={!items.length}
          >
            모두 읽음 처리
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onOpenNotificationsPage}
          >
            전체 알림 보기
          </button>
        </div>
      </aside>
    </div>
  )
}