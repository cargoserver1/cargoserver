import React, { useMemo, useState } from "react";
import {
  confirmPasswordReset,
  sendPasswordResetCode,
  verifyPasswordResetCode,
} from "../api";
import "./LoginPage.css";

const ForgotPasswordPage = ({ controller }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [step, setStep] = useState(1);

  const passwordMatched = useMemo(() => {
    return confirmPassword && newPassword === confirmPassword;
  }, [confirmPassword, newPassword]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      alert("이메일을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const data = await sendPasswordResetCode(email.trim());
      setStatusMessage(data.message || "인증코드를 확인해주세요.");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || "인증코드 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      alert("인증코드를 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const data = await verifyPasswordResetCode(email.trim(), code.trim());
      setResetToken(data.resetToken || "");
      setStatusMessage(data.message || "인증이 완료되었습니다.");
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || "인증코드 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      alert("새 비밀번호를 입력해주세요");
      return;
    }
    if (!confirmPassword) {
      alert("비밀번호 확인을 입력해주세요");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다");
      return;
    }
    if (!resetToken) {
      alert("이메일 인증을 먼저 완료해주세요");
      return;
    }

    try {
      setLoading(true);
      const data = await confirmPasswordReset(email.trim(), resetToken, newPassword);
      alert(data.message || "비밀번호가 변경되었습니다.");
      controller.setRoutePage("login");
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">비밀번호 찾기</h2>
        <div className="login-hint">
          이메일 인증코드를 받아 확인한 뒤 새 비밀번호로 변경할 수 있습니다.
        </div>

        <label className="login-label">이메일</label>
        <input
          type="email"
          className="login-input"
          placeholder="가입한 이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step > 1}
        />

        <button className="login-button" onClick={handleSendCode} disabled={loading}>
          {loading && step === 1 ? "전송 중..." : step > 1 ? "인증코드 재전송" : "인증코드 보내기"}
        </button>

        {statusMessage ? <div className="login-hint">{statusMessage}</div> : null}

        {step >= 2 && (
          <>
            <label className="login-label">인증코드</label>
            <input
              className="login-input"
              placeholder="이메일로 받은 6자리 코드를 입력하세요"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            />

            <button className="login-button" onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
              {loading && step === 2 ? "확인 중..." : "인증코드 확인"}
            </button>
          </>
        )}

        {step >= 3 && (
          <>
            <label className="login-label">새 비밀번호</label>
            <input
              type="password"
              className="login-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
            />

            <label className="login-label">비밀번호 확인</label>
            <input
              type="password"
              className="login-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
            />

            {confirmPassword ? (
              <div
                style={{
                  color: passwordMatched ? "green" : "red",
                  fontSize: "12px",
                  marginTop: "5px",
                }}
              >
                {passwordMatched ? "비밀번호가 일치합니다" : "비밀번호가 일치하지 않습니다"}
              </div>
            ) : null}

            <button className="login-button" onClick={handleResetPassword} disabled={loading}>
              {loading ? "변경 중..." : "새 비밀번호로 변경"}
            </button>
          </>
        )}

        <div className="back-to-main" onClick={() => controller.setRoutePage("login")}>
          로그인으로 돌아가기
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
