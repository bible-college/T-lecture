// src/config/database.js
function buildDatabaseConfig() {
    const provider = process.env.DB_PROVIDER || 'mysql';

    if (process.env.DATABASE_URL) {
        return {
        provider,
        url: process.env.DATABASE_URL,
        };
    }

    const {
        DB_HOST,
        DB_PORT,
        DB_USER,
        DB_PASSWORD,
        DB_NAME,
    } = process.env;

    if (!DB_HOST || !DB_USER || !DB_NAME) {
        // 필수 변수가 없으면 오류를 던지거나, 안전한 기본값 사용 정책을 따릅니다.
        // 여기서는 기존 코드를 따라 에러를 던집니다.
        throw new Error('Database env variables are missing');
    }

    const port = DB_PORT || (provider === 'postgresql' ? 5432 : 3306);

    const url =
        provider === 'postgresql'
        ? `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${port}/${DB_NAME}`
        : `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${port}/${DB_NAME}`;

    return { provider, url };
}

module.exports = { buildDatabaseConfig };