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
  Goal,
  Database,
  Bell,
  Lock
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
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { isOwner } = useOrganization();
  const { user } = useAuth();
  
  // Check if user is system owner
  const isSystemOwner = (user as any)?.isSystemOwner || false;

  // Different menu items for system owners vs regular users
  const systemOwnerMenuItems = [
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
      path: "/user-management",
      active: location === "/user-management"
    },
    {
      label: "Kelola Langganan",
      icon: CreditCard,
      path: "/system-admin/subscriptions",
      active: location === "/system-admin/subscriptions"
    },
    {
      label: "Database",
      icon: Database,
      path: "/system-admin/database",
      active: location === "/system-admin/database"
    },
    {
      label: "Keamanan",
      icon: Lock,
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

  const regularUserMenuItems = [
    {
      label: "Daily Focus",
      icon: Sun,
      path: "/",
      active: location === "/" || location === "/daily-focus"
    },
    {
      label: "Goals",
      icon: Target,
      path: "/dashboard",
      active: location === "/dashboard"
    },
    {
      label: "Goals Perusahaan",
      icon: Building2,
      path: "/company-okr",
      active: location === "/company-okr"
    },
    {
      label: "Siklus",
      icon: RotateCcw,
      path: "/cycles",
      active: location === "/cycles"
    },
    {
      label: "Template",
      icon: FileText,
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
      icon: Goal,
      path: "/network",
      active: location === "/network"
    },
    {
      label: "Harga",
      icon: CreditCard,
      path: "/pricing",
      active: location === "/pricing"
    }
  ];

  // Add organization management items for organization owners
  if (isOwner && !isSystemOwner) {
    regularUserMenuItems.push(
      {
        label: "Pengaturan Organisasi",
        icon: Settings,
        path: "/organization-settings",
        active: location === "/organization-settings"
      },
      {
        label: "Kelola Pengguna",
        icon: Users,
        path: "/client-users",
        active: location === "/client-users"
      },
      {
        label: "Kelola Role",
        icon: Shield,
        path: "/role-management",
        active: location === "/role-management"
      }
    );
  }

  // Choose menu items based on user type
  const menuItems = isSystemOwner ? systemOwnerMenuItems : regularUserMenuItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-30",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
                        : "text-gray-700 hover:bg-gray-100"
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

        {/* Profile section at bottom */}
        <div className="border-t border-gray-200 p-4">
          <Link href="/profile">
            <button 
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                location === "/profile"
                  ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={onClose}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}