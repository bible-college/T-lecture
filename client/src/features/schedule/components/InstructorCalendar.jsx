import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';

import 'react-calendar/dist/Calendar.css';

export const InstructorCalendar = () => {
  const [selectedDates, setSelectedDates] = useState([]);

  // [가정] 로그인한 유저 정보 (실제로는 로그인 후 Context나 로컬스토리지에서 가져옴)
  const loggedInUser = {
    name: "김강사",
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (value) => {
    const dateStr = format(value, 'yyyy-MM-dd');
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  // ★★★ [서버 요구사항에 맞춘 최종 수정] ★★★
  const handleSubmit = async () => {
    // 1. 날짜 선택 안 했으면 중단
    if (selectedDates.length === 0) {
      alert("날짜를 선택해주세요.");
      return;
    }

    const sortedDates = [...selectedDates].sort();
    
    // [중요] 백엔드가 year, month를 따로 원하므로 첫 번째 날짜 기준으로 추출
    // 예: "2025-06-25" -> year: 2025, month: 6
    const firstDateObj = new Date(sortedDates[0]);
    const year = firstDateObj.getFullYear();
    const month = firstDateObj.getMonth() + 1; // JS 월은 0부터 시작하므로 +1

    // 2. 확인 창
    if (!window.confirm(`${year}년 ${month}월 일정을 저장하시겠습니까?\n(총 ${sortedDates.length}일)`)) return;

    try {
      const SERVER_URL = 'http://localhost:3000/api/v1/instructor/availability';
      const token = localStorage.getItem('token') || '';

      // [핵심] 백엔드 controller가 원하는 이름으로 데이터 포장
      const payload = {
        userId: "instructor_01", // ★ auth를 뺐으므로 임시 ID 직접 전송
        year: year,              // ★ 백엔드 필수 조건
        month: month,            // ★ 백엔드 필수 조건
        dates: sortedDates,      // ★ 백엔드는 'dates'라는 이름을 원함 (availableDates 아님!)
      };

      console.log("🚀 서버로 보내는 데이터:", payload);

      const response = await fetch(SERVER_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload) // 포장한 데이터를 전송
      });

      if (response.ok) {
        alert("✅ 저장 성공! (DB 업데이트 완료)");
      } else {
        const errText = await response.text();
        console.error("서버 에러:", errText);
        
        // 에러 메시지 파싱 시도
        try {
            const errJson = JSON.parse(errText);
            alert(`❌ 저장 실패: ${errJson.error}`);
        } catch(e) {
            alert(`❌ 저장 실패: ${errText}`);
        }
      }

    } catch (error) {
      console.error("네트워크 에러:", error);
      alert("🚨 서버 연결 실패: 백엔드 서버가 켜져 있는지 확인해주세요.");
    }
  };

  return (
    <div className="w-full flex justify-center bg-white p-8">
      
      {/* 스타일: 선택 시 배경 투명, 테두리 파랑, 주말 색상 유지, TODAY 라벨 수정됨 */}
      <style>{`
        /* 1. 캘린더 기본 틀 */
        .react-calendar { width: 100%; max-width: 1000px; background: white; border: 1px solid #e5e7eb; font-family: 'Pretendard', sans-serif; line-height: 1.5; }
        .react-calendar__navigation { height: 60px; border-bottom: 1px solid #e5e7eb; }
        .react-calendar__navigation button { font-size: 1.25rem; font-weight: 700; }
        
        /* 2. 요일 헤더 */
        .react-calendar__month-view__weekdays { background-color: #f9fafb; padding: 14px 0; border-bottom: 1px solid #e5e7eb; }
        .react-calendar__month-view__weekdays__weekday { color: #6b7280; font-weight: 600; text-decoration: none !important; }
        abbr { text-decoration: none !important; }

        /* 3. 타일 기본 스타일 (평일 기준 흰색 배경 고정) */
        .react-calendar__tile, 
        .react-calendar__tile:enabled:hover, 
        .react-calendar__tile:enabled:focus, 
        .react-calendar__tile--active {
          height: 110px; display: flex; flex-direction: column; align-items: flex-start; padding: 12px; font-size: 1.05rem; font-weight: 500;
          background: white !important; 
          color: #374151 !important; 
          border-right: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; border-radius: 0 !important;
          position: relative; overflow: visible !important; z-index: 0;
        }

        /* 4. 주말 색상 강제 적용 (가장 높은 우선순위) */
        .react-calendar__month-view__days__day--weekend, .react-calendar__month-view__days__day--weekend:enabled:focus, .react-calendar__month-view__days__day--weekend:enabled:hover { background-color: #fff1f2 !important; color: #ef4444 !important; }
        .react-calendar__month-view__days__day--weekend:not(:nth-child(7n)), .react-calendar__month-view__days__day--weekend:not(:nth-child(7n)):enabled:focus, .react-calendar__month-view__days__day--weekend:not(:nth-child(7n)):enabled:hover { background-color: #f0f9ff !important; color: #2563eb !important; }

        /* 5. 선택된 날짜 (.selected-date) 커스텀 스타일 */
        .react-calendar__tile.selected-date { font-weight: 700; }
        
        /* 테두리 (Border) */
        .react-calendar__tile.selected-date::before { content: ''; position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px; background-color: transparent !important; border: 2px solid #3b82f6; border-radius: 12px; z-index: 1; pointer-events: none; }
        
        /* 체크 표시 (Checkmark) */
        .react-calendar__tile.selected-date::after { content: '✔'; position: absolute; bottom: 12px; right: 12px; font-size: 1.1rem; color: #2563eb; z-index: 2; }

        /* 6. 오늘(TODAY) 라벨 처리 (숫자 밑으로 이동) */
        .react-calendar__tile abbr { display: flex; flex-direction: column; align-items: flex-start; position: relative; z-index: 2; width: 100%; }
        .react-calendar__tile--now abbr::after { content: 'TODAY'; font-size: 0.65rem; font-weight: 700; background-color: #eff6ff; color: #2563eb; padding: 3px 6px; border-radius: 4px; margin-top: 6px; white-space: nowrap; }

        /* 기타 */
        .react-calendar__month-view__days__day--neighboringMonth { background-color: #fcfcfc !important; color: transparent !important; pointer-events: none !important; }
      `}</style>

      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-gray-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 py-1 px-2 rounded text-xs font-bold">BUSINESS</span>
              <h1 className="text-3xl font-bold text-gray-900">{loggedInUser.name}님 근무 일정 관리</h1>
            </div>
            <p className="text-gray-500 mt-1">근무 가능한 날짜를 선택 후 저장하기 버튼을 눌러주세요.</p>
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
            value={null} /* 번쩍임 방지 */
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

        {/* 하단 범례 */}
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