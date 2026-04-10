import React, { useState } from "react";
import "./LoginPage.css";
import ShipperSignupForm from "./ShipperSignupForm";
import DriverSignupForm from "./DriverSignupForm";

const SignupPage = ({ controller }) => {
    const [selectedRole, setSelectedRole] = useState(null);

    const handleSelectRole = (role) => {
        controller.setSignupForm({
            ...controller.signupForm,
            role,
        });

        console.log("선택된 역할:", role);
    };

    return (
        <div className="signup-wrapper">

            {/* 왼쪽 브랜딩 영역 */}
            <div className="signup-left">
                <div className="signup-left-content">
                    <h1>입찰부터 관리까지<br />한 번에 경험해보세요</h1>
                    <p>
                        WANT는 입찰부터 실시간 배송 현황까지<br />
                        한 번에 확인할 수 있습니다.
                    </p>
                </div>
            </div>

            {/* 오른쪽 선택 영역 */}
            <div className="signup-right">
                {/* 제목 */}
                <div className="signup-header">
                    <h2 className="login-title">회원가입</h2>
                    <p className="signup-subtitle">
                        여정을 시작할 역할을 선택하세요
                    </p>
                </div>

                <div className="signup-card-container">

                    <div
                        className={`signup-card ${selectedRole === "SHIPPER" ? "active" : ""}`}
                        onClick={() => setSelectedRole("SHIPPER")}
                    >
                        <div className="signup-card-title">화주</div>
                        <div className="signup-card-desc">
                            화물 운송을 <br />
                            의뢰하는 기업 또는 개인
                        </div>
                    </div>

                    <div
                        className={`signup-card ${selectedRole === "DRIVER" ? "active" : ""}`}
                        onClick={() => setSelectedRole("DRIVER")}
                    >
                        <div className="signup-card-title">차주</div>
                        <div className="signup-card-desc">
                            전문적인 화물 운송 서비스를 제공하는 운송 사업자
                        </div>
                    </div>

                </div>

                {/* 선택된 폼 영역 */}
                <div className={`signup-form-area ${!selectedRole ? "disabled" : ""}`}>

                    {selectedRole === "SHIPPER" && (
                        <ShipperSignupForm controller={controller} />
                    )}

                    {selectedRole === "DRIVER" && (
                        <DriverSignupForm controller={controller} />
                    )}
                </div>

                {/* 뒤로가기 */}
                <div
                    className="back-to-main signup-back"
                    onClick={() => controller.setRoutePage("login")}
                >
                    로그인으로 돌아가기
                </div>

            </div>
        </div>
    );
};

export default SignupPage;