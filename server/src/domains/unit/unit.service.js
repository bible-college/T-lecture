//server/src/domains/unit/unit.service.js
const unitRepository = require('./unit.repository');

class UnitService {
  /**
   * [신규] 단일 부대 등록 프로세스 처리
   * - 입력 데이터를 정제하고 DB에 저장
   */
  async registerSingleUnit(rawData) {
    const cleanData = {
      name: rawData.name,
      unitType: rawData.unitType,
      wideArea: rawData.wideArea,
      region: rawData.region,
      addressDetail: rawData.addressDetail,
      lat: rawData.lat,
      lng: rawData.lng,
      officerName: rawData.officerName,
      officerPhone: rawData.officerPhone,
      officerEmail: rawData.officerEmail,

      // 일정 정보 구조화
      schedules: (rawData.schedules && rawData.schedules.length > 0)
        ? {
            create: rawData.schedules.map((dateStr) => ({
              date: new Date(dateStr),
            })),
          }
        : undefined,

      // 교육장소 정보 구조화
      trainingLocations: (rawData.trainingLocations && rawData.trainingLocations.length > 0)
        ? {
            create: rawData.trainingLocations.map((loc) => ({
              originalPlace: loc.originalPlace,
              plannedCount: Number(loc.plannedCount || 0),
              note: loc.note,
            })),
          }
        : undefined,
    };

    return await unitRepository.insertOneUnit(cleanData);
  }

  /**
   * [신규] 엑셀 데이터 기반 대량 부대 등록 처리
   * - Controller에서 파싱된 JSON 배열(rawRows)을 받아 매핑 후 저장
   */
  async processExcelDataAndRegisterUnits(rawRows) {
    // 1. 데이터 매핑 (한글 엑셀 컬럼 -> 영문 필드)
    const mappedData = rawRows.map((row) => ({
      name: row['부대명'],
      unitType: row['군구분'],
      wideArea: row['광역'],
      region: row['지역'],
      addressDetail: row['주소'],
      officerName: row['담당자명'],
      officerPhone: row['연락처'],
      officerEmail: row['이메일'],
      
      schedules: row['교육일정'] ? row['교육일정'].split(',').map(d => d.trim()) : [],
      
      trainingLocations: row['교육장소명'] 
        ? [{ originalPlace: row['교육장소명'], plannedCount: row['계획인원'] || 0 }] 
        : []
    }));

    return await this.registerMultipleUnits(mappedData);
  }

  /**
   * [신규] 다수 부대 일괄 등록 (내부 로직)
   */
  async registerMultipleUnits(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('등록할 데이터가 없습니다.');
    }

    const cleanDataList = dataArray.map((rawData) => ({
      name: rawData.name,
      unitType: rawData.unitType,
      wideArea: rawData.wideArea,
      region: rawData.region,
      addressDetail: rawData.addressDetail,
      lat: rawData.lat,
      lng: rawData.lng,
      officerName: rawData.officerName,
      officerPhone: rawData.officerPhone,
      officerEmail: rawData.officerEmail,

      schedules: (rawData.schedules && rawData.schedules.length > 0)
        ? {
            create: rawData.schedules.map((dateStr) => ({
              date: new Date(dateStr),
            })),
          }
        : undefined,

      trainingLocations: (rawData.trainingLocations && rawData.trainingLocations.length > 0)
        ? {
            create: rawData.trainingLocations.map((loc) => ({
              originalPlace: loc.originalPlace,
              plannedCount: Number(loc.plannedCount || 0),
              note: loc.note,
            })),
          }
        : undefined,
    }));

    const results = await unitRepository.insertManyUnits(cleanDataList);
    return { count: results.length };
  }

  /**
   * [변경] 부대 목록 조회 (고도화: 통합 검색 + 고급 필터링)
   * - 지원 기능: 페이징, 키워드 검색, 지역 필터, 일정 기간, 인원수 등
   */
  async searchUnitList(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20); // 기본 20개

    // 쿼리 파라미터 추출
    const { 
      keyword,           // 통합 검색어 (부대명, 지역, 주소)
      region,            // 지역 필터 (정확히 일치)
      wideArea,          // 광역 필터
      unitType,          // 군 구분
      startDate, endDate, // 일정 기간 필터
      minPersonnel, maxPersonnel // 인원수 필터
    } = query;

    // Prisma Where 조건 조립 (AND 조건 배열)
    const where = { AND: [] };

    // 1. 통합 키워드 검색 (부대명 OR 지역 OR 상세주소)
    if (keyword) {
      where.AND.push({
        OR: [
          { name: { contains: keyword } },
          { region: { contains: keyword } },
          { addressDetail: { contains: keyword } }
        ]
      });
    }

    // 2. 기본 필드 필터링
    if (region) where.AND.push({ region: { contains: region } });
    if (wideArea) where.AND.push({ wideArea: wideArea });
    if (unitType) where.AND.push({ unitType: unitType });

    // 3. [고급] 특정 기간 내 교육 일정이 있는 부대만 검색 (Relation Filter)
    if (startDate || endDate) {
      where.AND.push({
        schedules: {
          some: { // 하위 일정 중 하나라도 조건에 맞으면 포함
            date: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            }
          }
        }
      });
    }

    // 4. [고급] 특정 인원수 조건에 맞는 교육장소가 있는 부대 검색 (Relation Filter)
    if (minPersonnel || maxPersonnel) {
      where.AND.push({
        trainingLocations: {
          some: {
            plannedCount: {
              gte: minPersonnel ? Number(minPersonnel) : undefined,
              lte: maxPersonnel ? Number(maxPersonnel) : undefined,
            }
          }
        }
      });
    }

    // 조건이 하나도 없으면 빈 객체로 변환 (전체 조회)
    const finalWhere = where.AND.length > 0 ? where : {};

    // 페이징 계산
    const skip = (page - 1) * limit;

    // Repository 호출
    const { total, units } = await unitRepository.findUnitsByFilterAndCount({ 
      skip, 
      take: limit, 
      where: finalWhere 
    });

    return {
      data: units,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * [변경] 부대 상세 정보 조회
   */
  async getUnitDetailWithSchedules(id) {
    const unit = await unitRepository.findUnitWithRelations(id);
    if (!unit) throw new Error('해당 부대를 찾을 수 없습니다.');
    return unit;
  }

  /**
   * [신규] 부대 기본 정보(이름, 위치 등) 수정
   */
  async modifyUnitBasicInfo(id, rawData) {
    const updateData = {};
    
    if (rawData.name !== undefined) updateData.name = rawData.name;
    if (rawData.unitType !== undefined) updateData.unitType = rawData.unitType;
    if (rawData.wideArea !== undefined) updateData.wideArea = rawData.wideArea;
    if (rawData.region !== undefined) updateData.region = rawData.region;
    
    if (rawData.addressDetail) {
      updateData.addressDetail = rawData.addressDetail;
      updateData.lat = null;
      updateData.lng = null;
    }

    return await unitRepository.updateUnitById(id, updateData);
  }

  /**
   * [신규] 부대 담당자(Contact Point) 정보 수정
   */
  async modifyUnitContactInfo(id, rawData) {
    const updateData = {
      officerName: rawData.officerName,
      officerPhone: rawData.officerPhone,
      officerEmail: rawData.officerEmail,
    };
    return await unitRepository.updateUnitById(id, updateData);
  }

  /**
   * [신규] 특정 부대에 교육 일정 추가
   */
  async addScheduleToUnit(unitId, dateStr) {
    return await unitRepository.insertUnitSchedule(unitId, dateStr);
  }

  /**
   * [신규] 특정 교육 일정 삭제
   */
  async removeScheduleFromUnit(scheduleId) {
    return await unitRepository.deleteUnitSchedule(scheduleId);
  }

  /**
   * [변경] 부대 영구 삭제
   */
  async removeUnitPermanently(id) {
    return await unitRepository.deleteUnitById(id);
  }
}

module.exports = new UnitService();
