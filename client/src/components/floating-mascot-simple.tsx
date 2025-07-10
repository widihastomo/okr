import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ChevronDown, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple SVG Mascot Component
interface SimpleMascotProps {
  state: "welcome" | "encouraging" | "thinking" | "waving";
  size?: number;
}

const SimpleMascot: React.FC<SimpleMascotProps> = ({ state, size = 48 }) => {
  const getColor = () => {
    switch (state) {
      case "welcome": return "#3B82F6"; // Blue
      case "encouraging": return "#10B981"; // Green
      case "thinking": return "#F59E0B"; // Yellow
      case "waving": return "#8B5CF6"; // Purple
      default: return "#3B82F6";
    }
  };

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300",
        state === "waving" && "animate-bounce"
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="drop-shadow-sm"
      >
        {/* Body */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill={getColor()}
          className="transition-all duration-300"
        />
        
        {/* Eyes */}
        <circle cx="42" cy="42" r="3" fill="white" />
        <circle cx="58" cy="42" r="3" fill="white" />
        <circle cx="42" cy="42" r="1.5" fill="#1F2937" />
        <circle cx="58" cy="42" r="1.5" fill="#1F2937" />
        
        {/* Mouth based on state */}
        {state === "welcome" && (
          <path d="M 40 55 Q 50 65 60 55" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {state === "encouraging" && (
          <path d="M 38 55 Q 50 68 62 55" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {state === "thinking" && (
          <ellipse cx="50" cy="58" rx="4" ry="2" fill="white" />
        )}
        {state === "waving" && (
          <path d="M 40 55 Q 50 65 60 55" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        
        {/* Thinking bubbles */}
        {state === "thinking" && (
          <>
            <circle cx="70" cy="30" r="2" fill={getColor()} opacity="0.6" />
            <circle cx="78" cy="22" r="3" fill={getColor()} opacity="0.4" />
            <circle cx="85" cy="15" r="4" fill={getColor()} opacity="0.2" />
          </>
        )}
      </svg>
    </div>
  );
};

// Contextual tips based on current page/state
const getContextualTips = () => {
  const pathname = window.location.pathname;
  
  if (pathname === "/dashboard" || pathname === "/") {
    return [
      {
        message: "Mulai dengan membuat objective pertama Anda. Objective yang baik adalah spesifik dan dapat diukur!",
        action: "Buat Objective"
      },
      {
        message: "Gunakan template OKR untuk memulai dengan cepat. Template sudah disesuaikan dengan best practices!",
        action: "Lihat Template"
      }
    ];
  }
  
  if (pathname === "/analytics") {
    return [
      {
        message: "Analytics menunjukkan progress tim Anda. Pantau metrics yang paling penting untuk kesuksesan!",
        action: "Explore Metrics"
      }
    ];
  }
  
  return [
    {
      message: "Selamat datang di platform OKR! Mari mulai dengan membuat objective pertama Anda.",
      action: "Mulai Sekarang"
    }
  ];
};

interface FloatingMascotProps {
  className?: string;
}

export const FloatingMascot: React.FC<FloatingMascotProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mascotState, setMascotState] = useState<"welcome" | "encouraging" | "thinking" | "waving">("welcome");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const tips = getContextualTips();
  const currentTip = tips[currentTipIndex];
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycle through mascot states
  useEffect(() => {
    const states: Array<"welcome" | "encouraging" | "thinking" | "waving"> = 
      ["welcome", "encouraging", "thinking", "waving"];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
      setMascotState(states[currentIndex]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle tips
  useEffect(() => {
    if (tips.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [tips.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!isVisible) return null;

  return (
    <div className={cn("fixed z-50", className)}>
      {isVisible && (
        <div
          ref={containerRef}
          className="fixed"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1000,
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
              <div className="p-4">
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
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingMascot;