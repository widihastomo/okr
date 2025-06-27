import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {

  

  return (
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
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-10",
          // Mobile: completely hidden when closed, full width when open
          isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0",
          // Desktop: always visible, width changes
          "lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0",
          !isOpen && "lg:w-16"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header spacer */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            {isOpen ? (
              <div className="text-sm font-medium text-gray-600">OKR Manager</div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">OK</span>
              </div>
            )}
          </div>
          
          


        </div>
      </div>
    </div>
  );
}