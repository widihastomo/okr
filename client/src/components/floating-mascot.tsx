import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  MessageCircle,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Star,
  Target,
  Trophy,
  Lightbulb,
  Zap,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import the mascot character from trial-mascot
import { MascotFloatingAnimation, MascotSparkleEffect, MascotTooltip } from "./mascot-animations";

type MascotState = "welcome" | "encouraging" | "celebrating" | "thinking" | "waving" | "pointing" | "sleeping" | "excited";

interface FloatingMascotProps {
  className?: string;
}

// Contextual tips based on current page
const getPageContextualTips = (pathname: string, achievements: any[], trialStatus: any) => {
  const completedCount = achievements.filter(a => a.unlocked).length;
  const progressPercentage = achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0;
  
  const baseTips = {
    "/": [
      {
        state: "welcome" as MascotState,
        message: "Selamat datang di Daily Focus! Ini adalah pusat kendali harian Anda.",
        action: "Mulai Tour",
        priority: 1,
      },
      {
        state: "pointing" as MascotState,
        message: "Coba lihat panduan onboarding di bawah untuk memulai!",
        action: "Lihat Panduan",
        priority: 2,
      },
    ],
    "/dashboard": [
      {
        state: "encouraging" as MascotState,
        message: "Halaman Goals adalah tempat Anda mengelola semua objective!",
        action: "Buat Objective",
        priority: 1,
      },
      {
        state: "thinking" as MascotState,
        message: "Tip: Gunakan template untuk membuat objective yang lebih terstruktur.",
        action: "Lihat Template",
        priority: 2,
      },
    ],
    "/analytics": [
      {
        state: "excited" as MascotState,
        message: "Analytics membantu Anda memahami performa tim secara mendalam!",
        action: "Pelajari Metric",
        priority: 1,
      },
    ],
    "/pricing": [
      {
        state: "celebrating" as MascotState,
        message: "Upgrade ke premium untuk fitur advanced dan tim yang lebih besar!",
        action: "Lihat Paket",
        priority: 1,
      },
    ],
    "/client-users": [
      {
        state: "encouraging" as MascotState,
        message: "Menambahkan anggota tim akan meningkatkan kolaborasi!",
        action: "Undang Member",
        priority: 1,
      },
    ],
  };

  const currentTips = baseTips[pathname] || [];
  
  // Add progress-based tips
  if (progressPercentage < 20) {
    currentTips.push({
      state: "pointing" as MascotState,
      message: "Anda baru memulai! Ikuti panduan step-by-step untuk hasil maksimal.",
      action: "Ke Daily Focus",
      priority: 0,
    });
  } else if (progressPercentage > 80) {
    currentTips.push({
      state: "celebrating" as MascotState,
      message: "Luar biasa! Anda sudah hampir menguasai semua fitur!",
      action: "Lihat Pencapaian",
      priority: 0,
    });
  }

  return currentTips.sort((a, b) => a.priority - b.priority);
};

// Simple SVG mascot for floating version
const SimpleMascot: React.FC<{ state: MascotState; size?: number }> = ({ state, size = 40 }) => {
  const getColor = () => {
    switch (state) {
      case "celebrating": return "#10b981";
      case "encouraging": return "#3b82f6";
      case "thinking": return "#8b5cf6";
      case "excited": return "#ef4444";
      case "sleeping": return "#6b7280";
      default: return "#f59e0b";
    }
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 60 60" width={size} height={size} className="drop-shadow-md">
        {/* Body */}
        <circle cx="30" cy="40" r="12" fill={getColor()} />
        {/* Head */}
        <circle cx="30" cy="25" r="15" fill={getColor()} />
        {/* Eyes */}
        <circle cx="25" cy="22" r="2" fill="white" />
        <circle cx="35" cy="22" r="2" fill="white" />
        <circle cx="25" cy="22" r="1" fill="black" />
        <circle cx="35" cy="22" r="1" fill="black" />
        {/* Mouth */}
        <path
          d={state === "celebrating" ? "M 22 28 Q 30 35 38 28" :
              state === "sleeping" ? "M 25 28 Q 30 30 35 28" :
              "M 24 28 Q 30 32 36 28"}
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Arms */}
        <circle cx="15" cy="35" r="4" fill={getColor()} />
        <circle cx="45" cy="35" r="4" fill={getColor()} />
      </svg>
      
      {state === "celebrating" && (
        <MascotSparkleEffect className="absolute inset-0" />
      )}
      
      {state === "sleeping" && (
        <div className="absolute -top-1 -right-1">
          <div className="text-xs animate-pulse">💤</div>
        </div>
      )}
    </div>
  );
};

export default function FloatingMascot({ className }: FloatingMascotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>("welcome");
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");
  
  const dragRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { user } = useAuth();

  // Fetch trial data - always call hooks first
  const { data: trialStatus } = useQuery({
    queryKey: ["/api/trial-status"],
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/trial-achievements"],
  });

  // Get contextual tips based on current page
  const tips = getPageContextualTips(location, achievements, trialStatus);
  const currentTip = tips[currentTipIndex] || tips[0];

  // Auto-cycle through tips
  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 10000); // Change tip every 10 seconds
      return () => clearInterval(interval);
    }
  }, [tips.length]);

  // Update mascot state based on current tip
  useEffect(() => {
    if (currentTip) {
      setMascotState(currentTip.state);
    }
  }, [currentTip]);

  // Show contextual tooltips
  useEffect(() => {
    if (currentTip && !isMinimized && !isExpanded) {
      const timer = setTimeout(() => {
        setTooltipMessage(currentTip.message);
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 4000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTip, isMinimized, isExpanded, currentTipIndex]);

  // Auto-minimize after inactivity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
        setIsMinimized(true);
      }, 15000); // Auto-minimize after 15 seconds
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Hide on certain pages when user is advanced
  useEffect(() => {
    const hideOnPages = ["/system-admin", "/organization-settings"];
    const completedPercentage = achievements.length > 0 ? (achievements.filter(a => a.unlocked).length / achievements.length) * 100 : 0;
    
    if (hideOnPages.includes(location) && completedPercentage > 70) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [location, achievements]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const handleMouseMove = (e: MouseEvent) => {
        const newRight = window.innerWidth - e.clientX + offsetX;
        const newBottom = window.innerHeight - e.clientY + offsetY;
        
        setPosition({
          right: Math.max(20, Math.min(newRight, window.innerWidth - 100)),
          bottom: Math.max(20, Math.min(newBottom, window.innerHeight - 100)),
        });
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  // Check if component should render
  const shouldHide = (user as any)?.isSystemOwner || location === "/onboarding" || !isVisible || !currentTip;
  
  if (shouldHide) {
    return null;
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        bottom: position.bottom,
        right: position.right,
      }}
    >
      {/* Minimized state - just the mascot */}
      {isMinimized && (
        <div className="relative">
          <MascotFloatingAnimation>
            <button
              onClick={() => {
                setIsMinimized(false);
                setIsExpanded(true);
              }}
              onMouseDown={handleMouseDown}
              className="p-2 bg-white rounded-full shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-colors duration-200 cursor-grab active:cursor-grabbing"
            >
              <SimpleMascot state={mascotState} size={32} />
            </button>
          </MascotFloatingAnimation>
          
          {showTooltip && (
            <MascotTooltip
              message={tooltipMessage}
              position="left"
              className="whitespace-nowrap max-w-xs"
            />
          )}
        </div>
      )}

      {/* Expanded state - full card */}
      {!isMinimized && (
        <Card className="w-80 max-w-sm bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div onMouseDown={handleMouseDown} className="cursor-grab active:cursor-grabbing">
                  <SimpleMascot state={mascotState} size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 text-sm">Orby</h3>
                  <p className="text-xs text-blue-600 truncate">Virtual Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:bg-gray-100"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Settings panel */}
            {showSettings && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Sound Effects</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Current tip */}
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 leading-relaxed">
                  {currentTip.message}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs h-8"
                  onClick={() => {
                    // Handle tip actions
                    const action = currentTip.action;
                    console.log("Floating mascot button clicked with action:", action);
                    
                    if (action.includes("Daily Focus") || action.includes("Ke Daily")) {
                      window.location.href = "/";
                    } else if (action.includes("Template") || action.includes("Lihat Template")) {
                      window.location.href = "/templates";
                    } else if (action.includes("Objective") || action.includes("Buat Objective")) {
                      window.location.href = "/dashboard";
                    } else if (action.includes("Analytics") || action.includes("Pelajari Metric")) {
                      window.location.href = "/analytics";
                    } else if (action.includes("Paket") || action.includes("Lihat Paket")) {
                      window.location.href = "/pricing";
                    } else if (action.includes("Panduan") || action.includes("Lihat Panduan")) {
                      document.querySelector('[data-testid="onboarding-missions"]')?.scrollIntoView({ behavior: 'smooth' });
                    } else if (action.includes("Tour") || action.includes("Mulai Tour")) {
                      document.querySelector('[data-testid="onboarding-missions"]')?.scrollIntoView({ behavior: 'smooth' });
                    } else if (action.includes("Member") || action.includes("Undang Member")) {
                      window.location.href = "/client-users";
                    } else if (action.includes("Pencapaian") || action.includes("Lihat Pencapaian")) {
                      window.location.href = "/trial-achievements";
                    } else {
                      // Default action - go to dashboard
                      window.location.href = "/dashboard";
                    }
                  }}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  {currentTip.action}
                </Button>
                
                {tips.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                    onClick={() => setCurrentTipIndex((prev) => (prev + 1) % tips.length)}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Tip indicators */}
              {tips.length > 1 && (
                <div className="flex justify-center gap-1">
                  {tips.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        index === currentTipIndex
                          ? "bg-blue-500"
                          : "bg-blue-200 hover:bg-blue-300"
                      )}
                      onClick={() => setCurrentTipIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}