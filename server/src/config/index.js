module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL || 'mysql://user:password@host:port/database',
  kakao: {
    apiKey: process.env.KAKAO_API_KEY,
    restApiKey: process.env.KAKAO_REST_API_KEY,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
