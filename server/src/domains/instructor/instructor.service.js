/*
// web/server/src/domains/instructor/services/instructor.service.js
const instructorRepository = require('./instructor.repository');

// [제거됨] getMyProfile -> User 도메인에서 담당

//가능 일정 조회
exports.getAvailabilities = async (instructorId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const availabilities = await instructorRepository.findAvailabilities(instructorId, startDate, endDate);
  
  // "YYYY-MM-DD" 문자열 배열로 변환
  return availabilities.map(item => item.availableOn.toISOString().split('T')[0]);
};

// 가능 일정 수정 (제약 조건: 이미 배정된 날짜 제외 불가)
exports.updateAvailabilities = async (instructorId, year, month, newDatesStr) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // 1. 해당 기간에 이미 배정된(Active) 날짜 조회
  const activeAssignmentDates = await instructorRepository.findActiveAssignmentsDate(instructorId, startDate, endDate);

  // 2. 유효성 검사: 배정된 날짜가 newDatesStr에 모두 포함되어 있는지 확인
  const assignedDatesSet = new Set(activeAssignmentDates.map(d => d.toISOString().split('T')[0]));
  const newDatesSet = new Set(newDatesStr);

  for (const assignedDate of assignedDatesSet) {
    if (!newDatesSet.has(assignedDate)) {
      throw new Error(`이미 배정이 확정된 날짜(${assignedDate})는 근무 가능일에서 제외할 수 없습니다.`);
    }
  }

  // 3. 업데이트 수행
  await instructorRepository.replaceAvailabilities(instructorId, startDate, endDate, newDatesStr);
  
  return { message: '근무 가능일이 저장되었습니다.' };
};
*/

//**********여기부터 테스트 코드**********************

// server/src/domains/instructor/instructor.service.js
const instructorRepository = require('./instructor.repository');

/**
 * 가능 일정 조회
 */
exports.getAvailabilities = async (userIdString, year, month) => {
  // 1. 강사 정보 찾기 (userId -> instructorId 변환)
  const instructor = await instructorRepository.findInstructorByUserId(userIdString);
  if (!instructor) {
    return []; // 강사가 없으면 일정 없음
  }

  // 2. 실제 Instructor ID 사용
  const realId = instructor.id || instructor.userId;

  // 3. 날짜 계산 (비즈니스 로직)
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  const availabilities = await instructorRepository.findAvailabilities(realId, startDate, endDate);
  return availabilities.map(item => item.availableOn.toISOString().split('T')[0]);
};

/**
 * 가능 일정 수정 (모든 판단은 여기서 수행)
 */
exports.updateAvailabilities = async (userIdString, year, month, dates) => {
  const TEST_EMAIL = "test_instructor@test.com";

  // 1. 강사 존재 여부 확인 및 자동 생성 판단
  let instructor = await instructorRepository.findInstructorByUserId(userIdString);

  if (!instructor) {
    console.log("⚠️ 강사 정보 없음. 서비스 단에서 생성 결정.");
    instructor = await instructorRepository.createTestInstructor(TEST_EMAIL, userIdString);
  }

  // 2. 저장용 ID 추출 (id가 없으면 userId 사용)
  const realId = instructor.id || instructor.userId;

  // 3. 날짜 범위 계산
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  // 4. 리포지토리에 순수하게 "데이터 저장"만 명령
  await instructorRepository.replaceAvailabilities(realId, startDate, endDate, dates);

  return { message: '근무 가능일이 저장되었습니다.' };
};