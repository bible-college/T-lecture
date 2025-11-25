// client/src/features/auth/ui/RegisterForm.jsx

import React, { useState } from "react";
import { InputField } from "../../../shared/ui/InputField";
import { Button } from "../../../shared/ui/Button";
import {
  sendVerificationCode,
  verifyEmailCode,
  registerUser,
} from "../api/authApi";
import { useNavigate } from "react-router-dom";

export const RegisterForm = () => {
  const [userType, setUserType] = useState("INSTRUCTOR"); // INSTRUCTOR | USER
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    code: "",
    address: "", // 강사일 때만 사용
    hasCar: false, // 일단 상태만, 서버에는 아직 안 보냄
    agreed: false,
  });

  const [sendingCode, setSendingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendCode = async () => {
    try {
      setError("");
      setInfo("");
      if (!form.email) {
        setError("이메일을 먼저 입력해주세요.");
        return;
      }
      setSendingCode(true);
      await sendVerificationCode(form.email);
      setInfo("인증번호가 발송되었습니다. 이메일을 확인해주세요.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setError("");
      setInfo("");
      if (!form.email || !form.code) {
        setError("이메일과 인증번호를 모두 입력해주세요.");
        return;
      }
      setVerifyingCode(true);
      await verifyEmailCode(form.email, form.code);
      setCodeVerified(true);
      setInfo("이메일 인증이 완료되었습니다.");
    } catch (e) {
      setCodeVerified(false);
      setError(e.message);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!codeVerified) {
      setError("이메일 인증을 완료한 뒤 가입 신청이 가능합니다.");
      return;
    }
    if (!form.agreed) {
      setError("이용약관 및 개인정보 처리방침에 동의해주세요.");
      return;
    }
    if (userType === "INSTRUCTOR" && !form.address.trim()) {
      setError("강사 등록 시 거주지 주소는 필수입니다.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        email: form.email,
        password: form.password,
        name: form.name,
        phoneNumber: form.phoneNumber,
        address: userType === "INSTRUCTOR" ? form.address : undefined,
        type: userType, // "INSTRUCTOR" or "USER" → auth.service.register에서 사용
      };

      const result = await registerUser(payload);

      setInfo(result.message || "가입 신청이 완료되었습니다.");
      // 가입 신청 후 바로 로그인 화면으로 이동
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (e) {
      // 이미 등록된 이메일인 경우 등
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
          회원가입
        </h2>
        <p className="text-center text-gray-500 mb-8">
          푸른나무재단에 오신 것을 환영합니다.
        </p>

        {/* 안내/에러 메시지 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded">
            {info}
          </div>
        )}

        {/* 탭 버튼 (강사 / 일반) */}
        <div className="flex mb-8 border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              userType === "INSTRUCTOR"
                ? "border-b-2 border-green-500 text-green-600 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => setUserType("INSTRUCTOR")}
          >
            강사
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              userType === "USER"
                ? "border-b-2 border-green-500 text-green-600 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => setUserType("USER")}
          >
            일반
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputField
            label="이름"
            required
            placeholder="실명을 입력하세요"
            value={form.name}
            onChange={handleChange("name")}
          />
          <InputField
            label="아이디 (이메일)"
            required
            placeholder="example@btf.or.kr"
            value={form.email}
            onChange={handleChange("email")}
            hasBtn={sendingCode ? "발송중..." : "인증번호 발송"}
            onBtnClick={sendingCode ? undefined : handleSendCode}
          />
          <InputField
            label="인증번호"
            required
            placeholder="이메일로 받은 6자리 숫자를 입력하세요"
            value={form.code}
            onChange={handleChange("code")}
            hasBtn={verifyingCode ? "확인중..." : codeVerified ? "인증완료" : "인증확인"}
            onBtnClick={
              verifyingCode || codeVerified ? undefined : handleVerifyCode
            }
          />
          <InputField
            label="비밀번호"
            type="password"
            required
            placeholder="영문, 숫자, 특수문자 포함 8자 이상"
            value={form.password}
            onChange={handleChange("password")}
          />
          <InputField
            label="연락처"
            required
            placeholder="010-1234-5678"
            value={form.phoneNumber}
            onChange={handleChange("phoneNumber")}
          />

          {userType === "INSTRUCTOR" && (
            <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 text-sm text-gray-700">
                강사 활동 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    거주지 주소 *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                    placeholder="시/군/구까지 포함하여 입력하세요"
                    value={form.address}
                    onChange={handleChange("address")}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="car"
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    checked={form.hasCar}
                    onChange={handleChange("hasCar")}
                  />
                  <label htmlFor="car" className="text-sm text-gray-700">
                    자차 보유 및 운행 가능
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              checked={form.agreed}
              onChange={handleChange("agreed")}
              required
            />
            <span className="text-sm text-gray-600">
              [필수] 이용약관 및 개인정보 처리방침에 동의합니다.
            </span>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              fullWidth
              variant="primary"
              disabled={submitting}
            >
              {submitting ? "가입 신청 중..." : "가입 신청"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
