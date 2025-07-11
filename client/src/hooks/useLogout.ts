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
    console.log('🔓 Starting logout process...');
    
    try {
      // 1. Call logout API first and wait for response
      console.log('🔓 Calling logout API...');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('🔓 Logout API response:', result);
      
      if (!response.ok) {
        console.error('Logout API failed:', result);
      }
    } catch (error) {
      console.warn('Logout API error (continuing with client cleanup):', error);
    } finally {
      // 2. Clear all client-side state
      console.log('🔓 Clearing client state...');
      queryClient.clear();
      queryClient.invalidateQueries();
      
      // 3. Clear storage
      console.log('🔓 Clearing storage...');
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Set logout flag
      localStorage.setItem("isLoggedOut", "true");
      
      // 5. Navigate to login page
      console.log('🔓 Navigating to home page...');
      setLocation("/");
      
      setIsLoggingOut(false);
      console.log('🔓 Logout process completed');
    }
  };

  return {
    logout,
    isLoggingOut
  };
}