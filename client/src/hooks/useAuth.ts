import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes cache for reduced API calls
    gcTime: 5 * 60 * 1000, // 5 minutes cache (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if cached
  });

  // If we get a 401 error, user is not authenticated
  const isUnauthorized = error && (error as any).status === 401;
  
  // Check if user is explicitly logged out
  const isLoggedOut = localStorage.getItem("isLoggedOut") === "true";

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isUnauthorized && !isLoggedOut,
  };
}