import AddressPanel from "../components/AddressPanel";
import SchedulePanel from "../components/SchedulePanel";

export default function QuoteStepRoute({
  formData,
  errors,
  updateField,
  activePanel,
  openPanel,
  closePanel,
}) {
  if (!formData) return null;

  const transportScheduleText =
    formData.transportDate && formData.transportTime
      ? `${formData.transportDate} ${formData.transportTime}`
      : "운송일자와 시간을 선택해주세요";

  return (
    // Step 1, 2가 같은 비율을 쓰도록 공통 레이아웃 클래스 사용
    <section className="quote-step-layout">
      {/* 왼쪽 입력 영역 */}
      <div className="quote-step-layout__main">
        <div className="form-group">
          <label>
            어떤 제목으로 올려볼까요? <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            value={formData.estimateName}
            onChange={(e) => updateField("estimateName", e.target.value)}
            placeholder="예: 서울 → 부산 냉장 식품 운송"
          />
          {errors?.estimateName && (
            <p className="error-text">{errors.estimateName}</p>
          )}
        </div>

        <div className="form-group">
          <label>
            출발지와 도착지를 입력해 주세요.{" "}
            <span className="required-mark">*</span>
          </label>

          <div className="route-select-box">
            <button
              type="button"
              className={`route-item ${activePanel === "origin" ? "active" : ""}`}
              onClick={() => openPanel("origin")}
            >
              <span className="dot green"></span>

              <div className="route-text-group">
                <span className="route-main-text">
                  {formData.originAddress || "출발지"}
                </span>
                <span className="route-sub-text">
                  {formData.originDetailAddress || "상세 주소를 입력해주세요"}
                </span>
              </div>
            </button>

            <div className="route-divider" />

            <button
              type="button"
              className={`route-item ${
                activePanel === "destination" ? "active" : ""
              }`}
              onClick={() => openPanel("destination")}
            >
              <span className="dot blue"></span>

              <div className="route-text-group">
                <span className="route-main-text">
                  {formData.destinationAddress || "도착지"}
                </span>
                <span className="route-sub-text">
                  {formData.destinationDetailAddress ||
                    "상세 주소를 입력해주세요"}
                </span>
              </div>
            </button>
          </div>

          {errors?.originAddress && (
            <p className="error-text">{errors.originAddress}</p>
          )}
          {errors?.destinationAddress && (
            <p className="error-text">{errors.destinationAddress}</p>
          )}
        </div>

        <div className="form-group transport-date-group">
          <label>
            언제 운송하실 예정인가요? <span className="required-mark">*</span>
          </label>
          <button
            type="button"
            className={`panel-trigger-input ${
              activePanel === "schedule" ? "is-active" : ""
            }`}
            onClick={() => openPanel("schedule")}
          >
            {transportScheduleText}
          </button>
          {errors?.transportDate && (
            <p className="error-text">{errors.transportDate}</p>
          )}
        </div>
      </div>

      {/* 오른쪽 보조 패널 영역 - Step 2와 같은 공통 폭/비율 사용 */}
      <aside className="quote-step-side-panel">
        {activePanel === "origin" && (
          <AddressPanel
            title="출발지 입력"
            fieldName="originAddress"
            currentValue={formData.originAddress}
            currentDetailValue={formData.originDetailAddress}
            updateField={updateField}
            closePanel={closePanel}
          />
        )}

        {activePanel === "destination" && (
          <AddressPanel
            title="도착지 입력"
            fieldName="destinationAddress"
            currentValue={formData.destinationAddress}
            currentDetailValue={formData.destinationDetailAddress}
            updateField={updateField}
            closePanel={closePanel}
          />
        )}

        {activePanel === "schedule" && (
          <SchedulePanel
            transportDate={formData.transportDate}
            transportTime={formData.transportTime}
            updateField={updateField}
            closePanel={closePanel}
          />
        )}

        {!activePanel && (
          <div className="panel-placeholder">
            <h3>입력 보조 패널</h3>
            <p>
              출발지, 도착지, 운송일자를 클릭하면 여기에서 선택할 수 있습니다.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
