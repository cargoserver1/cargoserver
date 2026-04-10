export const roleText = (role) => ({ SHIPPER: '화주', DRIVER: '차주', ADMIN: '관리자' }[role] || role)
export const statusText = (status) => ({ REQUESTED: '요청', BIDDING: '입찰중', CONFIRMED: '확정', IN_TRANSIT: '운반중', COMPLETED: '완료', CANCELLED: '취소', DISPUTED: '분쟁' }[status] || status)
export const memberStatusText = (status) => ({ ACTIVE: '정상', PENDING: '대기', SUSPENDED: '정지', DELETED: '삭제' }[status] || status)
export const inquiryStatusText = (status) => ({ RECEIVED: '접수', ANSWERED: '답변완료', CLOSED: '종결' }[status] || status)
export const formatCurrency = (value) => value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}원`
const toSafeDate = (value) => {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const raw = String(value).trim()
  if (!raw) return null

  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const fallback = new Date(normalized)
  if (!Number.isNaN(fallback.getTime())) return fallback

  const compact = normalized.replace(/\.(\d{3})\d+/, '.$1')
  const compactDate = new Date(compact)
  return Number.isNaN(compactDate.getTime()) ? null : compactDate
}

export const formatDate = (value, options = {}) => {
  const parsed = toSafeDate(value)
  if (!parsed) return '-'

  const hasTime = !(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()))
  const defaultOptions = hasTime
    ? {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    : {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }

  return parsed.toLocaleString('ko-KR', { ...defaultOptions, ...options })
}
export const transactionTypeText = (type) => ({ SPEND: '지출', EARN: '수익', FEE: '수수료' }[type] || type)
export const renderStars = (score = 0) => '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score))
export const formatRatingSummary = (avg, count) => count ? `${Number(avg || 0).toFixed(1)}점 (${count}명)` : '평점 없음'

export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({ dataUrl: reader.result, name: file.name })
  reader.onerror = reject
  reader.readAsDataURL(file)
})


const MEDIA_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const resolveMediaUrl = (value) => {
  const raw = (value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw
  if (raw.startsWith('/uploads/')) return `${MEDIA_BASE_URL}${raw}`
  return raw
}
