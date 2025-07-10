import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const logout = async () => {
    if (isLoggingOut) return; // Prevent double logout
    
    setIsLoggingOut(true);
    
    try {
      // 1. Call logout API first and wait for response
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.warn('Logout API error (continuing with client cleanup):', error);
    } finally {
      // 2. Clear all client-side state
      queryClient.clear();
      queryClient.invalidateQueries();
      
      // 3. Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Set logout flag
      localStorage.setItem("isLoggedOut", "true");
      
      // 5. Navigate to login page
      setLocation("/");
      
      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    isLoggingOut
  };
}