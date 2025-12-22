import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitApi } from "./unitApi"; // 경로 확인 필요

export const useUnit = () => {
  const queryClient = useQueryClient();

  // 목록 조회
  const { data: units, isLoading } = useQuery({
    queryKey: ["units"],
    queryFn: unitApi.getUnitList,
  });

  // 단건 등록
  const registerMutation = useMutation({
    mutationFn: unitApi.registerUnit,
    onSuccess: () => queryClient.invalidateQueries(["units"]),
  });

  // 엑셀 업로드 (추가 필요)
  const uploadExcelMutation = useMutation({
    mutationFn: unitApi.uploadExcel,
    onSuccess: () => queryClient.invalidateQueries(["units"]),
  });

  // 삭제
  const deleteMutation = useMutation({
    mutationFn: unitApi.deleteUnit,
    onSuccess: () => queryClient.invalidateQueries(["units"]),
  });

  return { 
      units: units?.data || units, // 서버 응답 구조(data.data)에 따라 조정 필요할 수 있음
      isLoading, 
      registerUnit: registerMutation.mutateAsync, // 비동기 처리를 위해 mutateAsync 추천
      uploadExcel: uploadExcelMutation.mutateAsync, // 추가됨
      deleteUnit: deleteMutation.mutate 
  };
};