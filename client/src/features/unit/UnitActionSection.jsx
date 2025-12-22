import React, { useRef } from 'react';
import { useUnit } from './useUnit'; // 기존 useUnit 훅 사용
import { Button } from '../../shared/ui/Button'; // Button 컴포넌트

export const UnitActionSection = () => {
    const fileInputRef = useRef(null);
    const { uploadExcel, registerUnit } = useUnit(); // 훅에서 함수 가져오기

    // 엑셀 파일 선택 핸들러
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (window.confirm(`${file.name} 파일을 업로드하시겠습니까?`)) {
                await uploadExcel(file); // 엑셀 업로드 API 호출
                alert('업로드가 완료되었습니다.');
                window.location.reload(); // 목록 갱신을 위해 새로고침
            }
        } catch (error) {
            console.error(error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            e.target.value = ''; // input 초기화
        }
    };

    // 테스트용 단건 등록 (빠른 테스트를 위해 임시 데이터 사용)
    const handleQuickRegister = async () => {
        const dummyData = {
            unitType: "Army",
            name: `신규부대_${Math.floor(Math.random() * 1000)}`,
            region: "경기",
            wideArea: "경기북부"
        };

        if(window.confirm('테스트용 부대를 등록하시겠습니까?')) {
            try {
                await registerUnit(dummyData);
                alert('등록되었습니다.');
            } catch (error) {
                alert('등록 실패');
            }
        }
    };

    return (
        <div className="flex gap-2 mb-4">
            {/* 숨겨진 파일 인풋 */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".xlsx, .xls"
            />
            
            <Button 
                variant="primary" 
                onClick={() => fileInputRef.current.click()}
            >
                📤 엑셀 일괄 등록
            </Button>

            <Button 
                variant="secondary" 
                onClick={handleQuickRegister}
            >
                ➕ 테스트 부대 추가
            </Button>
        </div>
    );
};