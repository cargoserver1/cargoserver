import SectionTitle from '../../../components/common/SectionTitle'

export default function UserRegisterDriverTab() {
  return (
    <div className="surface"><SectionTitle title="입찰 운영 가이드" desc="차주 기준 업무 흐름을 요약했습니다." /><div className="list-stack"><div className="list-row block"><strong>1. 입찰중 배차 선택</strong><span>구간, 화물 종류, 예상 시간 확인 후 제안을 등록합니다.</span></div><div className="list-row block"><strong>2. 화주 확정 이후 운반 시작</strong><span>확정된 건만 운반 시작 버튼이 열립니다.</span></div><div className="list-row block"><strong>3. 자동 주행 트래킹</strong><span>운반 시작과 동시에 귀여운 트럭 아이콘이 예상 시간에 맞춰 출발지에서 도착지까지 자동 이동합니다.</span></div></div></div>
  )
}
