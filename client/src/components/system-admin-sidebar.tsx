import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  RotateCcw,
  FileText,
  Users,
  Target,
  BarChart3,
  User,
  Settings,
  Shield,
  X,
  Trophy,
  Calendar,
  CreditCard,
  Clock,
  Focus,
  CheckSquare,
  Sun,

  Database,
  Bell,
  Lock,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SystemAdminSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [location] = useLocation();
  const { isOwner } = useOrganization();
  const { user } = useAuth();

  // Menu items for system owners (platform administrators)
  const menuItems = [
    {
      label: "Dashboard Sistem",
      icon: LayoutDashboard,
      path: "/system-admin",
      active: location === "/system-admin"
    },
    {
      label: "Kelola Organisasi",
      icon: Building2,
      path: "/system-admin/organizations",
      active: location === "/system-admin/organizations"
    },
    {
      label: "Kelola Pengguna",
      icon: Users,
      path: "/system-admin/users",
      active: location === "/system-admin/users"
    },
    {
      label: "Kelola Paket",
      icon: Package,
      path: "/subscription-packages",
      active: location === "/subscription-packages"
    },
    {
      label: "Kelola Subscription",
      icon: CreditCard,
      path: "/system-admin/subscriptions",
      active: location === "/system-admin/subscriptions"
    },
    {
      label: "Kelola Add-Ons",
      icon: Package,
      path: "/system-admin/add-ons",
      active: location === "/system-admin/add-ons"
    },
    {
      label: "Pemetaan Status Client",
      icon: MapPin,
      path: "/system-admin/client-status-mapping",
      active: location === "/system-admin/client-status-mapping"
    },
    {
      label: "Pengaturan Free Trial",
      icon: Clock,
      path: "/system-admin/trial-settings",
      active: location === "/system-admin/trial-settings"
    },
    {
      label: "Database",
      icon: Database,
      path: "/system-admin/database",
      active: location === "/system-admin/database"
    },
    {
      label: "Keamanan",
      icon: Shield,
      path: "/system-admin/security",
      active: location === "/system-admin/security"
    },
    {
      label: "Notifikasi Sistem",
      icon: Bell,
      path: "/system-admin/notifications",
      active: location === "/system-admin/notifications"
    },
    {
      label: "Pengaturan Sistem",
      icon: Settings,
      path: "/system-admin/settings",
      active: location === "/system-admin/settings"
    }
  ];

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
        "fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:z-auto"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">System Admin</span>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-800 text-gray-300"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <button 
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                        item.active
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                      onClick={onClose}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* System Info */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-3">
              <div>Environment: Production</div>
              <div>Version: 2.1.0</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}