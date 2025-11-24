// src/shared/ui/MainLayout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const MainLayout = ({ children }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
        {/* 공통 헤더 (네비게이션 바) */}
        <header className="bg-white shadow p-4 mb-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 
                onClick={() => navigate('/')} 
                className="text-xl font-bold text-green-600 cursor-pointer"
            >
                T-Lecture
            </h1>
            {/* 필요하면 여기에 우측 메뉴 추가 (예: 마이페이지) */}
            </div>
        </header>

        {/* 페이지별 내용이 들어갈 자리 */}
        <main className="max-w-7xl mx-auto px-4">
            {children}
        </main>
        </div>
    );
};