// 방금 만든 레포지토리 불러오기
const scheduleRepo = require('../repositories/schedule.repository');

// 1. 스케줄 등록 로직
const registerSchedule = async (userId, dates) => {
  // 날짜가 없으면 에러 처리
  if (!dates || dates.length === 0) {
    throw new Error("등록할 날짜가 없습니다.");
  }

  // 레포지토리에게 저장 시키기
  return await scheduleRepo.createAvailabilities(userId, dates);
};

// 2. 내 스케줄 조회 로직
const getMySchedule = async (userId) => {
  return await scheduleRepo.findAvailabilities(userId);
};

module.exports = {
  registerSchedule,
  getMySchedule,
};