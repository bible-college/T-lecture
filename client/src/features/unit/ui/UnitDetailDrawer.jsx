import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/ui/Button';       // 경로 주의
import { InputField } from '../../../shared/ui/InputField'; // 경로 주의 (import { InputField } 확인 필요)

export const UnitDetailDrawer = ({ isOpen, onClose, unit, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '', unitType: '', region: '', wideArea: '', addressDetail: '', 
    officerName: '', officerPhone: ''
  });

  useEffect(() => {
    if (unit) {
      setFormData({ 
        ...unit,
        // 서버 필드명 매핑 (혹시 null이면 빈 문자열로)
        addressDetail: unit.addressDetail || '',
        officerName: unit.officerName || '',
        officerPhone: unit.officerPhone || ''
      });
    } else {
      setFormData({ 
        name: '', unitType: '육군', region: '', wideArea: '', addressDetail: '', 
        officerName: '', officerPhone: '' 
      });
    }
  }, [unit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (unit) {
      onSave({ id: unit.id, data: formData });
    } else {
      onSave(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if(window.confirm('정말 삭제하시겠습니까?')) {
        onDelete(unit.id);
        onClose();
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {unit ? '부대 상세 정보' : '새 부대 등록'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-140px)]">
          <form id="unit-form" onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 border-b pb-2">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="부대명" name="name" value={formData.name} onChange={handleChange} required />
              <InputField label="군 구분" name="unitType" value={formData.unitType} onChange={handleChange} placeholder="예: 육군" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="광역" name="wideArea" value={formData.wideArea} onChange={handleChange} placeholder="예: 경기" />
              <InputField label="지역" name="region" value={formData.region} onChange={handleChange} placeholder="예: 양주" />
            </div>
            <InputField label="상세주소" name="addressDetail" value={formData.addressDetail} onChange={handleChange} fullWidth />

            <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mt-6">담당자 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="담당자명" name="officerName" value={formData.officerName} onChange={handleChange} />
              <InputField label="연락처" name="officerPhone" value={formData.officerPhone} onChange={handleChange} />
            </div>
          </form>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-50 border-t flex justify-between items-center">
          {unit ? (
            <button type="button" onClick={handleDelete} className="text-red-500 text-sm hover:underline px-2">부대 삭제</button>
          ) : <div></div>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button variant="primary" type="submit" form="unit-form">저장하기</Button>
          </div>
        </div>
      </div>
    </>
  );
};