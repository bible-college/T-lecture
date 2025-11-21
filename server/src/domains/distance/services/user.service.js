const userRepo = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 회원가입 로직
 */
const signup = async (userData) => {
  const { email, password, name, contactNumber, role, address, instructorType } = userData;

  // 1. 이메일 중복 확인 (기존 repo 함수 사용)
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    throw new Error("이미 존재하는 이메일입니다.");
  }

  // 2. 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. DB 저장 (기존 repo의 create 함수 사용)
  // userData 객체를 그대로 넘기되, password만 암호화된 걸로 교체
  const newUser = await userRepo.create({
    email,
    password: hashedPassword,
    name,
    contactNumber,
    role: role || 'INSTRUCTOR', // 기본값 강사
    address,
    instructorType, // 강사라면 타입 (Main, Co 등)
    // 필요한 다른 필드들도 여기에 추가
  });

  return newUser;
};

/**
 * 로그인 로직
 */
const login = async (email, password) => {
  // 1. 이메일로 유저 찾기 (기존 repo 함수 사용)
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new Error("가입되지 않은 이메일입니다.");
  }

  // 2. 비밀번호 확인
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("비밀번호가 틀렸습니다.");
  }

  // 3. 토큰 발급
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'secret-key', // .env에 JWT_SECRET 설정 권장
    { expiresIn: '12h' }
  );

  // 4. 응답 시 비밀번호 등 민감정보 제외 (userRepo의 select 옵션 덕분에 이미 제외됐을 수 있지만 안전하게)
  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

module.exports = {
  signup,
  login
};