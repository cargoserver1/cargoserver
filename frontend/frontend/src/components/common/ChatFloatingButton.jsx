import { useEffect, useRef, useState } from 'react'

export default function ChatFloatingButton({ unreadCount, notificationUnreadCount, onChatClick, onNotificationClick, onPlaceholderClick }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuToggle = () => setOpen((prev) => !prev)

  const handleAction = (fn, type) => {
    if (fn) fn(type)
    setOpen(false)
  }

  return (
    <div className={`floating-quick-menu ${open ? 'is-open' : ''}`} ref={rootRef}>
      <div className="floating-quick-menu__actions">
        <button className="floating-quick-menu__action floating-quick-menu__action--placeholder" type="button" onClick={() => handleAction(onPlaceholderClick, 'placeholder-1')} aria-label="추가 메뉴 1">
          <span className="floating-quick-menu__action-label">준비중</span>
        </button>

        <button className="floating-quick-menu__action floating-quick-menu__action--notification" type="button" onClick={() => handleAction(onNotificationClick, 'notification')} aria-label="알림 열기">
          <span className="floating-quick-menu__action-label">알림</span>
          {notificationUnreadCount > 0 && <span className="floating-quick-menu__badge">{notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}</span>}
        </button>

        <button className="floating-quick-menu__action floating-quick-menu__action--chat" type="button" onClick={() => handleAction(onChatClick, 'chat')} aria-label="채팅 열기">
          <span className="floating-quick-menu__action-label">채팅</span>
          {unreadCount > 0 && <span className="floating-quick-menu__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
      </div>

      <button className="floating-quick-menu__trigger" type="button" onClick={handleMenuToggle} aria-label={open ? '메뉴 닫기' : '빠른 메뉴 열기'}>
        <span className="floating-quick-menu__trigger-line floating-quick-menu__trigger-line--top" />
        <span className="floating-quick-menu__trigger-line floating-quick-menu__trigger-line--middle" />
        <span className="floating-quick-menu__trigger-line floating-quick-menu__trigger-line--bottom" />
      </button>
    </div>
  )
}
