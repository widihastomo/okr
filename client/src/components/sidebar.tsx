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
  X,
  Trophy,
  Calendar,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  const menuItems = [
    {
      label: "Beranda",
      icon: LayoutDashboard,
      path: "/",
      active: location === "/" || location === "/"
    },
    {
      label: "Daily Focus",
      icon: Calendar,
      path: "/daily-focus",
      active: location === "/daily-focus"
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
      label: "Pengguna",
      icon: Users,
      path: "/users",
      active: location === "/users"
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
      label: "Harga",
      icon: CreditCard,
      path: "/pricing",
      active: location === "/pricing"
    },

  ];

  return (
    <TooltipProvider>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40",
          // Mobile: completely hidden when closed, full width when open
          isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0",
          // Desktop: always visible, width changes
          "lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0",
          !isOpen && "lg:w-16"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header spacer */}
          <div className="h-16 border-b border-gray-200">
          </div>
          
          {/* Navigation Menu */}
          <nav className={cn(
            "flex-1 py-4 space-y-1 transition-all duration-300",
            isOpen ? "px-4" : "px-2 lg:px-2"
          )}>
            {menuItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/" && location.startsWith(item.path));
              
              if (isOpen) {
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors space-x-3 px-3 py-2",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
              
              // Collapsed state with tooltip (desktop only)
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.path}
                      className={cn(
                        "hidden lg:flex lg:items-center lg:justify-center lg:rounded-lg lg:text-sm lg:font-medium lg:transition-colors lg:px-2 lg:py-3",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={onClose}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>


        </div>
      </div>
    </TooltipProvider>
  );
}