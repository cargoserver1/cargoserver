import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'

export default function AdminIssuesTab({ controller }) {
  const { adminReports, adminDisputes, handleResolveDispute } = controller

  const reportsPaging = useClientPagination(adminReports, 6)
  const disputesPaging = useClientPagination(adminDisputes, 6)

  return (
    <div className="admin-grid-2">
      <div className="page-stack">
        <div className="surface">
          <SectionTitle title="신고 목록" />

          <table className="board-table compact">
            <thead>
              <tr>
                <th>신고자</th>
                <th>대상</th>
                <th>사유</th>
                <th>상태</th>
              </tr>
            </thead>

            <tbody>
              {reportsPaging.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.reporterName}</td>
                  <td>{item.targetName || '-'}</td>
                  <td>
                    {item.reason}
                    <small>{item.description}</small>
                  </td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={reportsPaging.page}
          totalPages={reportsPaging.totalPages}
          onPageChange={reportsPaging.setPage}
        />
      </div>

      <div className="page-stack">
        <div className="surface">
          <SectionTitle title="분쟁 처리" />

          <div className="list-stack">
            {disputesPaging.pagedItems.map((item) => (
              <div className="issue-card" key={item.id}>
                <div className="detail-head">
                  <strong>{item.shipmentTitle}</strong>
                  <span className="badge badge-neutral">{item.status}</span>
                </div>

                <small>
                  {item.shipperName} ↔ {item.driverName}
                </small>

                <p>
                  {item.reason} · {item.detail}
                </p>

                <div className="table-actions">
                  <button className="btn btn-ghost small" onClick={() => handleResolveDispute(item.id, 'REVIEWING')}>
                    검토중
                  </button>
                  <button className="btn btn-primary small" onClick={() => handleResolveDispute(item.id, 'RESOLVED')}>
                    해결
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Pagination
          page={disputesPaging.page}
          totalPages={disputesPaging.totalPages}
          onPageChange={disputesPaging.setPage}
        />
      </div>
    </div>
  )
}