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
  User
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
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-30",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:top-0 lg:h-[calc(100vh-4rem)]",
          isOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-3 py-2 h-10 font-medium text-sm",
                      item.active
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Profile Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Profile</p>
                <p className="text-xs text-gray-500">Kelola profil Anda</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}