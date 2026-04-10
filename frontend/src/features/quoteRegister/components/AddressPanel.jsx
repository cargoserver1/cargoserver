import { useEffect, useMemo, useState } from "react";
import DaumPostcode from "react-daum-postcode";

export default function AddressPanel({
  title,
  fieldName,
  currentValue,
  currentDetailValue,
  updateField,
  closePanel,
}) {
  const [panelStep, setPanelStep] = useState("search");
  const [selectedBaseAddress, setSelectedBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [hasElevator, setHasElevator] = useState("");

  useEffect(() => {
    if (!currentDetailValue) {
      setDetailAddress("");
      setFloor("");
      setHasElevator("");
      return;
    }

    const detailText = currentDetailValue;

    const floorMatch = detailText.match(/(\d+)\s*층/);
    const elevatorMatch = detailText.match(/엘리베이터\s*(있음|없음)/);

    setFloor(floorMatch ? floorMatch[1] : "");

    const cleanedDetail = detailText
      .replace(/(\d+)\s*층/g, "")
      .replace(/엘리베이터\s*(있음|없음)/g, "")
      .trim();

    setDetailAddress(cleanedDetail);
    setHasElevator(elevatorMatch ? elevatorMatch[1] : "");
  }, [currentDetailValue]);

  const getDetailFieldName = () => {
    if (fieldName === "originAddress") return "originDetailAddress";
    if (fieldName === "destinationAddress") return "destinationDetailAddress";
    return "";
  };

  const handleComplete = (data) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname) {
        extraAddress += data.bname;
      }

      if (data.buildingName) {
        extraAddress += extraAddress
          ? `, ${data.buildingName}`
          : data.buildingName;
      }

      if (extraAddress) {
        fullAddress += ` (${extraAddress})`;
      }
    }

    updateField(fieldName, fullAddress);
    setSelectedBaseAddress(fullAddress);
    setPanelStep("detail");
  };

  const isValidFloor = useMemo(() => {
    return /^\d+$/.test(floor) && Number(floor) >= 1;
  }, [floor]);

  const isValidElevator = useMemo(() => {
    return hasElevator === "있음" || hasElevator === "없음";
  }, [hasElevator]);

  const isDetailFormValid = isValidFloor && isValidElevator;

  const handleSubmitDetail = () => {
    const detailFieldName = getDetailFieldName();

    if (!detailFieldName) {
      closePanel();
      return;
    }

    if (!isValidFloor || !isValidElevator) {
      return;
    }

    const detailParts = [];

    if (detailAddress.trim()) {
      detailParts.push(detailAddress.trim());
    }

    if (floor.trim()) {
      detailParts.push(`${floor.trim()}층`);
    }

    if (hasElevator) {
      detailParts.push(`엘리베이터 ${hasElevator}`);
    }

    updateField(detailFieldName, detailParts.join(" "));
    closePanel();
  };

  const handleBackToSearch = () => {
    setPanelStep("search");
  };

  const baseAddressText = selectedBaseAddress || currentValue || "";

  return (
    <div className="side-panel-content">
      <div className="side-panel-header">
        {panelStep === "search" ? (
          <h3>{title}</h3>
        ) : (
          <div className="detail-panel-title-row">
            <button
              type="button"
              className="panel-back-button"
              onClick={handleBackToSearch}
            >
              ←
            </button>
            <h3>상세주소 입력</h3>
          </div>
        )}

        <button
          type="button"
          className="panel-close-button"
          onClick={closePanel}
        >
          ×
        </button>
      </div>

      {panelStep === "search" && (
        <div className="address-panel-body">
          {currentValue && (
            <div className="selected-preview">
              <strong>현재 선택된 주소</strong>
              <p>{currentValue}</p>
            </div>
          )}

          <div className="daum-postcode-wrapper">
            <DaumPostcode
              onComplete={handleComplete}
              autoClose={false}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      )}

      {panelStep === "detail" && (
        <div className="detail-address-panel">
          <div className="selected-preview">
            <strong>선택한 주소</strong>
            <p>{baseAddressText}</p>
          </div>

          <div className="form-group">
            <label>상세 주소</label>
            <input
              type="text"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              placeholder="상세 주소를 입력해주세요."
            />
          </div>

          <div className="form-group">
            <label>
              층수 <span className="required-mark">*</span>
            </label>

            <div className="floor-input-wrapper">
              <input
                type="text"
                className="floor-input"
                placeholder="층수 입력"
                value={floor}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setFloor(value);
                }}
              />
              <span className="floor-unit">층</span>
            </div>

            {!floor && <p className="error-text">층수를 입력해주세요.</p>}

            {floor && !isValidFloor && (
              <p className="error-text">층수는 1 이상의 숫자로 입력해주세요.</p>
            )}
          </div>

          <div className="form-group">
            <label>
              건물 내 엘리베이터 <span className="required-mark">*</span>
            </label>
            <div className="elevator-toggle-group">
              <button
                type="button"
                className={`elevator-toggle-button ${
                  hasElevator === "있음" ? "selected" : ""
                }`}
                onClick={() => setHasElevator("있음")}
              >
                있음
              </button>

              <button
                type="button"
                className={`elevator-toggle-button ${
                  hasElevator === "없음" ? "selected" : ""
                }`}
                onClick={() => setHasElevator("없음")}
              >
                없음
              </button>
            </div>

            {!isValidElevator && (
              <p className="error-text">엘리베이터 유무를 선택해주세요.</p>
            )}
          </div>

          <button
            type="button"
            className="primary-button detail-submit-button"
            onClick={handleSubmitDetail}
            disabled={!isDetailFormValid}
          >
            적용하기
          </button>
        </div>
      )}
    </div>
  );
}
