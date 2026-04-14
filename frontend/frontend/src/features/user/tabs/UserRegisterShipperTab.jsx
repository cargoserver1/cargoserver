import ShipmentLocationPicker from '../../../components/ShipmentLocationPicker'
import SectionTitle from '../../../components/common/SectionTitle'

export default function UserRegisterShipperTab({ controller }) {
  const { shipmentForm, setShipmentForm, handleShipmentImagesChange, handleCreateShipment } = controller

  return (
    <div className="surface form-surface">
      <SectionTitle
        title="신규 화물 등록"
        desc="주소를 입력해 바로 지도에 찍고, 지도 클릭으로 좌표와 주소를 자동 입력할 수 있습니다."
      />

      <div className="form-stack">
        <div className="split-2">
          <input
            placeholder="배차명"
            value={shipmentForm.title}
            onChange={(e) => setShipmentForm({ ...shipmentForm, title: e.target.value })}
          />
          <input
            placeholder="화물 종류"
            value={shipmentForm.cargoType}
            onChange={(e) => setShipmentForm({ ...shipmentForm, cargoType: e.target.value })}
          />
        </div>

        <div className="split-2">
          <input
            placeholder="중량(kg)"
            value={shipmentForm.weightKg}
            onChange={(e) => setShipmentForm({ ...shipmentForm, weightKg: e.target.value })}
          />
          <input
            placeholder="상세 설명"
            value={shipmentForm.description}
            onChange={(e) => setShipmentForm({ ...shipmentForm, description: e.target.value })}
          />
        </div>

        <div className="surface-sub">
          <strong>운송 시작 예정 시각</strong>
          <input
            type="datetime-local"
            value={shipmentForm.scheduledStartAt}
            onChange={(e) => setShipmentForm({ ...shipmentForm, scheduledStartAt: e.target.value })}
          />
        </div>

        <div className="surface-sub">
          <strong>화물 사진 등록</strong>
          <p className="section-desc">출발 전 화물 상태 확인용 사진을 최대 5장까지 첨부할 수 있습니다.</p>
          <input type="file" accept="image/*" multiple onChange={handleShipmentImagesChange} />
          {(shipmentForm.cargoImageDataUrls || []).length > 0 && (
            <div className="image-preview-row">
              {shipmentForm.cargoImageDataUrls.map((src, idx) => (
                <img key={idx} src={src} alt={`cargo-${idx}`} className="image-preview-thumb" />
              ))}
            </div>
          )}
        </div>

        <ShipmentLocationPicker value={shipmentForm} onChange={setShipmentForm} />

        <button className="btn btn-primary" onClick={handleCreateShipment}>
          화물 등록
        </button>
      </div>
    </div>
  )
}
