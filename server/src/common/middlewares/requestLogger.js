const logger = require('../../config/logger');

module.exports = (req, res, next) => {
    const start = Date.now();
    // 요청 시작 로깅 (원하면)
    // logger.info(`[REQ] ${req.method} ${req.url}`);

    res.on('finish', () => {
        const ms = Date.now() - start;
        // 응답 완료 후 로깅
        if (res.statusCode >= 400) {
            logger.warn(`[RES] ${req.method} ${req.url} ${res.statusCode} (${ms}ms)`);
        } else {
            logger.info(`[RES] ${req.method} ${req.url} ${res.statusCode} (${ms}ms)`);
        }
    });

    next();
};