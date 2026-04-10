import './PaymentModal.css'
import { formatCurrency, formatDate } from '../../utils/formatters'

const PAYMENT_METHOD_OPTIONS = [
  { key: 'REGISTERED', label: '등록된 결제수단', brand: 'registered', hint: '프로필에 저장된 수단 사용' },
  { key: 'NAVER_PAY', label: '네이버페이', brand: 'naver', hint: '간편 결제' },
  { key: 'KAKAO_PAY', label: '카카오페이', brand: 'kakao', hint: '간편 결제' },
  { key: 'TOSS_PAY', label: '토스페이', brand: 'toss', hint: '간편 결제' },
  { key: 'CARD', label: '신용카드', brand: 'card', hint: '일반 결제' },
  { key: 'BANK_TRANSFER', label: '실시간 계좌이체', brand: 'bank', hint: '즉시 이체' },
  { key: 'WIRE_TRANSFER', label: '무통장 입금', brand: 'wire', hint: '가상 계좌/입금' },
]

function PaymentMethodBadge({ brand, label }) {
  if (brand === 'naver') {
    return <span className="payment-method-badge payment-method-badge--naver">N Pay</span>
  }
  if (brand === 'kakao') {
    return <span className="payment-method-badge payment-method-badge--kakao">K Pay</span>
  }
  if (brand === 'toss') {
    return <span className="payment-method-badge payment-method-badge--toss">Toss</span>
  }
  if (brand === 'card') {
    return <span className="payment-method-badge payment-method-badge--card">Card</span>
  }
  if (brand === 'bank') {
    return <span className="payment-method-badge payment-method-badge--bank">Bank</span>
  }
  if (brand === 'wire') {
    return <span className="payment-method-badge payment-method-badge--wire">입금</span>
  }
  return <span className="payment-method-badge payment-method-badge--registered">등록</span>
}

export default function PaymentModal({ controller }) {
  const {
    paymentModalOpen,
    closePaymentModal,
    paymentModalStep,
    openPaymentMethodStep,
    setPaymentModalStep,
    selected,
    profile,
    paymentSubmitting,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    handlePayShipment,
  } = controller

  if (!paymentModalOpen || !selected) return null

  const amount = selected.agreedPrice || selected.bestOfferPrice || 0
  const registeredMethod = profile?.paymentMethod?.trim()
  const registeredLabel = registeredMethod || '프로필에 등록된 결제수단 없음'
  const currentMethodLabel = selectedPaymentMethod === 'REGISTERED'
    ? (registeredMethod || '등록된 결제수단')
    : PAYMENT_METHOD_OPTIONS.find((option) => option.key === selectedPaymentMethod)?.label || '결제수단 선택'

  return (
    <div className="payment-modal-overlay" onClick={closePaymentModal}>
      <div className={`payment-modal-shell payment-modal-shell--${paymentModalStep}`} onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" type="button" onClick={closePaymentModal} aria-label="닫기">
          ×
        </button>

        {paymentModalStep === 'summary' ? (
          <>
            <div className="payment-modal-main">
              <div className="payment-modal-panel payment-modal-panel--details">
                <div className="payment-modal-section">
                  <div className="payment-modal-label">보내는 사람</div>
                  <div className="payment-modal-value">{selected.shipperName || profile?.name || '-'}</div>
                </div>
                <div className="payment-modal-section">
                  <div className="payment-modal-label">받는 사람</div>
                  <div className="payment-modal-value">{selected.assignedDriverName || '-'}</div>
                </div>
                <div className="payment-modal-section">
                  <div className="payment-modal-label">결제 항목</div>
                  <div className="payment-modal-value">{selected.title || '-'}</div>
                </div>
                <div className="payment-modal-section">
                  <div className="payment-modal-label">운송 구간</div>
                  <div className="payment-modal-value payment-modal-value--multiline">
                    {selected.originAddress || '-'} → {selected.destinationAddress || '-'}
                  </div>
                </div>
                <div className="payment-modal-section">
                  <div className="payment-modal-label">예정 시작</div>
                  <div className="payment-modal-value">{selected.scheduledStartAt ? formatDate(selected.scheduledStartAt) : '일정 미정'}</div>
                </div>
                <div className="payment-modal-section">
                  <div className="payment-modal-label">등록 결제수단</div>
                  <div className="payment-modal-value">{registeredLabel}</div>
                </div>
              </div>

              <div className="payment-modal-panel payment-modal-panel--summary">
                <div className="payment-modal-eyebrow">SUMMARY</div>
                <h3 className="payment-modal-title">최종 결제 금액</h3>
                <div className="payment-modal-amount">{formatCurrency(amount)}</div>

                <div className="payment-modal-status-card">
                  <div className="payment-modal-label">현재 상태</div>
                  <div className="payment-modal-status">{selected.paid ? '결제 완료' : '결제 대기'}</div>
                  <p>{selected.paid ? '이미 결제가 완료된 거래입니다.' : '결제 후 결제수단을 최종 확정합니다.'}</p>
                </div>

                {!selected.paid ? (
                  <>
                    <button className="payment-modal-primary" type="button" onClick={openPaymentMethodStep}>
                      {formatCurrency(amount)} 결제하기
                    </button>
                    <button className="payment-modal-secondary" type="button" onClick={closePaymentModal}>
                      닫기
                    </button>
                  </>
                ) : (
                  <button className="payment-modal-primary" type="button" onClick={closePaymentModal}>
                    확인
                  </button>
                )}
              </div>
            </div>
          </>
        ) : paymentModalStep === 'method' ? (
          <div className="payment-method-step">
            <div className="payment-method-step__header">
              <div>
                <div className="payment-modal-eyebrow">PAYMENT METHOD</div>
                <h3 className="payment-modal-title">결제수단 선택</h3>
                <p className="payment-method-step__desc">원하는 결제수단을 선택한 뒤 결제를 완료하세요.</p>
              </div>
            </div>

            <div className="payment-method-list">
              {PAYMENT_METHOD_OPTIONS.map((option) => {
                const disabled = option.key === 'REGISTERED' && !registeredMethod
                const checked = selectedPaymentMethod === option.key

                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`payment-method-item${checked ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
                    onClick={() => !disabled && setSelectedPaymentMethod(option.key)}
                    disabled={disabled}
                  >
                    <span className={`payment-method-radio${checked ? ' is-selected' : ''}`} />
                    <PaymentMethodBadge brand={option.brand} label={option.label} />
                    <span className="payment-method-texts">
                      <strong>{option.label}</strong>
                      <small>{option.key === 'REGISTERED' ? registeredLabel : option.hint}</small>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="payment-method-step__actions">
              <button className="payment-modal-secondary" type="button" onClick={() => setPaymentModalStep('summary')}>
                이전
              </button>
              <button
                className="payment-modal-primary"
                type="button"
                onClick={handlePayShipment}
                disabled={paymentSubmitting || selected.paid}
              >
                {paymentSubmitting ? '결제 처리 중...' : `${formatCurrency(amount)} 결제`}
              </button>
            </div>

            <p className="payment-method-step__selected">선택된 결제수단: <strong>{currentMethodLabel}</strong></p>
          </div>
        ) : (
          <div className="payment-complete-step">
            <div className="payment-modal-eyebrow">PAYMENT COMPLETE</div>
            <h3 className="payment-modal-title">결제 완료</h3>
            <p className="payment-complete-step__desc">결제가 완료되어 차주가 운반을 시작할 수 있습니다.</p>

            <div className="payment-complete-step__card">
              <div className="payment-modal-label">결제 항목</div>
              <div className="payment-modal-value">{selected.title || '-'}</div>

              <div className="payment-complete-step__meta">
                <div>
                  <span className="payment-modal-label">결제 금액</span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
                <div>
                  <span className="payment-modal-label">결제수단</span>
                  <strong>{currentMethodLabel}</strong>
                </div>
              </div>
            </div>

            <button className="payment-modal-primary payment-complete-step__confirm" type="button" onClick={closePaymentModal}>
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
