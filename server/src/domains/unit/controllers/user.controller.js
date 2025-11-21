const userService = require('../services/user.service');

/**
 * 회원가입 요청 처리
 */
const signup = async (req, res) => {
  try {
    // 프론트엔드에서 보낸 데이터 통째로 받기
    const userData = req.body;
    
    const result = await userService.signup(userData);
    
    res.status(201).json({ 
      message: "회원가입이 완료되었습니다.",
      user: result 
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * 로그인 요청 처리
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await userService.login(email, password);
    
    res.status(200).json({
      message: "로그인 성공",
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login
};