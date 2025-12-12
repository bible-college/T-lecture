import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import Holidays from 'date-holidays'; // [추가] 공휴일 라이브러리

import 'react-calendar/dist/Calendar.css';

export const InstructorCalendar = () => {
  const [selectedDates, setSelectedDates] = useState([]);

  // 로그인한 유저 정보 가져오기
  const [loggedInUser, setLoggedInUser] = useState(null);

  // 현재 보고 있는 달력의 날짜 (초기값: 오늘)
  const [currentDate, setCurrentDate] = useState(new Date());

  // [추가] 동적 공휴일 데이터 계산
  const holidaysMap = useMemo(() => {
    // 혹시라도 라이브러리 로드 실패 시 안전장치
    try {
      const hd = new Holidays('KR'); // 한국 공휴일 초기화
      const year = currentDate.getFullYear();

      // 현재 년도, 작년, 내년 3년치 계산 (연말연시 경계 처리 위함)
      const years = [year - 1, year, year + 1];
      const map = {};

      years.forEach(y => {
        const holidays = hd.getHolidays(y);
        holidays.forEach(h => {
          // 'public' 타입만 표시 (대체공휴일 'substitute' 포함됨)
          if (h.type === 'public') {
            const dateStr = h.date.split(' ')[0]; // "2025-01-01 00:00:00" -> "2025-01-01"
            if (!map[dateStr]) {
              map[dateStr] = h.name;
            }
          }
        });
      });

      return map;
    } catch (e) {
      console.warn("공휴일 계산 실패:", e);
      return {};
    }
  }, [currentDate.getFullYear()]); // 연도가 바뀔 때만 재계산

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setLoggedInUser(JSON.parse(userStr));
    }
  }, []);

  // 일정 가져오기 함수
  const fetchAvailabilities = async () => {
    if (!loggedInUser?.id) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      const SERVER_URL = `http://localhost:3000/api/v1/instructor/availability?userId=${loggedInUser.id}&year=${year}&month=${month}`;
      const token = localStorage.getItem('accessToken') || '';

      const response = await fetch(SERVER_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const dates = await response.json();
        console.log(`[Client] 수신된 날짜들:`, dates);
        setSelectedDates(dates);
      } else {
        const errText = await response.text();
        console.error("일정 불러오기 실패:", errText);

        // 에러 팝업 띄우기 (JSON 파싱 시도)
        try {
          const errJson = JSON.parse(errText);
          const errMsg = errJson.error || errJson.message || errText;
          // 너무 자주 뜨면 불편하므로 콘솔에만 남기거나 필요시 alert
          console.warn(`데이터 로드 경고: ${errMsg}`);
        } catch (e) {
          console.warn(`데이터 로드 경고: ${errText}`);
        }
      }
    } catch (error) {
      console.error("일정 불러오기 에러:", error);
    }
  };

  // 유저 정보나 달력 날짜가 바뀌면 데이터 다시 불러오기
  useEffect(() => {
    fetchAvailabilities();
  }, [loggedInUser, currentDate]);

  // 달력 월 변경 핸들러
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCurrentDate(activeStartDate);
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

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      alert("날짜를 선택해주세요.");
      return;
    }

    const sortedDates = [...selectedDates].sort();
    const firstDateObj = new Date(sortedDates[0]);
    const year = firstDateObj.getFullYear();
    const month = firstDateObj.getMonth() + 1;

    if (!window.confirm(`${year}년 ${month}월 일정을 저장하시겠습니까?\n(총 ${sortedDates.length}일)`)) return;

    try {
      const SERVER_URL = 'http://localhost:3000/api/v1/instructor/availability';
      const token = localStorage.getItem('accessToken') || '';

      const payload = {
        userId: loggedInUser?.id,
        year: year,
        month: month,
        dates: sortedDates,
      };

      console.log("🚀 서버로 보내는 데이터:", payload);

      const response = await fetch(SERVER_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("✅ 저장 성공! (DB 업데이트 완료)");
      } else {
        const errText = await response.text();
        console.error("서버 에러:", errText);

        try {
          const errJson = JSON.parse(errText);
          alert(`❌ 저장 실패: ${errJson.error || errJson.message || errText}`);
        } catch (e) {
          alert(`❌ 저장 실패: ${errText}`);
        }
      }

    } catch (error) {
      console.error("네트워크 에러:", error);
      alert("🚨 서버 연결 실패: 백엔드 서버가 켜져 있는지 확인해주세요.");
    }
  };

  // [기능] 주말 비활성화 로직
  const checkTileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const day = date.getDay();
      // 0: 일요일, 6: 토요일, 그리고 공휴일도 비활성화
      const dateStr = format(date, 'yyyy-MM-dd');
      return day === 0 || day === 6 || !!holidaysMap[dateStr];
    }
    return false;
  };

  // [기능] 공휴일 컨텐츠 표시
  const getTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      // 라이브러리 데이터 사용
      if (holidaysMap[dateStr]) {
        return <div className="text-[10px] text-red-500 font-bold mt-1 break-keep leading-tight">{holidaysMap[dateStr]}</div>;
      }
    }
    return null;
  };

  // [기능] 타일 클래스 설정 (선택됨, 공휴일, 주말 색상용)
  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const dateStr = format(date, 'yyyy-MM-dd');
    const day = date.getDay();
    const classes = [];

    // 1. 선택된 날짜
    if (selectedDates.includes(dateStr)) {
      classes.push('selected-date');
    }

    // 2. 공휴일 (빨간 글씨)
    if (holidaysMap[dateStr]) {
      classes.push('holiday-date');
    }

    // 3. [추가] 토/일 명시적 클래스 부여 (nth-child 문제 해결)
    if (day === 0) classes.push('sunday'); // 일요일
    if (day === 6) classes.push('saturday'); // 토요일

    return classes.join(' ');
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
        .react-calendar__tile {
          height: 110px; display: flex; flex-direction: column; align-items: flex-start; padding: 12px; font-size: 1.05rem; font-weight: 500;
          background-color: white; /* !important 제거: 다른 배경색 허용 */
          color: #374151 !important; 
          border-right: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; border-radius: 0 !important;
          position: relative; overflow: visible !important; z-index: 0;
          
          /* [추가] 텍스트 드래그(파란색 선택 영역) 및 포커스 테두리 방지 */
          user-select: none !important;
          -webkit-user-select: none !important;
          outline: none !important;
        }

        .react-calendar__tile:enabled:hover, 
        .react-calendar__tile:enabled:focus {
          background-color: #f9fafb !important;
        }

        /* 4. 비활성화된 타일 (평일 과거 등) */
        /* 기본적으로 회색. 단, 주말/공휴일 클래스를 가진 녀석은 제외(아래 규칙 따름) */
        .react-calendar__tile:disabled:not(.saturday):not(.sunday):not(.holiday-date) {
          background-color: #f3f4f6 !important;
          color: #d1d5db !important;
          cursor: not-allowed !important;
          opacity: 0.7;
        }

        /* 5. 요일별 색상 (최우선 순위 적용 + 색상 진하게) */
        /* .react-calendar 클래스를 앞에 붙여 점수(Specificity)를 높임 */
        
        /* 토요일 (.saturday) - 비활성 여부 상관없이 빨간색(Rose-100) */
        .react-calendar .react-calendar__tile.saturday,
        .react-calendar .react-calendar__tile:disabled.saturday { 
          background-color: #ffe4e6 !important; /* #fff1f2보다 진한 색 */
          color: #e11d48 !important; /* 글자도 더 진하게 */
          opacity: 1 !important;
        }
        
        /* 일요일 (.sunday) - 비활성 여부 상관없이 파란색(Blue-100) */
        .react-calendar .react-calendar__tile.sunday,
        .react-calendar .react-calendar__tile:disabled.sunday { 
          background-color: #dbeafe !important; /* #f0f9ff보다 진한 색 */
          color: #2563eb !important;
          opacity: 1 !important;
        }

        /* 공휴일 (.holiday-date) - 비활성 여부 상관없이 빨간색(Rose-100) */
        .react-calendar .react-calendar__tile.holiday-date,
        .react-calendar .react-calendar__tile:disabled.holiday-date {
          color: #e11d48 !important;
          background-color: #ffe4e6 !important; 
          opacity: 1 !important;
        }

        /* 7. 선택된 날짜 (.selected-date) 커스텀 스타일 - [복구] 테두리 + 체크표시 */
        .react-calendar .react-calendar__tile.selected-date { 
          background-color: transparent !important; /* 배경 투명 (기본 흰색 유지) */
          color: #2563eb !important; /* 글자 파란색 */
          opacity: 1 !important;
          font-weight: 700;
          box-shadow: none !important;
        }
        
        /* 테두리 (Border) - 둥근 네모 */
        .react-calendar__tile.selected-date::before { 
          content: ''; 
          display: block !important;
          position: absolute; 
          top: 6px; left: 6px; right: 6px; bottom: 6px; 
          background-color: transparent !important; 
          border: 2px solid #3b82f6; 
          border-radius: 12px; 
          z-index: 1; 
          pointer-events: none; 
        }
        
        /* 체크 표시 (Checkmark) */
        .react-calendar__tile.selected-date::after { 
          content: '✔'; 
          display: block !important; 
          position: absolute; 
          bottom: 12px; right: 12px; 
          font-size: 1.1rem; 
          color: #2563eb; 
          z-index: 2; 
        }

        /* 호버 시 배경 살짝 변경 */
        .react-calendar .react-calendar__tile.selected-date:hover {
          background-color: #eff6ff !important;
        }
 
        /* 8. 오늘(TODAY) 라벨 처리 */
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
              <h1 className="text-3xl font-bold text-gray-900">{loggedInUser?.name || '강사'}님 근무 일정 관리</h1>
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
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            tileDisabled={({ date, view }) => {
              // 1. 기본 주말/공휴일만 체크 (과거 날짜 차단 제거)
              return checkTileDisabled({ date, view });
            }}
            next2Label={null} // 1년 뒤 이동 버튼 숨김
            prev2Label={null} // 1년 전 이동 버튼 숨김
            minDetail="month" // '월' 단위로만 보기 강제 (연도 클릭 방지)
            minDate={new Date(new Date().getFullYear(), new Date().getMonth(), 1)} // 이번 달 1일부터
            maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)} // 다음 달 말일까지
            formatDay={(locale, date) => format(date, 'd')}
            calendarType="gregory"
            showNeighboringMonth={false} // 이웃 달 날짜 숨김
            onActiveStartDateChange={handleActiveStartDateChange}
          />
        </div>

        {/* 하단 범례 */}
        <div className="flex gap-8 mt-6 text-sm text-gray-500 justify-end border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm"></div>
            <span>평일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-dbeafe border border-blue-200 rounded shadow-sm opacity-50"></div>
            <span className="text-blue-400">일요일</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-ffe4e6 border border-red-200 rounded shadow-sm opacity-50"></div>
            <span className="text-red-400">토요일/공휴일</span>
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