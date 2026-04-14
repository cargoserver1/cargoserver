import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";
import { API_BASE_URL } from "../api";

const ShipperSignupPage = ({ controller }) => {
    const [confirmPassword, setConfirmPassword] = useState("");

    const [form, setForm] = useState({
        email: "",
        password: "",
        name: "",
        phone: "",
        companyName: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = async () => {
        if (!form.email) {
            alert("이메일을 입력해주세요");
            return;
        }

        if (!form.email.includes("@")) {
            alert("올바른 이메일 형식이 아닙니다");
            return;
        }

        if (!form.password) {
            alert("비밀번호를 입력해주세요");
            return;
        }

        if (!confirmPassword) {
            alert("비밀번호 확인을 입력해주세요");
            return;
        }

        if (form.password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다");
            return;
        }

        if (!form.name) {
            alert("이름을 입력해주세요");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/signup`, {
                ...form,
                role: "SHIPPER"
            });

            alert("회원가입 성공!");
            controller.setRoutePage("login");

        } catch (err) {
            alert("회원가입 실패: " + (err.response?.data?.message || "오류 발생"));
        }
    };

    return (
        <>
            {/* 이메일 필수 */}
            <label className="login-label">
                이메일 <span className="required">*</span>
            </label>
            <input
                className="login-input"
                name="email"
                value={form.email}
                onChange={handleChange}
            />

            {/* 비밀번호 필수 */}
            <label className="login-label">
                비밀번호 <span className="required">*</span>
            </label>
            <input
                type="password"
                className="login-input"
                name="password"
                value={form.password}
                onChange={handleChange}
            />

            <div className="label-row">
                <label className="login-label">
                    비밀번호 확인 <span className="required">*</span>
                </label>

                {confirmPassword && (
                    <span
                        className={`password-check ${form.password === confirmPassword ? "success" : "error"
                            }`}
                    >
                        {form.password === confirmPassword
                            ? "일치합니다"
                            : "일치하지 않습니다"}
                    </span>
                )}
            </div>

            <input
                type="password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* 이름 필수 */}
            <label className="login-label">
                이름 <span className="required">*</span>
            </label>
            <input
                className="login-input"
                name="name"
                value={form.name}
                onChange={handleChange}
            />

            {/* 전화번호 선택 */}
            <label className="login-label">전화번호</label>
            <input
                className="login-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
            />

            {/* 회사명 선택 */}
            <label className="login-label">회사명</label>
            <input
                className="login-input"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
            />

            <button className="login-button" onClick={handleSignup}>
                회원가입
            </button>
        </>
    );
};

export default ShipperSignupPage;