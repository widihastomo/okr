import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear any client-side state if needed
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to logout endpoint
      window.location.href = '/api/logout';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
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