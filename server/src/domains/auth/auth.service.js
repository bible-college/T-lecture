// server/src/domains/auth/auth.service.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const instructorRepository = require('../instructor/instructor.repository');
const authRepository = require('./auth.repository');
const userRepository = require('../user/repositories/user.repository');
const emailService = require('../../infra/email.service');

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
    // dto: { email, password, name, phoneNumber, address, type, virtueIds, teamId, category }
    const {
      email,
      password,
      name,
      phoneNumber,
      address,
      type,
      virtueIds,
      teamId,
      category,
    } = dto;

    if (!email || !password || !name || !phoneNumber) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) throw new Error('이미 가입된 이메일입니다.');

    const verification = await authRepository.findLatestVerification(email);
    if (!verification || !verification.isVerified) {
      throw new Error('이메일 인증이 완료되지 않았습니다.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const commonData = {
      userEmail: email,
      password: hashedPassword,
      name,
      userphoneNumber: phoneNumber,
      status: 'PENDING', // 승인 대기
    };

    let newUser;

    if (type === 'INSTRUCTOR') {
      if (!address) throw new Error('강사는 거주지 주소를 입력해야 합니다.');
      if (!teamId || !category || !virtueIds || virtueIds.length === 0) {
        throw new Error('강사 과목(덕목), 팀, 직책 정보를 모두 입력해야 합니다.');
      }

      // 1) User + Instructor 생성
      newUser = await userRepository.createInstructor(commonData, {
        location: address,
        teamId: teamId || null,
        category: category || null,
        lat: null,
        lng: null,
      });

// 2) InstructorVirtue (강사가능덕목) 관계 저장
// 2) InstructorVirtue (강사가능덕목) 관계 저장
      await instructorRepository.addVirtues(newUser.id, virtueIds)
    } else {
      // 일반 유저
      newUser = await userRepository.createUser(commonData);
    }

    await authRepository.deleteVerifications(email);

    return {
      id: newUser.id,
      email: newUser.userEmail,
      name: newUser.name,
      status: newUser.status,
      message: '가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
    };
  }


  async login(email, password, loginType) {
    // 1) 사용자 조회 (+ admin / instructor 포함)
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('가입되지 않은 이메일입니다.');
    }

    // 2) 비밀번호 검증
    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // 3) 로그인 탭별 권한 체크
    const isAdmin = !!user.admin;
    const adminLevel = user.admin?.level || null;
    const isInstructor = !!user.instructor;

    if (loginType === 'ADMIN') {
      if (!isAdmin) {
        throw new Error('관리자 계정이 아닙니다.');
      }
    } else if (loginType === 'GENERAL') {
      // 여기에서 관리자/슈퍼관리자가 일반 탭 로그인 허용할지 정책 정하면 됨

      if (user.status !== 'APPROVED') {
        throw new Error('승인되지 않은 계정입니다.');
      }
    } else {
      throw new Error('잘못된 로그인 타입입니다.');
    }

    // 4) JWT 발급 (최소 정보만 넣기)
    const payload = {
      userId: user.id,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h',
    });

    // 5) 프론트에서 쓸 유저 정보
    const responseUser = {
      id: user.id,
      email: user.userEmail,
      name: user.name,
      status: user.status,
      isAdmin,
      adminLevel,
      isInstructor,
    };

    return {
      accessToken,
      user: responseUser,
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