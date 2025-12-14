// server/src/common/middlewares/errorHandler.js
const logger = require('../../config/logger');
const { mapPrismaError } = require('../errors/prismaErrorMapper');

module.exports = (err, req, res, next) => {

    const mapped = mapPrismaError(err);
    if (mapped) err = mapped;

    const statusCode = Number(err.statusCode || err.status || 500);
    const code = err.code || 'INTERNAL_ERROR';

    const logPayload = {
        code,
        statusCode,
        message: err.message,
        userId: req.user?.id || null,
        method: req.method,
        url: req.originalUrl || req.url,
        stack: err.stack,
        meta: err.meta || null,
    };

    if (statusCode >= 500) logger.error('[API ERROR]', logPayload);
    else logger.warn('[API ERROR]', logPayload);

    const isProd = process.env.NODE_ENV === 'production';
    const isAppError = err.isAppError === true;
    const safeMessage = isProd && !isAppError ? 'Internal Server Error' : err.message;


    res.status(statusCode).json({
        error: safeMessage,
        statusCode,
        code,
        // ...(isProd ? {} : { stack: err.stack }),
    });
};
