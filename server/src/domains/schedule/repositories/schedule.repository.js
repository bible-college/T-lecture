// libs 폴더가 domains 폴더랑 같은 레벨(src)에 있을 테니 경로 맞춰줌
const prisma = require('../../../libs/prisma'); 

// 1. 강사 스케줄 일괄 등록 (날짜 여러 개 한 번에)
const createAvailabilities = async (userId, dates) => {
  const data = dates.map((date) => ({
    userId,
    date: new Date(date),
  }));

  // 중복 방지(skipDuplicates) 옵션 사용
  return await prisma.instructorAvailability.createMany({
    data,
    skipDuplicates: true,
  });
};

// 2. 내 스케줄 조회 (날짜순 정렬)
const findAvailabilities = async (userId) => {
  return await prisma.instructorAvailability.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
};

module.exports = {
  createAvailabilities,
  findAvailabilities,
};