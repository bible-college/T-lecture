import React from 'react';
import { useUnit } from './useUnit';
import { Button } from '../../shared/ui/Button';

export const UnitListSection = () => {
  const { units, isLoading, deleteUnit } = useUnit();

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 border">군구분</th>
            <th className="px-4 py-2 border">부대명</th>
            <th className="px-4 py-2 border">지역</th>
            <th className="px-4 py-2 border">관리</th>
          </tr>
        </thead>
        <tbody>
          {units?.map((unit) => (
            <tr key={unit.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{unit.unitType}</td>
              <td className="px-4 py-2 border">{unit.name}</td>
              <td className="px-4 py-2 border">{unit.region}</td>
              <td className="px-4 py-2 border text-center">
                <Button 
                  onClick={() => { if(window.confirm('삭제하시겠습니까?')) deleteUnit(unit.id) }}
                  className="bg-red-500 text-white text-xs px-2 py-1"
                >
                  삭제
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};