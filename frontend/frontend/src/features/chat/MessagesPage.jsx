import ChatWindowModal from '../../components/common/ChatWindowModal'

export default function MessagesPage({ controller }) {
  return (
    <div className="messages-page">
      <div className="messages-page__head">
        <div>
          <h2>전체 채팅</h2>
          <p>최근 대화 목록과 1대1 채팅 내역을 한 곳에서 확인합니다.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => controller.setRoutePage('main')}
        >
          뒤로가기
        </button>
      </div>

      <div className="messages-page__layout">
        <aside className="messages-page__sidebar">
          <div className="messages-page__sidebar-title">대화 목록</div>
          {controller.chatRooms?.length ? (
            controller.chatRooms.map((room) => (
              <button
                key={room.roomKey}
                type="button"
                className={`messages-page__room ${controller.chatRoom?.roomKey === room.roomKey ? 'is-active' : ''}`}
                onClick={() => controller.openChatRoomFromSummary(room, { embedded: true })}
              >
                <div className="messages-page__room-name">{room.targetProfile?.name}</div>
                <div className="messages-page__room-text">{room.lastMessage || '대화를 시작해 보세요.'}</div>
                {!!room.unreadCount && (
                  <span className="messages-page__room-badge">{room.unreadCount}</span>
                )}
              </button>
            ))
          ) : (
            <div className="empty-box small">대화방이 없습니다.</div>
          )}
        </aside>

        <section className="messages-page__content">
          {controller.chatRoom ? (
            <div className="messages-page__chat-panel">
              <ChatWindowModal
                embedded
                room={controller.chatRoom}
                draft={controller.chatDraft}
                setDraft={controller.setChatDraft}
                onSend={controller.handleSendChatMessage}
                onClose={() => controller.setRoutePage('main')}
                isSending={controller.chatSending}
              />
            </div>
          ) : (
            <div className="empty-box">왼쪽에서 대화 상대를 선택해 주세요.</div>
          )}
        </section>
      </div>
    </div>
  )
}
