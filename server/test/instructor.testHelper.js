const prisma = require('../src/libs/prisma');

/**
 * Test helper: create a user and instructor for testing purposes only.
 * Place test helpers under `server/test` so they are not mixed into domain code.
 */
async function createTestInstructor(email, overrides = {}) {
  return await prisma.instructor.create({
    data: {
      user: {
        connectOrCreate: {
          where: { userEmail: email },
          create: {
            userEmail: email,
            name: overrides.name || '테스트강사',
            status: overrides.status || 'APPROVED',
            password: overrides.password || 'temp_password',
            userphoneNumber: overrides.userphoneNumber || '010-0000-0000',
          },
        },
      },
    },
    include: { user: true },
  });
}

module.exports = { createTestInstructor };
