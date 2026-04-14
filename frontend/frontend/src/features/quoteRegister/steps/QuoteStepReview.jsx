import { useEffect, useState } from "react";

export default function QuoteStepReview({ formData = {} }) {
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  useEffect(() => {
    const files = Array.isArray(formData.cargoImages)
      ? formData.cargoImages
      : [];
    const nextUrls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.cargoImages]);

  const formatPrice = (value) => {
    if (!value) return "-";
    return Number(value).toLocaleString("ko-KR");
  };

  const transportDateTime =
    formData.transportDate && formData.transportTime
      ? `${formData.transportDate} ${formData.transportTime}`
      : formData.transportDate || "-";

  const vehicleDisplay = formData.vehicleNeedConsult
    ? "상담 필요로 요청"
    : formData.vehicleType || "-";

  const weightDisplay = formData.weightNeedConsult
    ? "상담 필요로 요청"
    : formData.weight
      ? `${formData.weight}${formData.weightUnit || "kg"}`
      : "-";

  const priceDisplay = formData.desiredPrice
    ? `${formatPrice(formData.desiredPrice)}원`
    : "-";

  const requestNoteDisplay = (formData.requestNote || "").trim() || "없음";

  const estimateTitleDisplay = (formData.estimateName || "").trim() || "-";
  const originAddressDisplay = (formData.originAddress || "").trim() || "-";
  const originDetailDisplay =
    (formData.originDetailAddress || "").trim() || "상세주소 없음";
  const destinationAddressDisplay =
    (formData.destinationAddress || "").trim() || "-";
  const destinationDetailDisplay =
    (formData.destinationDetailAddress || "").trim() || "상세주소 없음";

  const cargoTypeDisplay = (formData.cargoType || "").trim() || "-";
  const cargoNameDisplay = (formData.cargoName || "").trim() || "-";

  const imageCount = Array.isArray(formData.cargoImages)
    ? formData.cargoImages.length
    : 0;

  return (
    <section className="quote-review-layout">
      <div className="quote-review-main">
        <div className="quote-review-header">
          <h2 className="quote-review-title">최종 확인</h2>
          <p className="quote-review-subtitle">
            입력한 견적 정보를 한 번 더 확인해주세요.
          </p>
        </div>

        <div className="quote-review-grid">
          {/* 기본 정보 */}
          <section className="quote-review-card">
            <div className="quote-review-card__header">
              <h3>기본 정보</h3>
            </div>

            <div className="quote-review-list">
              <div className="quote-review-row">
                <span className="quote-review-label">게시명</span>
                <span className="quote-review-value">
                  {estimateTitleDisplay}
                </span>
              </div>

              <div className="quote-review-row quote-review-row--top">
                <span className="quote-review-label">출발지</span>
                <div className="quote-review-value-group">
                  <span className="quote-review-value">
                    {originAddressDisplay}
                  </span>
                  <span className="quote-review-subvalue">
                    {originDetailDisplay}
                  </span>
                </div>
              </div>

              <div className="quote-review-row quote-review-row--top">
                <span className="quote-review-label">도착지</span>
                <div className="quote-review-value-group">
                  <span className="quote-review-value">
                    {destinationAddressDisplay}
                  </span>
                  <span className="quote-review-subvalue">
                    {destinationDetailDisplay}
                  </span>
                </div>
              </div>

              <div className="quote-review-row">
                <span className="quote-review-label">운송일자</span>
                <span className="quote-review-value">{transportDateTime}</span>
              </div>
            </div>
          </section>

          {/* 화물 정보 */}
          <section className="quote-review-card">
            <div className="quote-review-card__header">
              <h3>화물 정보</h3>
            </div>

            <div className="quote-review-list">
              <div className="quote-review-row quote-review-row--top">
                <span className="quote-review-label">차량</span>
                <div className="quote-review-value-group">
                  <span className="quote-review-value">{vehicleDisplay}</span>
                  {formData.vehicleNeedConsult && (
                    <span className="quote-review-badge">상담 필요</span>
                  )}
                </div>
              </div>

              <div className="quote-review-row">
                <span className="quote-review-label">화물 종류</span>
                <span className="quote-review-value">{cargoTypeDisplay}</span>
              </div>

              <div className="quote-review-row">
                <span className="quote-review-label">화물명</span>
                <span className="quote-review-value">{cargoNameDisplay}</span>
              </div>

              <div className="quote-review-row quote-review-row--top">
                <span className="quote-review-label">중량</span>
                <div className="quote-review-value-group">
                  <span className="quote-review-value">{weightDisplay}</span>
                  {formData.weightNeedConsult && (
                    <span className="quote-review-badge">상담 필요</span>
                  )}
                </div>
              </div>

              <div className="quote-review-row quote-review-row--top">
                <span className="quote-review-label">요청사항</span>
                <div className="quote-review-value-group">
                  <span className="quote-review-value quote-review-value--multiline">
                    {requestNoteDisplay}
                  </span>
                </div>
              </div>

              <div className="quote-review-row quote-review-row--top">
                <span className="quote-review-label">희망 운임</span>
                <div className="quote-review-value-group">
                  <span className="quote-review-value">{priceDisplay}</span>
                  {formData.priceProposalAllowed && (
                    <span className="quote-review-badge quote-review-badge--accent">
                      가격 상담 가능
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <aside className="quote-review-side-panel">
        <div className="quote-review-side-card">
          <h3 className="quote-review-side-title">등록 전 체크</h3>
          <ul className="quote-review-check-list">
            <li>출발지와 도착지가 정확한지 확인하세요.</li>
            <li>화물명은 기사님이 이해하기 쉽게 작성하세요.</li>
            <li>상담 필요 항목은 기사님과 추가 협의가 진행됩니다.</li>
            <li>희망 운임과 요청사항을 마지막으로 다시 확인하세요.</li>
          </ul>
        </div>

        <div className="quote-review-side-card">
          <h3 className="quote-review-side-title">핵심 조건 확인</h3>
          <div className="quote-review-summary">
            <div className="quote-review-summary-row">
              <span>차량</span>
              <strong>
                {formData.vehicleNeedConsult ? "상담 필요" : vehicleDisplay}
              </strong>
            </div>
            <div className="quote-review-summary-row">
              <span>중량</span>
              <strong>
                {formData.weightNeedConsult ? "상담 필요" : weightDisplay}
              </strong>
            </div>
            <div className="quote-review-summary-row">
              <span>운임</span>
              <strong>{priceDisplay}</strong>
            </div>
          </div>
        </div>

        <div className="quote-review-side-card">
          <div className="quote-review-image-header">
            <h3 className="quote-review-side-title">첨부 사진</h3>
            <span className="quote-review-image-count">{imageCount}장</span>
          </div>

          {imageCount === 0 ? (
            <div className="quote-review-image-empty">
              첨부된 사진이 없습니다.
            </div>
          ) : (
            <div className="quote-review-image-grid">
              {imagePreviewUrls.slice(0, 5).map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="quote-review-image-item"
                >
                  <img
                    src={url}
                    alt={`첨부 사진 ${index + 1}`}
                    className="quote-review-image"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
