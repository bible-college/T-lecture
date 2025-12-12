// client/src/pages/schedule.jsx
import React from 'react';
import { MainLayout } from '../shared/ui/MainLayout';
import { CommonHeader } from '../shared/ui/CommonHeader';
import { useAuthGuard } from '../features/auth/model/useAuthGuard';
import { InstructorCalendar } from '../features/schedule/components/InstructorCalendar';

const InstructorSchedulePage = () => {
  // 권한 체크 (일단 USER 권한 이상이면 접근 가능하게, 추후 INSTRUCTOR로 변경 가능)
  const { shouldRender } = useAuthGuard('USER');

  // 유저 이름 파싱 (CommonHeader용)
  let userLabel = 'User';
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      userLabel = user.name || user.email || 'User';
    }
  } catch (e) {
    console.error('User parsing error', e);
  }

  // 헤더 메뉴 설정 (메인 페이지와 동일)
  const userLinks = [
    { label: '내 정보', path: '/user-main/profile' },
    { label: '신청 현황', path: '/instructor/schedule' },
  ];

  if (!shouldRender) return null;

  return (
    <>
      <CommonHeader
        title="T-Lecture"
        userLabel={userLabel}
        links={userLinks}
      />
      <MainLayout>
        {/* 기존 테스트용 스타일 제거 후 깔끔하게 배치 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <InstructorCalendar />
        </div>
      </MainLayout>
    </>
  );
};

export default InstructorSchedulePage;