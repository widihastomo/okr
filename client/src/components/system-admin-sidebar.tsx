import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  RotateCcw,
  FileText,
  Receipt,
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
  Gift,
  Mail,
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
      active: location === "/system-admin",
    },
    {
      label: "Kelola Organisasi",
      icon: Building2,
      path: "/system-admin/organizations",
      active: location === "/system-admin/organizations",
    },
    {
      label: "Kelola Paket",
      icon: Package,
      path: "/subscription-packages",
      active: location === "/subscription-packages",
    },


    {
      label: "Pengaturan Aplikasi",
      icon: Settings,
      path: "/system-admin/application-settings",
      active: location === "/system-admin/application-settings",
    },
    {
      label: "Kelola Langganan",
      icon: CreditCard,
      path: "/system-admin/subscriptions",
      active: location === "/system-admin/subscriptions",
    },
    {
      label: "Kelola Add-Ons",
      icon: Package,
      path: "/system-admin/add-ons",
      active: location === "/system-admin/add-ons",
    },
    {
      label: "Kode Referral",
      icon: Gift,
      path: "/referral-codes",
      active: location === "/referral-codes",
    },
    {
      label: "Template Management",
      icon: FileText,
      path: "/system-admin/template-management",
      active: location === "/system-admin/template-management",
    },

    {
      label: "Pemetaan Status Client",
      icon: MapPin,
      path: "/system-admin/client-status-mapping",
      active: location === "/system-admin/client-status-mapping",
    },
    {
      label: "Database",
      icon: Database,
      path: "/system-admin/database",
      active: location === "/system-admin/database",
    },
    {
      label: "Keamanan",
      icon: Lock,
      path: "/system-admin/security",
      active: location === "/system-admin/security",
    },
    {
      label: "Notifikasi Sistem",
      icon: Bell,
      path: "/system-admin/notifications",
      active: location === "/system-admin/notifications",
    },
    {
      label: "Pengaturan Sistem",
      icon: Settings,
      path: "/system-admin/settings",
      active: location === "/system-admin/settings",
    },
  ];

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
      <TooltipProvider>
        <div
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30",
            // Mobile: slide in/out
            "lg:translate-x-0", // Desktop: always visible
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            // Desktop: collapsed/expanded width, Mobile: always full width when open
            isCollapsed ? "lg:w-16" : "lg:w-64",
            // Mobile: always full width when open
            "w-64",
          )}
        >
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const menuItem = (
                  <Link href={item.path}>
                    <button
                      className={cn(
                        "flex items-center rounded-lg text-sm font-medium transition-colors w-full text-left",
                        item.active
                          ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                          : "text-gray-700 hover:bg-gray-100",
                        // Desktop: collapsed = center, expanded = space between
                        // Mobile: always space between (show labels)
                        isCollapsed
                          ? "lg:px-3 lg:py-2 lg:justify-center px-3 py-2 space-x-3"
                          : "px-3 py-2 space-x-3",
                      )}
                      onClick={() => {
                        // Only close sidebar on mobile, don't affect desktop collapsed state
                        if (window.innerWidth < 1024) {
                          onClose?.();
                        }
                      }}
                    >
                      <item.icon className="flex-shrink-0 w-5 h-5" />
                      {/* Desktop: show label only when not collapsed, Mobile: always show label */}
                      <span
                        className={cn(
                          isCollapsed ? "lg:hidden" : "",
                          "truncate",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  </Link>
                );

                return (
                  <li key={item.path}>
                    {/* Show tooltip only on desktop when collapsed */}
                    {isCollapsed ? (
                      <div className="lg:block hidden">
                        <Tooltip>
                          <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      menuItem
                    )}
                    {/* On mobile, always show the menu item without tooltip */}
                    <div className="lg:hidden">{menuItem}</div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Profile section at bottom */}
          <div className="border-t border-gray-200 p-2">
            {/* Desktop: show tooltip when collapsed */}
            {isCollapsed && (
              <div className="lg:block hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/profile">
                      <button
                        className={cn(
                          "flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
                          location === "/profile"
                            ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                            : "text-gray-700 hover:bg-gray-100",
                        )}
                        onClick={() => {
                          // Only close sidebar on mobile, don't affect desktop collapsed state
                          if (window.innerWidth < 1024) {
                            onClose?.();
                          }
                        }}
                      >
                        <User className="w-5 h-5" />
                      </button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Profile</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Desktop: show expanded when not collapsed, Mobile: always show expanded */}
            <div className={cn(isCollapsed ? "lg:hidden" : "")}>
              <Link href="/profile">
                <button
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                    location === "/profile"
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                  onClick={() => {
                    // Only close sidebar on mobile, don't affect desktop collapsed state
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}