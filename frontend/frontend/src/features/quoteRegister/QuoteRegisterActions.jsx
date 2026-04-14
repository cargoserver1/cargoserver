export default function QuoteRegisterActions({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
  isCurrentStepValid,
}) {
  return (
    <div className="quote-register-actions">
      <div className="quote-register-actions-left">
        {currentStep > 1 && (
          <button type="button" className="secondary-button" onClick={onPrev}>
            이전
          </button>
        )}
      </div>

      <div className="quote-register-actions-right">
        {currentStep < totalSteps && (
          <button
            type="button"
            className="primary-button"
            onClick={onNext}
            disabled={!isCurrentStepValid}
          >
            다음
          </button>
        )}

        {currentStep === totalSteps && (
          <button type="button" className="primary-button" onClick={onSubmit}>
            견적 등록하기
          </button>
        )}
      </div>
    </div>
  );
}
