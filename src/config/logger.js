// src/config/logger.js
const winston = require('winston');
const winstonDaily = require('winston-daily-rotate-file');
const path = require('path');

const logDir = 'logs'; // 로그 파일 저장할 폴더

const { combine, timestamp, printf, colorize } = winston.format;

// 로그 출력 포맷 정의
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // 1. 에러 로그만 별도로 파일 저장
        new winstonDaily({
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        dirname: path.join(logDir, 'error'),
        filename: `%DATE%.error.log`,
        maxFiles: '30d', // 30일치 보관
        zippedArchive: true,
        }),
        // 2. 모든 로그 파일 저장
        new winstonDaily({
        level: 'info',
        datePattern: 'YYYY-MM-DD',
        dirname: logDir,
        filename: `%DATE%.log`,
        maxFiles: '30d',
        zippedArchive: true,
        }),
    ],
});

// 개발 환경일 경우 터미널에도 예쁘게 출력
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
        format: combine(
            colorize(), // 색상 입히기
            logFormat
        ),
        })
    );
}

module.exports = logger;