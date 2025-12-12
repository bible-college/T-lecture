// src/features/assignment/assignmentApi.js
import { apiClient } from "../../shared/apiClient";

/**
 * 배정 후보 데이터(미배정 부대, 가용 강사) 조회
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export const getAssignmentCandidates = async (startDate, endDate) => {
    // 쿼리 파라미터 생성
    const params = new URLSearchParams({
        startDate,
        endDate
    });

    const res = await apiClient(`/api/v1/assignments/candidates?${params}`);
    
    if (!res.ok) {
        throw new Error("배정 후보 데이터를 불러오는데 실패했습니다.");
    }
    return res.json(); 
    // 반환값 예시: { unassignedUnits: [...], availableInstructors: [...] }
};

/**
 * (추가 예정) 배정 확정 API 등도 여기에 추가하면 됩니다.
 */