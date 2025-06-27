import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OKRFormModal from "./okr-form-modal";

interface GlobalHeaderProps {
  onMenuToggle?: () => void;
}

export default function GlobalHeader({ onMenuToggle }: GlobalHeaderProps) {
  const [notificationCount] = useState(1);
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);

  const handleCreateOKR = () => {
    setIsOKRModalOpen(true);
  };

  const handleCreateProject = () => {
    // Navigate to create project page or open modal
    console.log("Create project clicked");
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
        {/* Create OKR Button */}
        <Button
          onClick={handleCreateOKR}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          title="Buat OKR (Ctrl+K)"
        >
          <Plus className="h-4 w-4" />
          <span>Buat OKR</span>
          <span className="text-xs opacity-75 ml-2 hidden md:inline">Ctrl+K</span>
        </Button>

        {/* Create Project Button */}
        <Button
          onClick={handleCreateProject}
          variant="outline"
          className="border-pink-300 text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Project</span>
        </Button>

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
          <DropdownMenuContent align="end" className="w-64">
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
      </div>

      {/* Global OKR Creation Modal */}
      <OKRFormModal 
        open={isOKRModalOpen} 
        onOpenChange={setIsOKRModalOpen} 
      />
    </header>
  );
}