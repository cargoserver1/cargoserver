import { formatRatingSummary, resolveMediaUrl, roleText } from '../../utils/formatters'

export default function ProfilePreviewCard({ title, profile }) {
  if (!profile) return null

  return (
    <div className="surface-sub">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {profile.profileImageUrl ? (
          <img src={resolveMediaUrl(profile.profileImageUrl)} alt={title} className="image-preview-thumb" style={{ width: 64, height: 64, objectFit: 'cover' }} />
        ) : (
          <div className="identity-mark" style={{ width: 56, height: 56 }}>{(profile.name || '?').slice(0, 1)}</div>
        )}
        <div style={{ flex: 1 }}>
          <strong>{title}</strong>
          <div className="section-desc" style={{ marginTop: 4 }}>{profile.name} · {roleText(profile.role)}</div>
          <div className="section-desc" style={{ marginTop: 4 }}>평점 {formatRatingSummary(profile.averageRating, profile.ratingCount)} · 완료 거래 {profile.completedCount || 0}건</div>
          {profile.companyName && <div className="section-desc" style={{ marginTop: 4 }}>회사명: {profile.companyName}</div>}
          {profile.vehicleType && <div className="section-desc" style={{ marginTop: 4 }}>차량 정보: {profile.vehicleType}</div>}
          {profile.bio && <p className="section-desc" style={{ marginTop: 6 }}>{profile.bio}</p>}
          {(profile.contactEmail || profile.contactPhone) && <div className="section-desc" style={{ marginTop: 6 }}>{profile.contactEmail || ''}{profile.contactEmail && profile.contactPhone ? ' · ' : ''}{profile.contactPhone || ''}</div>}
        </div>
      </div>
    </div>
  )
}
