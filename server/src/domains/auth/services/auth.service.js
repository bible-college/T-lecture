// server/src/domains/auth/services/auth.service.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authRepository = require('../repositories/auth.repository');
const userRepository = require('../../user/repositories/user.repository');
const emailService = require('../../../infra/email.service');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

class AuthService {
  /**
   * 1. 인증번호 발송
   */
  async sendVerificationCode(email) {
    // 6자리 난수 생성
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분 유효

    await authRepository.createVerificationCode(email, code, expiresAt);
    await emailService.sendVerificationCode(email, code);

    return { message: '인증번호가 발송되었습니다. (유효시간 3분)' };
  }

  /**
   * 2. 인증번호 검증
   */
  async verifyCode(email, code) {
    const record = await authRepository.findLatestVerification(email);

    if (!record) throw new Error('인증 요청 기록이 없습니다.');
    if (new Date() > record.expiresAt) throw new Error('인증번호가 만료되었습니다.');
    if (record.code !== code) throw new Error('인증번호가 일치하지 않습니다.');

    await authRepository.markAsVerified(record.id);
    return { message: '이메일 인증이 완료되었습니다.' };
  }

  /**
   * 3. 회원가입
   * - 로직 수정: Admin 생성 불가, 오직 USER/INSTRUCTOR만 가입 가능
   * - registerInstructor 등의 분리된 메서드 호출 대신, 기존 Repo 활용 로직으로 통합 및 정리
   */
  async register(dto) {
    // 1. 데이터 추출 (type: 'USER' | 'INSTRUCTOR')
    const { email, password, name, phoneNumber, address, type } = dto;

    if (!email || !password || !name || !phoneNumber) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    // 2. 중복 확인
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) throw new Error('이미 가입된 이메일입니다.');

    // 3. 인증 여부 확인
    const verification = await authRepository.findLatestVerification(email);
    if (!verification || !verification.isVerified) {
      throw new Error('이메일 인증이 완료되지 않았습니다.');
    }

    // 4. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. DB 저장 데이터 구성
    const commonData = {
      userEmail: email,
      password: hashedPassword,
      name,
      userphoneNumber: phoneNumber,
      status: 'PENDING', // 기본 상태: 승인 대기
      // role 필드는 DB 스키마 변경에 따라 선택적으로 사용 (여기선 기록용으로 저장한다고 가정)
      role: type === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'USER',
    };

    let newUser;

    // 6. 타입에 따른 저장 (Repository 호출)
    if (type === 'INSTRUCTOR') {
      if (!address) throw new Error('강사는 거주지 주소를 입력해야 합니다.');
      
      // 강사 생성: User + Instructor 테이블 동시 생성
      newUser = await userRepository.createInstructor(commonData, {
        location: address, 
        lat: null, 
        lng: null 
      });
    } else {
      // 일반 유저 생성: User 테이블만 생성
      newUser = await userRepository.createUser(commonData);
    }

    // 7. 인증 기록 정리 (가입 성공 시 삭제)
    await authRepository.deleteVerifications(email);

    return {
      id: newUser.id,
      email: newUser.userEmail,
      name: newUser.name,
      status: newUser.status,
      message: '가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
    };
  }

  /**
   * 4. 로그인
   * - loginType ('ADMIN' | 'GENERAL')에 따른 분기 처리
   */
  async login(email, password, loginType) {
    // 1. 유저 조회 (Admin, Instructor 정보 포함해서 가져온다고 가정)
    // userRepository.findByEmail 내부에서 { include: { admin: true, instructor: true } } 필요
    const user = await userRepository.findByEmail(email);
    
    if (!user) throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');

    // 2. 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');

    // 3. 로그인 타입에 따른 권한 검사
    if (loginType === 'ADMIN') {
      // 관리자로 로그인 시도: Admin 테이블 정보 존재 여부 확인
      if (!user.admin) {
        throw new Error('관리자 권한이 없는 계정입니다.');
      }
      // (선택) 관리자는 승인 상태(status)와 무관하게 로그인 가능하게 할지, 아니면 관리자도 승인 필요한지 정책 결정 필요.
      // 여기서는 관리자 테이블에 있으면 바로 통과라고 가정.
    } else {
      // 일반/강사로 로그인 시도: 계정 상태(status) 확인
      if (user.status === 'PENDING') throw new Error('관리자 승인 대기 중인 계정입니다.');
      if (user.status === 'INACTIVE') throw new Error('비활성화된 계정입니다.');
      if (user.status === 'REJECTED') throw new Error('가입이 거절된 계정입니다.');
    }

    // 4. 토큰 발급
    // 프론트엔드에서 메뉴를 다르게 보여주기 위해 isAdmin, isInstructor 플래그를 담음
    const tokenPayload = {
      id: user.id,
      email: user.userEmail,
      name: user.name,
      isAdmin: !!user.admin,           // 관리자 여부 (Boolean)
      isInstructor: !!user.instructor, // 강사 여부 (Boolean)
      loginType: loginType             // 현재 어떤 모드로 로그인했는지
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.userEmail,
        name: user.name,
        role: user.role, // 참고용
        isAdmin: !!user.admin,
        isInstructor: !!user.instructor,
      },
    };
  }

  /**
   * 5. 비밀번호 재설정
   */
  async resetPassword(email, code, newPassword) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('가입되지 않은 이메일입니다.');

    // 인증 번호 확인
    const record = await authRepository.findLatestVerification(email);
    if (!record || record.code !== code) {
      throw new Error('인증번호가 올바르지 않습니다.');
    }
    
    if (new Date() > record.expiresAt) throw new Error('인증번호가 만료되었습니다.');

    // 비밀번호 변경
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.updatePassword(user.id, hashedPassword);

    await authRepository.deleteVerifications(email);

    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }
}

module.exports = new AuthService();