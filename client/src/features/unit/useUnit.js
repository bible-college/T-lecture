import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitApi } from "./unitApi";

export const useUnit = () => {
  const queryClient = useQueryClient();

  const { data: units, isLoading } = useQuery({
    queryKey: ["units"],
    queryFn: unitApi.getUnitList,
  });

  const registerMutation = useMutation({
    mutationFn: unitApi.registerUnit,
    onSuccess: () => queryClient.invalidateQueries(["units"]),
  });

  const deleteMutation = useMutation({
    mutationFn: unitApi.deleteUnit,
    onSuccess: () => queryClient.invalidateQueries(["units"]),
  });

  return { units, isLoading, registerUnit: registerMutation.mutate, deleteUnit: deleteMutation.mutate };
};