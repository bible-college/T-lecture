// server/src/common/errors/prismaErrorMapper.js
const { Prisma } = require('@prisma/client');
const AppError = require('./AppError');

function mapPrismaError(err) {
    // Prisma Client Known Request Error (P2002 등)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
        case 'P2002': {
            // Unique constraint failed
            // err.meta.target: ['userEmail'] 같은 정보가 들어옴
            const target = Array.isArray(err.meta?.target) ? err.meta.target.join(',') : String(err.meta?.target || '');
            return new AppError(
            '이미 존재하는 값입니다.',
            409,
            'DUPLICATE_RESOURCE',
            { prismaCode: err.code, target, meta: err.meta }
            );
        }

        case 'P2025': {
            // Record not found (update/delete where not found)
            return new AppError(
            '대상을 찾을 수 없습니다.',
            404,
            'NOT_FOUND',
            { prismaCode: err.code, meta: err.meta }
            );
        }

        case 'P2003': {
            // Foreign key constraint failed
            return new AppError(
            '참조 관계로 인해 처리할 수 없습니다.',
            409,
            'FOREIGN_KEY_CONFLICT',
            { prismaCode: err.code, meta: err.meta }
            );
        }

        default:
            // 나머지는 내부에러로 묶되 meta를 남겨 디버깅
            return new AppError(
            '데이터베이스 처리 중 오류가 발생했습니다.',
            500,
            'DB_ERROR',
            { prismaCode: err.code, meta: err.meta }
            );
        }
    }

    // Prisma Client Validation Error (잘못된 where/input 등)
    if (err instanceof Prisma.PrismaClientValidationError) {
        return new AppError(
        '요청 값이 올바르지 않습니다.',
        400,
        'PRISMA_VALIDATION_ERROR',
        { name: err.name }
        );
    }

    // Prisma Client Initialization Error (DB 연결 등)
    if (err instanceof Prisma.PrismaClientInitializationError) {
        return new AppError(
        '데이터베이스 연결에 실패했습니다.',
        503,
        'DB_UNAVAILABLE',
        { name: err.name }
        );
    }

    // Prisma Client Rust Panic Error (심각)
    if (err instanceof Prisma.PrismaClientRustPanicError) {
        return new AppError(
        '서버 내부 오류가 발생했습니다.',
        500,
        'DB_PANIC',
        { name: err.name }
        );
    }

    return null; // Prisma 에러가 아니면 변환하지 않음
}

module.exports = { mapPrismaError };
