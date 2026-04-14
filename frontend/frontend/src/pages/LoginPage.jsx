import React from "react";
import "./LoginPage.css";

const LoginPage = ({ controller }) => {

    const { loginForm, setLoginForm, handleLogin } = controller;

    const handleClickLogin = async () => {
        const success = await controller.handleLogin();
        if (success) {
            controller.setRoutePage("main"); // 로그인 성공 시 바로 이동
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">

                {/* 제목 */}
                <h2 className="login-title">로그인</h2>

                {/* 이메일 */}
                <label className="login-label">이메일</label>
                <input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="login-input"
                    value={loginForm.email}
                    onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                    }
                />

                {/* 비밀번호 */}
                <label className="login-label">비밀번호</label>
                <input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    className="login-input"
                    value={loginForm.password}
                    onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                    }
                />

                {/* 샘플 계정 안내 */}
                <div className="login-hint">
                    샘플 계정: shipper@test.com / driver@test.com / admin@test.com · 비밀번호 1111
                </div>

                {/* 옵션 영역 */}
                <div className="login-options">
                    <label className="checkbox-label">
                        <input type="checkbox" />
                        로그인 유지
                    </label>
                    <div
                        className="find-password"
                        onClick={() => controller.setRoutePage("forgot-password")}
                    >
                        비밀번호 찾기
                    </div>
                </div>

                <button
                    className="login-button"
                    onClick={handleClickLogin}
                >
                    로그인
                </button>

                {/* 구분 */}
                <div className="divider">
                    <span>또는 소셜 계정으로 로그인</span>
                </div>

                {/* 카카오 로그인 */}
                <button className="kakao-button">카카오 로그인</button>

                {/* 회원가입 */}
                <div className="signup">
                    계정이 없으신가요?{" "}
                    <span
                        className="signup-link"
                        onClick={() => controller.setRoutePage("signup")}
                    >
                        회원가입
                    </span>
                </div>

                {/* 메인 페이지 이동 (링크 스타일) */}
                <div
                    className="back-to-main"
                    onClick={() => {
                        controller.setRoutePage("main");
                    }}
                >
                    메인 페이지로 이동
                </div>

            </div>
        </div>
    );
};

export default LoginPage;