// src/features/assignment/ui/AssignmentWorkspace.jsx

import React, { useState, useRef } from 'react';
import { useAssignment } from '../model/useAssignment';
import { Button } from '../../../shared/ui/Button'; 
import { AssignmentDetailModal } from './AssignmentDetailModal'; 
import { MiniCalendar } from '../../../shared/ui/MiniCalendar'; 

export const AssignmentWorkspace = () => {
    const { 
        dateRange, 
        setDateRange, 
        loading, 
        error, 
        unassignedUnits, 
        availableInstructors,
        fetchData 
    } = useAssignment();

    const [selectedItem, setSelectedItem] = useState(null);
    
    // 캘린더 팝업 상태
    const [calendarPopup, setCalendarPopup] = useState({
        visible: false,
        x: 0,
        y: 0,
        dates: []
    });

    const closeTimeoutRef = useRef(null);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        if (!value) return; 
        setDateRange(prev => ({ ...prev, [name]: new Date(value) }));
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    const handleMouseEnter = (e, dates) => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (dates) {
            const rect = e.currentTarget.getBoundingClientRect();
            setCalendarPopup({
                visible: true,
                x: rect.right + 10, 
                y: rect.top, 
                dates: dates
            });
        }
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setCalendarPopup(prev => ({ ...prev, visible: false }));
        }, 300);
    };

    return (
        <div className="flex flex-col h-full relative"> 
            {/* 1. Control Bar */}
            <div className="bg-white p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800">배정 기간 설정</h2>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-300">
                        <input type="date" name="startDate" value={formatDate(dateRange.startDate)} onChange={handleDateChange} className="bg-transparent focus:outline-none text-sm text-gray-700"/>
                        <span className="text-gray-400">~</span>
                        <input type="date" name="endDate" value={formatDate(dateRange.endDate)} onChange={handleDateChange} className="bg-transparent focus:outline-none text-sm text-gray-700"/>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchData} disabled={loading} size="medium">{loading ? '조회 중...' : '조회하기'}</Button>
                </div>
            </div>

            {error && (<div className="bg-red-50 text-red-600 px-4 py-2 text-sm border-b border-red-100">⚠️ {error}</div>)}

            {/* 2. Main Workspace (Grid) */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden bg-gray-100">
                {/* Left Column */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    {/* Panel 1: 미배정 부대 */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                         <div className="p-3 bg-red-50 border-b border-red-100 border-l-4 border-l-red-500 font-bold text-gray-700 flex justify-between items-center">
                            <span className="flex items-center gap-2">📋 배정 대상 부대 (미배정)</span>
                            <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-red-200 text-red-600 font-bold">{unassignedUnits.length}건</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                             <div className="space-y-2">
                                {unassignedUnits.map(unit => (
                                    <div key={unit.id} onClick={() => setSelectedItem({ ...unit, type: 'UNIT' })} className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-red-300 transition-all border-l-4 border-l-transparent hover:border-l-red-400 group">
                                        <div className="font-bold text-gray-800 text-sm flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span>{unit.unitName}</span>
                                                {/* [수정] 교육장소 표시 (originalPlace) */}
                                                {unit.originalPlace && (
                                                    <span className="text-[11px] font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {unit.originalPlace}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 font-normal">{unit.date} {unit.time}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex justify-between items-end">
                                            <span>📍 {unit.location}</span>
                                            {/* [수정] 주/보 삭제 -> 필요 인원만 표시 */}
                                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold border border-blue-100">
                                                필요 인원: {unit.instructorsNumbers}명
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Panel 2: 가용 강사 */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 border-l-4 border-l-slate-700 font-bold text-gray-700">
                            <span>👤 가용 강사</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                            {loading && availableInstructors.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">로딩 중...</div>
                            ) : availableInstructors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                                    <span className="text-2xl mb-2">🚫</span>
                                    <span>가용 가능한 강사가 없습니다.</span>
                                </div>
                            ) : (
                                <div className="space-y-2 pb-20">
                                    {availableInstructors.map(inst => (
                                        <div 
                                            key={inst.id}
                                            onClick={() => setSelectedItem({ ...inst, type: 'INSTRUCTOR' })}
                                            className="relative bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-slate-400 transition-all border-l-4 border-l-transparent hover:border-l-slate-600"
                                        >
                                            <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                {inst.name} 
                                                
                                                {/* [수정] 팀 이름 배지 추가 */}
                                                {inst.teamName && (
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                        {inst.teamName}
                                                    </span>
                                                )}

                                                {/* 역할/분류 배지 */}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                    inst.category === 'Main' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    inst.category === 'Assistant' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {inst.category || inst.role}
                                                </span>
                                            </div>
                                            
                                            <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                                                <span>📍 {inst.location}</span>
                                                <span 
                                                    className="text-blue-600 font-medium cursor-help hover:bg-blue-50 px-1 rounded transition-colors"
                                                    onMouseEnter={(e) => handleMouseEnter(e, inst.availableDates)}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    📅 {inst.availableDates?.length || 0}일 가능
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                         <div className="p-3 bg-orange-50 border-b border-orange-100 border-l-4 border-l-orange-500 font-bold text-gray-700">
                            <span>⚖️ 임시 배정 (작업 공간)</span>
                        </div>
                        <div className="flex-1 p-4 bg-gray-50/50 flex items-center justify-center border-2 border-dashed border-gray-300 m-4 rounded-xl">
                            <div className="text-center"><span className="text-3xl block mb-2">👆</span><span className="text-gray-400 text-sm">왼쪽에서 강사를 선택하여<br/>이곳으로 드래그하세요.</span></div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                         <div className="p-3 bg-blue-50 border-b border-blue-100 border-l-4 border-l-blue-500 font-bold text-gray-700">
                            <span>✅ 확정 배정 완료</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm"><span>아직 확정된 배정이 없습니다.</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 모달 */}
            <AssignmentDetailModal 
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />

            {/* 캘린더 팝업 (Overlay) */}
            {calendarPopup.visible && (
                <div 
                    className="fixed z-popover"
                    style={{ 
                        top: calendarPopup.y, 
                        left: calendarPopup.x 
                    }}
                    onMouseEnter={() => handleMouseEnter(null, null)}
                    onMouseLeave={handleMouseLeave}
                >
                    <MiniCalendar 
                        availableDates={calendarPopup.dates} 
                        width="220px" 
                        className="shadow-2xl border-blue-200 ring-2 ring-blue-100 bg-white"
                    />
                </div>
            )}
        </div>
    );
};