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
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function ClientSidebar({ isOpen, onClose }: ClientSidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { isOwner } = useOrganization();
  const { state: sidebarState } = useSidebar();

  // Menu items for client users (normal OKR application users)
  const menuItems = [
    {
      label: "Goals",
      icon: Target,
      path: "/",
      active: location === "/"
    },
    {
      label: "Daily Focus",
      icon: Calendar,
      path: "/daily-focus",
      active: location === "/daily-focus"
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/analytics",
      active: location === "/analytics"
    },
    {
      label: "Achievements",
      icon: Trophy,
      path: "/achievements",
      active: location === "/achievements"
    },
    {
      label: "Jaringan Goal",
      icon: Network,
      path: "/network",
      active: location === "/network"
    }
  ];

  // Add organization management for owners only
  if (isOwner) {
    menuItems.push(
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
      },
      {
        label: "Paket Berlangganan",
        icon: CreditCard,
        path: "/pricing",
        active: location === "/pricing"
      }
    );
  }

  // Add notification settings for all users
  menuItems.push({
    label: "Pengaturan Notifikasi",
    icon: Bell,
    path: "/notification-settings",
    active: location === "/notification-settings"
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isCollapsed = sidebarState === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white">
                  <Target className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">OKR Platform</span>
                  <span className="truncate text-xs">Goal Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        asChild 
                        isActive={item.active}
                        className={cn(
                          item.active && "bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:bg-gradient-to-r hover:from-orange-700 hover:to-orange-600"
                        )}
                      >
                        <Link href={item.path}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" sideOffset={5}>
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="size-4" />
                  <span>Keluar</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={5}>
                  Keluar
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}