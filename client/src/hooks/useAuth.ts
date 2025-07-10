import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes cache for auth state
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // If we get a 401 error, user is not authenticated
  const isUnauthorized = error && (error as any).status === 401;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isUnauthorized,
  };
}