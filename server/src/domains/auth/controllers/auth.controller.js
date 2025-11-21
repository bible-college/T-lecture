const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    // req.body: { email, password, name, role, address, ... }
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    // 400 Bad Request: 중복 이메일, 주소 누락 등
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    // 401 Unauthorized: 로그인 실패
    res.status(401).json({ error: error.message });
  }
};

// [신규] POST /forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('이메일을 입력해주세요.');

    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// [신규] POST /reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw new Error('잘못된 요청입니다.');

    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};