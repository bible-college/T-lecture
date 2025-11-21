const userRepository = require('../../user/repositories/user.repository');
const instructorRepository = require('../repositories/instructor.repository');

exports.getMyProfile = async (userId) => {
  // 1. Repository를 통해 내 정보 조회 (User + Instructor 정보)
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new Error('사용자 정보를 찾을 수 없습니다.');
  }

  // 2. 데이터 가공 (보안상 필요한 경우)
  // 비밀번호는 Repository 단계에서 이미 제외(select)했으므로 그대로 반환해도 안전함
  
  return user;
};

exports.updateMyProfile = async (userId, updateData) => {
    // TODO: 프로필 수정 로직 (추후 구현)
    // 1. User 정보 수정 (이름, 폰번호 등)
    // 2. Instructor 정보 수정 (주소, 자차여부 등)
    return { message: "프로필 수정 기능 준비 중" };
};

// [신규] 근무 가능일 조회 로직
exports.getAvailabilities = async (instructorId, year, month) => {
  // 해당 월의 1일과 마지막 날 계산
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // month는 0부터 시작하므로 다음달의 0일 = 이번달 말일

  const availabilities = await instructorRepository.findAvailabilities(instructorId, startDate, endDate);
  
  // 프론트엔드 편의를 위해 "YYYY-MM-DD" 문자열 배열로 변환해서 줄 수도 있음
  return availabilities.map(item => item.availableOn);
};

// [신규] 근무 가능일 수정 로직
exports.updateAvailabilities = async (instructorId, year, month, dates) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  await instructorRepository.replaceAvailabilities(instructorId, startDate, endDate, dates);
  
  return { message: '근무 가능일이 저장되었습니다.' };
};