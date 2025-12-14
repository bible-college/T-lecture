// src/libs/prisma.js
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const databaseUrl = config.databaseUrl; 


if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
}


const prisma = new PrismaClient({
    datasources: {
        db: { url: databaseUrl }, 
    },
});

module.exports = prisma;