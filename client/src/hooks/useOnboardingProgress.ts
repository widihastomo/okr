import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface OnboardingProgress {
  completedTours: string[];
  isFirstTimeUser: boolean;
  lastActiveAt?: string;
}

export function useOnboardingProgress() {
  return useQuery<OnboardingProgress>({
    queryKey: ["/api/onboarding/progress"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/onboarding/progress");
        return response;
      } catch (error) {
        // Return default progress if endpoint doesn't exist yet
        return {
          completedTours: [],
          isFirstTimeUser: true
        };
      }
    },
    retry: false
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (progress: Partial<OnboardingProgress>) => {
      return apiRequest("PUT", "/api/onboarding/progress", progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
    }
  });
}

export function useCompleteOnboardingTour() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tourId: string) => {
      return apiRequest("POST", "/api/onboarding/complete-tour", { tourId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
    }
  });
}