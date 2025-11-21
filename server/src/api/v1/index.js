// src/api/v1/index.js
const express = require('express');
const userRoutes = require('./user.routes');
const unitRoutes = require('./unit.routes');
const distanceRoutes = require('./distance.routes');

// ✅ [추가 1] 방금 만든 스케줄 라우터 파일 불러오기
const scheduleRoutes = require('./schedule.routes');

const router = express.Router();

// /api/v1/users
router.use('/users', userRoutes);

// /api/v1/locations
router.use('/units', unitRoutes);

// /api/v1/distances
router.use('/distances', distanceRoutes);

// ✅ [추가 2] 스케줄 라우터 등록하기
// 이제 주소는 "/api/v1/schedules/availability" 가 됩니다.
router.use('/schedules', scheduleRoutes);

module.exports = router;
