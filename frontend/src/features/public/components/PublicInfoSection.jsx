import { formatDate } from '../../../utils/formatters'

export default function PublicInfoSection({ controller }) {
  const { publicData, inquiryForm, setInquiryForm, handleInquiry } = controller

  return (
    <section className="landing-info" id="notice-faq">
      <div className="landing-info__inner">
        <div className="landing-sectionHead" data-reveal>
          <span>NOTICE & SUPPORT</span>
          <h2>운영 공지, 자주 묻는 질문, 도입 문의까지 한 곳에서 안내합니다.</h2>
          <p>실제 서비스에 사용할 수 있도록 공지와 문의 흐름을 간결하고 읽기 쉬운 형태로 정리했습니다.</p>
        </div>

        <div className="landing-infoGrid">
          {/* <article className="landing-infoPanel" data-reveal>
            <div className="landing-infoPanel__top">
              <span>공지사항</span>
              <strong>운영 안내</strong>
            </div>
            <div className="landing-noticeList">
              {(publicData.notices || []).map((notice) => (
                <div key={notice.id} className="landing-noticeItem">
                  <div className="landing-noticeItem__meta">
                    <em>{notice.category}</em>
                    {notice.pinned && <b>중요</b>}
                  </div>
                  <strong>{notice.title}</strong>
                  <p>{notice.summary}</p>
                  <small>{formatDate(notice.publishedAt)}</small>
                </div>
              ))}
            </div>
          </article> */}

          <article className="landing-infoPanel" data-reveal>
            <div className="landing-infoPanel__top">
              <span>자주 묻는 질문</span>
              <strong>FAQ</strong>
            </div>
            <div className="landing-faqList">
              {(publicData.faqs || []).map((faq) => (
                <details key={faq.id} className="landing-faqItem">
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </article>

          <article className="landing-infoPanel landing-infoPanel--form" data-reveal>
            <div className="landing-infoPanel__top">
              <span>도입 문의</span>
              <strong>상담 요청</strong>
            </div>
            <div className="landing-formStack">
              <input placeholder="회사명" value={inquiryForm.companyName} onChange={(e) => setInquiryForm({ ...inquiryForm, companyName: e.target.value })} />
              <div className="landing-split2">
                <input placeholder="담당자명" value={inquiryForm.contactName} onChange={(e) => setInquiryForm({ ...inquiryForm, contactName: e.target.value })} />
                <input placeholder="연락처" value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} />
              </div>
              <input placeholder="이메일" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} />
              <select value={inquiryForm.inquiryType} onChange={(e) => setInquiryForm({ ...inquiryForm, inquiryType: e.target.value })}>
                <option>도입 문의</option>
                <option>데모 요청</option>
                <option>요금 상담</option>
                <option>기술 협의</option>
              </select>
              <textarea rows="6" placeholder="도입 목적, 필요한 기능, 운영 방식 등을 남겨주세요." value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} />
              <button className="landing-btn landing-btn--primary landing-btn--full" onClick={handleInquiry}>문의 접수</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
