const express = require('express');
const router = express.Router();
const adminController = require('../../domains/admin/controllers/admin.controller');
const { checkAuth, checkAdmin } = require('../../common/middlewares');

// 관리자만 접근 가능하도록 미들웨어 적용
router.use(checkAuth);
router.use(checkAdmin); 

// 승인 대기 목록 조회
router.get('/users/pending', adminController.getPendingUsers);

// [신규] 일괄 승인 (PATCH /api/v1/admin/users/bulk-approve)
router.patch('/users/bulk-approve', adminController.approveUsersBulk);

// (참고) 기존 단일 승인 라우트가 있다면 순서에 주의하세요.
// :userId 처럼 파라미터가 있는 라우트보다, 고정된 경로(bulk-approve)를 위에 두는 것이 안전합니다.

// 유저 승인 (PATCH /api/v1/admin/users/:userId/approve)
router.patch('/users/:userId/approve', adminController.approveUser);

// [신규] 내 정보 조회 (GET /api/v1/admin/me)
router.get('/me', adminController.getMe);

module.exports = router;