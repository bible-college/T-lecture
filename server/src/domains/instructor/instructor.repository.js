
// server/src/domains/instructor/repositories/instructor.repository.js

/*const prisma = require('../../libs/prisma');

class InstructorRepository {

  // 특정 기간의 근무 가능일 조회 
  async findAvailabilities(instructorId, startDate, endDate) {
    return await prisma.instructorAvailability.findMany({
      where: {
        instructorId: Number(instructorId),
        availableOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { availableOn: 'asc' },
    });
  }

  // 근무 가능일 일괄 업데이트 (덮어쓰기) 
  async replaceAvailabilities(instructorId, startDate, endDate, newDates) {
    return await prisma.$transaction(async (tx) => {
      // 기존 데이터 삭제
      await tx.instructorAvailability.deleteMany({
        where: {
          instructorId: Number(instructorId),
          availableOn: { gte: startDate, lte: endDate },
        },
      });

      // 새 데이터 생성
      if (newDates.length > 0) {
        await tx.instructorAvailability.createMany({
          data: newDates.map((date) => ({
            instructorId: Number(instructorId),
            availableOn: new Date(date),
          })),
        });
      }
    });
  }

  // 승인된 강사 조회 
  async findActiveInstructors() {
    return prisma.instructor.findMany({
      where: {
        user: {
          status: 'APPROVED',
        },
      },
      include: {
        user: true,
      }
    });
  }

  // ⭐ 신규 추가: 강사 덕목(Virtue) 추가 
  async addVirtues(instructorId, virtueIds) {
    if (!virtueIds || virtueIds.length === 0) return;

    await prisma.instructorVirtue.createMany({
      data: virtueIds.map((vId) => ({
        instructorId: Number(instructorId),
        virtueId: vId,
      })),
      skipDuplicates: true,
    });
  }
}

module.exports = new InstructorRepository();
*/

//여기부터 테스트 코드

// server/src/domains/instructor/repositories/instructor.repository.js
const prisma = require('../../libs/prisma');

class InstructorRepository {

  /** [필수] ID로 강사 조회 */
  /** [필수] ID로 강사 조회 */
  async findInstructorByUserId(userId) {
    if (!userId) return null;
    return await prisma.instructor.findFirst({
      where: { userId: Number(userId) }
    });
  }

  /** [필수] 테스트용 강사 생성 (없을 경우) */
  async createTestInstructor(email, userId) {
    // 이미 User가 존재하는지 확인
    let user = await prisma.user.findFirst({ where: { id: Number(userId) } });

    // 유저조차 없으면 문제이므로 에러 처리하거나, 여기서 유저 생성을 기대하진 않음
    // (서비스 로직상 이미 로그인 된 유저 ID가 넘어오므로 유저는 존재함)

    // 강사 레코드 생성
    return await prisma.instructor.create({
      data: { userId: Number(userId) }
    });
  }

  /** [내부용] 숫자 ID로만 동작하는 저장 함수 */
  async replaceAvailabilities(realInstructorId, startDate, endDate, newDates) {
    if (realInstructorId === undefined || realInstructorId === null) {
      throw new Error(`[Repo Error] 강사 ID가 없습니다.`);
    }
    const idAsNumber = Number(realInstructorId);
    if (isNaN(idAsNumber)) {
      throw new Error(`[Repo Error] 강사 ID는 숫자여야 합니다. 값: ${realInstructorId}`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. 기존 데이터 삭제
      await tx.instructorAvailability.deleteMany({
        where: {
          instructorId: idAsNumber,
          availableOn: { gte: startDate, lte: endDate },
        },
      });

      // 2. 새 데이터 생성
      if (newDates.length > 0) {
        await tx.instructorAvailability.createMany({
          data: newDates.map((date) => ({
            instructorId: idAsNumber,
            availableOn: new Date(date),
          })),
        });
      }
    });
  }

  /** * ★ [최종 수정] 외부 호출용 함수 
   * instructor.id가 없으면 instructor.userId를 사용하도록 수정됨
   */
  async updateAvailabilities(userIdString, year, month, dates) {
    console.log(`[Repo] 강사 정보 확인 중...`);

    const TEST_EMAIL = "test_instructor@test.com";

    // 1. 유저 찾기
    let user = await prisma.user.findFirst({
      where: { userEmail: TEST_EMAIL }
    });

    let instructor = null;

    // 2. 강사 찾기
    if (user) {
      instructor = await prisma.instructor.findFirst({
        where: { userId: user.id }
      });
    }

    // 3. 없으면 생성 (유저 + 강사)
    if (!user || !instructor) {
      console.log("⚠️ 계정 자동 생성 중...");
      try {
        if (!user) {
          user = await prisma.user.create({
            data: {
              userEmail: TEST_EMAIL,
              name: "김강사",
              status: "APPROVED",
              password: "temp_password",
              userphoneNumber: "010-0000-0000"
            }
          });
        }

        if (!instructor) {
          await prisma.instructor.create({
            data: { userId: user.id }
          });
          // 재조회
          instructor = await prisma.instructor.findFirst({
            where: { userId: user.id }
          });
        }
      } catch (e) {
        console.error("생성 실패:", e);
        throw new Error("DB 생성 오류");
      }
    }

    // ★★★ [핵심 수정] ID 결정 로직 ★★★
    // 객체에 'id'가 있으면 그걸 쓰고, 없으면 'userId'를 씁니다.
    const realId = instructor.id || instructor.userId;

    if (!realId) {
      console.log("DEBUG: instructor 객체:", instructor);
      throw new Error("강사 ID(PK)를 찾을 수 없습니다.");
    }

    // 4. 저장 실행
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(`[Repo] 실제 강사번호(${realId})로 저장 시작`);

    return this.replaceAvailabilities(realId, startDate, endDate, dates);
  }

  /** 강의 배정 충돌 확인 (Mock) */
  async findActiveAssignmentsDate(instructorId, year, month, dates) {
    return [];
  }

  // --- 기존 함수들 ---
  async findAvailabilities(instructorId, startDate, endDate) {
    return await prisma.instructorAvailability.findMany({
      where: {
        instructorId: Number(instructorId),
        availableOn: { gte: startDate, lte: endDate },
      },
      orderBy: { availableOn: 'asc' },
    });
  }

  async findActiveInstructors() {
    return prisma.instructor.findMany({
      where: { user: { status: 'APPROVED' } },
      include: { user: true }
    });
  }

  async addVirtues(instructorId, virtueIds) {
    if (!virtueIds || virtueIds.length === 0) return;
    await prisma.instructorVirtue.createMany({
      data: virtueIds.map((vId) => ({
        instructorId: Number(instructorId),
        virtueId: vId,
      })),
      skipDuplicates: true,
    });
  }
}

module.exports = new InstructorRepository();