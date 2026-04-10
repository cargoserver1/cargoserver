import { useEffect, useState } from "react";
import CargoAssistPanel from "../components/CargoAssistPanel";

function formatNumber(value) {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function QuoteStepCargo({
  formData = {},
  errors = {},
  updateField,
}) {
  const [assistPanelMode, setAssistPanelMode] = useState("guide");
  const [showVehicleTooltip, setShowVehicleTooltip] = useState(false);
  const [showWeightTooltip, setShowWeightTooltip] = useState(false);

  useEffect(() => {
    if (!showVehicleTooltip) return;
    const timer = setTimeout(() => setShowVehicleTooltip(false), 3000);
    return () => clearTimeout(timer);
  }, [showVehicleTooltip]);

  useEffect(() => {
    if (!showWeightTooltip) return;
    const timer = setTimeout(() => setShowWeightTooltip(false), 3000);
    return () => clearTimeout(timer);
  }, [showWeightTooltip]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const openVehiclePanel = () => {
    if (formData.vehicleNeedConsult) return;
    setAssistPanelMode("vehicle");
  };

  const openCargoTypePanel = () => {
    setAssistPanelMode("cargoType");
  };

  const openImagePanel = () => {
    setAssistPanelMode("images");
  };

  const handleSelectVehicle = (vehicleLabel) => {
    updateField("vehicleType", vehicleLabel);
    setAssistPanelMode("guide");
  };

  const handleSelectCargoType = (cargoTypeLabel) => {
    updateField("cargoType", cargoTypeLabel);
    setAssistPanelMode("guide");
  };

  const closeAssistPanel = () => {
    setAssistPanelMode("guide");
  };

  const handleVehicleConsultChange = (e) => {
    const checked = e.target.checked;
    updateField("vehicleNeedConsult", checked);

    if (checked) {
      updateField("vehicleType", "");
      setAssistPanelMode("guide");
      setShowVehicleTooltip(true);
    } else {
      setShowVehicleTooltip(false);
    }
  };

  const handleWeightChange = (e) => {
    const nextValue = e.target.value;

    if (formData.weightUnit === "kg") {
      if (/^\d*$/.test(nextValue)) {
        updateField("weight", nextValue);
      }
      return;
    }

    if (nextValue === "" || /^\d+(\.\d?)?$/.test(nextValue)) {
      updateField("weight", nextValue);
    }
  };

  const handleWeightUnitChange = (nextUnit) => {
    if (formData.weightUnit === nextUnit) return;
    updateField("weight", "");
    updateField("weightUnit", nextUnit);
  };

  const handleWeightConsultChange = (e) => {
    const checked = e.target.checked;
    updateField("weightNeedConsult", checked);

    if (checked) {
      updateField("weight", "");
      setShowWeightTooltip(true);
    } else {
      setShowWeightTooltip(false);
    }
  };

  const handlePriceChange = (e) => {
    const onlyNumber = e.target.value.replace(/[^0-9]/g, "");
    updateField("desiredPrice", onlyNumber);
  };

  const handlePriceProposalChange = (e) => {
    const checked = e.target.checked;
    updateField("priceProposalAllowed", checked);
  };

  const handleAddImages = (newFiles) => {
    const prevFiles = Array.isArray(formData.cargoImages)
      ? formData.cargoImages
      : [];

    if (prevFiles.length + newFiles.length > 5) {
      alert("사진은 최대 5장까지 첨부할 수 있습니다. 다시 선택해주세요.");
      return false;
    }

    updateField("cargoImages", [...prevFiles, ...newFiles]);
    return true;
  };

  const handleRemoveImage = (indexToRemove) => {
    const nextFiles = (formData.cargoImages || []).filter(
      (_, index) => index !== indexToRemove,
    );
    updateField("cargoImages", nextFiles);
  };

  const imageCount = Array.isArray(formData.cargoImages)
    ? formData.cargoImages.length
    : 0;

  return (
    <section className="quote-step-layout">
      <div className="quote-step-layout__main">
        <div className="quote-step-form">
          {/* 희망 차량 */}
          <div className="form-group form-group--with-option">
            <label htmlFor="vehicleType">
              희망 차량 <span className="required-mark">*</span>
            </label>

            <div className="field-top-option">
              {showVehicleTooltip && (
                <span className="inline-tooltip inline-tooltip--top">
                  화물명에 자세하게 적어주세요.
                </span>
              )}
            </div>

            <button
              type="button"
              id="vehicleType"
              className={`panel-trigger-input cargo-panel-trigger ${
                assistPanelMode === "vehicle" ? "is-active" : ""
              } ${
                !formData.vehicleType && !formData.vehicleNeedConsult
                  ? "is-placeholder"
                  : ""
              }`}
              onClick={openVehiclePanel}
              disabled={!!formData.vehicleNeedConsult}
            >
              {formData.vehicleNeedConsult
                ? "상담 필요로 선택됨"
                : formData.vehicleType || "희망 차량을 선택해 주세요"}
            </button>

            {errors.vehicleType && !formData.vehicleNeedConsult && (
              <p className="error-text">{errors.vehicleType}</p>
            )}
          </div>

          {/* 화물 종류 */}
          <div className="form-group">
            <label htmlFor="cargoType">
              화물 종류 <span className="required-mark">*</span>
            </label>

            <button
              type="button"
              id="cargoType"
              className={`panel-trigger-input cargo-panel-trigger ${
                assistPanelMode === "cargoType" ? "is-active" : ""
              } ${!(formData.cargoType || "").trim() ? "is-placeholder" : ""}`}
              onClick={openCargoTypePanel}
            >
              {formData.cargoType || "화물 종류를 선택해 주세요"}
            </button>

            {errors.cargoType && (
              <p className="error-text">{errors.cargoType}</p>
            )}
          </div>

          {/* 화물명 */}
          <div className="form-group">
            <label htmlFor="cargoName">
              화물명 <span className="required-mark">*</span>
            </label>
            <input
              id="cargoName"
              name="cargoName"
              type="text"
              value={formData.cargoName || ""}
              onChange={handleChange}
              placeholder="예: 냉장고, 세탁기"
            />
            {errors.cargoName && (
              <p className="error-text">{errors.cargoName}</p>
            )}
          </div>

          {/* 중량 */}
          <div className="form-group form-group--with-option">
            <label htmlFor="weight">
              중량 <span className="required-mark">*</span>
            </label>

            <div className="field-top-option">
              {showWeightTooltip && (
                <span className="inline-tooltip inline-tooltip--top">
                  화물명에 자세하게 적어주세요.
                </span>
              )}
            </div>

            <div className="input-with-toggle">
              <input
                id="weight"
                name="weight"
                type="text"
                value={formData.weight || ""}
                onChange={handleWeightChange}
                placeholder={
                  formData.weightNeedConsult
                    ? "상담 필요로 선택됨"
                    : "숫자로 입력해 주세요"
                }
                disabled={!!formData.weightNeedConsult}
                className={
                  formData.weightNeedConsult ? "input-disabled-like" : ""
                }
              />

              <div className="unit-toggle">
                <button
                  type="button"
                  className={formData.weightUnit === "kg" ? "active" : ""}
                  onClick={() => handleWeightUnitChange("kg")}
                  disabled={!!formData.weightNeedConsult}
                >
                  kg
                </button>

                <button
                  type="button"
                  className={formData.weightUnit === "t" ? "active" : ""}
                  onClick={() => handleWeightUnitChange("t")}
                  disabled={!!formData.weightNeedConsult}
                >
                  t
                </button>
              </div>
            </div>

            <p className="form-helper-text">
              kg는 정수만, t는 소수점 한 자리까지 입력 가능합니다.
            </p>

            {errors.weight && !formData.weightNeedConsult && (
              <p className="error-text">{errors.weight}</p>
            )}
          </div>

          {/* 요청사항 */}
          <div className="form-group">
            <label htmlFor="requestNote">요청사항</label>
            <textarea
              id="requestNote"
              name="requestNote"
              value={formData.requestNote || ""}
              onChange={handleChange}
              placeholder="파손 주의, 엘리베이터 없음, 오전 상차 희망"
            />
            {errors.requestNote && (
              <p className="error-text">{errors.requestNote}</p>
            )}
          </div>

          {/* 사진 첨부 */}
          <div className="form-group">
            <label htmlFor="cargoImages">사진 첨부</label>

            <button
              type="button"
              id="cargoImages"
              className={`panel-trigger-input cargo-panel-trigger ${
                assistPanelMode === "images" ? "is-active" : ""
              } ${imageCount === 0 ? "is-placeholder" : ""}`}
              onClick={openImagePanel}
            >
              {imageCount === 0
                ? "사진을 첨부해 주세요"
                : `${imageCount}장 첨부됨 - 다시 눌러서 변경 가능합니다.`}
            </button>

            <p className="form-helper-text">
              오른쪽 패널에서 미리보기, 삭제, 추가 첨부가 가능합니다.
            </p>
          </div>

          {/* 희망 운임 */}
          <div className="form-group form-group--with-option">
            <label htmlFor="desiredPrice">
              희망 운임 <span className="required-mark">*</span>
            </label>

            <div className="field-top-option">
              <label className="inline-check-label custom-check-label">
                <input
                  type="checkbox"
                  checked={!!formData.priceProposalAllowed}
                  onChange={handlePriceProposalChange}
                />
                <span className="custom-check-box"></span>
                <span className="custom-check-text">가격 상담 가능</span>
              </label>
            </div>

            <div className="price-input-wrapper">
              <input
                id="desiredPrice"
                name="desiredPrice"
                type="text"
                value={formatNumber(formData.desiredPrice || "")}
                onChange={handlePriceChange}
                placeholder="가격을 입력해 주세요"
              />
              <span className="price-unit">원</span>
            </div>

            <p className="form-helper-text">
              체크 시 입력한 희망 운임을 유지하면서 기사님의 가격 제안도 받을 수
              있습니다.
            </p>

            {errors.desiredPrice && (
              <p className="error-text">{errors.desiredPrice}</p>
            )}
          </div>
        </div>
      </div>

      <aside className="quote-step-side-panel">
        <CargoAssistPanel
          panelMode={assistPanelMode}
          selectedVehicle={formData.vehicleType || ""}
          selectedCargoType={formData.cargoType || ""}
          selectedImages={formData.cargoImages || []}
          onSelectVehicle={handleSelectVehicle}
          onSelectCargoType={handleSelectCargoType}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
          onApplyImages={closeAssistPanel}
          onCloseVehiclePanel={closeAssistPanel}
        />
      </aside>
    </section>
  );
}
