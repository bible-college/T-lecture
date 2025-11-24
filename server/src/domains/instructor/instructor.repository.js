// web/server/src/domains/instructor/repositories/instructor.repository.js
const prisma = require('../../libs/prisma');

/**
 * [기존] 특정 기간의 근무 가능일 조회
 */
exports.findAvailabilities = async (instructorId, startDate, endDate) => {
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
};

/**
 * [기존] 근무 가능일 일괄 업데이트 (덮어쓰기)
 */
exports.replaceAvailabilities = async (instructorId, startDate, endDate, newDates) => {
  return await prisma.$transaction(async (tx) => {
    // 1. 해당 기간의 기존 데이터 삭제
    await tx.instructorAvailability.deleteMany({
      where: {
        instructorId: Number(instructorId),
        availableOn: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 2. 새 날짜 데이터 생성
    if (newDates.length > 0) {
      await tx.instructorAvailability.createMany({
        data: newDates.map((date) => ({
          instructorId: Number(instructorId),
          availableOn: new Date(date),
        })),
      });
    }
  });
};




exports.findActiveInstructors = async () => {
  return prisma.instructor.findMany({
    where: {
      user: {
        role: 'INSTRUCTOR',
        status: 'APPROVED',
      }
    },
    include: {
      user: true,     // 필요 시 사용자 정보 포함
    }
  });
};