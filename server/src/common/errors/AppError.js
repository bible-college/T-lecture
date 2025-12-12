// server/src/common/errors/AppError.js
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', meta = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.meta = meta;
    }
}

module.exports = AppError;
