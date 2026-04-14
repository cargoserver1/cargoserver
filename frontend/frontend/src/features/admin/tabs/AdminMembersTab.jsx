import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'
import { formatRatingSummary, memberStatusText, roleText } from '../../../utils/formatters'

export default function AdminMembersTab({ controller }) {
  const { adminMembers, handleUpdateMember } = controller
  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminMembers, 10)

  return (
    <div className="page-stack">
      <div className="surface">
        <SectionTitle title="회원 관리" desc="역할 변경과 계정 상태 관리를 한 표에서 처리합니다." />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>회원</th>
              <th>역할</th>
              <th>상태</th>
              <th>평점</th>
              <th>연락처</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {pagedItems.map((member) => (
              <tr key={member.id}>
                <td>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </td>
                <td>{roleText(member.role)}</td>
                <td>{memberStatusText(member.status)}</td>
                <td>{formatRatingSummary(member.averageRating, member.ratingCount)}</td>
                <td>{member.phone || '-'}</td>
                <td>
                  <div className="table-actions">
                    <select value={member.role} onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}>
                      <option value="SHIPPER">화주</option>
                      <option value="DRIVER">차주</option>
                      <option value="ADMIN">관리자</option>
                    </select>

                    <select
                      value={member.status}
                      onChange={(e) => handleUpdateMember(member.id, 'status', e.target.value)}
                    >
                      <option value="ACTIVE">정상</option>
                      <option value="PENDING">대기</option>
                      <option value="SUSPENDED">정지</option>
                      <option value="DELETED">삭제</option>
                    </select>
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