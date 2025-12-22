import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitApi } from "../api/unitApi";

export const useUnit = () => {
  const queryClient = useQueryClient();

  // 1. 목록 조회
  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["units"],
    queryFn: unitApi.getUnitList,
  });

  const units = response?.data || [];

  // 2. 통합 수정 (기본 정보 + 담당자 정보 동시 처리)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // 두 API를 병렬로 호출하여 모두 업데이트
      return Promise.all([
        unitApi.updateUnitBasic(id, data),
        unitApi.updateUnitOfficer(id, data),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["units"]);
      alert("부대 정보가 성공적으로 수정되었습니다.");
    },
    onError: (err) => {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    },
  });

  // 3. 삭제
  const deleteMutation = useMutation({
    mutationFn: unitApi.deleteUnit,
    onSuccess: () => {
        queryClient.invalidateQueries(["units"]);
        alert("삭제되었습니다.");
    },
  });

  // 4. 엑셀 업로드
  const uploadExcelMutation = useMutation({
    mutationFn: unitApi.uploadExcel,
    onSuccess: (res) => {
        queryClient.invalidateQueries(["units"]);
        alert(res.message || "업로드가 완료되었습니다.");
    },
    onError: () => alert("업로드 실패"),
  });

  // 5. 신규 등록
  const registerMutation = useMutation({
    mutationFn: unitApi.registerUnit,
    onSuccess: () => {
        queryClient.invalidateQueries(["units"]);
        alert("등록되었습니다.");
    },
    onError: (err) => alert(err.message || "등록 실패"),
  });

  return {
    units,
    isLoading,
    isError,
    errorMessage: error?.message,
    updateUnit: updateMutation.mutate, // 통합된 수정 함수
    deleteUnit: deleteMutation.mutate,
    uploadExcel: uploadExcelMutation.mutateAsync,
    registerUnit: registerMutation.mutateAsync,
  };
};