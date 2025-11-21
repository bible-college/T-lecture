// web/server/src/domains/admin/controllers/admin.controller.js
const adminService = require('../services/admin.service');

// [승인 대기 목록 조회]
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await adminService.getPendingUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [내 정보 조회]
exports.getMe = async (req, res) => {
  try {
    // 미들웨어(checkAuth)가 토큰에서 해석한 ID
    const adminId = req.user.id;
    const admin = await adminService.getMe(adminId);
    res.json(admin);
  } catch (error) {
    // 서비스에서 에러를 던진 경우 (예: 404)
    res.status(404).json({ error: error.message });
  }
};

// [유저 승인]
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body; // (선택)

    const result = await adminService.approveUser(userId, role);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// [일괄 승인]
exports.approveUsersBulk = async (req, res) => {
  try {
    const { userIds } = req.body;
    const result = await adminService.approveUsersBulk(userIds);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// [유저 승인 거절]
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await adminService.rejectUser(userId);
    res.json(result);
  } catch (error) {
    console.error(error);
    // 에러 메시지에 따라 상태 코드를 분기할 수 있으나, 편의상 400으로 처리
    res.status(400).json({ error: error.message });
  }
};

// [일괄 거절]
exports.rejectUsersBulk = async (req, res) => {
  try {
    const { userIds } = req.body;
    const result = await adminService.rejectUsersBulk(userIds);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};