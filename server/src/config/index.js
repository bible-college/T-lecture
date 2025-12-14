// src/config/index.js
// 🚨 경로 수정: database.js를 현재 폴더에서 require 합니다.
const { buildDatabaseConfig } = require('./database'); 

// 파일 로드 시점에 DB URL을 생성합니다.
const dbConfig = (() => {
    try {
        return buildDatabaseConfig();
    } catch (e) {
        // DB 환경 변수가 없는 경우, 에러 발생 대신 안전한 기본 URL을 반환
        // Prisma가 초기화되지 못하는 문제를 피하기 위해 'test' 환경일 경우 처리할 수 있습니다.
        console.warn('DB configuration failed, using dummy URL:', e.message);
        return { url: 'mysql://dummy:dummy@localhost:3306/dummy' };
    }
})();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: dbConfig.url, // 👈 database.js에서 가져온 URL 사용
  kakao: {
    restApiKey: process.env.KAKAO_REST_API_KEY,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};