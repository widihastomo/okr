import { queryClient } from "@/lib/queryClient";

// Pre-fetch commonly needed data after login to speed up navigation
export async function prefetchAuthData() {
  // Pre-fetch these queries in parallel for faster subsequent page loads
  const promises = [
    queryClient.prefetchQuery({
      queryKey: ["/api/trial-status"],
      staleTime: 60 * 1000, // 1 minute
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/onboarding/status"],
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
  ];

  // Don't wait for prefetch to complete, let it happen in background
  Promise.all(promises).catch(() => {
    // Ignore prefetch errors
  });
}