// web/server/src/domains/admin/services/admin.service.js
const adminRepository = require('../repositories/admin.repository');
const userRepository = require('../../user/repositories/user.repository'); // 내 정보 조회 시 재사용

class AdminService {
  /**
   * 승인 대기 유저 목록 조회
   */
  async getPendingUsers() {
    return await adminRepository.findPendingUsers();
  }

  /**
   * 관리자 내 정보 조회
   */
  async getMe(adminId) {
    const admin = await userRepository.findById(adminId);
    if (!admin) {
      throw new Error('관리자 정보를 찾을 수 없습니다.');
    }
    return admin;
  }

  /**
   * 유저 승인 처리
   */
  async approveUser(userId, role) {
    // 1. 변경할 데이터 준비 (기본은 상태만 승인)
    const updateData = { status: 'APPROVED' };

    // 2. 역할 변경 요청이 있다면 포함
    if (role && ['ADMIN', 'INSTRUCTOR', 'USER'].includes(role)) {
      updateData.role = role;
    }

    const updatedUser = await adminRepository.updateUser(userId, updateData);

    return {
      message: '승인 처리가 완료되었습니다.',
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    };
  }

  /**
   * 유저 일괄 승인 처리
   */
  async approveUsersBulk(userIds) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('승인할 유저 ID 목록(배열)이 필요합니다.');
    }

    const result = await adminRepository.updateUsersStatusBulk(userIds, 'APPROVED');

    return {
      message: `${result.count}명의 유저가 승인되었습니다.`,
      count: result.count,
    };
  }

  /**
   * 유저 승인 거절 (삭제)
   */
  async rejectUser(userId) {
    const id = Number(userId);

    // 1. 유저 존재 및 상태 확인
    const user = await adminRepository.findById(id);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // '승인 대기' 상태인 경우에만 거절 가능
    if (user.status !== 'PENDING') {
      throw new Error('승인 대기 중인 사용자만 거절할 수 있습니다.');
    }

    // 2. 데이터 삭제
    await adminRepository.deleteUserWithInstructor(id);

    return { message: '회원가입 요청을 거절하고 데이터를 삭제했습니다.' };
  }

  /**
   * 유저 일괄 거절 (삭제)
   */
  async rejectUsersBulk(userIds) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('거절할 유저 ID 목록(배열)이 필요합니다.');
    }

    const result = await adminRepository.deleteUsersWithInstructorBulk(userIds);

    return {
      message: `${result.count}명의 가입 요청을 거절(삭제)했습니다.`,
      count: result.count,
    };
  }
}

module.exports = new AdminService();