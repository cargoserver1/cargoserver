import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'
import { statusText } from '../../../utils/formatters'

export default function AdminShipmentsTab({ controller }) {
  const { adminShipments, handleForceShipmentStatus } = controller
  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminShipments, 10)

  return (
    <div className="page-stack">
      <div className="surface">
        <SectionTitle title="화물 관리" desc="운영자가 전체 화물을 조회하고 상태를 강제 조정할 수 있습니다." />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>상태</th>
              <th>제목</th>
              <th>화주 / 차주</th>
              <th>구간</th>
              <th>입찰</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span>
                </td>
                <td>{item.title}</td>
                <td>
                  <strong>{item.shipperName}</strong>
                  <small>{item.assignedDriverName || '미배정'}</small>
                </td>
                <td>
                  {item.originAddress} → {item.destinationAddress}
                </td>
                <td>{item.offerCount}건</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-ghost small" onClick={() => handleForceShipmentStatus(item.id, 'CONFIRMED')}>
                      확정
                    </button>
                    <button className="btn btn-ghost small" onClick={() => handleForceShipmentStatus(item.id, 'IN_TRANSIT')}>
                      운반중
                    </button>
                    <button className="btn btn-ghost small" onClick={() => handleForceShipmentStatus(item.id, 'COMPLETED')}>
                      완료
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}