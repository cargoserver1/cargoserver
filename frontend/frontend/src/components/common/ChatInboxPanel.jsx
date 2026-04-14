import { formatDate, resolveMediaUrl } from '../../utils/formatters'

export default function ChatInboxPanel({
  open,
  rooms,
  onClose,
  onOpenRoom,
  onOpenMessagesPage,
}) {
  if (!open) return null

  return (
    <div className="chat-inbox-backdrop" onClick={onClose}>
      <aside className="chat-inbox-panel" onClick={(e) => e.stopPropagation()}>
        <div className="chat-inbox-panel__head">
          <div>
            <strong>최근 대화</strong>
            <p>최근에 메시지를 주고받은 상대를 바로 확인할 수 있습니다.</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>×</button>
        </div>

        <div className="chat-inbox-panel__body">
          {rooms?.length ? (
            rooms.map((room) => (
              <button
                key={room.roomKey}
                type="button"
                className="chat-inbox-item"
                onClick={() => onOpenRoom(room)}
              >
                {room.targetProfile?.profileImageUrl ? (
                  <img
                    src={resolveMediaUrl(room.targetProfile.profileImageUrl)}
                    alt={room.targetProfile?.name}
                    className="chat-inbox-item__avatar"
                  />
                ) : (
                  <div className="chat-inbox-item__avatar chat-inbox-item__avatar--fallback">
                    {(room.targetProfile?.name || '?').slice(0, 1)}
                  </div>
                )}

                <div className="chat-inbox-item__content">
                  <div className="chat-inbox-item__top">
                    <strong>{room.targetProfile?.name}</strong>
                    <span>{room.lastMessageAt ? formatDate(room.lastMessageAt) : ''}</span>
                  </div>
                  <div className="chat-inbox-item__bottom">
                    <p>{room.lastMessage || '아직 메시지가 없습니다.'}</p>
                    {!!room.unreadCount && (
                      <span className="chat-inbox-item__badge">{room.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-box small">아직 대화 내역이 없습니다.</div>
          )}
        </div>

        <div className="chat-inbox-panel__foot">
          <button className="btn btn-secondary" type="button" onClick={onOpenMessagesPage}>
            전체 채팅 보기
          </button>
        </div>
      </aside>
    </div>
  )
}
