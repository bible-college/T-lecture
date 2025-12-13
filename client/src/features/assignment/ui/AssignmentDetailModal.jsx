// src/features/assignment/ui/AssignmentDetailModal.jsx

import React, { useMemo, useState } from 'react';
import { DetailModal } from '../../../shared/ui/DetailModal';
import { MiniCalendar } from '../../../shared/ui/MiniCalendar';
import { Button } from '../../../shared/ui/Button';
import { InstructorSelectionPopup } from './InstructorSelectionPopup';
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


export const AssignmentGroupDetailModal = ({ group, onClose }) => {
    // 강사 추가 팝업 상태 (어떤 날짜, 어떤 스케줄에 추가할지)
    const [addPopupTarget, setAddPopupTarget] = useState(null); 

    const handleRemoveInstructor = (unitScheduleId, instructorId) => {
        if(confirm('이 강사를 배정에서 제외하시겠습니까?')) {
            onRemove(unitScheduleId, instructorId);
            console.log('Remove:', unitScheduleId, instructorId);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeInScale">
                
                {/* 1. Header (부대 정보) */}
                <div className="bg-white px-6 py-5 border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {group.unitName}
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{group.region}</span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">📅 교육 기간: {group.period}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
                        ✕
                    </button>
                </div>

                {/* 2. Body (교육장소 > 일자별 스크롤 영역) */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
                    {group.trainingLocations.map((loc) => (
                        <div key={loc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* 교육장소 헤더 */}
                            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                                <span className="text-lg">🏫</span>
                                <h3 className="font-bold text-indigo-900">{loc.name}</h3>
                            </div>

                            {/* 일자별 로우 (Row) */}
                            <div className="divide-y divide-gray-100">
                                {loc.dates.map((dateInfo) => (
                                    <div key={dateInfo.unitScheduleId} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                        
                                        {/* 날짜 & 필요인원 */}
                                        <div className="w-32 flex-shrink-0">
                                            <div className="font-bold text-gray-700">{dateInfo.date}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                필요: {dateInfo.requiredCount}명
                                            </div>
                                        </div>

                                        {/* 🟢 강사 리스트 (가로 스택) */}
                                        <div className="flex-1 flex flex-wrap gap-2 items-center">
                                            {dateInfo.instructors.map((inst) => (
                                                <div 
                                                    key={inst.instructorId} 
                                                    className="group relative flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow transition-all"
                                                >
                                                    {/* 강사 정보 */}
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800">{inst.name}</div>
                                                        <div className="text-[10px] text-gray-500">{inst.team}</div>
                                                    </div>

                                                    {/* 삭제 버튼 (호버 시 등장) */}
                                                    <button 
                                                        onClick={() => handleRemoveInstructor(dateInfo.unitScheduleId, inst.instructorId)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}

                                            {/* 🟢 추가 버튼 (+) */}
                                            <button 
                                                onClick={() => setAddPopupTarget({ 
                                                    unitScheduleId: dateInfo.unitScheduleId, 
                                                    date: dateInfo.date,
                                                    locationName: loc.name 
                                                })}
                                                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                                                title="강사 추가"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="bg-white p-4 border-t border-gray-200 flex justify-end">
                    <Button onClick={onClose} variant="secondary">닫기</Button>
                </div>
            </div>

            {/* 4. 강사 추가 팝업 (조건부 렌더링) */}
            {addPopupTarget && (
                <InstructorSelectionPopup 
                    target={addPopupTarget}
                    onClose={() => setAddPopupTarget(null)}
                    // onAdd={(instructor) => ...}
                />
            )}
        </div>
    );
};