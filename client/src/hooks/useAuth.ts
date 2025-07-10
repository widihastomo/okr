import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 10 * 1000, // 10 seconds cache for faster navigation
    cacheTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if cached
  });

  // If we get a 401 error, user is not authenticated
  const isUnauthorized = error && (error as any).status === 401;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isUnauthorized,
  };
}