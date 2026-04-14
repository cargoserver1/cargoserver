import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDate, resolveMediaUrl } from '../../utils/formatters'

const CHAT_MODAL_POSITION_KEY = 'chatWindowPosition'
const CHAT_MODAL_MARGIN = 24

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getDefaultPosition() {
  if (typeof window === 'undefined') {
    return { left: CHAT_MODAL_MARGIN, top: CHAT_MODAL_MARGIN }
  }

  const modalWidth = Math.min(560, Math.max(window.innerWidth - 32, 320))
  const estimatedHeight = Math.min(760, Math.max(window.innerHeight - 48, 420))

  return {
    left: Math.max(CHAT_MODAL_MARGIN, window.innerWidth - modalWidth - CHAT_MODAL_MARGIN),
    top: Math.max(CHAT_MODAL_MARGIN, window.innerHeight - estimatedHeight - CHAT_MODAL_MARGIN),
  }
}

function readSavedPosition() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CHAT_MODAL_POSITION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (typeof parsed?.left !== 'number' || typeof parsed?.top !== 'number') {
      return null
    }

    return parsed
  } catch (error) {
    return null
  }
}

function keepPositionInViewport(position, modalRect) {
  if (typeof window === 'undefined') return position

  const width = modalRect?.width || 560
  const height = modalRect?.height || 640
  const maxLeft = Math.max(CHAT_MODAL_MARGIN, window.innerWidth - width - CHAT_MODAL_MARGIN)
  const maxTop = Math.max(CHAT_MODAL_MARGIN, window.innerHeight - height - CHAT_MODAL_MARGIN)

  return {
    left: clamp(position.left, CHAT_MODAL_MARGIN, maxLeft),
    top: clamp(position.top, CHAT_MODAL_MARGIN, maxTop),
  }
}

export default function ChatWindowModal({ room, draft, setDraft, onSend, onClose, isSending, embedded = false }) {
  const modalRef = useRef(null)
  const dragStateRef = useRef(null)
  const [position, setPosition] = useState(() => readSavedPosition() || getDefaultPosition())

  const modalStyle = useMemo(() => {
    if (embedded) return undefined

    return {
      left: `${position.left}px`,
      top: `${position.top}px`,
    }
  }, [embedded, position.left, position.top])

  useEffect(() => {
    if (embedded || !modalRef.current) return

    const next = keepPositionInViewport(position, modalRef.current.getBoundingClientRect())
    if (next.left !== position.left || next.top !== position.top) {
      setPosition(next)
    }
  }, [embedded])

  useEffect(() => {
    if (embedded || typeof window === 'undefined') return undefined

    const handleResize = () => {
      if (!modalRef.current) return

      const next = keepPositionInViewport(position, modalRef.current.getBoundingClientRect())
      setPosition((prev) => (
        prev.left === next.left && prev.top === next.top ? prev : next
      ))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [embedded, position])

  useEffect(() => {
    if (embedded || typeof window === 'undefined') return
    window.localStorage.setItem(CHAT_MODAL_POSITION_KEY, JSON.stringify(position))
  }, [embedded, position])

  useEffect(() => {
    return () => {
      dragStateRef.current = null
    }
  }, [])

  if (!room) return null

  const handleDragStart = (event) => {
    if (embedded || !modalRef.current) return
    if (event.button !== 0) return
    if (event.target.closest('button, textarea, input')) return

    event.preventDefault()

    const modalRect = modalRef.current.getBoundingClientRect()
    dragStateRef.current = {
      offsetX: event.clientX - modalRect.left,
      offsetY: event.clientY - modalRect.top,
    }

    const handleDragMove = (moveEvent) => {
      if (!dragStateRef.current || !modalRef.current) return

      const rect = modalRef.current.getBoundingClientRect()
      const next = keepPositionInViewport(
        {
          left: moveEvent.clientX - dragStateRef.current.offsetX,
          top: moveEvent.clientY - dragStateRef.current.offsetY,
        },
        rect,
      )

      setPosition(next)
    }

    const handleDragEnd = () => {
      dragStateRef.current = null
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
    }

    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
  }

  const body = (
    <div
      ref={modalRef}
      className={embedded ? 'chat-modal chat-modal--embedded' : 'chat-modal chat-modal--floating'}
      style={modalStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={embedded ? 'chat-modal__head' : 'chat-modal__head chat-modal__head--draggable'}
        onMouseDown={handleDragStart}
      >
        <div className="chat-modal__peer">
          {room.targetProfile?.profileImageUrl ? (
            <img src={resolveMediaUrl(room.targetProfile.profileImageUrl)} alt={room.targetProfile.name} className="chat-modal__avatar" />
          ) : (
            <div className="chat-modal__avatar chat-modal__avatar--fallback">{(room.targetProfile?.name || '?').slice(0, 1)}</div>
          )}
          <div>
            <strong>{room.targetProfile?.name}</strong>
            <small>1대1 채팅</small>
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="chat-modal__messages">
        {room.messages?.length ? room.messages.map((message) => (
          <div key={message.id} className={message.mine ? 'chat-bubble chat-bubble--mine' : 'chat-bubble'}>
            {!message.mine && (
              <div className="chat-bubble__sender">{message.senderName}</div>
            )}
            <p>{message.content}</p>
            <span>{formatDate(message.createdAt)}</span>
          </div>
        )) : (
          <div className="empty-box small">아직 대화가 없습니다. 먼저 메시지를 보내 보세요.</div>
        )}
      </div>

      <div className="chat-modal__composer">
        <textarea
          rows="3"
          placeholder="메시지를 입력하세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
        />
        <button className="btn btn-primary" onClick={onSend} disabled={isSending}>전송</button>
      </div>
    </div>
  )

  if (embedded) return body

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      {body}
    </div>
  )
}
