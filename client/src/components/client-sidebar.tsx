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
  Gift,
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

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
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
      label: "Kelola Invoice",
      icon: Receipt,
      path: "/invoices",
      active: location === "/invoices" || location.startsWith("/invoices/"),
    },
    // Referral codes menu is moved to system admin only - removed from general menu
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

  const regularUserMenuItems = [
    {
      label: "Daily Focus",
      icon: Sun,
      path: "/",
      active: location === "/" || location === "/daily-focus",
    },
    {
      label: "Goals",
      icon: Target,
      path: "/dashboard",
      active: location === "/dashboard",
    },
    {
      label: "Goals Perusahaan",
      icon: Building2,
      path: "/company-okr",
      active: location === "/company-okr",
    },
    {
      label: "Siklus",
      icon: RotateCcw,
      path: "/cycles",
      active: location === "/cycles",
    },
    {
      label: "Template",
      icon: FileText,
      path: "/templates",
      active: location === "/templates",
    },
    {
      label: "Pencapaian",
      icon: Trophy,
      path: "/achievements",
      active: location === "/achievements",
    },
    {
      label: "Analitik",
      icon: BarChart3,
      path: "/analytics",
      active: location === "/analytics",
    },

    {
      label: "Harga",
      icon: CreditCard,
      path: "/pricing",
      active: location === "/pricing",
    },
    {
      label: "Add-Ons",
      icon: Package,
      path: "/add-ons",
      active: location === "/add-ons",
    },
  ];

  // Add organization management items for organization owners
  if (isOwner && !isSystemOwner) {
    regularUserMenuItems.push({
      label: "Kelola Pengguna",
      icon: Users,
      path: "/client-users",
      active: location === "/client-users",
    });
    regularUserMenuItems.push({
      label: "Invoice",
      icon: Receipt,
      path: "/invoices",
      active: location === "/invoices" || location.startsWith("/invoices/"),
    });
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
