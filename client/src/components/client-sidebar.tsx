import React from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Target,
  Calendar,
  BarChart3,
  Trophy,
  Network,
  Bell,
  Settings,
  Users,
  Shield,
  CreditCard,
  LogOut,
  Menu,
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
      label: "Goals",
      icon: Target,
      path: "/",
      active: location === "/",
    },
    {
      label: "Daily Focus",
      icon: Calendar,
      path: "/daily-focus",
      active: location === "/daily-focus",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/analytics",
      active: location === "/analytics",
    },
    {
      label: "Achievements",
      icon: Trophy,
      path: "/achievements",
      active: location === "/achievements",
    },
    {
      label: "Jaringan Goal",
      icon: Network,
      path: "/network",
      active: location === "/network",
    },
  ];

  // Add organization management for owners only
  if (isOwner) {
    menuItems.push(
      {
        label: "Pengaturan Organisasi",
        icon: Settings,
        path: "/organization-settings",
        active: location === "/organization-settings",
      },
      {
        label: "Kelola Pengguna",
        icon: Users,
        path: "/client-users",
        active: location === "/client-users",
      },
      {
        label: "Kelola Role",
        icon: Shield,
        path: "/role-management",
        active: location === "/role-management",
      },
      {
        label: "Paket Berlangganan",
        icon: CreditCard,
        path: "/pricing",
        active: location === "/pricing",
      },
    );
  }

  // Add notification settings for all users
  menuItems.push({
    label: "Pengaturan Notifikasi",
    icon: Bell,
    path: "/notification-settings",
    active: location === "/notification-settings",
  });

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
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                OKR Platform
              </span>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
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
                          ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                          : "text-gray-700 hover:bg-gray-100",
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

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
