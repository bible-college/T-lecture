const request = require('supertest');
const { expect } = require('chai');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { app, server } = require('../../src/server'); // server.js 경로 확인 필요

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const ADMIN_EMAIL = 'metadata_admin_test@test.com';
const NON_ADMIN_EMAIL = 'non_admin_meta@test.com'; // 비관리자 토큰 생성용

describe('Metadata API Integration Test (All Routes)', () => {
    let adminToken;
    let nonAdminToken; // 비관리자 강사 토큰
    let teamId;
    let virtueId;

    // ✅ [로그 헬퍼] 성공/실패 여부 상관없이 요청 정보와 응답 본문(JSON)을 출력
    const logResponse = (res, label) => {
        console.log(`\n📦 [${label}] ${res.req.method} ${res.req.path}`);
        console.log(`Status: ${res.status}`);
        if (res.body) {
            console.log('Response Body:', JSON.stringify(res.body, null, 2));
        }
        const authHeader = res.req.headers?.authorization;
        if (authHeader) console.log('Auth Header:', authHeader.substring(0, 30) + '...');
        console.log('--------------------------------------------------\n');
    };

    const expectErrorShape = (res) => {
        expect(res.status).to.be.at.least(400);
        expect(res.body).to.be.an('object');
        expect(res.body.error || res.body.message || res.body.code).to.exist;
    };

    // ✅ 1. 테스트 데이터 초기화 및 시딩
    before(async () => {
        try {
            // 1-1. DB 정리 (FK 제약 조건 고려: 자식 -> 부모 순서)
            await prisma.messageAssignment.deleteMany(); 
            await prisma.messageReceipt.deleteMany(); 
            await prisma.message.deleteMany(); 
            await prisma.messageTemplate.deleteMany();

            await prisma.instructorUnitAssignment.deleteMany(); 
            await prisma.instructorUnitDistance.deleteMany();
            
            await prisma.instructorVirtue.deleteMany();
            await prisma.instructorAvailability.deleteMany();
            await prisma.instructorStats.deleteMany();
            await prisma.instructor.deleteMany(); 

            await prisma.unitSchedule.deleteMany();
            await prisma.trainingLocation.deleteMany();
            await prisma.unit.deleteMany();

            await prisma.admin.deleteMany();
            await prisma.user.deleteMany({ where: { userEmail: { in: [ADMIN_EMAIL, NON_ADMIN_EMAIL] } } });

            await prisma.team.deleteMany();
            await prisma.virtue.deleteMany();

            // ---------------------------------------------------------
            // 1-2. 데이터 시딩
            
            // (1) 팀 생성
            const team = await prisma.team.create({ data: { name: '초기테스트팀' } });
            teamId = team.id;

            // (2) 덕목 생성
            const virtue = await prisma.virtue.create({ data: { name: '초기테스트덕목' } });
            virtueId = virtue.id;

            // (3) 메시지 템플릿 생성
            await prisma.messageTemplate.create({
                data: { key: 'TEMPORARY', title: '임시 타이틀', body: '내용: {{content}}' }
            });

            // (4) 관리자 계정 생성 (토큰 발급용)
            const adminUser = await prisma.user.create({
                data: {
                    userEmail: ADMIN_EMAIL,
                    password: 'hash',
                    name: '관리자',
                    userphoneNumber: '010-0000-0000',
                    status: 'APPROVED',
                    admin: { create: { level: 'SUPER' } }
                }
            });
            adminToken = jwt.sign({ userId: adminUser.id }, JWT_SECRET);

            // (5) 비관리자 계정 생성 (권한 테스트용)
            const nonAdminUser = await prisma.user.create({
                data: {
                    userEmail: NON_ADMIN_EMAIL,
                    password: 'hash',
                    name: '비관리자',
                    userphoneNumber: '010-9999-9999',
                    status: 'APPROVED',
                    instructor: { create: { teamId: team.id, category: 'Main', location: '서울' } }
                }
            });
            nonAdminToken = jwt.sign({ userId: nonAdminUser.id }, JWT_SECRET);


            console.log('✅ Metadata Test Data Seeded');
        } catch (error) {
            console.error('❌ Seeding Failed:', error);
            throw error;
        }
    });

    after(async () => {
        if (server) server.close();
        await prisma.$disconnect();
    });

    // =================================================================
    // 🧪 1. Public 조회 API (인증 불필요)
    // =================================================================
    
    describe('1. Public Read APIs (No Auth)', () => {
        it('[GET] /instructor - 통합 메타데이터 조회 (Success)', async () => {
            const res = await request(app).get('/api/v1/metadata/instructor');
            
            logResponse(res, 'Get Instructor Meta');
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('virtues').that.is.an('array');
            expect(res.body).to.have.property('teams').that.is.an('array');
            expect(res.body).to.have.property('categories').that.is.an('array');
        });

        it('[GET] /teams - 팀 목록 조회 (Success)', async () => {
            const res = await request(app).get('/api/v1/metadata/teams');
            
            logResponse(res, 'Get Teams');
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body.some(t => t.name === '초기테스트팀')).to.be.true;
        });

        it('[GET] /virtues - 덕목 목록 조회 (Success)', async () => {
            const res = await request(app).get('/api/v1/metadata/virtues');
            
            logResponse(res, 'Get Virtues');
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body.some(v => v.name === '초기테스트덕목')).to.be.true;
        });
    });


    // =================================================================
    // 🧪 2. Protected 조회 API (관리자 전용)
    // =================================================================

    describe('2. Protected Read API (GET /templates)', () => {
        it('[GET] /templates - Success (Admin)', async () => {
            const res = await request(app)
                .get('/api/v1/metadata/templates')
                .set('Authorization', `Bearer ${adminToken}`);
            
            logResponse(res, 'Get Templates (Admin Success)');
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0].key).to.equal('TEMPORARY');
        });

        it('[GET] /templates - Error: No Token (401)', async () => {
            const res = await request(app).get('/api/v1/metadata/templates');
            
            logResponse(res, 'Get Templates (401 No Token)');
            
            expect(res.status).to.equal(401);
            expectErrorShape(res);
        });
        
        it('[GET] /templates - Error: Non-Admin Token (403)', async () => {
            const res = await request(app)
                .get('/api/v1/metadata/templates')
                .set('Authorization', `Bearer ${nonAdminToken}`);
            
            logResponse(res, 'Get Templates (403 Non-Admin)');
            
            expect(res.status).to.equal(403);
            expectErrorShape(res);
            expect(res.body.error).to.include('관리자만 접근할 수 있습니다.');
        });
    });

    // =================================================================
    // 🧪 3. 수정 API - 팀 (Team)
    // =================================================================

    describe('3. Team Update API (PUT /teams/:id)', () => {
        it('[PUT] Success (Admin)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/teams/${teamId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '수정된팀이름' });
            
            logResponse(res, 'Update Team (Success)');
            
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal('수정된팀이름');
        });

        it('[PUT] Error: No Token (401)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/teams/${teamId}`)
                .send({ name: 'Fail' });
            
            logResponse(res, 'Update Team (401 No Token)');
            
            expect(res.status).to.equal(401);
            expectErrorShape(res);
        });

        it('[PUT] Error: Non-Admin Token (403)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/teams/${teamId}`)
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .send({ name: 'Fail' });
            
            logResponse(res, 'Update Team (403 Non-Admin)');
            
            expect(res.status).to.equal(403);
            expectErrorShape(res);
        });

        it('[PUT] Error: Missing Name (400)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/teams/${teamId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({}); 
            
            logResponse(res, 'Update Team (400 Missing Name)');
            
            expect(res.status).to.equal(400);
            expect(res.body.code).to.equal('VALIDATION_ERROR');
            expect(res.body.error).to.include('팀 이름(name)이 필요합니다.');
        });

        it('[PUT] Error: Not Found ID (404)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/teams/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Fail' });
            
            logResponse(res, 'Update Team (404 Not Found)');
            
            expect(res.status).to.equal(404);
            expect(res.body.code).to.equal('NOT_FOUND');
            // 변경: '해당 팀을 찾을 수 없습니다.' -> '대상을 찾을 수 없습니다.'
            expect(res.body.error).to.include('대상을 찾을 수 없습니다.'); 
        });
    });

    // =================================================================
    // 🧪 4. 수정 API - 덕목 (Virtue)
    // =================================================================

    describe('4. Virtue Update API (PUT /virtues/:id)', () => {
        it('[PUT] Success (Admin)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/virtues/${virtueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '수정된덕목' });
            
            logResponse(res, 'Update Virtue (Success)');
            
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal('수정된덕목');
        });

        it('[PUT] Error: No Token (401)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/virtues/${virtueId}`)
                .send({ name: 'Fail' });
            
            logResponse(res, 'Update Virtue (401 No Token)');
            
            expect(res.status).to.equal(401);
            expectErrorShape(res);
        });
        
        it('[PUT] Error: Non-Admin Token (403)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/virtues/${virtueId}`)
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .send({ name: 'Fail' });
            
            logResponse(res, 'Update Virtue (403 Non-Admin)');
            
            expect(res.status).to.equal(403);
            expectErrorShape(res);
        });

        it('[PUT] Error: Missing Name (400)', async () => {
            const res = await request(app)
                .put(`/api/v1/metadata/virtues/${virtueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({}); // name 없음
            
            logResponse(res, 'Update Virtue (400 Missing Name)');
            
            expect(res.status).to.equal(400);
            expect(res.body.code).to.equal('VALIDATION_ERROR');
            expect(res.body.error).to.include('덕목 이름(name)이 필요합니다.');
        });

        it('[PUT] Error: Not Found ID (404)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/virtues/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Fail' });
            
            logResponse(res, 'Update Virtue (404 Not Found)');
            
            expect(res.status).to.equal(404);
            expect(res.body.code).to.equal('NOT_FOUND');
            // 변경: '해당 덕목을 찾을 수 없습니다.' -> '대상을 찾을 수 없습니다.'
            expect(res.body.error).to.include('대상을 찾을 수 없습니다.');
        });
    });

    // =================================================================
    // 🧪 5. 수정 API - 템플릿 (Template)
    // =================================================================

    describe('5. Template Update API (PUT /templates/:key)', () => {
        it('[PUT] Success (Admin)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/templates/TEMPORARY')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: '변경타이틀', body: '변경본문' });
            
            logResponse(res, 'Update Template (Success)');
            
            expect(res.status).to.equal(200);
            expect(res.body.title).to.equal('변경타이틀');
        });

        it('[PUT] Error: No Token (401)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/templates/TEMPORARY')
                .send({ title: 'Fail', body: 'Fail' });
            
            logResponse(res, 'Update Template (401 No Token)');
            
            expect(res.status).to.equal(401);
            expectErrorShape(res);
        });
        
        it('[PUT] Error: Non-Admin Token (403)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/templates/TEMPORARY')
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .send({ title: 'Fail', body: 'Fail' });
            
            logResponse(res, 'Update Template (403 Non-Admin)');
            
            expect(res.status).to.equal(403);
            expectErrorShape(res);
        });

        it('[PUT] Error: Missing Title or Body (400)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/templates/TEMPORARY')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: '타이틀만보냄' }); // body 누락
            
            logResponse(res, 'Update Template (400 Missing Body)');
            
            expect(res.status).to.equal(400);
            expect(res.body.code).to.equal('VALIDATION_ERROR');
            expect(res.body.error).to.include('템플릿 제목(title)과 본문(body)이 모두 필요합니다.');
        });

        it('[PUT] Error: Not Found Key (404)', async () => {
            const res = await request(app)
                .put('/api/v1/metadata/templates/INVALID_KEY')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Fail', body: 'Fail' });
            
            logResponse(res, 'Update Template (404 Not Found)');
            
            expect(res.status).to.equal(404);
            expect(res.body.code).to.equal('NOT_FOUND');
            // 변경: '해당 템플릿을 찾을 수 없습니다.' -> '대상을 찾을 수 없습니다.'
            expect(res.body.error).to.include('대상을 찾을 수 없습니다.');
        });
    });
});