import SectionTitle from '../../../components/common/SectionTitle'
import { formatDate } from '../../../utils/formatters'

function renderPenaltyStatus(profile) {
  if (!profile) return '정보 불러오는 중'
  if (profile.tradingBlockedUntil) return '거래 금지 적용 중'
  if (profile.matchingBlockedUntil) return '매칭 제한 적용 중'
  if (profile.highCancelBadge) return '취소율 높음 주의 상태'
  return '정상'
}

function resolvePenaltyStage(score) {
  const value = Number(score || 0)
  if (value >= 20) return '관리자 검토 단계'
  if (value >= 15) return '중징계 단계'
  if (value >= 10) return '거래 금지 단계'
  if (value >= 8) return '고위험 단계'
  if (value >= 5) return '주의 단계'
  if (value >= 3) return '경고 단계'
  return '안정 단계'
}

const PENALTY_RULES = [
  ['48시간 이전 취소', '1점'],
  ['24시간 이전 취소', '2점'],
  ['3시간 이내 취소', '3점'],
  ['1시간 이내 취소', '4점'],
  ['운송 시작 이후 취소', '6점'],
]

const PENALTY_ACTIONS = [
  ['3점 이상', '2시간 매칭 제한'],
  ['5점 이상', '24시간 매칭 제한'],
  ['8점 이상', '72시간 매칭 제한 + 취소율 높음 뱃지 가능'],
  ['10점 이상', '3일 거래 금지'],
  ['15점 이상', '7일 거래 금지 + 평점 강등'],
  ['20점 이상', '14일 거래 금지 + 관리자 검토'],
]

export default function UserPenaltyTab({ controller }) {
  const { profile } = controller

  const penaltyScore = Number(profile?.penaltyScore30d || 0)
  const cancelRate = Number(profile?.cancelRate || 0)
  const penaltyStatus = renderPenaltyStatus(profile)
  const penaltyStage = resolvePenaltyStage(penaltyScore)

  return (
    <div className="page-stack">
      <div className="surface">
        <SectionTitle
          title="패널티 현황"
          desc="취소 관련 제재 상태와 누적 점수를 한 화면에서 확인할 수 있습니다."
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
            <span>현재 단계</span>
            <strong>{penaltyStage}</strong>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="surface">
          <SectionTitle
            title="현재 제재 적용 내역"
            desc="현재 계정에 걸려 있는 제한과 표시 상태입니다."
          />

          <div className="list-stack">
            <div className="bookmark-item" as="div">
              <strong>매칭 제한 종료 시각</strong>
              <small>{formatDate(profile?.matchingBlockedUntil)}</small>
            </div>
            <div className="bookmark-item" as="div">
              <strong>거래 금지 종료 시각</strong>
              <small>{formatDate(profile?.tradingBlockedUntil)}</small>
            </div>
            <div className="bookmark-item" as="div">
              <strong>취소율 높음 뱃지</strong>
              <small>{profile?.highCancelBadge ? '표시 중' : '없음'}</small>
            </div>
            <div className="bookmark-item" as="div">
              <strong>안내</strong>
              <small>취소 직전 모달에서도 이번 취소로 추가될 예상 점수를 다시 확인할 수 있습니다.</small>
            </div>
          </div>
        </div>

        <div className="surface">
          <SectionTitle
            title="취소 점수 기준"
            desc="취소 시점에 따라 누적되는 점수 기준입니다."
          />

          <div className="list-stack">
            {PENALTY_RULES.map(([title, score]) => (
              <div key={title} className="bookmark-item" as="div">
                <strong>{title}</strong>
                <small>{score}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface">
        <SectionTitle
          title="누적 점수별 조치"
          desc="점수가 쌓이면 아래 단계에 따라 제한이 강화됩니다."
        />

        <div className="list-stack">
          {PENALTY_ACTIONS.map(([title, desc]) => (
            <div key={title} className="bookmark-item" as="div">
              <strong>{title}</strong>
              <small>{desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
