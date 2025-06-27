import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  variant = "outline", 
  size = "default", 
  className = "",
  showIcon = true,
  children = "Keluar"
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Set logout flag in localStorage before API call
      localStorage.setItem('isLoggedOut', 'true');
      
      // Call logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Clear React Query cache
      queryClient.clear();
      
      // Clear any client-side state
      localStorage.clear();
      sessionStorage.clear();
      
      // Set logout flag again (after clear)
      localStorage.setItem('isLoggedOut', 'true');
      
      // Force page reload to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Set logout flag and reload anyway
      localStorage.setItem('isLoggedOut', 'true');
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('isLoggedOut', 'true');
      window.location.reload();
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoggingOut}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {isLoggingOut ? "Keluar..." : children}
    </Button>
  );
}