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

export default function NotificationsPage({ controller }) {
  const items = controller.allNotifications || []

  return (
    <div className="messages-page notifications-page">
      <div className="messages-page__head">
        <div>
          <h2>전체 알림</h2>
          <p>지금까지 받은 모든 알림을 시간순으로 확인할 수 있습니다.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => controller.setRoutePage('main')}
        >
          뒤로가기
        </button>
      </div>

      <div className="notifications-page__list">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`notification-item notifications-page__item ${item.isRead ? '' : 'is-unread'}`}
              onClick={() => controller.handleOpenNotificationLink(item, { keepPanelClosed: true })}
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
          <div className="empty-box">아직 받은 알림이 없습니다.</div>
        )}
      </div>
    </div>
  )
}