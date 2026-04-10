import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import { emptyFaq } from '../../../constants/forms'
import useClientPagination from '../../../hooks/useClientPagination'

export default function AdminFaqsTab({ controller }) {
  const {
    faqForm,
    setFaqForm,
    submitFaq,
    editingFaqId,
    setEditingFaqId,
    adminFaqs,
    deleteAdminFaq,
    loadAdmin,
    loadPublic,
  } = controller

  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminFaqs, 10)

  return (
    <div className="page-stack">
      <div className="surface form-surface">
        <SectionTitle title="FAQ 작성 / 수정" />

        <div className="form-stack">
          <input
            placeholder="카테고리"
            value={faqForm.category}
            onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
          />

          <input
            placeholder="질문"
            value={faqForm.question}
            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
          />

          <textarea
            rows="5"
            placeholder="답변"
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
          />

          <input
            placeholder="정렬 순서"
            value={faqForm.sortOrder}
            onChange={(e) => setFaqForm({ ...faqForm, sortOrder: e.target.value })}
          />

          <div className="table-actions">
            <button className="btn btn-primary" onClick={submitFaq}>
              저장
            </button>

            {editingFaqId && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditingFaqId(null)
                  setFaqForm(emptyFaq)
                }}
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface">
        <SectionTitle title="FAQ 목록" />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>카테고리</th>
              <th>질문</th>
              <th>정렬</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.id}>
                <td>{item.category}</td>
                <td>
                  {item.question}
                  <small>{item.answer}</small>
                </td>
                <td>{item.sortOrder}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-ghost small"
                      onClick={() => {
                        setEditingFaqId(item.id)
                        setFaqForm({
                          category: item.category,
                          question: item.question,
                          answer: item.answer,
                          sortOrder: item.sortOrder,
                        })
                      }}
                    >
                      수정
                    </button>

                    <button
                      className="btn btn-ghost small danger"
                      onClick={async () => {
                        await deleteAdminFaq(item.id)
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