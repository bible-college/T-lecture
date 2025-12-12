// server/src/domains/auth/auth.controller.js
const authService = require('./auth.service');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const AppError = require('../../common/errors/AppError');
const logger = require('../../config/logger');

// 쿠키 옵션(설정/삭제 시 동일하게 맞추는 게 안전)
function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/', // clearCookie가 잘 먹게 path 고정
  };
}

// [인증번호 발송]
exports.sendCode = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) throw new AppError('이메일을 입력해주세요.', 400, 'VALIDATION_ERROR');

  const result = await authService.sendVerificationCode(email);
  res.status(200).json(result);
});

// [인증번호 검증]
exports.verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) throw new AppError('이메일과 인증번호를 입력해주세요.', 400, 'VALIDATION_ERROR');

  const result = await authService.verifyCode(email, code);
  res.status(200).json(result);
});

// [회원가입]
exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

// [로그인]
exports.login = asyncHandler(async (req, res) => {
  const { email, password, loginType, deviceId } = req.body || {};
  if (!email || !password) throw new AppError('이메일과 비밀번호를 입력해주세요.', 400, 'VALIDATION_ERROR');

  const result = await authService.login(email, password, loginType, deviceId);

  logger.info('[auth.login] success', { email, userId: result?.user?.id, loginType, deviceId });

  // ✅ 기존 코드의 ".getRefreshCookieOptions()" 문법 오류 제거
  res.cookie('refreshToken', result.refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

// [토큰 갱신]
exports.refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new AppError('Refresh token이 없습니다. 다시 로그인 해주세요.', 401, 'NO_REFRESH_TOKEN');
  }

  const result = await authService.refreshAccessToken(refreshToken);
  res.status(200).json(result);
});

// [로그아웃] (인증 필요: req.user.id 사용)
exports.logout = asyncHandler(async (req, res) => {
  const { deviceId } = req.body || {};
  const userId = req.user?.id;

  logger.info('[auth.logout]', { userId, deviceId: deviceId || 'unknown' });

  // 서비스 실패하더라도 “쿠키 제거”는 무조건 실행하는 게 실무적으로 안전
  try {
    await authService.logout(userId, deviceId);
  } catch (e) {
    logger.warn('[auth.logout] service failed (ignored)', { userId, message: e.message });
  }

  res.clearCookie('refreshToken', getRefreshCookieOptions());
  res.status(200).json({ message: '로그아웃 성공' });
});

// [비밀번호 재설정]
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    throw new AppError('필수 정보를 입력해주세요.', 400, 'VALIDATION_ERROR');
  }

  const result = await authService.resetPassword(email, code, newPassword);
  logger.info('[auth.resetPassword] success', { email });
  res.status(200).json(result);
});
