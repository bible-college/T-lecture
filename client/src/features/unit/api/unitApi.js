import { apiClient } from "../../../shared/apiClient";

export const unitApi = {
  // 목록 조회
  getUnitList: async () => {
    const response = await apiClient("/api/v1/unit");
    return response.json();
  },
  // 단건 등록
  registerUnit: async (data) => {
    const response = await apiClient("/api/v1/unit", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  // 엑셀 업로드
  uploadExcel: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient("/api/v1/unit/upload/excel", {
      method: "POST",
      body: formData,
      headers: {}, // FormData는 Content-Type 자동 설정
    });
    return response.json();
  },
  // 기본 정보 수정 (서버: PATCH /:id/basic)
  updateUnitBasic: async (id, data) => {
    const response = await apiClient(`/api/v1/unit/${id}/basic`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  // 담당자 정보 수정 (서버: PATCH /:id/officer)
  updateUnitOfficer: async (id, data) => {
    const response = await apiClient(`/api/v1/unit/${id}/officer`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  // 삭제
  deleteUnit: async (id) => {
    await apiClient(`/api/v1/unit/${id}`, { method: "DELETE" });
  },
};