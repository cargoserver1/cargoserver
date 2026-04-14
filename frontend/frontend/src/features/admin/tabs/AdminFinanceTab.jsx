import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'
import { formatCurrency, formatDate, transactionTypeText } from '../../../utils/formatters'

export default function AdminFinanceTab({ controller }) {
  const { financeSummary, financeTransactions } = controller
  const { pagedItems, page, setPage, totalPages } = useClientPagination(financeTransactions, 10)

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <div className="kpi-card">
          <span>플랫폼 수익</span>
          <strong>{formatCurrency(financeSummary?.totalPlatformRevenue)}</strong>
          <p>수수료율 {financeSummary?.serviceFeeRate ?? 3}% 기준</p>
        </div>

        <div className="kpi-card">
          <span>총 거래 수</span>
          <strong>{financeSummary?.transactionCount ?? 0}건</strong>
        </div>

        <div className="kpi-card">
          <span>완료 화물</span>
          <strong>{financeSummary?.completedShipmentCount ?? 0}건</strong>
        </div>

        <div className="kpi-card">
          <span>총 정산 원금</span>
          <strong>
            {formatCurrency(
              financeTransactions
                .filter((item) => item.type === 'SPEND')
                .reduce((sum, item) => sum + (item.grossAmount || 0), 0),
            )}
          </strong>
        </div>
      </div>

      <div className="surface">
        <SectionTitle title="플랫폼 수익 거래 내역" desc="화주 지출, 차주 정산, 관리자 수수료 수익이 같은 화물 단위로 묶여 기록됩니다." />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>유형</th>
              <th>화물</th>
              <th>거래액</th>
              <th>수수료</th>
              <th>실수익</th>
              <th>일시</th>
            </tr>
          </thead>

          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.id}>
                <td>{transactionTypeText(item.type)}</td>
                <td>
                  {item.shipmentTitle || '-'}
                  <small>#{item.shipmentId || '-'}</small>
                </td>
                <td>{formatCurrency(item.grossAmount)}</td>
                <td>{formatCurrency(item.feeAmount)}</td>
                <td>{formatCurrency(item.netAmount)}</td>
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