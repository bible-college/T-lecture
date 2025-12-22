import React, { useState, useMemo } from 'react';
import { AdminHeader } from '../../features/admin/ui/headers/AdminHeader';
// 1. 모델(로직) import
import { useUnit } from '../../features/unit/model/useUnit';
// 2. UI 컴포넌트 import (경로가 ui 폴더로 통일됨)
import { UnitToolbar } from '../../features/unit/ui/UnitToolbar';
import { UnitList } from '../../features/unit/ui/UnitList';
import { UnitDetailDrawer } from '../../features/unit/ui/UnitDetailDrawer';

const UnitPage = () => {
  const { units, isLoading, registerUnit, uploadExcel, updateUnit, deleteUnit } = useUnit();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 검색 필터링 로직
  const filteredUnits = useMemo(() => {
    if (!searchTerm) return units;
    return units.filter(unit => 
      unit.name?.includes(searchTerm) || 
      unit.region?.includes(searchTerm)
    );
  }, [units, searchTerm]);

  const handleUnitClick = (unit) => {
    setSelectedUnit(unit);
    setIsDrawerOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedUnit(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedUnit(null), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative">
        <UnitToolbar 
          onSearch={setSearchTerm} 
          onUploadExcel={uploadExcel}
          onCreate={handleCreateClick}
          totalCount={filteredUnits.length}
        />

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : (
          <UnitList 
            units={filteredUnits} 
            onUnitClick={handleUnitClick} 
          />
        )}
      </main>

      <UnitDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer}
        unit={selectedUnit}
        onSave={selectedUnit ? updateUnit : registerUnit}
        onDelete={deleteUnit}
      />
    </div>
  );
};

export default UnitPage;