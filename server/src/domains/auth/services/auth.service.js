const userRepository = require('../../user/repositories/user.repository');
const emailService = require('../../../infra/email.service'); // [추가]
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../libs/prisma'); // [추가] 비밀번호 업데이트용

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'; // .env 설정 필수

// [회원가입 로직]
exports.register = async (dto) => {
  const { email, password, name, phoneNumber, role, address } = dto;

  // 1. 이메일 중복 확인
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new Error('이미 가입된 이메일입니다.');
  }

  // 2. 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. 역할별 데이터 구성
  // role이 없으면 'USER'로, 있으면 그 값으로 설정
  const userRole = role || 'USER';

  // [백엔드 유효성 검사] 강사인데 주소가 없으면 차단
  if (userRole === 'INSTRUCTOR' && !address) {
    throw new Error('강사 가입 시 주소는 필수입니다.');
  }

  const dataToSave = {
    userEmail: email,
    password: hashedPassword,
    name,
    userphoneNumber: phoneNumber,
    role: userRole,
    
    // 강사(INSTRUCTOR)일 경우에만 Instructor 정보 추가 (Nested Write)
    ...(userRole === 'INSTRUCTOR' && {
      instructor: {
        create: {
          location: address, // 주소 문자열 저장
          lat: null,         // 좌표는 나중에 배치 작업으로 계산 (기존 유지)
          lng: null,
        }
      },
      category: 'Practicum' // 기본 등급 설정
    })
  };

  // 4. DB 저장
  const newUser = await userRepository.createUserWithInstructor(dataToSave);

  return {
    id: newUser.id,
    email: newUser.userEmail,
    name: newUser.name,
    role: newUser.role,
    status: newUser.status, // [추가] 현재 상태(PENDING) 확인용
    message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.' // [변경] 안내 메시지 수정
  };
};

// [로그인 로직]
exports.login = async (email, password) => {
  // 1. 사용자 조회
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  // [신규] 승인 상태 체크
  if (user.status !== 'APPROVED') {
    throw new Error('관리자 승인 대기 중인 계정입니다.');
  }

  // 2. 비밀번호 확인
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  // 3. 토큰 발급 (Role 포함)
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.userEmail, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.userEmail,
      role: user.role
    }
  };
};

// [신규] 비밀번호 찾기 (이메일 발송)
exports.forgotPassword = async (email) => {
  // 1. 이메일 존재 확인
  const user = await userRepository.findByEmail(email);
  if (!user) {
    // 보안상 "존재하지 않는 이메일입니다"라고 알려주는 것보다, 
    // 성공 메시지를 보내거나 모호하게 답하는 것이 좋지만, 편의상 에러 처리합니다.
    throw new Error('가입되지 않은 이메일입니다.');
  }

  // 2. 재설정 토큰 생성 (유효기간 1시간)
  // 보안 팁: 토큰 비밀키에 'user.password' 해시를 섞으면, 비번 변경 시 구 토큰이 자동 만료됨
  const secret = JWT_SECRET + user.password; 
  const token = jwt.sign({ id: user.id, email: user.userEmail }, secret, { expiresIn: '1h' });

  // 3. 이메일 발송
  await emailService.sendPasswordResetEmail(user.userEmail, token);

  return { message: '비밀번호 재설정 메일을 발송했습니다.' };
};

// [신규] 비밀번호 재설정 (토큰 인증 + 비번 변경)
exports.resetPassword = async (token, newPassword) => {
  try {
    // 1. 토큰 디코딩 (id 추출)
    const decoded = jwt.decode(token);
    if (!decoded) throw new Error('잘못된 토큰입니다.');

    // 2. 유저 조회 (현재 비밀번호 해시 필요)
    const user = await userRepository.findById(decoded.id);
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    // 3. 토큰 검증 (유효기간 및 서명 확인)
    const secret = JWT_SECRET + user.password; // 생성할 때 썼던 그 조합키로 검증
    jwt.verify(token, secret);

    // 4. 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 5. 비밀번호 업데이트 (Repository에 updatePassword가 없으므로 prisma 직접 사용)
    // *User Repository에 update 기능을 추가해서 사용하는 것이 더 좋습니다.
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: '비밀번호가 성공적으로 변경되었습니다.' };

  } catch (error) {
    throw new Error('토큰이 만료되었거나 유효하지 않습니다.');
  }
};