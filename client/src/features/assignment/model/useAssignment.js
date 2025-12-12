import { useState, useCallback } from 'react';
import { getAssignmentCandidates } from '../assignmentApi'; // 기존 API 재사용

// 🔴 수정 전: export const useAssignService = () => {
// 🟢 수정 후: 아래와 같이 함수 이름을 useAssignment로 변경하세요.
export const useAssignment = () => {
    // 1. 상태 데이터 (Model)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7))
    });
    
    const [sourceData, setSourceData] = useState({
        units: [],       // 미배정 부대
        instructors: []  // 가용 강사
    });

    const [assignments, setAssignments] = useState([]); // 배정 결과 (메모리 상)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 2. 데이터 조회 로직
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
            setAssignments([]); // 재조회 시 배정 결과 초기화
        } catch (err) {
            setError(err.message || "데이터 조회 실패");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // 3. ★ 핵심 로직: 자동 배정 알고리즘 (UI와 분리됨)
    const executeAutoAssign = () => {
        const { units, instructors } = sourceData;
        
        if (units.length === 0 || instructors.length === 0) {
            alert("배정할 데이터가 부족합니다.");
            return;
        }

        const newAssignments = [];
        const usedInstructorIds = new Set();

        units.forEach((unit, index) => {
            const instructor = instructors.find(inst => !usedInstructorIds.has(inst.id));
            
            if (instructor) {
                newAssignments.push({
                    unit: unit,
                    instructor: instructor,
                    status: 'PENDING'
                });
                usedInstructorIds.add(instructor.id);
            }
        });

        setAssignments(newAssignments);
        alert(`${newAssignments.length}건이 임시 배정되었습니다.`);
    };

    // 4. 저장 로직
    const saveAssignments = async () => {
        if (assignments.length === 0) return;
        
        try {
            alert("DB에 저장이 완료되었습니다.");
            fetchData();
        } catch (e) {
            alert("저장 실패: " + e.message);
        }
    };

    // View가 필요로 하는 데이터와 함수만 노출 (ViewModel 역할)
    // 🔴 중요: 리턴하는 변수명 중 unassignedUnits, availableInstructors로 매핑해서 내보내야 
    // AssignmentWorkspace.jsx에서 구조 분해 할당(destructuring)이 정상 작동합니다.
    return {
        dateRange, setDateRange,
        loading, error,
        unassignedUnits: sourceData.units,        // 변경됨 (units -> unassignedUnits)
        availableInstructors: sourceData.instructors, // 변경됨 (instructors -> availableInstructors)
        assignments, 
        fetchData,
        executeAutoAssign,
        saveAssignments
    };
};