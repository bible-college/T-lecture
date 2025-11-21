const instructorService = require('../services/instructor.service');

// GET /api/v1/instructor/me
exports.getMe = async (req, res) => {
  try {
    // 미들웨어(checkAuth)가 심어준 req.user.id 사용
    const userId = req.user.id; 
    
    const myProfile = await instructorService.getMyProfile(userId);
    res.status(200).json(myProfile);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// PATCH /api/v1/instructor/me
exports.updateMe = async (req, res) => {
    // 추후 구현
    res.status(200).json({ message: "수정 기능 준비 중" });
};

// [신규] 근무 가능일 조회 (GET /api/v1/instructor/availability?year=2025&month=3)
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

// [신규] 근무 가능일 수정 (PUT /api/v1/instructor/availability)
exports.updateAvailability = async (req, res) => {
  try {
    const { year, month, dates } = req.body; // dates: ["2025-03-01", "2025-03-05"]
    if (!year || !month || !Array.isArray(dates)) {
      throw new Error('잘못된 요청 데이터입니다.');
    }

    const result = await instructorService.updateAvailabilities(req.user.id, Number(year), Number(month), dates);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};