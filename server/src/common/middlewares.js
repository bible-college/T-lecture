const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

module.exports = {
  // Example middleware
  logger: (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  },
  // Add other common middlewares here

  // [신규] 로그인 인증 미들웨어
  checkAuth: (req, res, next) => {
    try {
      // 1. 헤더에서 토큰 추출 ("Bearer <token>" 형태)
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: '인증 토큰이 없습니다.' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: '잘못된 토큰 형식입니다.' });
      }

      // 2. 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 3. 요청 객체(req)에 사용자 정보 심기 (컨트롤러에서 사용)
      req.user = decoded; // { id, email, role }

      next(); // 통과!
    } catch (error) {
      // 토큰 만료, 위변조 등
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
  },

  // [신규] 강사 권한 확인 (checkAuth 뒤에 연결해서 사용)
  checkInstructor: (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR') {
      return res.status(403).json({ error: '강사 권한이 필요합니다.' });
    }
    next();
  },

  // [신규] 관리자 권한 확인
  checkAdmin: (req, res, next) => {
    // req.user는 checkAuth에서 심어줍니다.
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }
    next();
  }
};
