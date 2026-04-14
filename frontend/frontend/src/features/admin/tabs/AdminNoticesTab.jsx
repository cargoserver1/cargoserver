import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import { emptyNotice } from '../../../constants/forms'
import useClientPagination from '../../../hooks/useClientPagination'

export default function AdminNoticesTab({ controller }) {
  const {
    noticeForm,
    setNoticeForm,
    submitNotice,
    editingNoticeId,
    setEditingNoticeId,
    adminNotices,
    deleteAdminNotice,
    loadAdmin,
    loadPublic,
  } = controller

  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminNotices, 10)

  return (
    <div className="page-stack">
      <div className="surface form-surface">
        <SectionTitle title="공지 작성 / 수정" />

        <div className="form-stack">
          <input
            placeholder="카테고리"
            value={noticeForm.category}
            onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
          />

          <input
            placeholder="제목"
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
          />

          <textarea
            rows="4"
            placeholder="요약"
            value={noticeForm.summary}
            onChange={(e) => setNoticeForm({ ...noticeForm, summary: e.target.value })}
          />

          <label className="check-inline">
            <input
              type="checkbox"
              checked={noticeForm.pinned}
              onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
            />
            중요 공지
          </label>

          <div className="table-actions">
            <button className="btn btn-primary" onClick={submitNotice}>
              저장
            </button>

            {editingNoticeId && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditingNoticeId(null)
                  setNoticeForm(emptyNotice)
                }}
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface">
        <SectionTitle title="공지 목록" />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>카테고리</th>
              <th>제목</th>
              <th>중요</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.id}>
                <td>{item.category}</td>
                <td>
                  {item.title}
                  <small>{item.summary}</small>
                </td>
                <td>{item.pinned ? '예' : '아니오'}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-ghost small"
                      onClick={() => {
                        setEditingNoticeId(item.id)
                        setNoticeForm({
                          category: item.category,
                          title: item.title,
                          summary: item.summary,
                          pinned: item.pinned,
                        })
                      }}
                    >
                      수정
                    </button>

                    <button
                      className="btn btn-ghost small danger"
                      onClick={async () => {
                        await deleteAdminNotice(item.id)
                        await Promise.all([loadAdmin(), loadPublic()])
                      }}
                    >
                      삭제
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