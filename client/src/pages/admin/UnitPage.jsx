import React from 'react';
import { UnitListSection } from '../../features/unit/UnitListSection';
import { UnitActionSection } from '../../features/unit/UnitActionSection'; // 새로 만든 컴포넌트
import { AdminHeader } from '../../features/admin/ui/headers/AdminHeader';

const UnitPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">부대 관리</h2>
                <p className="text-sm text-gray-500 mt-1">부대 정보를 등록하거나 엑셀로 일괄 업로드합니다.</p>
            </div>
            {/* 액션 버튼 섹션 추가 */}
            <UnitActionSection />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
            <UnitListSection />
        </div>
      </main>
    </div>
  );
};

export default UnitPage;