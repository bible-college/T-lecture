import React from 'react';
import { UnitListSection } from '../../features/unit/UnitListSection';
import AdminHeader from '../../features/admin/ui/headers/AdminHeader';

const UnitPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">부대 관리</h2>
          {/* 여기에 엑셀 업로드나 단건 등록 버튼 추가 가능 */}
        </div>
        <UnitListSection />
      </main>
    </div>
  );
};

export default UnitPage;