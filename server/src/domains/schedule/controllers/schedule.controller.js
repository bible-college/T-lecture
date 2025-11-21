const scheduleService = require('../services/schedule.service');

// [POST] 스케줄 등록
const submitAvailability = async (req, res) => {
  try {
    // 로그인 기능 완성 전까지는 userId = 1 (임시)로 고정
    // 나중에는 req.user.id로 바꾸면 됨
    const userId = req.user ? req.user.id : 1; 
    const { dates } = req.body; // 프론트에서 { dates: [...] } 이렇게 보낼 예정

    await scheduleService.registerSchedule(userId, dates);

    res.status(201).json({ message: "스케줄 등록 성공" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// [GET] 내 스케줄 조회
const getAvailability = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1; // 임시 ID

    const schedules = await scheduleService.getMySchedule(userId);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  submitAvailability,
  getAvailability,
};