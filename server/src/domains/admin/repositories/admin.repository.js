// web/server/src/domains/admin/repositories/admin.repository.js
const prisma = require('../../../libs/prisma');

class AdminRepository {
  /**
   * 승인 대기(PENDING) 상태인 유저 목록 조회
   */
  async findPendingUsers() {
    return await prisma.user.findMany({
      where: { status: 'PENDING' },
      include: { instructor: true }, // 강사 정보 확인용
      orderBy: { id: 'desc' },
    });
  }

  /**
   * 특정 유저 조회 (Admin 로직용, 전체 필드 접근)
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { instructor: true },
    });
  }

  /**
   * 유저 정보 업데이트
   */
  async updateUser(id, data) {
    return await prisma.user.update({
      where: { id: Number(id) },
      data,
    });
  }

  /**
   * 다중 유저 상태 일괄 업데이트
   */
  async updateUsersStatusBulk(ids, status) {
    return await prisma.user.updateMany({
      where: {
        id: { in: ids },
        status: 'PENDING', // 현재 '승인 대기' 상태인 유저만 대상
      },
      data: { status },
    });
  }

  /**
   * 유저 및 관련 강사 정보 삭제 (트랜잭션)
   */
  async deleteUserWithInstructor(id) {
    return await prisma.$transaction(async (tx) => {
      // 강사 정보 삭제 (존재 시)
      await tx.instructor.deleteMany({
        where: { userId: Number(id) },
      });

      // 유저 정보 삭제
      return await tx.user.delete({
        where: { id: Number(id) },
      });
    });
  }

  /**
   * 다중 유저 및 관련 강사 정보 일괄 삭제 (트랜잭션)
   */
  async deleteUsersWithInstructorBulk(ids) {
    return await prisma.$transaction(async (tx) => {
      // 1. 삭제 대상 ID 필터링 ('PENDING' 상태인 유저만)
      const targets = await tx.user.findMany({
        where: {
          id: { in: ids },
          status: 'PENDING',
        },
        select: { id: true },
      });

      const targetIds = targets.map((u) => u.id);

      if (targetIds.length === 0) {
        return { count: 0 };
      }

      // 2. 연관된 강사 데이터(Instructor) 먼저 삭제
      await tx.instructor.deleteMany({
        where: { userId: { in: targetIds } },
      });

      // 3. 유저 데이터(User) 삭제
      const deletedUsers = await tx.user.deleteMany({
        where: { id: { in: targetIds } },
      });

      return deletedUsers;
    });
  }
}

module.exports = new AdminRepository();