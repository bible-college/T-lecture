import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitApi } from "../api/unitApi";

export const useUnit = () => {
  const queryClient = useQueryClient();

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ["units"],
    queryFn: unitApi.getUnitList,
  });

  // ✅ 수정됨: 서버 응답 구조(response.data.data)에 맞춰 실제 배열 추출
  // 구조: response (JSON) -> data (Controller Wrapper) -> data (Service Result Array)
  const units = response?.data?.data || [];
  
  // 참고: 메타데이터(페이지네이션 정보)가 필요하면 아래와 같이 꺼낼 수 있습니다.
  // const meta = response?.data?.meta;

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
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

  const deleteMutation = useMutation({
    mutationFn: unitApi.deleteUnit,
    onSuccess: () => {
        queryClient.invalidateQueries(["units"]);
        alert("삭제되었습니다.");
    },
  });

  const uploadExcelMutation = useMutation({
    mutationFn: unitApi.uploadExcel,
    onSuccess: (res) => {
        queryClient.invalidateQueries(["units"]);
        alert(res.message || "업로드가 완료되었습니다.");
    },
    onError: () => alert("업로드 실패"),
  });

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
    updateUnit: updateMutation.mutate,
    deleteUnit: deleteMutation.mutate,
    uploadExcel: uploadExcelMutation.mutateAsync,
    registerUnit: registerMutation.mutateAsync,
  };
};