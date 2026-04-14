import ProfilePreviewCard from '../../../components/common/ProfilePreviewCard'
import SectionTitle from '../../../components/common/SectionTitle'
import VehicleTypeSelector from '../../../components/common/VehicleTypeSelector'
import { formatCurrency, resolveMediaUrl, statusText } from '../../../utils/formatters'
import { useRef } from 'react'
import { parseVehicleTypeString, stringifyVehicleTypes } from '../../../constants/vehicleCatalog'

function renderPenaltyStatus(profile) {
  if (!profile) return '정보 불러오는 중'
  if (profile.tradingBlockedUntil) return '거래 금지 적용 중'
  if (profile.matchingBlockedUntil) return '매칭 제한 적용 중'
  if (profile.highCancelBadge) return '취소율 높음 주의 상태'
  return '정상'
}

export default function UserOverviewTab({ controller }) {
  const {
    auth,
    profile,
    profileForm,
    setProfileForm,
    signupForm,
    handleSaveProfile,
    handleProfileImageFileChange,
    clearProfileImage,
    profileSaving,
    profileImageUploading,
    profileImageUploadError,
    selectedProfileImageName,
    profileSaveSuccessOpen,
    setProfileSaveSuccessOpen,
    roleTheme,
    summary,
    userAlerts,
    roleQuickActions,
    filteredShipments,
    bookmarks,
    setSelectedId,
    setDashboardTab,
  } = controller

  const profileImageInputRef = useRef(null)

  const penaltyScore = Number(profile?.penaltyScore30d || 0)
  const cancelRate = Number(profile?.cancelRate || 0)
  const penaltyStatus = renderPenaltyStatus(profile)
  const selectedVehicles = parseVehicleTypeString(profileForm.vehicleType)

  return (
    <div className="page-stack">
      {!auth.profileCompleted && (
        <div className="alert-info">
          첫 로그인입니다. 아래 선택 입력 정보를 저장하면 다음 로그인부터는 바로 메인 페이지로 이동합니다.
        </div>
      )}

      <div className="admin-grid-2">
        <div className="surface profile-edit-surface">
          {profileSaving && (
            <div className="profile-save-panelOverlay" role="status" aria-live="polite">
              <div className="transport-loadingCard profile-save-panelOverlay__card">
                <div className="transport-loadingBadge">PROFILE SAVE</div>
                <div className="transport-loadingVisual" aria-hidden="true">
                  <span className="transport-loadingDot transport-loadingDot--left" />
                  <span className="transport-loadingTrack">
                    <span className="transport-loadingTruck">🚚</span>
                  </span>
                  <span className="transport-loadingDot transport-loadingDot--right" />
                </div>
                <strong>회원정보를 저장하고 있어요</strong>
                <p>입력한 프로필 정보와 보유 차량 정보를 반영하는 중입니다.</p>
              </div>
            </div>
          )}

          {profileSaveSuccessOpen && (
            <div className="profile-save-panelOverlay profile-save-panelOverlay--success">
              <div className="transport-loadingCard profile-save-panelOverlay__card profile-save-panelOverlay__card--success">
                <div className="transport-loadingBadge">PROFILE SAVE</div>
                <strong>저장되었습니다.</strong>
                <p>회원정보가 정상적으로 저장되었습니다.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setProfileSaveSuccessOpen(false)}
                >
                  확인
                </button>
              </div>
            </div>
          )}
          <SectionTitle
            title="회원정보 수정"
            desc="현재 회원가입 필수 정보는 유지하고, 아래 정보는 선택으로 추가할 수 있습니다."
          />

          <div className="form-stack">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  {profileForm.profileImageUrl ? (
                    <img
                      src={resolveMediaUrl(profileForm.profileImageUrl)}
                      alt="프로필 사진"
                      style={{
                        width: 96,
                        height: 96,
                        minWidth: 96,
                        minHeight: 96,
                        maxWidth: 96,
                        maxHeight: 96,
                        borderRadius: 14,
                        objectFit: 'cover',
                        display: 'block',
                        border: '1px solid var(--line)',
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                        background: '#fff',
                      }}
                    />
                  ) : (
                    <div
                      className="identity-mark"
                      style={{
                        width: 96,
                        height: 96,
                        minWidth: 96,
                        minHeight: 96,
                        maxWidth: 96,
                        maxHeight: 96,
                        borderRadius: 14,
                        border: '1px solid var(--line)',
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                        fontSize: 34,
                      }}
                    >
                      {(auth.name || '?').slice(0, 1)}
                    </div>
                  )}

                  <button
                    type="button"
                    aria-label="프로필 사진 선택"
                    onClick={() => profileImageInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      right: -8,
                      bottom: -8,
                      width: 32,
                      height: 32,
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.96)',
                        boxShadow: '0 6px 14px rgba(15, 23, 42, 0.20)',
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      📷
                    </span>
                  </button>

                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleProfileImageFileChange(file)
                      }
                      e.target.value = ''
                    }}
                  />
                </div>

                {profileImageUploading && (
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>이미지 업로드 중...</div>
                )}
                {!profileImageUploading && profileImageUploadError && (
                  <div style={{ fontSize: 14, color: 'var(--red)', fontWeight: 700, textAlign: 'center' }}>{profileImageUploadError}</div>
                )}

                {!!profileForm.profileImageUrl && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ minWidth: 190, alignSelf: 'center' }}
                    onClick={clearProfileImage}
                  >
                    기본 프로필로 돌아가기
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows="4"
              placeholder="자기소개"
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            />
            <input
              placeholder="결제 수단 메모"
              value={profileForm.paymentMethod}
              onChange={(e) => setProfileForm({ ...profileForm, paymentMethod: e.target.value })}
            />
            <div className="split-2">
              <input
                placeholder="추가 이메일"
                value={profileForm.contactEmail}
                onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
              />
              <input
                placeholder="추가 연락처"
                value={profileForm.contactPhone}
                onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
              />
            </div>

            {auth.role === 'DRIVER' && (
              <div className="form-stack">
                <div>
                  <strong style={{ display: 'block', marginBottom: 8 }}>보유 차량 선택</strong>
                  <VehicleTypeSelector
                    values={selectedVehicles}
                    onChange={(values) =>
                      setProfileForm({
                        ...profileForm,
                        vehicleType: stringifyVehicleTypes(values),
                      })
                    }
                    inputClassName="login-input"
                    placeholder="보유 차량을 검색하거나 아래 목록에서 선택해 주세요"
                  />
                  <small style={{ display: 'block', marginTop: 8, color: '#6f7b91' }}>
                    여러 차량을 동시에 선택할 수 있습니다.
                  </small>
                </div>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSaveProfile}>
              회원정보 저장
            </button>
          </div>
        </div>

        <div className="surface profile-edit-surface">
          <SectionTitle title="내 공개 프로필 미리보기" desc="거래 상대가 거래 전에 볼 수 있는 정보입니다." />
          <ProfilePreviewCard
            title="내 프로필"
            profile={
              profile
                ? { ...profile, role: auth.role }
                : {
                    ...profileForm,
                    name: auth.name,
                    role: auth.role,
                    companyName: signupForm.companyName,
                    vehicleType: profileForm.vehicleType || signupForm.vehicleType,
                    averageRating: profile?.averageRating,
                    ratingCount: profile?.ratingCount,
                    completedCount: profile?.completedCount,
                  }
            }
          />
        </div>
      </div>

      <div className="surface">
        <SectionTitle
          title="패널티 요약"
          desc="패널티 상세 정보는 별도 탭에서 보고, 마이페이지에는 현재 상태만 간단히 표시합니다."
        />

        <div className="kpi-grid">
          <div className="kpi-card">
            <span>현재 상태</span>
            <strong>{penaltyStatus}</strong>
          </div>
          <div className="kpi-card">
            <span>최근 30일 패널티 점수</span>
            <strong>{penaltyScore}점</strong>
          </div>
          <div className="kpi-card">
            <span>최근 취소율</span>
            <strong>{cancelRate.toFixed(1)}%</strong>
          </div>
          <div className="kpi-card">
            <span>취소율 높음 뱃지</span>
            <strong>{profile?.highCancelBadge ? '표시 중' : '없음'}</strong>
          </div>
        </div>

        <div className="admin-grid-2" style={{ marginTop: 16 }}>
          <div className="surface-sub">
            <span>상세 확인</span>
            <button className="btn btn-secondary" onClick={() => setDashboardTab('penalty')}>
              패널티 탭 보기
            </button>
          </div>
        </div>
      </div>

      <section className={`role-banner role-banner-${roleTheme?.accent || 'shipper'}`}>
        <div>
          <div className="eyebrow">ROLE FOCUSED THEME</div>
          <h2>{roleTheme?.label}</h2>
          <p>{roleTheme?.summary}</p>
        </div>
        <div className="role-banner-notes">
          {(roleTheme?.bullets || []).map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi-card"><span>전체 배차</span><strong>{summary.total}</strong></div>
        <div className="kpi-card"><span>입찰중</span><strong>{summary.bidding}</strong></div>
        <div className="kpi-card"><span>운행중</span><strong>{summary.live}</strong></div>
        <div className="kpi-card"><span>완료</span><strong>{summary.completed}</strong></div>
      </div>

      <div className="admin-grid-2">
        <div className="surface profile-edit-surface">
          <SectionTitle title="운영 알림" desc="역할에 따라 먼저 봐야 할 항목을 자동으로 묶었습니다." />
          <div className="signal-grid">
            {userAlerts.map((item) => (
              <div key={item.title} className="signal-card">
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface profile-edit-surface">
          <SectionTitle title="빠른 액션" desc="자주 쓰는 흐름으로 바로 이동합니다." />
          <div className="shortcut-grid">
            {roleQuickActions.map((item) => (
              <button key={item.title} className="shortcut-card" onClick={item.action}>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
                <span>{item.cta}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="surface profile-edit-surface">
          <SectionTitle title="최근 배차" />
          <table className="board-table compact">
            <thead>
              <tr>
                <th>상태</th>
                <th>제목</th>
                <th>구간</th>
                <th>입찰</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.slice(0, 8).map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (item.canAccessDetail !== false) {
                      setSelectedId(item.id)
                      setDashboardTab('board')
                    }
                  }}
                >
                  <td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td>
                  <td>
                    {item.title}
                    {auth.role === 'DRIVER' && (
                      <small>{item.assignedToMe ? '내 배차' : item.hasMyOffer ? '내 입찰' : '공개 배차'}</small>
                    )}
                  </td>
                  <td>{item.originAddress} → {item.destinationAddress}</td>
                  <td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="surface profile-edit-surface">
          <SectionTitle title="즐겨찾기" />
          <div className="list-stack">
            {bookmarks.length ? (
              bookmarks.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  className="bookmark-item"
                  onClick={() => {
                    setSelectedId(item.id)
                    setDashboardTab('board')
                  }}
                >
                  <strong>{item.title}</strong>
                  <small>{item.originAddress} → {item.destinationAddress}</small>
                  <span>{statusText(item.status)}</span>
                </button>
              ))
            ) : (
              <div className="empty-box small">즐겨찾기한 배차가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
