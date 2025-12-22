import React from 'react';
// 특별한 import 없음

export const UnitList = ({ units, onUnitClick }) => {
  if (units.length === 0) {
    return <div className="p-10 text-center text-gray-400 border rounded-lg bg-white">검색된 부대가 없습니다.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* PC 뷰 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-medium">군 구분</th>
              <th className="p-4 font-medium">부대명</th>
              <th className="p-4 font-medium">지역</th>
              <th className="p-4 font-medium">최근 강의</th>
              <th className="p-4 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {units.map((unit) => (
              <tr 
                key={unit.id} 
                className="hover:bg-green-50 cursor-pointer transition-colors"
                onClick={() => onUnitClick(unit)}
              >
                <td className="p-4 text-sm text-gray-500">{unit.unitType}</td>
                <td className="p-4 font-semibold text-gray-800">{unit.name}</td>
                <td className="p-4 text-sm text-gray-600">{unit.wideArea} {unit.region}</td>
                <td className="p-4 text-sm text-gray-500">
                  {unit.schedules?.[0]?.date || '-'}
                </td>
                <td className="p-4 text-right">
                  <span className="text-xs font-medium text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded">
                    상세보기
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 뷰 */}
      <div className="md:hidden flex flex-col divide-y divide-gray-100">
        {units.map((unit) => (
          <div 
            key={unit.id} 
            className="p-4 active:bg-gray-50 cursor-pointer"
            onClick={() => onUnitClick(unit)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                {unit.unitType}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{unit.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{unit.wideArea} {unit.region}</p>
          </div>
        ))}
      </div>
    </div>
  );
};