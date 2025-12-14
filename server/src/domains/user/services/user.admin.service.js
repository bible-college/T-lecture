// server/src/domains/user/services/user.admin.service.js

const adminRepository = require('../repositories/user.admin.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../../../common/errors/AppError');

// ✅ Prisma enum(UserStatus) import 없이도 검증 가능하도록 허용값을 직접 선언
const ALLOWED_USER_STATUS = ['PENDING', 'APPROVED', 'RESTING', 'INACTIVE'];

function parseBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    return false;
}

// 🚨 FIX: 응답 객체에서 password와 admin 정보를 제거하고, 강사 정보는 남깁니다.
function mapUserForAdmin(user) {
    if (!user) return null;
    const { password, admin, instructor, ...rest } = user; // password와 admin을 제거
    
    // 강사 정보가 null이 아니면 instructor 필드를 포함
    if (instructor) {
        return { instructor, ...rest };
    }
    
    // 강사 정보가 null이면 instructor 필드 없이 나머지 필드만 반환
    return rest; 
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

function assertDtoObject(dto) {
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
        throw new AppError('요청 바디 형식이 올바르지 않습니다.', 400, 'INVALID_BODY');
    }
}

function assertStringOrUndefined(value, fieldName) {
    if (value === undefined) return;
    if (value === null) return; // null 허용 정책이면 유지 (원치 않으면 여기서 막아도 됨)
    if (typeof value !== 'string') {
        throw new AppError(`${fieldName}는 문자열이어야 합니다.`, 400, 'INVALID_INPUT');
    }
}

function assertValidStatusOrUndefined(status) {
    if (status === undefined) return;
    if (typeof status !== 'string') {
        throw new AppError('status는 문자열이어야 합니다.', 400, 'INVALID_STATUS');
    }
    if (!ALLOWED_USER_STATUS.includes(status)) {
        throw new AppError(
            `유효하지 않은 status 입니다. allowed: ${ALLOWED_USER_STATUS.join(', ')}`,
            400,
            'INVALID_STATUS'
        );
    }
}

class AdminService {
    async getAllUsers(query) {
        const filters = normalizeFilters(query);
        const users = await adminRepository.findAll(filters);

        return users.map(mapUserForAdmin); // ✅ mapUserForAdmin 적용
    }

    async getPendingUsers() {
        const users = await adminRepository.findAll({ status: 'PENDING' });
        return users.map(mapUserForAdmin); // ✅ mapUserForAdmin 적용
    }

    async getUserById(id) {
        // userRepository.findById는 admin을 포함하지 않지만, 강사 정보는 포함합니다.
        const user = await userRepository.findById(id); 
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        return mapUserForAdmin(user); // ✅ mapUserForAdmin 적용
    }

    async updateUser(id, dto) {
        assertDtoObject(dto);

        const { name, phoneNumber, status, address, isTeamLeader } = dto;

        // ✅ 입력 검증(Prisma 500 방지)
        assertStringOrUndefined(name, 'name');
        assertStringOrUndefined(phoneNumber, 'phoneNumber');
        assertStringOrUndefined(address, 'address');
        assertValidStatusOrUndefined(status);

        if (isTeamLeader !== undefined && typeof isTeamLeader !== 'boolean') {
            throw new AppError('isTeamLeader는 boolean이어야 합니다.', 400, 'INVALID_INPUT');
        }

        // ✅ 수정할 값이 하나도 없으면 400 (원하면 200 no-op로 바꿔도 됨)
        const hasAny =
            name !== undefined ||
            phoneNumber !== undefined ||
            status !== undefined ||
            address !== undefined ||
            isTeamLeader !== undefined;

        if (!hasAny) {
            throw new AppError('수정할 값이 없습니다.', 400, 'NO_UPDATE_FIELDS');
        }

        // 1. 유저 정보 조회 (강사 여부 확인용)
        const user = await userRepository.findById(id);
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        // 2. User 테이블 수정 데이터
        const userData = {};
        if (name !== undefined) userData.name = name;
        if (phoneNumber !== undefined) userData.userphoneNumber = phoneNumber;
        if (status !== undefined) userData.status = status;

        // 3. Instructor 테이블 수정 데이터 (강사일 때만)
        const instructorData = {};
        const isInstructor = !!user.instructor;

        if (isInstructor) {
            if (address !== undefined) {
                instructorData.location = address;
                instructorData.lat = null;
                instructorData.lng = null;
            }
            if (typeof isTeamLeader === 'boolean') {
                instructorData.isTeamLeader = isTeamLeader;
            }
        }

        const updatedUser = await userRepository.update(id, userData, instructorData);
        
        return mapUserForAdmin(updatedUser); // ✅ mapUserForAdmin 적용
    }

    async deleteUser(id) {
        const user = await userRepository.findById(id);
        if (!user) throw new AppError('해당 회원을 찾을 수 없습니다.', 404, 'USER_NOT_FOUND');

        await userRepository.delete(id);
        return { message: '회원이 삭제되었습니다.' };
    }

    async approveUser(userId) {
        // adminRepository.updateUserStatus는 instructor와 admin을 모두 포함하여 반환합니다.
        const updatedUser = await adminRepository.updateUserStatus(userId, 'APPROVED');
        
        return {
            message: '승인 처리가 완료되었습니다.',
            user: mapUserForAdmin(updatedUser), // ✅ mapUserForAdmin 적용
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