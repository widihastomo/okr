import React from "react";
import { Link, useLocation } from "wouter";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

interface ClientSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function ClientSidebar({ isOpen, onClose }: ClientSidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { isOwner } = useOrganization();

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
        "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:relative lg:z-auto"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OKR Platform</span>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      item.active
                        ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}