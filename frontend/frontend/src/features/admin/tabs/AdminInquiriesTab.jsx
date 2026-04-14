import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'
import { inquiryStatusText } from '../../../utils/formatters'

export default function AdminInquiriesTab({ controller }) {
  const { adminInquiries, inquiryAnswerDraft, setInquiryAnswerDraft, handleAnswerInquiry } = controller
  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminInquiries, 10)

  return (
    <div className="page-stack">
      <div className="surface">
        <SectionTitle title="문의 관리" desc="도입 문의를 읽고 바로 답변 상태를 관리할 수 있습니다." />

        <div className="inquiry-grid">
          {pagedItems.map((item) => (
            <div className="inquiry-card" key={item.id}>
              <div className="detail-head">
                <div>
                  <strong>{item.companyName}</strong>
                  <small>
                    {item.contactName} · {item.email}
                  </small>
                </div>

                <span className="badge badge-neutral">{inquiryStatusText(item.status)}</span>
              </div>

              <p className="inquiry-message">{item.message}</p>

              <textarea
                rows="4"
                placeholder="답변 내용을 입력하세요."
                value={inquiryAnswerDraft[item.id] ?? item.answerContent ?? ''}
                onChange={(e) =>
                  setInquiryAnswerDraft({
                    ...inquiryAnswerDraft,
                    [item.id]: e.target.value,
                  })
                }
              />

              <button className="btn btn-primary small" onClick={() => handleAnswerInquiry(item.id)}>
                답변 저장
              </button>
            </div>
          ))}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}