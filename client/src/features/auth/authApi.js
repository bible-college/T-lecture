// client/src/features/auth/authApi.js
import { apiClient } from "../../shared/apiClient";
import { getDeviceId } from '../../shared/utils/deviceId';

// 1. 로그인 (토큰 갱신 로직 불필요 -> skipInterceptor: true)
export async function login({ email, password, loginType }) {
  const deviceId = getDeviceId();
  const res = await apiClient("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, loginType, deviceId }),
    skipInterceptor: true, 
  });
  return res.json();
}

// 2. 인증번호 발송 (Public)
export async function sendVerificationCode(email) {
  const res = await apiClient("/api/v1/auth/code/send", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipInterceptor: true,
  });
  return res.json();
}

// 3. 인증번호 확인 (Public)
export async function verifyEmailCode(email, code) {
  const res = await apiClient("/api/v1/auth/code/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    skipInterceptor: true,
  });
  return res.json();
}

// 4. 회원가입 (Public)
export async function registerUser(payload) {
  const res = await apiClient("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipInterceptor: true,
  });
  return res.json();
}

// 5. 메타데이터 조회 (이건 로그인 후 쓸 수도 있으니 토큰 로직 태워도 됨)
export async function getInstructorMeta() {
  const res = await apiClient("/api/v1/metadata/instructor");
  return res.json();
}

export const logout = async () => {
    const deviceId = getDeviceId(); // 현재 기기 ID
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ deviceId }), // [추가] 기기 ID 전송
    });
    
    // 로컬 스토리지 클리어 (토큰 삭제)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    // 주의: deviceId는 지우면 안 됨! (기기 고유값이므로 유지)
};