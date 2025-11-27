const prisma = require('../../../common/prisma');

// 회원가입: 이메일, 비번, 이름, 전화번호, 카테고리 저장
const createUser = async (userEmail, password, name, userphoneNumber, category) => {
  return await prisma.user.create({
    data: {
      userEmail,
      password,
      name,
      userphoneNumber,
      category, // "Main", "Co" 등 enum 값
    },
  });
};

// 로그인용: 이메일로 유저 찾기
const findUserByEmail = async (userEmail) => {
  return await prisma.user.findFirst({ // findUnique 대신 findFirst 사용 (스키마에 @unique가 안 보여서)
    where: { userEmail },
  });
};

module.exports = { createUser, findUserByEmail };