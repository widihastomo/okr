import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Settings,
  Minimize2,
  X,
  ArrowRight,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";

type MascotState = "welcome" | "encouraging" | "celebrating" | "thinking" | "waving" | "pointing" | "sleeping" | "excited";

interface FloatingMascotProps {
  className?: string;
}

// Simplified mascot SVG component
const SimpleMascot: React.FC<{ state: MascotState; size?: number }> = ({ state, size = 40 }) => {
  const getColor = () => {
    switch (state) {
      case "celebrating": return "#10b981";
      case "encouraging": return "#f59e0b";
      case "thinking": return "#8b5cf6";
      case "excited": return "#ef4444";
      default: return "#3b82f6";
    }
  };

  return (
    <div className={cn("relative inline-block", `w-${size/4} h-${size/4}`)}>
      <svg width={size} height={size} viewBox="0 0 60 60" className="animate-bounce-gentle">
        <circle cx="30" cy="30" r="25" fill={getColor()} opacity="0.2" />
        <circle cx="30" cy="30" r="20" fill={getColor()} />
        <circle cx="25" cy="25" r="2" fill="white" />
        <circle cx="35" cy="25" r="2" fill="white" />
        <path d="M 20 35 Q 30 45 40 35" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="15" cy="35" r="4" fill={getColor()} />
        <circle cx="45" cy="35" r="4" fill={getColor()} />
      </svg>
    </div>
  );
};

// Simplified floating mascot component
export default function FloatingMascot({ className }: FloatingMascotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>("welcome");
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { user } = useAuth();

  // Fetch trial data
  const { data: trialStatus } = useQuery({
    queryKey: ["/api/trial-status"],
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/trial/achievements"],
  });

  // Simple tips array
  const tips = [
    {
      message: "Selamat datang di platform OKR! Mari mulai dengan membuat objective pertama Anda.",
      action: "Mulai Sekarang",
      state: "welcome" as MascotState
    },
    {
      message: "Gunakan template yang sudah disediakan untuk mempercepat pembuatan OKR Anda.",
      action: "Lihat Template",
      state: "encouraging" as MascotState
    },
    {
      message: "Pantau progress tim Anda dengan fitur analytics yang tersedia.",
      action: "Lihat Analytics",
      state: "thinking" as MascotState
    }
  ];

  const currentTip = tips[currentTipIndex] || tips[0];

  // Auto-cycle through tips
  useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  // Update mascot state based on current tip
  useEffect(() => {
    if (currentTip) {
      setMascotState(currentTip.state);
    }
  }, [currentTip]);

  // Hide on certain pages
  useEffect(() => {
    const hideOnPages = ["/system-admin", "/onboarding"];
    if (hideOnPages.includes(location)) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [location]);

  // Simple drag functionality
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

  // Check if should render
  const shouldHide = (user as any)?.isSystemOwner || !isVisible || !currentTip;

  return (
    <div>
      {!shouldHide && (
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
          {/* Minimized state */}
          {isMinimized && (
            <div className="relative">
              <button
                onClick={() => setIsMinimized(false)}
                onMouseDown={handleMouseDown}
                className="p-2 bg-white rounded-full shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-colors duration-200 cursor-grab active:cursor-grabbing"
              >
                <SimpleMascot state={mascotState} size={32} />
              </button>
            </div>
          )}

          {/* Expanded state */}
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
                        // Simple navigation
                        if (currentTip.action.includes("Template")) {
                          window.location.href = "/templates";
                        } else if (currentTip.action.includes("Analytics")) {
                          window.location.href = "/analytics";
                        } else {
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
      )}
    </div>
  );
}