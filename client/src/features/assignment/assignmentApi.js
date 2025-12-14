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

export const postAutoAssignment = async (startDate, endDate) => {
    const res = await apiClient("/api/v1/assignments/auto-assign", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
    });
    if (!res.ok) throw new Error("자동 배정 실행에 실패했습니다.");
    
    // 서버가 계층형 JSON 구조를 반환해줍니다.
    return res.json(); 
};

export const cancelAssignmentApi = async (unitScheduleId, instructorId) => {
    const res = await apiClient(`/api/v1/assignments/${unitScheduleId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ unitScheduleId, instructorId }),
    });
    if (!res.ok) throw new Error("배정 취소에 실패했습니다.");
    return res.json();
};