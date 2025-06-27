import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check if user is explicitly logged out
  const isLoggedOut = localStorage.getItem('isLoggedOut') === 'true';
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    enabled: !isLoggedOut, // Don't fetch user data if logged out
  });

  return {
    user,
    isLoading: isLoggedOut ? false : isLoading,
    isAuthenticated: !isLoggedOut && !!user,
  };
}