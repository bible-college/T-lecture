// server/src/domains/assignment/assignment.service.js
const assignmentRepository = require('./assignment.repository');
const unitRepository = require('../unit/unit.repository');
const instructorRepository = require('../instructor/instructor.repository');

const AppError = require('../../common/errors/AppError');

class AssignmentService {
    /**
     * 배정 후보 데이터 조회 (Raw Data 반환)
     * - 순수하게 DB 데이터만 가져옴
     */
    async getAssignmentCandidatesRaw(startDate, endDate) {
        const unitsRaw = await unitRepository.findWithSchedules(startDate, endDate);
        const instructorsRaw = await instructorRepository.findAvailableInPeriod(startDate, endDate);
        return { unitsRaw, instructorsRaw };
    }

    /**
     * 임시 배정 응답 (동시성 제어 적용)
     */
    async respondToAssignment(instructorId, unitScheduleId, response) {
        let updateData = {};

        const upper = String(response).toUpperCase();
        if (upper === 'ACCEPT') updateData = { classification: 'Confirmed' };
        else if (upper === 'REJECT') updateData = { state: 'Canceled' };
        else throw new AppError('잘못된 응답입니다. (ACCEPT 또는 REJECT)', 400, 'VALIDATION_ERROR');

        const result = await assignmentRepository.updateAssignmentStatusCondition(
        instructorId,
        unitScheduleId,
        updateData
        );

        if (!result || result.count === 0) {
        // 이미 누가 처리했거나 조건(Confirmed/Canceled 등)에 맞지 않음
        throw new AppError('이미 처리되었거나 유효하지 않은 배정입니다.', 409, 'ASSIGNMENT_CONFLICT');
        }

        return { message: upper === 'ACCEPT' ? '배정을 수락했습니다.' : '배정을 거절했습니다.' };
    }

    async getWorkHistory(instructorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return assignmentRepository.findAssignments(instructorId, {
        classification: 'Confirmed',
        state: 'Active',
        UnitSchedule: { date: { lt: today } },
        });
    }

    async getUpcomingAssignments(instructorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return assignmentRepository.findAssignments(instructorId, {
        state: 'Active',
        UnitSchedule: { date: { gte: today } },
        });
    }

    async getAssignmentDetail(instructorId, unitScheduleId) {
        const assignment = await assignmentRepository.findAssignmentByScheduleId(instructorId, unitScheduleId);
        if (!assignment) throw new AppError('배정 정보를 찾을 수 없습니다.', 404, 'ASSIGNMENT_NOT_FOUND');

        // “확정+활성”만 상세 허용(정책이면)
        if (assignment.classification !== 'Confirmed' || assignment.state !== 'Active') {
        throw new AppError('확정된 배정 일정만 상세 정보를 조회할 수 있습니다.', 403, 'ASSIGNMENT_FORBIDDEN');
        }

        return assignment;
    }
}

module.exports = new AssignmentService();
