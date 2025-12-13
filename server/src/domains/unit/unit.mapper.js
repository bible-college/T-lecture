// server/src/domains/unit/unit.mapper.js

// 헬퍼: 문자열 확인
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
// 헬퍼: 날짜 변환
const toDateOrUndef = (v) => (v ? new Date(v) : undefined);

/**
 * [DTO] 부대 생성용 데이터 변환 (CreateUnitDto 역할)
 * - 단건 등록, 엑셀 등록 모두 이 함수를 통과하여 데이터 정합성을 맞춤
 */
function toCreateUnitDto(rawData = {}) {
  // 필수값 검증 (Service 로직 단순화)
  if (!isNonEmptyString(rawData.name)) {
    throw new Error('부대명(name)은 필수입니다.');
  }

  return {
    name: rawData.name,
    unitType: rawData.unitType,
    wideArea: rawData.wideArea,
    region: rawData.region,
    addressDetail: rawData.addressDetail,
    lat: rawData.lat,
    lng: rawData.lng,

    // 시간/날짜 필드 변환
    educationStart: toDateOrUndef(rawData.educationStart),
    educationEnd: toDateOrUndef(rawData.educationEnd),
    workStartTime: toDateOrUndef(rawData.workStartTime),
    workEndTime: toDateOrUndef(rawData.workEndTime),
    lunchStartTime: toDateOrUndef(rawData.lunchStartTime),
    lunchEndTime: toDateOrUndef(rawData.lunchEndTime),

    officerName: rawData.officerName,
    officerPhone: rawData.officerPhone,
    officerEmail: rawData.officerEmail,

    // 일정 (Nested Create)
    schedules: (Array.isArray(rawData.schedules) && rawData.schedules.length > 0)
      ? {
          create: rawData.schedules.map(d => ({ date: new Date(d) }))
        }
      : undefined,

    // 교육장소 (Nested Create)
    trainingLocations: (Array.isArray(rawData.trainingLocations) && rawData.trainingLocations.length > 0)
      ? {
          create: rawData.trainingLocations.map(loc => ({
            originalPlace: loc.originalPlace,
            plannedCount: Number(loc.plannedCount || 0),
            note: loc.note
          }))
        }
      : undefined,
  };
}

/**
 * [Mapper] 엑셀 Row(한글) -> API Raw Data 변환
 */
function excelRowToRawUnit(row = {}) {
  // 콤마로 구분된 일정 문자열 처리
  const schedules = isNonEmptyString(row['교육일정'])
    ? row['교육일정'].split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  // 교육장소 단순화 (엑셀 1줄에 1개 장소라고 가정)
  const trainingLocations = isNonEmptyString(row['교육장소명'])
    ? [{
        originalPlace: row['교육장소명'],
        plannedCount: row['계획인원'] || 0,
        note: row['비고'] || undefined,
      }]
    : [];

  return {
    name: row['부대명'],
    unitType: row['군구분'], // 'Army' | 'Navy'
    wideArea: row['광역'],
    region: row['지역'],
    addressDetail: row['주소'],
    
    // 시간 정보 매핑
    educationStart: row['교육시작일자'],
    educationEnd: row['교육종료일자'],
    workStartTime: row['근무시작시간'],
    workEndTime: row['근무종료시간'],
    lunchStartTime: row['점심시작시간'],
    lunchEndTime: row['점심종료시간'],

    officerName: row['담당자명'],
    officerPhone: row['연락처'],
    officerEmail: row['이메일'],

    schedules,
    trainingLocations,
  };
}

module.exports = {
  toCreateUnitDto,
  excelRowToRawUnit,
};