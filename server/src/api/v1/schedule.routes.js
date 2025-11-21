const express = require('express');
const router = express.Router();

// ✅ 중요: modules가 아니라 'domains' 폴더를 바라보게 했습니다.
const scheduleController = require('../../domains/schedule/controllers/schedule.controller');

// === 스케줄(캘린더) 라우터 ===

// 1. 스케줄 등록 (POST)
router.post('/availability', scheduleController.submitAvailability);

// 2. 내 스케줄 조회 (GET)
router.get('/availability', scheduleController.getAvailability);

module.exports = router;