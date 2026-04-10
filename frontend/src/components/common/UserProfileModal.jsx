import { formatRatingSummary, resolveMediaUrl, roleText } from '../../utils/formatters'

export default function UserProfileModal({ profile, isLoggedIn, onClose, onOpenChat }) {
  if (!profile) return null

  const getProfileImage = () => {
    return resolveMediaUrl(profile.profileImageUrl) || '/images/default-profile.png'
  }

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="profile-modal__head">
          <img
            src={getProfileImage()}
            alt={profile.name}
            className="profile-modal__avatar"
            onError={(e) => {
              e.currentTarget.src = '/images/default-profile.png'
            }}
          />
          <div>
            <div className="profile-modal__role">{roleText(profile.role)}</div>
            <h3>{profile.name}</h3>
            <p>{formatRatingSummary(profile.averageRating, profile.ratingCount)} · 완료 {profile.completedCount || 0}건</p>
          </div>
        </div>

        <div className="profile-modal__grid">
          <div>
            <span>회사명</span>
            <strong>{profile.companyName || '-'}</strong>
          </div>
          <div>
            <span>차량 정보</span>
            <strong>{profile.vehicleType || '-'}</strong>
          </div>
          <div>
            <span>연락 이메일</span>
            <strong>{profile.contactEmail || '-'}</strong>
          </div>
          <div>
            <span>연락처</span>
            <strong>{profile.contactPhone || '-'}</strong>
          </div>
        </div>

        <div className="profile-modal__bio">
          <span>소개</span>
          <p>{profile.bio || '등록된 소개가 없습니다.'}</p>
        </div>

        <div className="profile-modal__actions">
          {isLoggedIn ? (
            <button className="btn btn-primary" onClick={() => onOpenChat(profile)}>
              1대1 채팅
            </button>
          ) : (
            <small>1대1 채팅은 로그인 후 사용할 수 있습니다.</small>
          )}
        </div>
      </div>
    </div>
  )
}