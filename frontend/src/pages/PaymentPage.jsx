import { formatCurrency, formatDate } from "../utils/formatters"

export default function PaymentPage({ controller }) {
  const { selected, profile, handlePayShipment, paymentSubmitting, setRoutePage, setDashboardTab } = controller

  if (!selected) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <h2>결제 정보가 없습니다.</h2>
          <button className="btn btn-primary" type="button" onClick={() => { setRoutePage("dashboard"); setDashboardTab("board") }}>거래 목록으로 이동</button>
        </div>
      </div>
    )
  }

  const amount = selected.agreedPrice || selected.bestOfferPrice || selected.offers?.find((offer) => offer.id === selected.acceptedOfferId)?.price || 0

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-card__head">
          <div>
            <span className="payment-card__eyebrow">운송 결제</span>
            <h2>{selected.title}</h2>
            <p>차주 확정 후 운행 시작 전에 결제를 완료합니다.</p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => { setRoutePage("dashboard"); setDashboardTab("board") }}>닫기</button>
        </div>

        <div className="payment-summary-grid">
          <div className="payment-summary-box">
            <span>결제 금액</span>
            <strong>{formatCurrency(amount)}</strong>
            <p>선택된 차주의 최종 제안 금액</p>
          </div>
          <div className="payment-summary-box">
            <span>결제 상태</span>
            <strong>{selected.paid ? '결제 완료' : '결제 대기'}</strong>
            <p>{selected.paymentCompletedAt ? formatDate(selected.paymentCompletedAt) : '아직 결제되지 않았습니다.'}</p>
          </div>
        </div>

        <div className="payment-detail-box">
          <h3>거래 정보</h3>
          <div className="payment-detail-row"><span>출발지</span><strong>{selected.originAddress}</strong></div>
          <div className="payment-detail-row"><span>도착지</span><strong>{selected.destinationAddress}</strong></div>
          <div className="payment-detail-row"><span>선택 차주</span><strong>{selected.assignedDriverName || '-'}</strong></div>
          <div className="payment-detail-row"><span>예정 시작</span><strong>{selected.scheduledStartAt ? formatDate(selected.scheduledStartAt) : '-'}</strong></div>
          <div className="payment-detail-row"><span>결제 수단</span><strong>{profile?.paymentMethod || '프로필에 등록된 결제수단 없음'}</strong></div>
        </div>

        {!selected.paid ? (
          <div className="payment-submit-box">
            <p>결제 완료 알림이 거래 당사자에게 전송됩니다.</p>
            <button className="btn btn-primary payment-submit-btn" type="button" onClick={handlePayShipment} disabled={paymentSubmitting}>
              {paymentSubmitting ? '결제 처리 중...' : `${formatCurrency(amount)} 결제하기`}
            </button>
          </div>
        ) : (
          <div className="payment-submit-box payment-submit-box--done">
            <p>결제가 완료되어 차주가 운행을 시작할 수 있습니다.</p>
            <button className="btn btn-primary" type="button" onClick={() => { setRoutePage("dashboard"); setDashboardTab("board") }}>거래 화면으로 돌아가기</button>
          </div>
        )}
      </div>
    </div>
  )
}
