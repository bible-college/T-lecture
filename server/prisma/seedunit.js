// prisma/seedunit.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up previous data... (기존 데이터 삭제 중)');
  
  // [초기화] 외래키 제약조건 때문에 자식 테이블부터 순서대로 지워야 합니다.
  try {
    // 1. 관계 테이블 삭제
    await prisma.instructorUnitDistance.deleteMany(); // 거리 데이터
    await prisma.instructorAvailability.deleteMany(); // 가능일 데이터
    await prisma.instructorVirtue.deleteMany();       // 강사 덕목

    // 2. 부대 관련 삭제
    await prisma.unitSchedule.deleteMany();
    await prisma.trainingLocation.deleteMany();
    await prisma.unit.deleteMany(); // 부대 삭제

    // 3. 강사 및 유저 삭제
    await prisma.instructor.deleteMany(); // 강사 정보 삭제
    // 테스트용 유저(@test.com)만 골라서 삭제 (관리자 계정 등 보호)
    await prisma.user.deleteMany({
      where: { userEmail: { endsWith: '@test.com' } }
    });
    
    // (참고) Team, Virtue 등은 중복 생성되어도 큰 문제 없으므로 일단 둠 (필요시 삭제 추가)

  } catch (e) {
    // 테이블이 없거나 하는 등의 에러는 무시하고 진행
    console.log('⚠️ Cleanup warning:', e.message);
  }

  console.log('🌱 Seeding process started... (데이터 생성 시작)');

  // 1. 기초 데이터 생성 (팀, 덕목)
  // 중복 생성을 막기 위해 upsert(없으면 생성, 있으면 리턴) 사용 추천하지만, 간단히 create 사용
  let team = await prisma.team.findFirst({ where: { name: '교육1팀' } });
  if (!team) {
      team = await prisma.team.create({ data: { name: '교육1팀' } });
  }
  
  let virtue = await prisma.virtue.findFirst({ where: { name: '성실' } });
  if (!virtue) {
      virtue = await prisma.virtue.create({ data: { name: '성실' } });
  }

  // 2. 강사 생성 (기존 유지 - 10명)
  const instructors = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // 내일 날짜
  
  // 강사들의 가용일을 좀 더 다양하게 (내일 ~ 모레)
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

  for (let i = 1; i <= 10; i++) {
    // Enum 값 검증: Main, Co, Assistant, Practicum 중 하나여야 함
    const category = i % 2 === 0 ? 'Main' : 'Assistant'; 
    const isAvailableTomorrow = i % 3 !== 0; // 3명 중 2명은 내일 가능

    const user = await prisma.user.create({
      data: {
        userEmail: `instructor${i}@test.com`,
        password: '$2b$10$DUMMYHASHVALUE', 
        name: `강사_${i}`,
        userphoneNumber: `010-0000-00${i < 10 ? '0' + i : i}`,
        status: 'APPROVED',
        instructor: {
          create: {
            teamId: team.id,
            category: category, 
            location: '서울시 강남구',
            profileCompleted: true,
            virtues: {
              create: { virtueId: virtue.id },
            },
            // 강사 가능일 등록
            availabilities: { 
                create: isAvailableTomorrow 
                    ? [{ availableOn: tomorrow }, { availableOn: dayAfterTomorrow }] 
                    : [{ availableOn: dayAfterTomorrow }]
            }
          },
        },
      },
      include: { instructor: true }, 
    });
    
    if (user.instructor) {
        instructors.push(user.instructor);
    }
  }
  console.log(`✅ Created ${instructors.length} instructors with availability.`);

  // 3. 부대 및 일정, 교육장소 생성 (데이터 확대!)
  const units = [];
  const regions = ['경기', '강원', '충청', '전라', '경상']; // 지역 다양화
  
  // ★ 부대 개수를 20개로 늘림
  for (let i = 1; i <= 20; i++) {
    const region = regions[i % regions.length];
    
    // ★ [핵심] 하나의 부대에 교육장소를 1개 ~ 3개 랜덤 생성
    const locationCount = Math.floor(Math.random() * 3) + 1; // 1, 2, 3 중 하나
    const locationsToCreate = [];

    for (let j = 1; j <= locationCount; j++) {
        locationsToCreate.push({
            originalPlace: `제${i}부대_${j}교육장`, // 예: 제1부대_1교육장, 제1부대_2교육장
            instructorsNumbers: Math.floor(Math.random() * 2) + 2, // 필요 강사 2~3명
            plannedCount: Math.floor(Math.random() * 50) + 30,     // 인원 30~80명
        });
    }

    const unit = await prisma.unit.create({
      data: {
        name: `제${i}부대`,
        region: region,
        addressDetail: `${region} 어딘가 ${i}번지`,
        
        // 스케줄 생성 (일단 내일 날짜로 고정하여 테스트 집중)
        schedules: {
          create: {
            date: tomorrow, 
          },
        },

        // 교육장소 생성 (배열로 전달)
        trainingLocations: {
            create: locationsToCreate
        }
      },
      include: { schedules: true },
    });
    units.push(unit);
  }
  console.log(`✅ Created ${units.length} units with multiple locations.`);

  // 4. 거리 데이터 생성
  // (부대가 20개로 늘어났으므로 10명 * 20부대 = 200개의 거리 데이터 생성됨)
  const distanceData = [];
  for (const instructor of instructors) {
    for (const unit of units) {
      const randomDist = Math.floor(Math.random() * 95) + 5; // 5 ~ 100km
      
      distanceData.push({
        userId: instructor.userId, // Instructor PK는 userId
        unitId: unit.id,
        distance: randomDist,
        duration: randomDist * 1.5 * 60, // 대략적인 소요시간 (초)
      });
    }
  }

  // createMany로 한 번에 넣기 (성능 최적화)
  await prisma.instructorUnitDistance.createMany({
    data: distanceData,
    skipDuplicates: true,
  });
  console.log(`✅ Created distance data for ${instructors.length} instructors x ${units.length} units.`);

  console.log('🏁 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });