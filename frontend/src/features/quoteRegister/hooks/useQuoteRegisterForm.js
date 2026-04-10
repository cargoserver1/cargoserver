import { useState } from "react";
import { QUOTE_REGISTER_INITIAL_STATE } from "../constants/quoteRegisterInitialState";
import {
  validateQuoteStepRoute,
  validateQuoteStepCargo,
  validateAllSteps,
} from "../utils/quoteRegisterValidation";

export default function useQuoteRegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(QUOTE_REGISTER_INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [activePanel, setActivePanel] = useState(null);

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const openPanel = (panelName) => {
    setActivePanel(panelName);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  const goPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goNextStep = () => {
    let nextErrors = {};

    if (currentStep === 1) {
      nextErrors = validateQuoteStepRoute(formData);
    }

    if (currentStep === 2) {
      nextErrors = validateQuoteStepCargo(formData);
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return false;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
    setActivePanel(null);
    return true;
  };

  const convertWeightToKg = (weight, unit, needConsult) => {
    if (needConsult) return null;
    if (weight === "" || weight === null || weight === undefined) return null;

    const numericWeight = Number(weight);

    if (Number.isNaN(numericWeight)) return null;

    if (unit === "t") {
      return numericWeight * 1000;
    }

    return numericWeight;
  };

  const buildSubmitPayload = () => {
    const convertedWeight = convertWeightToKg(
      formData.weight,
      formData.weightUnit,
      formData.weightNeedConsult,
    );

    return {
      ...formData,

      // 중량은 서버 전송 시 kg 기준으로 통일
      weight: convertedWeight,
      weightUnit: convertedWeight === null ? null : "kg",

      // 운임 숫자 변환
      desiredPrice:
        formData.desiredPrice === "" || formData.desiredPrice === null
          ? null
          : Number(formData.desiredPrice),
    };
  };

  const submitForm = async () => {
    const finalErrors = validateAllSteps(formData);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      return false;
    }

    const payload = buildSubmitPayload();

    console.log("입력용 formData:", formData);
    console.log("서버 전송용 payload:", payload);

    // 실제 API 연결 시
    // await postQuote(payload);

    return true;
  };

  const resetForm = () => {
    setFormData(QUOTE_REGISTER_INITIAL_STATE);
    setErrors({});
    setCurrentStep(1);
    setActivePanel(null);
  };

  return {
    currentStep,
    formData,
    errors,
    activePanel,
    updateField,
    openPanel,
    closePanel,
    goPrevStep,
    goNextStep,
    submitForm,
    resetForm,
  };
}
