import { apiClient } from "../../shared/apiClient";

export const unitApi = {
  // 부대 목록 조회
  getUnitList: async () => {
    const response = await apiClient("/api/v1/unit");
    return response.json();
  },
  // 부대 상세 조회
  getUnitDetail: async (id) => {
    const response = await apiClient(`/api/v1/unit/${id}`);
    return response.json();
  },
  // 부대 단건 등록
  registerUnit: async (unitData) => {
    const response = await apiClient("/api/v1/unit", {
      method: "POST",
      body: JSON.stringify(unitData),
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
      headers: {}, // FormData 사용 시 Content-Type을 자동으로 설정하게 비워둠
    });
    return response.json();
  },
  // 부대 삭제
  deleteUnit: async (id) => {
    await apiClient(`/api/v1/unit/${id}`, { method: "DELETE" });
  }
};