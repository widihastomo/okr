import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 0, // No cache for auth state to ensure logout works immediately
    cacheTime: 0, // No cache
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