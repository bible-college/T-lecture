const request = require('supertest');
const { expect } = require('chai');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { app, server } = require('../../src/server'); // 경로 확인 완료

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const ADMIN_EMAIL = 'unit_admin_test@test.com';
const NON_ADMIN_EMAIL = 'unit_nonadmin@test.com';

// 엑셀 서비스 모킹을 위한 변수
let excelService;
let originalBufferToJson;

describe('Unit API Integration Test (All Routes)', () => {
    let adminToken;
    let nonAdminToken;
    let createdUnitId;
    let createdScheduleId;
    let unitToDeleteId; // 삭제 테스트용 유닛 ID

    // ✅ [로그 헬퍼] 성공/실패 여부 상관없이 JSON 본문 출력
    const logResponse = (res, label) => {
        console.log(`\n📦 [${label}] ${res.req.method} ${res.req.path} (${res.status})`);
        if (res.body) {
            const prefix = res.status >= 400 ? 'Error:' : 'Response Body:';
            console.log(prefix, JSON.stringify(res.body, null, 2));
        } else if (res.status === 204) {
            console.log('Response Body: (204 No Content)');
        }
        console.log('--------------------------------------------------\n');
    };

    const expectErrorShape = (res) => {
        expect(res.status).to.be.at.least(400);
        expect(res.body).to.be.an('object');
        expect(res.body.error || res.body.message).to.exist;
    };

    before(async () => {
        // 1. DB 정리 (FK 제약 방지 핵심 순서)
        await prisma.instructorUnitAssignment.deleteMany().catch(() => {});
        await prisma.instructorUnitDistance.deleteMany().catch(() => {});
        await prisma.instructor.deleteMany().catch(() => {}); // 강사 관련 FK 정리
        await prisma.admin.deleteMany();
        await prisma.user.deleteMany({ where: { userEmail: { in: [ADMIN_EMAIL, NON_ADMIN_EMAIL] } } });
        
        await prisma.unitSchedule.deleteMany();
        await prisma.trainingLocation.deleteMany();
        await prisma.unit.deleteMany();
        
        // 2. 관리자 및 비관리자 생성 (토큰 발급용)
        const adminUser = await prisma.user.create({
            data: {
                userEmail: ADMIN_EMAIL,
                password: 'hash',
                name: '관리자',
                status: 'APPROVED',
                admin: { create: { level: 'SUPER' } }
            }
        });
        adminToken = jwt.sign({ userId: adminUser.id }, JWT_SECRET);
        
        const nonAdminUser = await prisma.user.create({
            data: {
                userEmail: NON_ADMIN_EMAIL,
                password: 'hash',
                name: '비관리자',
                status: 'APPROVED',
            }
        });
        nonAdminToken = jwt.sign({ userId: nonAdminUser.id }, JWT_SECRET);

        // 3. 엑셀 서비스 모킹 설정
        // 🚨 FIX: unit.controller.js가 참조하는 경로로 가져옵니다.
        excelService = require('../../src/infra/excel.service'); 
        originalBufferToJson = excelService.bufferToJson;
        
        // 4. 삭제 테스트용 유닛 생성
        const unitToDelete = await prisma.unit.create({
             data: { name: '삭제대상부대', region: '서울', unitType: 'Army' }
        });
        unitToDeleteId = unitToDelete.id;

        console.log('✅ Unit Test Data Seeded');
    });

    after(async () => {
        // 엑셀 서비스 원상 복구
        if (excelService && originalBufferToJson) {
             excelService.bufferToJson = originalBufferToJson;
        }
        if (server) server.close();
        await prisma.$disconnect();
    });

    // =================================================================
    // 🧪 0. Auth & Role Check Helper
    // =================================================================
    const testAuthFailure = (method, path, body = {}, expectedCode = 403) => {
        it(`[AUTH] ${method} ${path} - No Token (401)`, async () => {
            const res = await request(app)[method.toLowerCase()](path).send(body);
            expect(res.status).to.equal(401);
            expectErrorShape(res);
        });

        it(`[AUTH] ${method} ${path} - Non-Admin (403)`, async () => {
            const res = await request(app)[method.toLowerCase()](path)
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .send(body);
            expect(res.status).to.equal(403);
            expectErrorShape(res);
            expect(res.body.error).to.include('관리자만 접근할 수 있습니다.');
        });
    };
    
    // =================================================================
    // 🧪 1. POST / (단건 등록) & POST /upload/excel (일괄 등록)
    // =================================================================

    describe('1. POST / & POST /upload/excel', () => {
        // 단건 등록에 대한 권한 검증
        testAuthFailure('POST', '/api/v1/units', { name: 'Fail' });
        
        it('[POST] / - Create Unit (Success, 201)', async () => {
            const res = await request(app)
                .post('/api/v1/units')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '제1테스트부대',
                    unitType: 'Army',
                    region: '서울',
                    addressDetail: '서울시 상세주소',
                    trainingLocations: [
                        { originalPlace: '연병장', instructorsNumbers: 5 }
                    ]
                });
            
            logResponse(res, 'Create Unit');
            expect(res.status).to.equal(201);
            expect(res.body.data.trainingLocations).to.have.lengthOf(1);
            createdUnitId = res.body.data.id;
        });

        it('[POST] / - Missing Name (Error 400)', async () => {
            const res = await request(app)
                .post('/api/v1/units')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ region: '서울' }); // name 누락
            
            logResponse(res, 'Create Unit Fail');
            // ✅ Service 로직 (mapper에서 throw Error -> service에서 AppError 400로 변환)
            expect(res.status).to.equal(400); 
            expect(res.body.code).to.equal('VALIDATION_ERROR');
            expect(res.body.error).to.include('부대명(name)은 필수입니다.');
        });
        
        // --- Excel Upload Tests ---
        
        it('[POST] /upload/excel - Success (201)', async () => {
            // Success Mock: 2개의 유닛을 반환하도록 설정
            excelService.bufferToJson = () => ([
                { '부대명': '엑셀부대1', '군구분': 'Army', '주소': '서울' },
                { '부대명': '엑셀부대2', '군구분': 'Navy', '주소': '부산' }
            ]);

            const res = await request(app)
                .post('/api/v1/units/upload/excel')
                .set('Authorization', `Bearer ${adminToken}`)
                // 파일 자체는 더미로 보내야 Multer가 통과시키고 Controller로 진입함
                .attach('file', Buffer.from('dummy data'), 'test.xlsx'); 
            
            logResponse(res, 'Excel Upload Success');
            expect(res.status).to.equal(201);
            expect(res.body.data.count).to.equal(2);
            
            // cleanup: 엑셀로 생성된 유닛을 찾아서 삭제 (목록 조회가 다음 테스트에서 클린하도록)
            const unit1 = await prisma.unit.findFirst({ where: { name: '엑셀부대1' } });
            const unit2 = await prisma.unit.findFirst({ where: { name: '엑셀부대2' } });
            if (unit1) await prisma.unit.delete({ where: { id: unit1.id } });
            if (unit2) await prisma.unit.delete({ where: { id: unit2.id } });
        });

        it('[POST] /upload/excel - No File Attached (Error 400)', async () => {
            const res = await request(app)
                .post('/api/v1/units/upload/excel')
                .set('Authorization', `Bearer ${adminToken}`); // .attach가 없는 경우
                
            logResponse(res, 'Excel Upload Fail (No File)');
            expect(res.status).to.equal(400);
            expect(res.body.error).to.include('파일이 업로드되지 않았습니다');
        });
        
        it('[POST] /upload/excel - Invalid Excel Data (Error 400)', async () => {
            // Invalid Mock: 필수 필드인 '부대명'이 없는 데이터를 반환하도록 설정
            excelService.bufferToJson = () => ([
                { '군구분': 'Army', '주소': '서울' } // 부대명 누락
            ]);
            
            const res = await request(app)
                .post('/api/v1/units/upload/excel')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from('dummy data'), 'test.xlsx');
                
            logResponse(res, 'Excel Upload Fail (Invalid Data)');
            expect(res.status).to.equal(400);
            expect(res.body.error).to.include('부대명(name)은 필수입니다.');
        });
    });

    // =================================================================
    // 🧪 2. GET / (목록 조회) & GET /:id (상세 조회)
    // =================================================================

    describe('2. GET / & GET /:id', () => {
        // 목록 조회에 대한 권한 검증
        testAuthFailure('GET', '/api/v1/units');

        it('[GET] / - Get List (Success, Filter/Paging)', async () => {
            const res = await request(app)
                .get('/api/v1/units')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ keyword: '테스트부대', limit: 1 });

            logResponse(res, 'Get Unit List');
            expect(res.status).to.equal(200);
            expect(res.body.data.data).to.be.an('array');
            expect(res.body.data.data.length).to.equal(1);
            expect(res.body.data.meta.total).to.be.at.least(1);
        });

        it('[GET] /:id - Get Detail (Success)', async () => {
            const res = await request(app)
                .get(`/api/v1/units/${createdUnitId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            logResponse(res, 'Get Unit Detail');
            expect(res.status).to.equal(200);
            expect(res.body.data.id).to.equal(createdUnitId);
            expect(res.body.data.trainingLocations).to.have.lengthOf(1);
        });

        it('[GET] /:id - Not Found (Error 404)', async () => {
            const res = await request(app)
                .get(`/api/v1/units/99999`)
                .set('Authorization', `Bearer ${adminToken}`);

            logResponse(res, 'Get Unit 404');
            expect(res.status).to.equal(404);
            expect(res.body.code).to.equal('UNIT_NOT_FOUND');
        });
        
        it('[GET] /:id - Invalid ID Param (Error 400)', async () => {
            const res = await request(app)
                .get(`/api/v1/units/abc`)
                .set('Authorization', `Bearer ${adminToken}`);

            logResponse(res, 'Get Unit 400');
            // prisma.findUnique에서 id가 숫자가 아니면 400 에러 반환 예상
            expect(res.status).to.equal(400); 
            expect(res.body.code).to.equal('PRISMA_VALIDATION_ERROR');
        });
    });

    // =================================================================
    // 🧪 3. PATCH /:id/basic & PATCH /:id/officer (정보 수정)
    // =================================================================
    
    describe('3. PATCH /:id/basic & PATCH /:id/officer', () => {
        // 기본 정보 수정에 대한 권한 검증
        testAuthFailure('PATCH', `/api/v1/units/${createdUnitId}/basic`, { region: 'Fail' });

        it('[PATCH] /:id/basic - Update Basic Info (Success)', async () => {
            const res = await request(app)
                .patch(`/api/v1/units/${createdUnitId}/basic`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ region: '부산', unitType: 'Navy' });

            logResponse(res, 'Update Basic Info');
            expect(res.status).to.equal(200);
            expect(res.body.data.region).to.equal('부산');
            expect(res.body.data.unitType).to.equal('Navy');
        });
        
        it('[PATCH] /:id/basic - Not Found (Error 404)', async () => {
             const res = await request(app)
                .patch(`/api/v1/units/99999/basic`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ region: 'Fail' });
            
            logResponse(res, 'Update Basic Info 404');
            expect(res.status).to.equal(404);
            expect(res.body.code).to.equal('NOT_FOUND'); // Prisma P2025 -> AppError 404
        });


        // 담당자 정보 수정에 대한 권한 검증
        testAuthFailure('PATCH', `/api/v1/units/${createdUnitId}/officer`, { officerName: 'Fail' });

        it('[PATCH] /:id/officer - Update Officer Info (Success)', async () => {
            const res = await request(app)
                .patch(`/api/v1/units/${createdUnitId}/officer`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ officerName: '김간부', officerPhone: '010-1234-5678' });

            logResponse(res, 'Update Officer');
            expect(res.status).to.equal(200);
            expect(res.body.data.officerName).to.equal('김간부');
            expect(res.body.data.officerPhone).to.equal('010-1234-5678');
        });
    });


    // =================================================================
    // 🧪 4. 하위 리소스: Schedules (일정 추가/삭제)
    // =================================================================
    
    describe('4. Schedules (POST/DELETE)', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowISO = tomorrow.toISOString();

        // helper도 path를 "함수"로 만들기
        const schedulePath = () => `/api/v1/units/${createdUnitId}/schedules`;

        testAuthFailure('POST', schedulePath(), { date: tomorrowISO }); 
        // ⚠️ 위 줄도 createdUnitId가 아직 undefined면 안 좋아서,
        // testAuthFailure 자체도 'path 함수'를 받도록 바꾸는 게 가장 안전함(아래 참고)

        it('[POST] /:id/schedules - Add Schedule (Success, 201)', async () => {
            const res = await request(app)
            .post(schedulePath())
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ date: tomorrowISO });

            logResponse(res, 'Add Schedule');
            expect(res.status).to.equal(201);
            expect(res.body.data.unitId).to.equal(createdUnitId);
            createdScheduleId = res.body.data.id;
        });

        it('[DELETE] /:id/schedules/:scheduleId - Remove Schedule (Success)', async () => {
            const deletePath = `/api/v1/units/${createdUnitId}/schedules/${createdScheduleId}`;

            const res = await request(app)
            .delete(deletePath)
            .set('Authorization', `Bearer ${adminToken}`);

            logResponse(res, 'Remove Schedule');
            expect(res.status).to.equal(200);

            const deleted = await prisma.unitSchedule.findUnique({ where: { id: createdScheduleId } });
            expect(deleted).to.be.null;
        });
    });


    // =================================================================
    // 🧪 5. DELETE /:id (부대 삭제)
    // =================================================================
    
    describe('5. DELETE /:id', () => {
        // 부대 삭제에 대한 권한 검증
        testAuthFailure('DELETE', `/api/v1/units/${unitToDeleteId}`);

        it('[DELETE] /:id - Delete Unit (Success, 204)', async () => {
            const res = await request(app)
                .delete(`/api/v1/units/${unitToDeleteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            logResponse(res, 'Delete Unit');
            expect(res.status).to.equal(204);
            expect(res.body).to.be.empty; 
            
            // DB에서 실제로 삭제되었는지 확인
            const deleted = await prisma.unit.findUnique({ where: { id: unitToDeleteId } });
            expect(deleted).to.be.null;
        });
        
        it('[DELETE] /:id - Not Found (Error 404)', async () => {
            const res = await request(app)
                .delete(`/api/v1/units/99999`)
                .set('Authorization', `Bearer ${adminToken}`);

            logResponse(res, 'Delete Unit 404');
            expect(res.status).to.equal(404);
            expect(res.body.code).to.equal('NOT_FOUND');
        });
    });
});