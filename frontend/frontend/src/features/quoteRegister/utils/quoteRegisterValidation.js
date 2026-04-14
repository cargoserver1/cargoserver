export function validateQuoteStepRoute(formData = {}) {
  const errors = {};

  if (!(formData.estimateName || "").trim()) {
    errors.estimateName = "제목을 입력해주세요.";
  }

  if (!(formData.originAddress || "").trim()) {
    errors.originAddress = "출발지를 입력해주세요.";
  }

  if (!(formData.destinationAddress || "").trim()) {
    errors.destinationAddress = "도착지를 입력해주세요.";
  }

  if (!(formData.transportDate || "").trim()) {
    errors.transportDate = "운송일자를 선택해주세요.";
  }

  if (!(formData.transportTime || "").trim()) {
    errors.transportDate = "운송시간을 선택해주세요.";
  }

  return errors;
}

export function validateQuoteStepCargo(formData = {}) {
  const errors = {};

  const vehicleType = (formData.vehicleType || "").trim();
  const cargoType = (formData.cargoType || "").trim();
  const cargoName = (formData.cargoName || "").trim();
  const weight = (formData.weight || "").trim();

  const vehicleNeedConsult = !!formData.vehicleNeedConsult;
  const weightNeedConsult = !!formData.weightNeedConsult;
  const weightUnit = formData.weightUnit || "kg";
  const desiredPrice = (formData.desiredPrice || "").trim();

  if (!vehicleNeedConsult && !vehicleType) {
    errors.vehicleType = "차량을 선택해주세요.";
  }

  if (!cargoType) {
    errors.cargoType = "화물 종류를 선택해주세요.";
  }

  if (!cargoName) {
    errors.cargoName = "화물명을 입력해주세요.";
  }

  if (!weightNeedConsult) {
    if (!weight) {
      errors.weight = "중량을 입력해주세요.";
    } else if (weightUnit === "kg") {
      if (!/^\d+$/.test(weight)) {
        errors.weight = "kg는 정수만 입력 가능합니다.";
      }
    } else if (weightUnit === "t") {
      // 343. 은 불가, 343 또는 343.1만 허용
      if (!/^\d+(\.\d{1})?$/.test(weight)) {
        errors.weight = "t는 소수점 한 자리까지 입력 가능합니다.";
      }
    }
  }

  // 희망 운임
  if (!desiredPrice) {
    errors.desiredPrice = "희망 운임을 입력해주세요.";
  } else if (!/^\d+$/.test(desiredPrice)) {
    errors.desiredPrice = "희망 운임은 숫자만 입력 가능합니다.";
  }

  return errors;
}

export function validateAllSteps(formData = {}) {
  return {
    ...validateQuoteStepRoute(formData),
    ...validateQuoteStepCargo(formData),
  };
}
