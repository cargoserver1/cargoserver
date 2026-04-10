import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'
import { formatDate, renderStars } from '../../../utils/formatters'

export default function AdminRatingsTab({ controller }) {
  const { adminRecentRatings } = controller
  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminRecentRatings, 10)

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <div className="kpi-card">
          <span>최근 평점 수</span>
          <strong>{adminRecentRatings.length}건</strong>
          <p>최근 20개 평가를 확인합니다.</p>
        </div>

        <div className="kpi-card">
          <span>평균 점수</span>
          <strong>
            {adminRecentRatings.length
              ? (adminRecentRatings.reduce((sum, item) => sum + item.score, 0) / adminRecentRatings.length).toFixed(2)
              : '0.00'}
          </strong>
          <p>전체 최근 등록 기준</p>
        </div>

        <div className="kpi-card">
          <span>5점 비율</span>
          <strong>
            {adminRecentRatings.length
              ? Math.round((adminRecentRatings.filter((item) => item.score === 5).length / adminRecentRatings.length) * 100)
              : 0}
            %
          </strong>
        </div>

        <div className="kpi-card">
          <span>운영 체크</span>
          <strong>{adminRecentRatings.some((item) => item.score <= 2) ? '주의 필요' : '양호'}</strong>
        </div>
      </div>

      <div className="surface">
        <SectionTitle title="최근 등록 평점" desc="화주와 차주가 서로에게 남긴 최신 평가입니다." />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>화물</th>
              <th>평가자</th>
              <th>대상</th>
              <th>점수</th>
              <th>코멘트</th>
              <th>일시</th>
            </tr>
          </thead>

          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.shipmentTitle}
                  <small>#{item.shipmentId}</small>
                </td>
                <td>{item.fromUserName}</td>
                <td>{item.toUserName}</td>
                <td>
                  {renderStars(item.score)} ({item.score})
                </td>
                <td>{item.comment || '-'}</td>
                <td>{formatDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}