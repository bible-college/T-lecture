// server/src/domains/distance/controllers/distance.controller.js
const distanceService = require('./distance.service');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const AppError = require('../../common/errors/AppError');

exports.getDistance = asyncHandler(async (req, res) => {
    const instructorId = Number(req.params.instructorId);
    const unitId = Number(req.params.unitId);

    if (!Number.isFinite(instructorId) || !Number.isFinite(unitId)) {
        throw new AppError('instructorId/unitId가 올바르지 않습니다.', 400, 'VALIDATION_ERROR');
    }

        const record = await distanceService.getDistance(instructorId, unitId);
        res.json(record);
});

exports.getUnitsWithinDistance = asyncHandler(async (req, res) => {
    const instructorId = Number(req.params.instructorId);
    const min = Number(req.query.min ?? 0);
    const max = Number(req.query.max ?? 999999);

    if (!Number.isFinite(instructorId) || !Number.isFinite(min) || !Number.isFinite(max)) {
        throw new AppError('파라미터가 올바르지 않습니다.', 400, 'VALIDATION_ERROR');
    }
    if (min < 0 || max < 0 || min > max) {
        throw new AppError('거리 범위(min/max)가 올바르지 않습니다.', 400, 'VALIDATION_ERROR');
    }

    const units = await distanceService.getUnitsWithinDistance(instructorId, min, max);
    res.json(units);
});

exports.getTodayUsage = asyncHandler(async (req, res) => {
    const usage = await distanceService.getTodayUsage();
    res.json(usage);
});

exports.runDailyBatchOnce = asyncHandler(async (req, res) => {
    const limit = Number(req.body?.limit ?? 200);
    if (!Number.isFinite(limit) || limit <= 0) {
        throw new AppError('limit은 1 이상의 숫자여야 합니다.', 400, 'VALIDATION_ERROR');
    }

    const result = await distanceService.calculateDistancesBySchedulePriority(limit);
    res.json(result);
});
