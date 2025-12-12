// server/src/domains/assignment/assignment.dto.js

/**
 * 날짜를 KST(한국 시간) 문자열(YYYY-MM-DD)로 변환
 * UTC 기준 날짜가 들어와도 한국 시간으로 9시간 더해서 계산
 */
const toKSTDateString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    // 한국 시간(UTC+9) 오프셋 적용
    const kstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000)); 
    return kstDate.toISOString().split('T')[0];
};

/**
 * 시간을 KST HH:mm 형태로 변환
 */
const toKSTTimeString = (date) => {
    if (!date) return '09:00';
    const d = new Date(date);
    const kstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString().split('T')[1].substring(0, 5);
};

class AssignmentDTO {
    /**
     * 배정 후보 데이터(부대+강사)를 프론트엔드용 포맷으로 변환
     */
    toCandidateResponse(unitsRaw, instructorsRaw) {
        const unassignedUnits = this.mapUnitsToCards(unitsRaw);
        const availableInstructors = this.mapInstructorsToCards(instructorsRaw);

        return {
            unassignedUnits,
            availableInstructors
        };
    }

    // 내부 로직: 부대 -> 카드 변환
    mapUnitsToCards(units) {
        const list = [];
        units.forEach(unit => {
            // 스케줄 날짜들 변환
            const dateStr = toKSTDateString(unit.schedules[0]?.date);
            
            // 교육장소(Location) 별로 카드 쪼개기 (Explosion)
            const locations = (unit.trainingLocations && unit.trainingLocations.length > 0) 
                ? unit.trainingLocations 
                : [{ id: 'def', originalPlace: '교육장소 미정', instructorsNumbers: 0 }];

            locations.forEach(loc => {
                list.push({
                    type: 'UNIT',
                    id: `u-${unit.id}-s-${unit.schedules[0]?.id || 0}-l-${loc.id}`,
                    
                    // [Card UI]
                    unitName: unit.name,
                    originalPlace: loc.originalPlace,
                    instructorsNumbers: loc.instructorsNumbers,
                    date: dateStr,
                    time: toKSTTimeString(unit.workStartTime),
                    location: unit.region,
                    
                    // [Modal Detail]
                    detail: {
                        unitName: unit.name,
                        region: unit.region,
                        wideArea: unit.wideArea,
                        address: unit.addressDetail,
                        officerName: unit.officerName,
                        officerPhone: unit.officerPhone,
                        officerEmail: unit.officerEmail,
                        originalPlace: loc.originalPlace,
                        changedPlace: loc.changedPlace,
                        instructorsNumbers: loc.instructorsNumbers,
                        plannedCount: loc.plannedCount,
                        actualCount: loc.actualCount,
                        note: loc.note,
                        
                        // 날짜/시간 포맷팅
                        educationStart: toKSTDateString(unit.educationStart),
                        educationEnd: toKSTDateString(unit.educationEnd),
                        workStartTime: toKSTTimeString(unit.workStartTime),
                        workEndTime: toKSTTimeString(unit.workEndTime),
                        lunchStartTime: toKSTTimeString(unit.lunchStartTime),
                        lunchEndTime: toKSTTimeString(unit.lunchEndTime),

                        hasInstructorLounge: loc.hasInstructorLounge,
                        hasWomenRestroom: loc.hasWomenRestroom,
                        hasCateredMeals: loc.hasCateredMeals,
                        hasHallLodging: loc.hasHallLodging,
                        allowsPhoneBeforeAfter: loc.allowsPhoneBeforeAfter
                    }
                });
            });
        });
        return list;
    }

    // 내부 로직: 강사 -> 카드 변환
    mapInstructorsToCards(instructors) {
        return instructors.map(inst => {
            const availableDates = inst.availabilities.map(a => toKSTDateString(a.availableOn));

            return {
                type: 'INSTRUCTOR',
                id: inst.userId,
                
                // [Card UI]
                name: inst.user.name,
                teamName: inst.team?.name || '소속없음',
                category: inst.category,
                location: inst.location ? inst.location.split(' ')[0] + ' ' + (inst.location.split(' ')[1] || '') : '지역미정',
                availableDates: availableDates,
                
                // [Modal Detail]
                detail: {
                    teamName: inst.team?.name,
                    category: inst.category,
                    phoneNumber: inst.user.userphoneNumber,
                    email: inst.user.userEmail,
                    address: inst.location,
                    generation: inst.generation,
                    isTeamLeader: inst.isTeamLeader,
                    restrictedArea: inst.restrictedArea,
                    virtues: inst.virtues.map(v => v.virtue ? v.virtue.name : '').filter(Boolean).join(', '),
                    availableDates: availableDates
                }
            };
        });
    }
}

module.exports = new AssignmentDTO();