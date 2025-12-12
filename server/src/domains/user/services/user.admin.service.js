// server/src/domains/user/services/user.admin.service.js
const adminRepository = require('../repositories/user.admin.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../../../common/errors/AppError');

function parseBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    return false;
}

function normalizeFilters(query = {}) {
    const filters = { ...query };

    // status 기본값 (기존 정책 유지)
    if (!filters.status) filters.status = 'APPROVED';
    if (filters.status === 'ALL') delete filters.status;

    // name 검색
    if (filters.name !== undefined && filters.name !== null && String(filters.name).trim() === '') {
        delete filters.name;
    }

    // role → repo가 이해하는 형태로 변환
    // 지원: role=ADMIN | INSTRUCTOR | ALL
    const role = (filters.role || '').toString().toUpperCase();
    if (role === 'ADMIN') {
        filters.onlyAdmins = true;
        delete filters.onlyInstructors;
    } else if (role === 'INSTRUCTOR') {
        filters.onlyInstructors = true;
        delete filters.onlyAdmins;
    } else if (role === 'ALL' || role === '') {
        // 아무 것도 안 함
    }

    // querystring "true"/"false" 처리
    if (filters.onlyAdmins !== undefined) filters.onlyAdmins = parseBool(filters.onlyAdmins);
    if (filters.onlyInstructors !== undefined) filters.onlyInstructors = parseBool(filters.onlyInstructors);

    // repo에 필요없는 키 제거 (실수 방지)
    delete filters.role;

    return filters;
}

class AdminService {
    async getAllUsers(query) {
        const filters = normalizeFilters(query);
        const users = await adminRepository.findAll(filters);

        return users.map((user) => {
        const { password, ...rest } = user;
        return rest;
        });
    }

    async getPendingUsers() {
        const users = await adminRepository.findAll({ status: 'PENDING' });
        return users.map((user) => {
        const { password, ...rest } = user;
        return rest;
        });
    }

    async getUserById(id) {
        const user = await userRepository.findById(id);
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        const { password, ...rest } = user;
        return rest;
    }

    async updateUser(id, dto) {
        const { name, phoneNumber, status, address, isTeamLeader } = dto;

        const userData = {};
        if (name !== undefined) userData.name = name;
        if (phoneNumber !== undefined) userData.userphoneNumber = phoneNumber;
        if (status !== undefined) userData.status = status;

        const instructorData = {};
        if (address !== undefined) {
        instructorData.location = address;
        instructorData.lat = null;
        instructorData.lng = null;
        }
        if (typeof isTeamLeader === 'boolean') {
        instructorData.isTeamLeader = isTeamLeader;
        }

        const updatedUser = await userRepository.update(id, userData, instructorData);
        const { password, ...rest } = updatedUser;
        return rest;
    }

    async deleteUser(id) {
        const user = await userRepository.findById(id);
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        await userRepository.delete(id);
        return { message: '회원이 삭제되었습니다.' };
    }

    async approveUser(userId) {
        const updatedUser = await adminRepository.updateUserStatus(userId, 'APPROVED');
        const { password, ...rest } = updatedUser;

        return {
        message: '승인 처리가 완료되었습니다.',
        user: rest,
        };
    }

    async approveUsersBulk(userIds) {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('승인할 유저 ID 목록(배열)이 필요합니다.', 400, 'INVALID_INPUT');
        }

        const result = await adminRepository.updateUsersStatusBulk(userIds, 'APPROVED');

        return {
        message: `${result.count}명의 유저가 승인되었습니다.`,
        count: result.count,
        };
    }

    async rejectUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError('사용자를 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');
        if (user.status !== 'PENDING') {
        throw new AppError('승인 대기 중인 사용자만 거절할 수 있습니다.', 400, 'INVALID_STATUS');
        }

        await userRepository.delete(userId);
        return { message: '회원가입 요청을 거절하고 데이터를 삭제했습니다.' };
    }

    async rejectUsersBulk(userIds) {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('거절할 유저 ID 목록(배열)이 필요합니다.', 400, 'INVALID_INPUT');
        }

        const result = await adminRepository.deleteUsersBulk(userIds);

        return {
        message: `${result.count}명의 가입 요청을 거절(삭제)했습니다.`,
        count: result.count,
        };
    }

    async setAdminLevel(userId, level = 'GENERAL') {
        const normalized = (level || 'GENERAL').toString().toUpperCase();
        if (!['GENERAL', 'SUPER'].includes(normalized)) {
        throw new AppError('잘못된 관리자 레벨입니다.', 400, 'INVALID_ADMIN_LEVEL');
        }

        const user = await userRepository.findById(userId);
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        const admin = await adminRepository.upsertAdmin(userId, normalized);

        return {
        message: '관리자 권한이 설정되었습니다.',
        userId: Number(userId),
        adminLevel: admin.level,
        };
    }

    async revokeAdminLevel(userId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        await adminRepository.removeAdmin(userId);

        return {
        message: '관리자 권한이 해제되었습니다.',
        userId: Number(userId),
        };
    }
}

module.exports = new AdminService();
