// src/features/assignment/ui/AssignmentDetailModal.jsx

import React, { useMemo } from 'react';
import { DetailModal } from '../../../shared/ui/DetailModal';
import { MiniCalendar } from '../../../shared/ui/MiniCalendar';

// --- Helper: Boolean Formatter ---
const formatBool = (val) => val ? 'O (보유/가능)' : 'X (미보유/불가)';
const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    // ISO string이면 시간만 추출, 아니면 그대로 표시
    return dateStr.includes('T') ? new Date(dateStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : dateStr;
};

// --- 1. 강사 필드 설정 ---
const INSTRUCTOR_FIELD_CONFIG = [
    { key: 'teamName', label: '소속 팀' }, // [NEW] 팀
    { key: 'category', label: '분류(직책)' }, // [NEW] 분류 (Main, Assistant 등)
    { key: 'phoneNumber', label: '연락처', format: (v) => v || '-' },
    { key: 'email', label: '이메일' },
    { key: 'address', label: '주소', isLong: true },
    { key: 'generation', label: '기수' },
    { key: 'isTeamLeader', label: '팀장 여부', format: (v) => v ? '팀장' : '팀원' },
    { key: 'restrictedArea', label: '제한 지역', isLong: true }, // [NEW] 제한지역
    { key: 'virtues', label: '강의 가능 과목', isLong: true },
    
    // 근무 가능일
    { 
        key: 'availableDates', 
        label: '근무 가능일', 
        isLong: true, 
        format: (dates) => {
            const count = Array.isArray(dates) ? dates.length : 0;
            return (
                <div className="flex flex-col gap-2 mt-1">
                    <span className="text-xs text-blue-600 font-bold">
                        총 {count}일 가능
                    </span>
                    <MiniCalendar availableDates={dates || []} />
                </div>
            );
        }
    },
];

// --- 2. 부대/교육장소 필드 설정 (Prisma 모델 반영) ---
const UNIT_FIELD_CONFIG = [
    // [기본 정보]
    { key: 'unitName', label: '부대명' },
    { key: 'region', label: '지역' },
    { key: 'wideArea', label: '광역' },
    { key: 'address', label: '상세주소', isLong: true },
    
    // [교육장소 및 인원]
    { key: 'originalPlace', label: '교육장소(기존)' },
    { key: 'changedPlace', label: '교육장소(변경)' },
    { key: 'instructorsNumbers', label: '투입 강사 수', format: (v) => v ? `${v}명` : '-' },
    { key: 'plannedCount', label: '계획 인원', format: (v) => v ? `${v}명` : '-' },
    { key: 'actualCount', label: '실 참여 인원', format: (v) => v ? `${v}명` : '-' },

    // [간부 정보]
    { key: 'officerName', label: '담당 간부명' },
    { key: 'officerPhone', label: '간부 연락처' },
    { key: 'officerEmail', label: '간부 이메일' },

    // [시간 정보]
    { key: 'educationStart', label: '교육 시작일', format: (v) => v ? v.split('T')[0] : '-' },
    { key: 'educationEnd', label: '교육 종료일', format: (v) => v ? v.split('T')[0] : '-' },
    { key: 'workStartTime', label: '근무 시작', format: formatTime },
    { key: 'workEndTime', label: '근무 종료', format: formatTime },
    { key: 'lunchStartTime', label: '점심 시작', format: formatTime },
    { key: 'lunchEndTime', label: '점심 종료', format: formatTime },

    // [시설 정보 (Boolean)]
    { key: 'hasInstructorLounge', label: '강사 휴게실', format: formatBool },
    { key: 'hasWomenRestroom', label: '여자 화장실', format: formatBool },
    { key: 'hasCateredMeals', label: '수탁 급식', format: formatBool },
    { key: 'hasHallLodging', label: '회관 숙박', format: formatBool },
    { key: 'allowsPhoneBeforeAfter', label: '휴대폰 불출', format: formatBool },
    
    // [특이사항]
    { key: 'note', label: '특이사항', isLong: true },
];

export const AssignmentDetailModal = ({ item, onClose }) => {
    const modalContent = useMemo(() => {
        if (!item) return null;

        const isInstructor = item.type === 'INSTRUCTOR';
        
        const title = isInstructor ? `${item.name} 강사` : item.unitName;
        // 서브타이틀도 더 자세하게 표시
        const subtitle = isInstructor 
            ? `${item.teamName || '소속 미정'} | ${item.category || item.role || '직책 미정'}`
            : `${item.originalPlace || '교육장소 미정'} | ${item.date || ''}`;

        const config = isInstructor ? INSTRUCTOR_FIELD_CONFIG : UNIT_FIELD_CONFIG;

        // 값을 찾는 로직: item 바로 아래에 없으면 item.detail 안에서 찾음
        const fields = config.map(field => {
            // 1. item 본체에서 찾기
            let val = item[field.key];
            // 2. 없으면 detail 객체 내부에서 찾기
            if (val === undefined && item.detail) {
                val = item.detail[field.key];
            }

            return {
                label: field.label,
                isLong: field.isLong,
                value: field.format ? field.format(val) : val
            };
        });

        return { title, subtitle, fields };
    }, [item]);

    if (!item || !modalContent) return null;

    return (
        <DetailModal 
            isOpen={!!item}
            onClose={onClose}
            title={modalContent.title}
            subtitle={modalContent.subtitle}
            fields={modalContent.fields}
        />
    );
};