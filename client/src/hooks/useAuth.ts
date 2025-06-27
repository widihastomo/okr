import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // If we get a 401 error, user is not authenticated
  const isUnauthorized = error && (error as any).status === 401;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isUnauthorized,
  };
}