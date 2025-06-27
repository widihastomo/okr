import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  GitBranch, 
  RotateCcw, 
  FileText, 
  Users, 
  Target, 
  BarChart3,
  User,
  Settings,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      active: location === "/dashboard" || location === "/"
    },
    {
      label: "Company OKRs",
      icon: Building2,
      path: "/company-okrs",
      active: location === "/company-okrs"
    },
    {
      label: "OKR Structure",
      icon: GitBranch,
      path: "/okr-structure",
      active: location === "/okr-structure"
    },
    {
      label: "Cycles",
      icon: RotateCcw,
      path: "/cycles",
      active: location === "/cycles"
    },
    {
      label: "Templates",
      icon: FileText,
      path: "/templates",
      active: location === "/templates"
    },
    {
      label: "Users",
      icon: Users,
      path: "/users",
      active: location === "/users"
    },
    {
      label: "My OKRs",
      icon: Target,
      path: "/my-okrs",
      active: location === "/my-okrs"
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/analytics",
      active: location === "/analytics"
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30",
          // Mobile: completely hidden when closed, full width when open
          isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0",
          // Desktop: always visible, width changes
          "lg:relative lg:top-0 lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0",
          !isOpen && "lg:w-16"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className={cn(
            "flex-1 py-4 space-y-1 transition-all duration-300",
            isOpen ? "px-4" : "px-2 lg:px-2"
          )}>
            {menuItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/" && location.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    // Mobile: always full width when visible
                    isOpen ? "space-x-3 px-3 py-2" : "hidden lg:flex lg:justify-center lg:px-2 lg:py-3",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  title={!isOpen ? item.label : undefined}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className={cn(
            "py-4 border-t border-gray-200 transition-all duration-300",
            isOpen ? "px-4" : "px-2 lg:px-2"
          )}>
            {isOpen ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    John Doe
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    john@example.com
                  </p>
                </div>
                <Settings className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            ) : (
              <div className="hidden lg:flex lg:justify-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}