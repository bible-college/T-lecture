// server/src/domains/auth/auth.repository.js

const prisma = require('../../libs/prisma');

class AuthRepository {
  // 인증 코드 생성/저장
  async createVerificationCode(email, code, expiresAt) {
    return await prisma.emailVerification.create({
      data: {
        email,
        code,
        expiresAt,
        isVerified: false,
      },
    });
  }

  // 최신 인증 기록 조회
  async findLatestVerification(email) {
    return await prisma.emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 인증 완료 처리
  async markAsVerified(id) {
    return await prisma.emailVerification.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  // 인증 기록 삭제 (가입 완료 후 정리)
  async deleteVerifications(email) {
    return await prisma.emailVerification.deleteMany({
      where: { email },
    });
  }

  // [신규] 리프레시 토큰 저장 (기존 토큰 삭제 후 저장)
  async saveRefreshToken(userId, token, expiresAt) {
    // 단일 기기 로그인 정책: 해당 유저의 모든 리프레시 토큰 삭제
    await prisma.refreshToken.deleteMany({ where: { userId } });
    
    return await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  // [신규] 리프레시 토큰 조회
  async findRefreshToken(userId, token) {
    return await prisma.refreshToken.findFirst({
      where: { userId, token },
    });
  }

  // [신규] 리프레시 토큰 삭제 (로그아웃)
  async deleteRefreshToken(userId) {
    return await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}

module.exports = new AuthRepository();