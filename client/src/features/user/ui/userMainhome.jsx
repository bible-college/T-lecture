// client/src/features/user/ui/InstructorDashboard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button'; // 기존 버튼 재사용

export const UserDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">일반 유저 메인 페이지</h2>

            {/* 3 cards were removed as they are now in the header */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center py-20">
                <div className="text-6xl mb-4">👋</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">환영합니다!</h3>
                <p className="text-gray-500">
                    상단 메뉴를 통해 내 정보, 신청 현황, 일정 관리를 이용하실 수 있습니다.
                </p>
            </div>
        </div>
    );
};