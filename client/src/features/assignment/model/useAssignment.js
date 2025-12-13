// src/features/assignment/model/useAssignment.js
import { useState, useCallback } from 'react';
// 🟢 [수정] postAutoAssignment 추가 import
import { getAssignmentCandidates, postAutoAssignment } from '../assignmentApi';

export const useAssignment = () => {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7))
    });
    
    const [sourceData, setSourceData] = useState({
        units: [],
        instructors: []
    });

    const [assignments, setAssignments] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. 데이터 조회
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = dateRange.startDate.toISOString().split('T')[0];
            const endStr = dateRange.endDate.toISOString().split('T')[0];
            
            const data = await getAssignmentCandidates(startStr, endStr);
            
            setSourceData({
                units: data.unassignedUnits || [],
                instructors: data.availableInstructors || []
            });
            setAssignments([]); // 초기화
        } catch (err) {
            setError(err.message || "데이터 조회 실패");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // 2. 🟢 [수정] 자동 배정 실행 (API 호출)
    const executeAutoAssign = async () => {
        if (!confirm('현재 조건으로 자동 배정을 실행하시겠습니까?')) return;

        setLoading(true);
        try {
            const startStr = dateRange.startDate.toISOString().split('T')[0];
            const endStr = dateRange.endDate.toISOString().split('T')[0];

            // 서버 API 호출 -> 계층형 결과 수신
            const result = await postAutoAssignment(startStr, endStr);
            console.log("🔥 [DEBUG] 서버 응답 데이터:", result); // 🟢 로그 확인 필수!
            if (!result.data) {
                console.error("데이터 구조가 이상합니다!", result);
            }
            setAssignments(result.data || []); 
            alert(`배정이 완료되었습니다.`);
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. 저장 로직 (이미 서버에 저장된 상태를 불러오므로 여기선 새로고침 정도만)
    const saveAssignments = async () => {
        alert("서버에 이미 저장된 상태입니다. (재조회)");
        fetchData();
    };
    const removeAssignment = async (unitScheduleId, instructorId) => {
        try {
            setLoading(true);
            await cancelAssignmentApi(unitScheduleId, instructorId);
            alert('배정이 취소되었습니다.');
            
            // 화면 갱신을 위해 데이터 재조회
            await fetchData(); 
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };
    return {
        dateRange, setDateRange,
        loading, error,
        unassignedUnits: sourceData.units,
        availableInstructors: sourceData.instructors,
        assignments, 
        fetchData,
        executeAutoAssign,
        saveAssignments,
        removeAssignment
    };
};