// // server/test/unit.spec.js
// const request = require('supertest');
// const { expect } = require('chai');
// const app = require('../src/server'); // server.js에서 app 가져오기
// const xlsx = require('xlsx'); // 엑셀 테스트용

// describe('📋 Unit(부대) API 통합 테스트', () => {
  
//   let adminToken;      // 관리자 인증 토큰
//   let createdUnitId;   // 생성된 부대 ID (테스트 간 공유)
//   let createdScheduleId; // 생성된 일정 ID

//   // [사전 작업] 관리자 로그인하여 토큰 확보
//   before((done) => {
//     request(app)
//       .post('/api/v1/auth/login')
//       .send({
//         email: 'admin@t-lecture.com', // .env의 SUPER_ADMIN_EMAIL
//         password: 'admin',            // .env의 SUPER_ADMIN_PASSWORD
//         loginType: 'ADMIN'
//       })
//       .end((err, res) => {
//         if (err) return done(err);
//         adminToken = res.body.accessToken;
//         console.log('🔑 관리자 토큰 확보 완료');
//         done();
//       });
//   });

//   // ============================================================
//   // 1. 등록 (Create)
//   // ============================================================

//   it('1. [POST] /units - 신규 부대를 단건 등록해야 한다', (done) => {
//     const newUnit = {
//       name: 'Mocha테스트부대',
//       unitType: 'Army',
//       wideArea: '경기',
//       region: '파주',
//       addressDetail: '경기도 파주시 문산읍',
//       officerName: '김단건',
//       officerPhone: '010-1111-1111',
//       officerEmail: 'single@mil.kr',
//       schedules: ['2025-06-01'],
//       trainingLocations: [{ originalPlace: '대강당', plannedCount: 100 }]
//     };

//     request(app)
//       .post('/api/v1/units')
//       .set('Authorization', `Bearer ${adminToken}`)
//       .send(newUnit)
//       .expect(201)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.name).to.equal('Mocha테스트부대');
//         createdUnitId = res.body.id; // 다음 테스트를 위해 ID 저장
//         done();
//       });
//   });

//   // 2. 엑셀 일괄 등록 (실제 사용하는 API 테스트)
//   it('2. [POST] /units/upload/excel - 엑셀 파일로 부대를 일괄 등록해야 한다', (done) => {
//     // 가짜 엑셀 파일 생성 (SheetJS 활용)
//     const wb = xlsx.utils.book_new();
//     const ws = xlsx.utils.json_to_sheet([
//       { '부대명': '엑셀부대1', '군구분': 'Army', '광역': '충남', '지역': '계룡', '담당자명': '김엑셀' },
//       { '부대명': '엑셀부대2', '군구분': 'Navy', '광역': '경기', '지역': '평택', '담당자명': '이해군' }
//     ]);
//     xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
//     const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

//     request(app)
//       .post('/api/v1/units/upload/excel')
//       .set('Authorization', `Bearer ${adminToken}`)
//       .attach('file', excelBuffer, 'test_units.xlsx') // 파일 첨부
//       .expect(201)
//       .end((err, res) => {
//         if (err) return done(err);
//         // 메시지 검증 (2개 등록되었는지)
//         expect(res.body.message).to.include('2개');
//         done();
//       });
//   });

//   // ============================================================
//   // 2. 조회 (Read)
//   // ============================================================

//   it('4. [GET] /units - 부대 목록을 조회해야 한다 (검색 포함)', (done) => {
//     request(app)
//       .get('/api/v1/units')
//       .set('Authorization', `Bearer ${adminToken}`)
//       .query({ keyword: 'Mocha', page: 1, limit: 10 })
//       .expect(200)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.data).to.be.an('array');
//         expect(res.body.data[0].name).to.include('Mocha');
//         done();
//       });
//   });

//   it('5. [GET] /units/:id - 부대 상세 정보를 조회해야 한다', (done) => {
//     request(app)
//       .get(`/api/v1/units/${createdUnitId}`)
//       .set('Authorization', `Bearer ${adminToken}`)
//       .expect(200)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.id).to.equal(createdUnitId);
//         expect(res.body.schedules).to.be.an('array'); // 연관 데이터 확인
//         done();
//       });
//   });

//   // ============================================================
//   // 3. 수정 (Update)
//   // ============================================================

//   it('6. [PATCH] /units/:id/basic - 부대 기본 정보를 수정해야 한다', (done) => {
//     request(app)
//       .patch(`/api/v1/units/${createdUnitId}/basic`)
//       .set('Authorization', `Bearer ${adminToken}`)
//       .send({ name: '수정된Mocha부대' })
//       .expect(200)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.name).to.equal('수정된Mocha부대');
//         done();
//       });
//   });

//   it('7. [PATCH] /units/:id/officer - 부대 담당자 정보를 수정해야 한다', (done) => {
//     request(app)
//       .patch(`/api/v1/units/${createdUnitId}/officer`)
//       .set('Authorization', `Bearer ${adminToken}`)
//       .send({ officerName: '박변경' })
//       .expect(200)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.officerName).to.equal('박변경');
//         done();
//       });
//   });

//   // ============================================================
//   // 4. 하위 리소스 관리 (Sub-resource)
//   // ============================================================

//   it('8. [POST] /units/:id/schedules - 교육 일정을 추가해야 한다', (done) => {
//     request(app)
//       .post(`/api/v1/units/${createdUnitId}/schedules`)
//       .set('Authorization', `Bearer ${adminToken}`)
//       .send({ date: '2025-12-25' })
//       .expect(201)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.date).to.include('2025-12-25');
//         createdScheduleId = res.body.id; // 삭제 테스트를 위해 ID 저장
//         done();
//       });
//   });

//   it('9. [DELETE] /units/:id/schedules/:scheduleId - 교육 일정을 삭제해야 한다', (done) => {
//     request(app)
//       .delete(`/api/v1/units/${createdUnitId}/schedules/${createdScheduleId}`)
//       .set('Authorization', `Bearer ${adminToken}`)
//       .expect(200)
//       .end((err, res) => {
//         if (err) return done(err);
//         expect(res.body.message).to.include('삭제');
//         done();
//       });
//   });

//   // ============================================================
//   // 5. 삭제 (Delete)
//   // ============================================================

//   it('10. [DELETE] /units/:id - 부대를 영구 삭제해야 한다', (done) => {
//     request(app)
//       .delete(`/api/v1/units/${createdUnitId}`)
//       .set('Authorization', `Bearer ${adminToken}`)
//       .expect(204) // No Content
//       .end((err, res) => {
//         if (err) return done(err);
//         done();
//       });
//   });

// });

// server/test/unit.spec.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server'); 
const xlsx = require('xlsx');

// API 응답 로그를 예쁘게 출력하는 헬퍼 함수
const logResponse = (method, url, status, body) => {
  console.log(`\n👉 [${method}] ${url} (Status: ${status})`);
  console.log('📦 Response JSON:');
  console.log(JSON.stringify(body, null, 2));
  console.log('--------------------------------------------------');
};

describe('📋 Unit(부대) API 통합 테스트 (Full Data & Log)', () => {
  
  let adminToken;      
  let createdUnitId;   
  let createdScheduleId; 

  // [사전 작업] 토큰 확보
  before((done) => {
    request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@t-lecture.com', 
        password: 'admin',            
        loginType: 'ADMIN'
      })
      .end((err, res) => {
        if (err) return done(err);
        adminToken = res.body.accessToken;
        console.log('\n🔑 관리자 토큰 확보 완료');
        done();
      });
  });

  // ============================================================
  // 1. 단건 등록
  // ============================================================
  it('1. [POST] /units - 신규 부대를 단건 등록해야 한다', (done) => {
    const newUnit = {
      name: '단건테스트부대',
      unitType: 'Army',
      wideArea: '경기',
      region: '파주',
      addressDetail: '경기도 파주시 문산읍 임진각로 148-53', // 실제 주소 포맷
      lat: 37.88, // 좌표도 포함 가능
      lng: 126.74,
      officerName: '김단건',
      officerPhone: '010-1111-1111',
      officerEmail: 'single@mil.kr',
      schedules: ['2025-06-01', '2025-06-02'], // 복수 일정
      trainingLocations: [
        { originalPlace: '대강당', plannedCount: 100, note: '빔프로젝터 있음' },
        { originalPlace: '소강당', plannedCount: 50, note: '음향시설 필요' }
      ]
    };

    request(app)
      .post('/api/v1/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUnit)
      .expect(201)
      .end((err, res) => {
        logResponse('POST', '/api/v1/units', res.status, res.body); // 로그 출력
        if (err) return done(err);
        
        expect(res.body.name).to.equal('단건테스트부대');
        createdUnitId = res.body.id;
        done();
      });
  });

  // ============================================================
  // 2. 엑셀 일괄 등록 (모든 컬럼 포함)
  // ============================================================
  it('2. [POST] /units/upload/excel - 엑셀 파일로 부대를 일괄 등록해야 한다', (done) => {
    // Service 로직(unit.service.js)에서 매핑하는 모든 컬럼 포함
    const excelData = [
      { 
        '부대명': '엑셀부대_A', 
        '군구분': 'Army', 
        '광역': '충남', 
        '지역': '계룡', 
        '주소': '충청남도 계룡시 신도안면 부남리',
        '담당자명': '박육군',
        '연락처': '010-2222-3333',
        '이메일': 'army@test.com',
        '교육일정': '2025-07-01, 2025-07-02', // 콤마로 구분된 일정
        '교육장소명': '본청 대회의실',
        '계획인원': 200
      },
      { 
        '부대명': '엑셀부대_B', 
        '군구분': 'Navy', 
        '광역': '경기', 
        '지역': '평택', 
        '주소': '경기도 평택시 포승읍',
        '담당자명': '이해군',
        '연락처': '010-4444-5555',
        '이메일': 'navy@test.com',
        '교육일정': '2025-08-15',
        '교육장소명': '해군 회관',
        '계획인원': 150
      }
    ];

    // SheetJS를 사용하여 가짜 엑셀 파일(Buffer) 생성
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    request(app)
      .post('/api/v1/units/upload/excel')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', excelBuffer, 'test_full_data.xlsx') // 파일 첨부
      .expect(201)
      .end((err, res) => {
        logResponse('POST', '/api/v1/units/upload/excel', res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.message).to.include('2개'); // 2건 등록 확인
        done();
      });
  });

  // ============================================================
  // 3. 목록 조회 (검색 포함)
  // ============================================================
  it('3. [GET] /units - 부대 목록을 조회해야 한다', (done) => {
    request(app)
      .get('/api/v1/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ keyword: '엑셀', page: 1, limit: 10 }) // 방금 엑셀로 넣은 부대 검색
      .expect(200)
      .end((err, res) => {
        logResponse('GET', '/api/v1/units?keyword=엑셀', res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.data).to.be.an('array');
        expect(res.body.data.length).to.be.at.least(1);
        done();
      });
  });

  // ============================================================
  // 4. 상세 조회
  // ============================================================
  it('4. [GET] /units/:id - 부대 상세 정보를 조회해야 한다', (done) => {
    request(app)
      .get(`/api/v1/units/${createdUnitId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .end((err, res) => {
        logResponse('GET', `/api/v1/units/${createdUnitId}`, res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.id).to.equal(createdUnitId);
        expect(res.body.schedules).to.be.an('array');
        expect(res.body.trainingLocations).to.be.an('array');
        done();
      });
  });

  // ============================================================
  // 5. 기본 정보 수정
  // ============================================================
  it('5. [PATCH] /units/:id/basic - 부대 기본 정보를 수정해야 한다', (done) => {
    request(app)
      .patch(`/api/v1/units/${createdUnitId}/basic`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '수정된부대명', region: '서울' })
      .expect(200)
      .end((err, res) => {
        logResponse('PATCH', `/api/v1/units/${createdUnitId}/basic`, res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.name).to.equal('수정된부대명');
        expect(res.body.region).to.equal('서울');
        done();
      });
  });

  // ============================================================
  // 6. 담당자 정보 수정
  // ============================================================
  it('6. [PATCH] /units/:id/officer - 부대 담당자 정보를 수정해야 한다', (done) => {
    request(app)
      .patch(`/api/v1/units/${createdUnitId}/officer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ officerName: '최변경', officerPhone: '010-9999-8888' })
      .expect(200)
      .end((err, res) => {
        logResponse('PATCH', `/api/v1/units/${createdUnitId}/officer`, res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.officerName).to.equal('최변경');
        done();
      });
  });

  // ============================================================
  // 7. 일정 추가
  // ============================================================
  it('7. [POST] /units/:id/schedules - 교육 일정을 추가해야 한다', (done) => {
    request(app)
      .post(`/api/v1/units/${createdUnitId}/schedules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ date: '2025-12-25' })
      .expect(201)
      .end((err, res) => {
        logResponse('POST', `/api/v1/units/${createdUnitId}/schedules`, res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.date).to.include('2025-12-25');
        createdScheduleId = res.body.id; 
        done();
      });
  });

  // ============================================================
  // 8. 일정 삭제
  // ============================================================
  it('8. [DELETE] /units/:id/schedules/:scheduleId - 교육 일정을 삭제해야 한다', (done) => {
    request(app)
      .delete(`/api/v1/units/${createdUnitId}/schedules/${createdScheduleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .end((err, res) => {
        logResponse('DELETE', `/api/v1/units/${createdUnitId}/schedules/${createdScheduleId}`, res.status, res.body);
        if (err) return done(err);
        
        expect(res.body.message).to.include('삭제');
        done();
      });
  });

  // ============================================================
  // 9. 부대 삭제
  // ============================================================
  it('9. [DELETE] /units/:id - 부대를 영구 삭제해야 한다', (done) => {
    request(app)
      .delete(`/api/v1/units/${createdUnitId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204) // No Content
      .end((err, res) => {
        // 204는 body가 없으므로 로그에 빈 객체로 나올 수 있음
        logResponse('DELETE', `/api/v1/units/${createdUnitId}`, res.status, res.body); 
        if (err) return done(err);
        done();
      });
  });

});