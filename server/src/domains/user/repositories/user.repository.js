const prisma = require('../../../libs/prisma');

// 1. 이메일로 사용자 찾기 (로그인, 중복확인용)
exports.findByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { userEmail: email },
    include: { instructor: true }, // 강사 정보 확인용
  });
};

// 2. ID로 사용자 찾기 (내 정보 조회용)
exports.findById = async (id) => {
  return await prisma.user.findUnique({
    where: { id: Number(id) },
    // 민감 정보 제외 (비밀번호 등)
    select: {
      id: true,
      userEmail: true,
      name: true,
      userphoneNumber: true,
      role: true,
      instructor: true,
    },
  });
};

// 3. 회원가입용 생성 (User + Instructor 동시 생성)
exports.createUserWithInstructor = async (data) => {
  return await prisma.user.create({
    data: data,
    include: {
      instructor: true, // 생성 후 강사 정보도 반환 확인
    },
  });
};