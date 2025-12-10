/*//server/src/domains/instructor/controllers/instructor.controller.js
const instructorService = require('./instructor.service');

// [제거됨] getMe, updateMe -> User 도메인의 /users/me 사용

// [가능 일정 조회]
exports.getAvailability = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) throw new Error('연도(year)와 월(month) 파라미터가 필요합니다.');

    const result = await instructorService.getAvailabilities(req.user.id, Number(year), Number(month));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// [가능 일정 수정]
exports.updateAvailability = async (req, res) => {
  try {
    const { year, month, dates } = req.body;
    if (!year || !month || !Array.isArray(dates)) {
      throw new Error('잘못된 요청 데이터입니다.');
    }

    const result = await instructorService.updateAvailabilities(req.user.id, Number(year), Number(month), dates);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
*/

// server/src/domains/instructor/controllers/instructor.controller.js
const instructorService = require('./instructor.service');

// [가능 일정 조회]
exports.getAvailability = async (req, res) => {
  try {
    const { year, month } = req.query;
    // req.user가 없으면 쿼리나 바디에서 userId를 찾도록 임시 수정
    const userId = req.user ? req.user.id : req.query.userId; 
    
    if (!year || !month) throw new Error('연도(year)와 월(month) 파라미터가 필요합니다.');

    const result = await instructorService.getAvailabilities(userId, Number(year), Number(month));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// [가능 일정 수정]
exports.updateAvailability = async (req, res) => {
  try {
    // ★ [수정] userId도 Body에서 받도록 추가 (로그인 미들웨어 없을 때 대비)
    const { year, month, dates, userId } = req.body;

    // 1. 필수 데이터 검증
    if (!year || !month || !Array.isArray(dates)) {
      throw new Error('잘못된 요청 데이터입니다. (year, month, dates 필수)');
    }

    // 2. 로그인 유저 ID 처리 (미들웨어 뺐을 땐 body의 userId 사용)
    const currentUserId = req.user ? req.user.id : userId;
    
    if (!currentUserId) {
        throw new Error('유저 ID가 확인되지 않습니다.');
    }

    console.log(`[서버] 일정 저장 요청: ID=${currentUserId}, ${year}년 ${month}월, 날짜=${dates}`);

    const result = await instructorService.updateAvailabilities(currentUserId, Number(year), Number(month), dates);
    res.json(result);
  } catch (error) {
    console.error(error); // 서버 터미널에 에러 찍기
    res.status(400).json({ error: error.message });
  }
};