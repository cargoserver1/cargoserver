import { formatCurrency, formatDate, statusText } from '../../../utils/formatters'

export default function PublicBoardSection({ controller }) {
  const {
    publicStatusFilter,
    setPublicStatusFilter,
    publicBoard,
    publicSelectedId,
    setPublicSelectedId,
    selectedPublic,
  } = controller

  return (
    <section className="landing-board" id="board">
      <div className="landing-board__inner">
        <div className="landing-sectionHead" data-reveal>
          <span>LIVE BOARD</span>
          <h2>실시간 배차 현황을 한눈에 볼 수 있는 공개 보드</h2>
          <p>로그인 전에도 현재 운영 흐름을 이해할 수 있도록, 배차 상태와 핵심 지표를 투명하게 제공합니다.</p>
        </div>

        <div className="landing-filterRow" data-reveal>
          {['ALL', 'BIDDING', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED'].map((status) => (
            <button
              key={status}
              className={publicStatusFilter === status ? 'landing-filterChip active' : 'landing-filterChip'}
              onClick={() => setPublicStatusFilter(status)}
            >
              {status === 'ALL' ? '전체' : statusText(status)}
            </button>
          ))}
        </div>

        <div className="landing-boardGrid">
          <div className="landing-boardTableWrap" data-reveal>
            <table className="board-table landing-boardTable">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>배차명</th>
                  <th>출발지</th>
                  <th>도착지</th>
                  <th>현재 위치</th>
                  <th>입찰 / 최저가</th>
                  <th>예상 시간</th>
                </tr>
              </thead>
              <tbody>
                {publicBoard.map((item) => (
                  <tr key={item.id} className={publicSelectedId === item.id ? 'is-selected' : ''} onClick={() => setPublicSelectedId(item.id)}>
                    <td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td>
                    <td><strong>{item.title}</strong><small>{item.cargoType} · {item.weightKg || 0}kg</small></td>
                    <td>{item.originSummary}</td>
                    <td>{item.destinationSummary}</td>
                    <td>{item.currentLocationSummary}</td>
                    <td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td>
                    <td>{item.estimatedMinutes}분</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="landing-boardAside" data-reveal>
            {selectedPublic ? (
              <>
                <div className="landing-boardAside__head">
                  <span className="landing-miniEyebrow">LIVE SNAPSHOT</span>
                  <h3>{selectedPublic.title}</h3>
                  <span className={`badge badge-${selectedPublic.status.toLowerCase()}`}>{statusText(selectedPublic.status)}</span>
                </div>

                <div className="landing-boardAside__stats">
                  <div><span>출발지</span><strong>{selectedPublic.originSummary}</strong></div>
                  <div><span>도착지</span><strong>{selectedPublic.destinationSummary}</strong></div>
                  <div><span>현재 위치</span><strong>{selectedPublic.currentLocationSummary}</strong></div>
                  <div><span>최저 제안가</span><strong>{formatCurrency(selectedPublic.bestOfferPrice)}</strong></div>
                </div>

                <div className="landing-boardAside__list">
                  <div><span>예상 거리 / 시간</span><strong>{selectedPublic.estimatedDistanceKm}km · {selectedPublic.estimatedMinutes}분</strong></div>
                  <div><span>배정 차주</span><strong>{selectedPublic.assignedDriverName || '미확정'}</strong></div>
                  <div><span>최근 갱신</span><strong>{formatDate(selectedPublic.updatedAt)}</strong></div>
                </div>
              </>
            ) : (
              <div className="empty-box">표시할 배차가 없습니다.</div>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
