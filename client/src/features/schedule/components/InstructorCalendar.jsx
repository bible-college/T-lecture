import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';

import 'react-calendar/dist/Calendar.css';

export const InstructorCalendar = () => {
  const [selectedDates, setSelectedDates] = useState([]);

  const handleDateClick = (value) => {
    const dateStr = format(value, 'yyyy-MM-dd');
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const handleSubmit = () => {
    alert(`[비즈니스 웹 캘린더]\n총 ${selectedDates.length}일의 일정이 선택되었습니다.`);
  };

  return (
    <div className="w-full flex justify-center bg-white p-8">
      
      <style>{`
        /* 1. 캘린더 기본 틀 */
        .react-calendar {
          width: 100%;
          max-width: 1000px;
          background: white;
          border: 1px solid #e5e7eb;
          font-family: 'Pretendard', sans-serif;
          line-height: 1.5;
        }

        /* 2. 네비게이션 */
        .react-calendar__navigation {
          height: 60px;
          border-bottom: 1px solid #e5e7eb;
        }
        .react-calendar__navigation button {
          font-size: 1.25rem;
          font-weight: 700;
        }

        /* 3. 요일 헤더 */
        .react-calendar__month-view__weekdays {
          background-color: #f9fafb;
          padding: 14px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .react-calendar__month-view__weekdays__weekday {
          color: #6b7280;
          font-weight: 600;
          text-decoration: none !important;
        }
        abbr { text-decoration: none !important; }

        /* ============================================================
           ★ 문제 해결의 핵심 CSS ★
           순서대로 적용되어야 평일/주말 색상 충돌이 없습니다.
           ============================================================ */

        /* [Step 1] 모든 날짜 타일의 기본 상태 (평일 기준) */
        /* 선택되든(:focus), 활성화되든(.active) 무조건 흰색 배경/검은 글씨로 초기화 */
        .react-calendar__tile,
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus,
        .react-calendar__tile--active {
          height: 110px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          font-size: 1.05rem;
          font-weight: 500;
          
          /* ★ 평일이 파랗게 변하는 것을 막는 방어막 ★ */
          background: white !important; 
          color: #374151 !important;
          
          border-right: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
          border-radius: 0 !important; /* 배경 찌그러짐 방지 */
          
          position: relative;
          overflow: visible !important;
          z-index: 0;
        }

        /* [Step 2] 주말 색상 덮어쓰기 (가장 강력하게 !important) */
        /* 위에서 흰색으로 밀어버렸으니, 주말은 다시 색을 입혀야 함 */
        
        /* 일요일 */
        .react-calendar__month-view__days__day--weekend,
        .react-calendar__month-view__days__day--weekend:enabled:focus,
        .react-calendar__month-view__days__day--weekend:enabled:hover {
          background-color: #fff1f2 !important; /* 연한 빨강 */
          color: #ef4444 !important;            /* 진한 빨강 */
        }

        /* 토요일 */
        .react-calendar__month-view__days__day--weekend:not(:nth-child(7n)),
        .react-calendar__month-view__days__day--weekend:not(:nth-child(7n)):enabled:focus,
        .react-calendar__month-view__days__day--weekend:not(:nth-child(7n)):enabled:hover {
          background-color: #f0f9ff !important; /* 연한 파랑 */
          color: #2563eb !important;            /* 진한 파랑 */
        }

        /* [Step 3] 선택된 날짜 (Custom Logic) */
        /* 배경색은 건드리지 않고(위의 흰색 or 주말색 유지), 테두리만 그림 */
        
        .react-calendar__tile.selected-date {
          font-weight: 700;
          /* 여기서 background를 설정하지 않음 -> 평일은 흰색, 주말은 주말색이 그대로 보임 */
        }

        /* ★ 파란 테두리 그리기 ★ */
        .react-calendar__tile.selected-date::before {
          content: '';
          position: absolute;
          top: 6px; left: 6px; right: 6px; bottom: 6px;
          
          background-color: transparent !important; /* 채우기 없음 */
          border: 2px solid #3b82f6;                /* 파란 테두리 */
          border-radius: 12px;                      /* 테두리 둥글게 */
          
          z-index: 1;
          pointer-events: none;
        }

        /* 체크 표시 */
        .react-calendar__tile.selected-date::after {
          content: '✔';
          position: absolute;
          bottom: 12px; right: 12px;
          font-size: 1.1rem;
          color: #2563eb;
          z-index: 2;
        }

        /* 4. 오늘 날짜 (Today) */
        .react-calendar__tile--now:not(.selected-date)::after {
          content: 'TODAY';
          font-size: 0.65rem;
          font-weight: 700;
          background-color: #eff6ff;
          color: #2563eb;
          padding: 3px 6px;
          border-radius: 4px;
          margin-top: 6px;
        }

        /* 기타 스타일 */
        .react-calendar__month-view__days__day--neighboringMonth {
          background-color: #fcfcfc !important;
          color: transparent !important;
          pointer-events: none !important;
        }
        .react-calendar__tile abbr {
          position: relative;
          z-index: 2;
        }
      `}</style>

      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-gray-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 py-1 px-2 rounded text-xs font-bold">BUSINESS</span>
              <h1 className="text-3xl font-bold text-gray-900">근무 일정 관리</h1>
            </div>
            <p className="text-gray-500 mt-1">
              날짜를 클릭하여 근무 일정을 등록하세요.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block mr-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Selected Days</span>
              <div className="font-bold text-2xl text-blue-600 leading-none">
                {selectedDates.length}<span className="text-sm text-gray-400 ml-1 font-medium">days</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>저장하기</span>
            </button>
          </div>
        </div>

        <div className="shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <Calendar 
            onClickDay={handleDateClick}
            /* 번쩍임 방지를 위해 null 유지 */
            value={null}
            tileClassName={({ date }) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              if (selectedDates.includes(dateStr)) return 'selected-date';
            }}
            next2Label={null}
            prev2Label={null}
            formatDay={(locale, date) => format(date, 'd')}
            calendarType="gregory"
            showNeighboringMonth={true}
          />
        </div>
        
        <div className="flex gap-8 mt-6 text-sm text-gray-500 justify-end border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm"></div>
            <span>평일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-fff1f2 border border-red-200 rounded shadow-sm"></div>
            <span className="text-red-400">일요일</span>
          </div>
           <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-f0f9ff border border-blue-200 rounded shadow-sm"></div>
            <span className="text-blue-400">토요일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-transparent border-2 border-blue-500 rounded-lg shadow-sm relative">
                <span className="absolute bottom-0 right-0.5 text-blue-600 text-[10px]">✔</span>
            </div>
            <span className="font-bold text-blue-700">선택됨</span>
          </div>
        </div>

      </div>
    </div>
  );
};