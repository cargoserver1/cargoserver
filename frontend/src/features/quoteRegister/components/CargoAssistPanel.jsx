import { useEffect, useMemo, useRef, useState } from "react";
import {
  SMALL_VEHICLES,
  LARGE_VEHICLES,
  BUSINESS_LARGE_VEHICLES,
  CARGO_TYPES,
} from "../constants/quoteRegisterOptions";

function VehicleItem({ item, selectedValue, onSelect }) {
  const isSelected = selectedValue === item.label;

  return (
    <button
      type="button"
      className={`vehicle-select-item ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelect(item.label)}
    >
      <div className="vehicle-select-item__icon" aria-hidden="true">
        {item.icon}
      </div>

      <div className="vehicle-select-item__content">
        <div className="vehicle-select-item__title-row">
          <span className="vehicle-select-item__title">{item.label}</span>
        </div>
        <span className="vehicle-select-item__desc">{item.desc}</span>
      </div>
    </button>
  );
}

export default function CargoAssistPanel({
  panelMode = "guide",
  selectedVehicle = "",
  selectedCargoType = "",
  selectedImages = [],
  onSelectVehicle,
  onSelectCargoType,
  onAddImages,
  onRemoveImage,
  onApplyImages,
  onCloseVehiclePanel,
}) {
  const [tab, setTab] = useState("small");
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const isLargeTab = useMemo(() => tab === "large", [tab]);

  useEffect(() => {
    const nextUrls = selectedImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    onAddImages?.(selectedFiles);
    e.target.value = "";
  };

  if (panelMode === "vehicle") {
    return (
      <div className="quote-assist-panel">
        <div className="quote-assist-panel__header">
          <h3 className="quote-assist-panel__title">희망 차량 선택</h3>
          <button
            type="button"
            className="quote-assist-panel__close-button"
            onClick={onCloseVehiclePanel}
            aria-label="희망 차량 선택 패널 닫기"
          >
            ×
          </button>
        </div>

        <div className="vehicle-tab-group">
          <button
            type="button"
            className={`vehicle-tab-button ${tab === "small" ? "is-active" : ""}`}
            onClick={() => setTab("small")}
          >
            소형차량
          </button>

          <button
            type="button"
            className={`vehicle-tab-button ${tab === "large" ? "is-active" : ""}`}
            onClick={() => setTab("large")}
          >
            대형차량
          </button>
        </div>

        <div className="vehicle-select-list">
          {!isLargeTab &&
            SMALL_VEHICLES.map((vehicle) => (
              <VehicleItem
                key={vehicle.id}
                item={vehicle}
                selectedValue={selectedVehicle}
                onSelect={onSelectVehicle}
              />
            ))}

          {isLargeTab && (
            <>
              {LARGE_VEHICLES.map((vehicle) => (
                <VehicleItem
                  key={vehicle.id}
                  item={vehicle}
                  selectedValue={selectedVehicle}
                  onSelect={onSelectVehicle}
                />
              ))}

              <div className="vehicle-section-header">
                <span className="vehicle-section-header__title">
                  비즈니스 전용 트럭
                </span>
                <span className="vehicle-section-header__badge">비즈니스</span>
              </div>

              {BUSINESS_LARGE_VEHICLES.map((vehicle) => (
                <VehicleItem
                  key={vehicle.id}
                  item={vehicle}
                  selectedValue={selectedVehicle}
                  onSelect={onSelectVehicle}
                />
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  if (panelMode === "cargoType") {
    return (
      <div className="quote-assist-panel">
        <div className="quote-assist-panel__header">
          <h3 className="quote-assist-panel__title">화물 종류 선택</h3>
          <button
            type="button"
            className="quote-assist-panel__close-button"
            onClick={onCloseVehiclePanel}
            aria-label="화물 종류 선택 패널 닫기"
          >
            ×
          </button>
        </div>

        <div className="vehicle-select-list">
          {CARGO_TYPES.map((cargoType) => (
            <VehicleItem
              key={cargoType.id}
              item={cargoType}
              selectedValue={selectedCargoType}
              onSelect={onSelectCargoType}
            />
          ))}
        </div>
      </div>
    );
  }

  if (panelMode === "images") {
    return (
      <div className="quote-assist-panel">
        <div className="quote-assist-panel__header">
          <h3 className="quote-assist-panel__title">사진 첨부</h3>
          <button
            type="button"
            className="quote-assist-panel__close-button"
            onClick={onCloseVehiclePanel}
            aria-label="사진 첨부 패널 닫기"
          >
            ×
          </button>
        </div>

        <div className="image-panel-toolbar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="cargo-image-upload-input"
          />

          <button
            type="button"
            className="image-panel-add-button"
            onClick={handleOpenFilePicker}
          >
            사진 추가
          </button>

          <span className="image-panel-guide">
            사진 선택 시 즉시 첨부됩니다. (최대 5장)
          </span>
        </div>

        {selectedImages.length === 0 ? (
          <div className="image-panel-empty">
            선택된 사진이 없습니다. 사진 추가 버튼을 눌러 첨부하세요.
          </div>
        ) : (
          <ul className="image-preview-list">
            {selectedImages.map((file, index) => (
              <li key={`${file.name}-${index}`} className="image-preview-item">
                <div className="image-preview-thumb">
                  <img src={previewUrls[index]} alt={file.name} />
                </div>

                <div className="image-preview-meta">
                  <span className="image-preview-name">{file.name}</span>
                  <span className="image-preview-size">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>

                <button
                  type="button"
                  className="image-preview-remove"
                  onClick={() => onRemoveImage?.(index)}
                  aria-label={`${file.name} 삭제`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="quote-assist-panel">
      <h3 className="quote-assist-panel__title">입력 보조 패널</h3>

      <div className="quote-assist-panel__section">
        <p className="quote-assist-panel__text">
          희망 차량, 화물 종류, 화물명, 중량, 요청사항, 사진 첨부, 희망 운임을
          입력하는 단계입니다.
        </p>
      </div>

      <div className="quote-assist-panel__section">
        <p className="quote-assist-panel__label">작성 가이드</p>
        <ul className="quote-assist-panel__list">
          <li>희망 차량은 왼쪽 입력 칸을 눌러 선택하세요.</li>
          <li>화물 종류도 왼쪽 입력 칸을 눌러 카테고리에서 선택하세요.</li>
          <li>화물명은 기사님이 이해하기 쉽게 구체적으로 적으세요.</li>
          <li>중량은 숫자 기준으로 입력하고 단위를 함께 선택하세요.</li>
          <li>희망 운임은 협의 가능한 기준 금액으로 입력하세요.</li>
        </ul>
      </div>
    </div>
  );
}
