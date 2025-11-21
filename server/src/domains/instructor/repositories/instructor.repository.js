// modules/instructor/repositories/instructor.repository.js
const prisma = require('../../../libs/prisma');

exports.findAll = async () => {
    return prisma.instructor.findMany();
};

exports.findById = async (userId) => {
    return prisma.instructor.findUnique({
        where: { userId: Number(userId) },
        include: {
        user: true,
        virtues: true,
        availabilities: true
        }
    });
};

exports.updateCoords = async (userId, lat, lng) => {
    return prisma.instructor.update({
        where: { userId: Number(userId) },
        data: { lat, lng }
    });
};

// [신규] 특정 기간의 근무 가능일 조회
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

// [신규] 근무 가능일 일괄 업데이트 (덮어쓰기)
// 해당 월의 기존 데이터를 싹 지우고, 새 날짜들을 입력하는 트랜잭션 방식입니다.
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

    // 2. 새 날짜 데이터 생성 (날짜가 있을 경우에만)
    if (newDates.length > 0) {
      await tx.instructorAvailability.createMany({
        data: newDates.map((date) => ({
          instructorId: Number(instructorId),
          availableOn: new Date(date), // "2025-03-15" 문자열 -> Date 객체 변환
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