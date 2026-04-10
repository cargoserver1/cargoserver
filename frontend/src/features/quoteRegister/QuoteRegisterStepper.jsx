import "./quoteRegister.css";

export default function QuoteRegisterStepper({ steps = [], currentStep = 1 }) {
  return (
    <div className="quote-stepper-wrap">
      <ol className="quote-stepper" aria-label="견적 등록 단계">
        {steps.map((step, index) => {
          let stepClassName = "upcoming";

          if (step.id < currentStep) {
            stepClassName = "done";
          } else if (step.id === currentStep) {
            stepClassName = "active";
          }

          return (
            <li
              key={step.id}
              className={`quote-stepper-item ${stepClassName}`}
              aria-current={step.id === currentStep ? "step" : undefined}
            >
              {/* 연결선 */}
              {index !== steps.length - 1 && (
                <span className="quote-stepper-line" aria-hidden="true" />
              )}

              {/* 원형 노드 */}
              <span className="quote-stepper-node" aria-hidden="true">
                <span className="quote-stepper-node-inner" />
              </span>

              {/* 텍스트 */}
              <div className="quote-stepper-text">
                <span className="quote-stepper-label">
                  {step.id === currentStep && (
                    <em className="sr-only">현재 단계 </em>
                  )}
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
