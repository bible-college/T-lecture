const request = require('supertest');
const { expect } = require('chai');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { app, server } = require('../../src/server'); // server.js 경로 확인 필요

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// 테스트 계정 이메일
const GENERAL_USER_EMAIL = 'me_general@test.com';
const INSTRUCTOR_USER_EMAIL = 'me_instructor@test.com';
const DELETE_USER_EMAIL = 'me_delete@test.com';

describe('User Me API Integration Test (Full Coverage)', () => {
    let generalUserId;
    let generalUserToken;
    let instructorUserId;
    let instructorUserToken;
    let deleteUserId;
    let deleteUserToken;
    let teamId;

    // ✅ 성공/실패 상관없이 JSON 출력
    const logResponse = (res, label) => {
        console.log(`\n📦 [${label}] ${res.req.method} ${res.req.path} (${res.status})`);
        const prefix = res.status >= 400 ? 'Error:' : 'Response Body:';
        console.log(prefix, JSON.stringify(res.body, null, 2));
        console.log('--------------------------------------------------\n');
    };

    // ✅ 에러 포맷 유연하게 검증
    const expectErrorLike = (res) => {
        expect(res.body).to.be.an('object');
        expect(res.body.error || res.body.message).to.exist;
    };

    before(async () => {
        // 1. DB 정리 (FK 제약 조건 고려: Instructor 하위 테이블 먼저, User/Admin/Instructor)
        await prisma.instructorVirtue.deleteMany().catch(() => {});
        await prisma.instructorAvailability.deleteMany().catch(() => {});
        await prisma.instructorStats.deleteMany().catch(() => {});
        await prisma.instructor.deleteMany().catch(() => {});
        await prisma.admin.deleteMany().catch(() => {});
        await prisma.user.deleteMany({ 
            where: { userEmail: { in: [GENERAL_USER_EMAIL, INSTRUCTOR_USER_EMAIL, DELETE_USER_EMAIL] } }
        });
        await prisma.team.deleteMany().catch(() => {});
        
        // 2. 기초 데이터 시딩
        const team = await prisma.team.create({ data: { name: 'Me Test Team' } });
        teamId = team.id;

        // 3. 일반 유저 (General User)
        const generalUser = await prisma.user.create({
            data: {
                userEmail: GENERAL_USER_EMAIL,
                password: 'hash',
                name: '일반유저',
                userphoneNumber: '010-1111-1111',
                status: 'APPROVED',
            },
        });
        generalUserId = generalUser.id;
        generalUserToken = jwt.sign({ userId: generalUser.id }, JWT_SECRET);
        
        // 4. 강사 유저 (Instructor User) - GET/PATCH 테스트용
        const instructorUser = await prisma.user.create({
            data: {
                userEmail: INSTRUCTOR_USER_EMAIL,
                password: 'hash',
                name: '강사유저',
                userphoneNumber: '010-2222-2222',
                status: 'APPROVED',
                instructor: {
                    create: {
                        location: '서울시 강남구 역삼동',
                        category: 'Main',
                        teamId: teamId,
                        isTeamLeader: false,
                        lat: 37.5,
                        lng: 127.0
                    }
                }
            },
            include: { instructor: true }
        });
        instructorUserId = instructorUser.id;
        instructorUserToken = jwt.sign({ userId: instructorUser.id }, JWT_SECRET);

        // 5. 삭제 테스트용 유저 (Delete User)
        const deleteUser = await prisma.user.create({
            data: {
                userEmail: DELETE_USER_EMAIL,
                password: 'hash',
                name: '삭제유저',
                userphoneNumber: '010-3333-3333',
                status: 'APPROVED',
            },
        });
        deleteUserId = deleteUser.id;
        deleteUserToken = jwt.sign({ userId: deleteUser.id }, JWT_SECRET);

        console.log('✅ User Me Test Data Seeded');
    });

    after(async () => {
        // 혹시 탈퇴 테스트에서 삭제되지 않은 데이터 정리 (findById에서 강사 포함하여 삭제)
        await prisma.user.deleteMany({ where: { id: generalUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: instructorUserId } }).catch(() => {});
        
        if (server) server.close();
        await prisma.$disconnect();
    });

    // ==========================================================
    // 0) AUTH 에러 (모든 엔드포인트 공통)
    // ==========================================================
    describe('0. Auth Errors (All Endpoints)', () => {
        it('[AUTH] GET /me - No Token (401)', async () => {
            const res = await request(app).get('/api/v1/users/me');
            logResponse(res, 'No Token');
            expect(res.status).to.equal(401);
            expectErrorLike(res);
        });

        it('[AUTH] PATCH /me - Invalid Token (401)', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me')
                .set('Authorization', 'Bearer not.a.jwt')
                .send({ name: 'x' });
            logResponse(res, 'Invalid Token');
            expect(res.status).to.equal(401);
            expectErrorLike(res);
        });
    });

    // ======================
    // 1) GET /users/me
    // ======================
    describe('1. GET /users/me - My Profile Check', () => {
        it('[GET] Success (General User)', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${generalUserToken}`);

            logResponse(res, 'Get My Profile (General)');
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal('일반유저');
            expect(res.body).to.not.have.property('password');
            expect(res.body).to.not.have.property('instructor'); 
        });
        
        it('[GET] Success (Instructor User) - Includes Instructor Data', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${instructorUserToken}`);

            logResponse(res, 'Get My Profile (Instructor)');
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal('강사유저');
            
            // ✅ 강사 정보 필드 검증 (instructor: true로 조회되어야 함)
            expect(res.body).to.have.property('instructor').that.is.an('object');
            expect(res.body.instructor.location).to.equal('서울시 강남구 역삼동');
            expect(res.body.instructor.category).to.equal('Main');
        });
        
        it('[GET] Error: User Not Found (401) by Auth Middleware', async () => {
            // 토큰은 유효하지만 DB에 존재하지 않는 ID (Auth Middleware에서 401 USER_NOT_FOUND)
            const fakeToken = jwt.sign({ userId: 99999998 }, JWT_SECRET); 
            await prisma.user.deleteMany({ where: { id: 99999998 } }).catch(() => {}); 

            const res = await request(app)
              .get('/api/v1/users/me')
              .set('Authorization', `Bearer ${fakeToken}`);
            
            logResponse(res, 'User Not Found by Auth');
            // 🚨 FIX: Auth Middleware에서 던지는 401을 기대합니다. (Failure 2 해결)
            expect(res.status).to.equal(401); 
            expectErrorLike(res);
            expect(res.body.code).to.equal('USER_NOT_FOUND');
        });
    });

    // ======================
    // 2) PATCH /users/me
    // ======================
    describe('2. PATCH /users/me - Update My Profile', () => {
        it('[PATCH] Success (General User) - Name & Phone', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me')
                .set('Authorization', `Bearer ${generalUserToken}`)
                .send({ name: '변경된일반이름', phoneNumber: '010-9999-9999' });

            logResponse(res, 'Update General Profile - Success');
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal('변경된일반이름');
            expect(res.body.userphoneNumber).to.equal('010-9999-9999');
            // 🚨 FIX: 서비스 코드 수정으로 이 검증 통과 예상 (Failure 1, 3 해결)
            expect(res.body).to.not.have.property('instructor'); 
        });

        it('[PATCH] Success (Instructor User) - Address Update', async () => {
            const newAddress = '경기도 성남시 분당구';
            const res = await request(app)
                .patch('/api/v1/users/me')
                .set('Authorization', `Bearer ${instructorUserToken}`)
                .send({ address: newAddress, phoneNumber: '010-2222-3333' }); // 주소와 전화번호 동시 업데이트

            logResponse(res, 'Update Instructor Profile - Address Success');
            expect(res.status).to.equal(200);
            
            // 강사 필드 검증 (location 업데이트, lat/lng 초기화)
            expect(res.body.instructor.location).to.equal(newAddress);
            expect(res.body.instructor.lat).to.be.null; 
            expect(res.body.instructor.lng).to.be.null; 
        });
        
        it('[PATCH] Error: Empty Body (400) - No update fields', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me')
                .set('Authorization', `Bearer ${generalUserToken}`)
                .send({});

            logResponse(res, 'Update My Profile - Empty Body');
            expect(res.status).to.equal(400); 
            expectErrorLike(res);
            expect(res.body.code).to.equal('NO_UPDATE_FIELDS'); 
        });

        it('[PATCH] Error: Invalid Type (400) - Name must be string', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me')
                .set('Authorization', `Bearer ${generalUserToken}`)
                .send({ name: 12345 }); // name이 숫자인 경우

            logResponse(res, 'Update My Profile - Invalid Type');
            expect(res.status).to.equal(400);
            expectErrorLike(res);
            expect(res.body.code).to.equal('INVALID_NAME'); 
        });
        
        it('[PATCH] Error: Invalid Address Type (400)', async () => {
             const res = await request(app)
                .patch('/api/v1/users/me')
                .set('Authorization', `Bearer ${generalUserToken}`)
                .send({ address: { street: 'no' } }); // address를 객체로 전송

            logResponse(res, 'Update Profile - Invalid Address Type');
            expect(res.status).to.equal(400); 
            expectErrorLike(res);
            expect(res.body.code).to.equal('INVALID_ADDRESS'); 
        });
    });

    // ======================
    // 3) DELETE /users/me
    // ======================
    describe('3. DELETE /users/me - Withdraw', () => {
        it('[DELETE] Success (200) - General User Withdraw', async () => {
            // 이 토큰은 deleteUserId를 포함 (삭제 테스트용 유저)
            const res = await request(app)
                .delete('/api/v1/users/me')
                .set('Authorization', `Bearer ${deleteUserToken}`);

            logResponse(res, 'Withdraw - Success');
            expect(res.status).to.equal(200);
            expect(res.body.message).to.include('회원 탈퇴가 완료되었습니다.');

            // DB에서 실제로 삭제되었는지 확인
            const deleted = await prisma.user.findUnique({ where: { id: deleteUserId } });
            expect(deleted).to.be.null;
        });

        it('[DELETE] Error: Cannot Withdraw Twice (401 or 404)', async () => {
            // 삭제된 유저의 토큰으로 다시 시도
            const res = await request(app)
                .delete('/api/v1/users/me')
                .set('Authorization', `Bearer ${deleteUserToken}`); 

            logResponse(res, 'Withdraw - Deleted User');
            // 토큰은 유효하지만 유저 ID가 DB에 없으므로, Auth Middleware에서 401 USER_NOT_FOUND 에러 반환
            expect(res.status).to.equal(401); 
            expectErrorLike(res);
        });

        it('[DELETE] Error: No Token (401)', async () => {
            const res = await request(app).delete('/api/v1/users/me');
            logResponse(res, 'Withdraw - No Token');
            expect(res.status).to.equal(401);
            expectErrorLike(res);
        });
    });
});