import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  Target, 
  Calendar, 
  BarChart3, 
  Trophy, 
  Network,
  Settings,
  Users,
  Shield,
  CreditCard,
  LogOut,
  Building,
  Shapes,
  X,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";

interface ClientSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function ClientSidebar({ isOpen, onClose }: ClientSidebarProps) {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const { isOwner } = useOrganization();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Menu items for client users (normal OKR application users)
  const menuItems = [
    {
      label: "Daily Focus",
      icon: Calendar,
      path: "/daily-focus",
      active: location === "/daily-focus"
    },
    {
      label: "Goals",
      icon: Target,
      path: "/",
      active: location === "/" || location === "/dashboard"
    },
    {
      label: "Goals Perusahaan",
      icon: Building,
      path: "/company-okr",
      active: location === "/company-okr"
    },
    {
      label: "Siklus",
      icon: Calendar,
      path: "/cycles",
      active: location === "/cycles"
    },
    {
      label: "Template",
      icon: Shapes,
      path: "/templates",
      active: location === "/templates"
    },
    {
      label: "Pencapaian",
      icon: Trophy,
      path: "/achievements", 
      active: location === "/achievements"
    },
    {
      label: "Analitik",
      icon: BarChart3,
      path: "/analytics",
      active: location === "/analytics"
    },
    {
      label: "Jaringan Goal",
      icon: Network,
      path: "/goal-network",
      active: location === "/goal-network"
    },
    {
      label: "Harga",
      icon: CreditCard,
      path: "/pricing",
      active: location === "/pricing"
    }
  ];

  // Add organization owner specific menu items
  if (isOwner) {
    menuItems.push({
      label: "Pengaturan Organisasi",
      icon: Settings,
      path: "/organization-settings",
      active: location === "/organization-settings"
    });
    
    menuItems.push({
      label: "Kelola Pengguna",
      icon: Users,
      path: "/client-users",
      active: location === "/client-users"
    });
    
    menuItems.push({
      label: "Kelola Role",
      icon: Shield,
      path: "/client-roles",
      active: location === "/client-roles"
    });
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile header with close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop collapse toggle */}
          <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">OKR Platform</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-8 w-8 p-0 ml-auto"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                      isCollapsed ? "justify-center" : "space-x-3",
                      item.active
                        ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Profile section at bottom */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={() => handleNavigation("/profile")}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                isCollapsed ? "justify-center" : "space-x-3",
                location === "/profile"
                  ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              title={isCollapsed ? "Profile" : undefined}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Profile</span>}
            </button>
            
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2",
                isCollapsed ? "justify-center" : "space-x-3",
                "text-gray-700 hover:bg-gray-100"
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}