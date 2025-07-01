import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, Plus, Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import OKRFormModal from "./okr-form-modal";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface GlobalHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function GlobalHeader({ onMenuToggle, sidebarOpen }: GlobalHeaderProps) {
  const [notificationCount] = useState(1);
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);
  const { user } = useAuth();

  const handleCreateOKR = () => {
    setIsOKRModalOpen(true);
  };

  

  const getUserInitials = () => {
    const firstName = (user as any)?.firstName || "";
    const lastName = (user as any)?.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email[0].toUpperCase();
    }
    return "U";
  };

  // Global keyboard shortcut for creating OKR (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOKRModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      {/* Left side - Menu toggle and Logo */}
      <div className="flex items-center space-x-3">
        {/* Hamburger menu button - always visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-md"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>
        
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OK</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">OKR Manager</span>
        </div>
      </div>

      {/* Right side - Action buttons and notifications */}
      <div className="flex items-center space-x-3">
        

        

        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 z-[70]">
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Update progress OKR Q1</p>
                <p className="text-xs text-gray-500">2 jam yang lalu</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Deadline key result mendekat</p>
                <p className="text-xs text-gray-500">1 hari yang lalu</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2 py-1 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none rounded-lg flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.profileImageUrl} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden md:inline">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[70]">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700"
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' })
                  .then(() => window.location.href = '/');
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global OKR Creation Modal */}
      <OKRFormModal 
        open={isOKRModalOpen} 
        onOpenChange={setIsOKRModalOpen} 
      />
    </header>
  );
}