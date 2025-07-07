import * as React from "react"
import { Link, useLocation } from "wouter"
import {
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
  Database,
  User,
  Home,
  FileText,
  Lock
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [location] = useLocation()
  const { user, logout } = useAuth()
  const { isOwner } = useOrganization()

  // Check if user is system owner
  const isSystemOwner = (user as any)?.isSystemOwner

  // System owner menu items
  const systemOwnerMenuItems = [
    {
      title: "Dashboard Sistem",
      url: "/system-admin",
      icon: Home,
    },
    {
      title: "Kelola Organisasi",
      url: "/organization-management",
      icon: Settings,
    },

    {
      title: "Kelola Langganan",
      url: "/subscription-management",
      icon: CreditCard,
    },
    {
      title: "Database",
      url: "/database-management",
      icon: Database,
    },
    {
      title: "Keamanan",
      url: "/security-management",
      icon: Lock,
    },
    {
      title: "Notifikasi Sistem",
      url: "/system-notifications",
      icon: Bell,
    },
    {
      title: "Pengaturan Sistem",
      url: "/system-settings",
      icon: Settings,
    },
  ]

  // Client user menu items
  const clientMenuItems = [
    {
      title: "Daily Focus",
      url: "/daily-focus",
      icon: Calendar,
    },
    {
      title: "Goals",
      url: "/",
      icon: Target,
    },
    {
      title: "Goals Perusahaan",
      url: "/company-okr",
      icon: FileText,
    },
    {
      title: "Siklus",
      url: "/cycles",
      icon: Calendar,
    },
    {
      title: "Template",
      url: "/templates",
      icon: FileText,
    },
    {
      title: "Pencapaian",
      url: "/achievements",
      icon: Trophy,
    },
    {
      title: "Analitik",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Jaringan Goal",
      url: "/network",
      icon: Network,
    },
    {
      title: "Harga",
      url: "/pricing",
      icon: CreditCard,
    },
  ]

  // Add organization management for owners
  if (isOwner && !isSystemOwner) {
    clientMenuItems.push(
      {
        title: "Pengaturan Organisasi",
        url: "/organization-settings",
        icon: Settings,
      },
      {
        title: "Kelola Pengguna",
        url: "/client-users",
        icon: Users,
      },
      {
        title: "Kelola Role",
        url: "/role-management",
        icon: Shield,
      }
    )
  }

  // Add notification settings for all non-system users
  if (!isSystemOwner) {
    clientMenuItems.push({
      title: "Pengaturan Notifikasi",
      url: "/notification-settings",
      icon: Bell,
    })
  }

  const menuItems = isSystemOwner ? systemOwnerMenuItems : clientMenuItems

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-semibold">
            OK
          </div>
          <span className="truncate font-semibold">OKR Manager</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Avatar className="h-6 w-6">
                <AvatarImage src={(user as any)?.profileImageUrl} alt={user?.firstName || ""} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}