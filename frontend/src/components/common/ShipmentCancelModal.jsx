import { useMemo } from 'react'

const cancelReasonOptions = [
  { value: 'SIMPLE_CHANGE_OF_MIND', label: '단순 변심' },
  { value: 'SCHEDULE_CHANGE', label: '일정 변경' },
  { value: 'OTHER_PARTY_NO_SHOW', label: '상대방 연락 두절' },
  { value: 'OTHER_PARTY_CHANGED_CONDITIONS', label: '상대방 조건 변경' },
  { value: 'VEHICLE_OR_CARGO_ISSUE', label: '차량/화물 문제 발생' },
  { value: 'OTHER', label: '기타' },
]

function getPenaltyLabel(score) {
  if (score >= 6) return '운송 시작 이후 취소로 6점이 반영됩니다.'
  if (score >= 4) return '운송 1시간 이내 취소로 4점이 반영됩니다.'
  if (score >= 3) return '운송 3시간 이내 취소로 3점이 반영됩니다.'
  if (score >= 2) return '운송 24시간 이내 취소로 2점이 반영됩니다.'
  return '운송 48시간 이내 취소로 1점이 반영됩니다.'
}

export default function ShipmentCancelModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  selected,
  isSubmitting,
}) {
  const predictedPenalty = useMemo(() => {
    if (!selected?.scheduledStartAt) return 1
    const now = new Date()
    const target = new Date(selected.scheduledStartAt)
    const diffMinutes = Math.floor((target.getTime() - now.getTime()) / 60000)

    if (selected.status === 'IN_TRANSIT' || diffMinutes <= 0) return 6
    if (diffMinutes <= 60) return 4
    if (diffMinutes <= 180) return 3
    if (diffMinutes <= 24 * 60) return 2
    return 1
  }, [selected])

  if (!open || !selected) return null

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="profile-modal__head">
          <div>
            <div className="profile-modal__role">거래 취소</div>
            <h3>{selected.title}</h3>
            <p>{getPenaltyLabel(predictedPenalty)}</p>
          </div>
        </div>

        <div className="form-stack">
          <div className="surface-sub">
            <strong>취소 사유</strong>
            <select
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            >
              <option value="">취소 사유를 선택하세요</option>
              {cancelReasonOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="surface-sub">
            <strong>상세 설명</strong>
            {form.reason === 'OTHER' && (
              <p className="section-desc">기타 사유를 구체적으로 입력해 주세요. 상세 설명은 필수입니다.</p>
            )}
            <textarea
              rows="5"
              value={form.detail}
              placeholder={
                form.reason === 'OTHER'
                  ? '기타 사유를 구체적으로 입력해 주세요.'
                  : '취소가 필요한 상황을 자세히 입력해 주세요.'
              }
              onChange={(e) => setForm((prev) => ({ ...prev, detail: e.target.value }))}
            />
          </div>

          <div className="surface-sub">
            <strong>예상 불이익 안내</strong>
            <div className="list-stack">
              <small>현재 예상 패널티 점수: {predictedPenalty}점</small>
              <small>누적 점수에 따라 매칭 제한, 거래 금지, 평점 강등, 취소율 높음 뱃지가 반영될 수 있습니다.</small>
              {(form.reason === 'OTHER_PARTY_NO_SHOW' || form.reason === 'OTHER_PARTY_CHANGED_CONDITIONS') && (
                <small>상대방 귀책 사유는 분쟁성 취소로 접수되어 운영 검토 대상으로 남습니다.</small>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? '취소 처리 중...' : '거래 취소 확정'}
          </button>
        </div>
      </div>
    </div>
  )
}
