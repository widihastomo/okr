import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserOnboardingProgress, UpdateOnboardingProgress } from "@shared/schema";

export function useOnboardingProgress() {
  return useQuery<UserOnboardingProgress | null>({
    queryKey: ["/api/user/onboarding-progress"],
    retry: false,
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: UpdateOnboardingProgress) => {
      return await apiRequest("PUT", "/api/user/onboarding-progress", progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-progress"] });
    },
  });
}