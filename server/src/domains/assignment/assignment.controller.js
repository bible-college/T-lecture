// server/src/domains/assignment/assignment.controller.js
const assignmentService = require('./assignment.service');
const assignmentDTO = require('./assignment.dto');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const AppError = require('../../common/errors/AppError');
const logger = require('../../config/logger');

// [근무 이력 조회]
exports.getWorkHistory = asyncHandler(async (req, res) => {
  const history = await assignmentService.getWorkHistory(req.user.id);
  res.json(history);
});

// [배정 목록 조회]
exports.getAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getUpcomingAssignments(req.user.id);
  res.json(assignments);
});

// [임시 배정 응답]
exports.respondAssignment = asyncHandler(async (req, res) => {
  const { unitScheduleId } = req.params;
  const { response } = req.body || {};

  if (!unitScheduleId || !response) throw new AppError('필수 파라미터가 누락되었습니다.', 400, 'VALIDATION_ERROR');

  logger.info('[assignment.respondAssignment]', {
    userId: req.user.id,
    unitScheduleId,
    response,
  });

  const result = await assignmentService.respondToAssignment(req.user.id, unitScheduleId, response);
  res.json(result);
});

// [확정 배정 상세 조회]
exports.getAssignmentDetail = asyncHandler(async (req, res) => {
  const { unitScheduleId } = req.params;
  if (!unitScheduleId) throw new AppError('unitScheduleId가 필요합니다.', 400, 'VALIDATION_ERROR');

  const detail = await assignmentService.getAssignmentDetail(req.user.id, unitScheduleId);
  res.json(detail);
});

// 배정 후보 데이터 조회 (부대 + 강사)
exports.getCandidates = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query || {};
    if (!startDate || !endDate) throw new AppError('조회 기간이 필요합니다.', 400, 'VALIDATION_ERROR');

    logger.info('[assignment.getCandidates]', { startDate, endDate, userId: req.user?.id });

    // 1) Raw 조회
    const { unitsRaw, instructorsRaw } = await assignmentService.getAssignmentCandidatesRaw(startDate, endDate);

    // 2) UI 응답 형태로 변환 (DTO)
    const responseData = assignmentDTO.toCandidateResponse(unitsRaw, instructorsRaw);

    res.json(responseData);
});
