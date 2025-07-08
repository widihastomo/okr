import React from "react";
import { cn } from "@/lib/utils";

// Additional mascot animations and states
export const MascotFloatingAnimation: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("animate-bounce", className)} style={{
    animation: "float 3s ease-in-out infinite",
  }}>
    {children}
    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `}</style>
  </div>
);

export const MascotPulseAnimation: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("animate-pulse", className)}>
    {children}
  </div>
);

export const MascotWaveAnimation: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn(className)} style={{
    animation: "wave 2s ease-in-out infinite",
  }}>
    {children}
    <style jsx>{`
      @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(10deg); }
        75% { transform: rotate(-10deg); }
      }
    `}</style>
  </div>
);

export const MascotSparkleEffect: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("absolute inset-0 pointer-events-none", className)}>
    <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" 
         style={{ animationDelay: "0s" }} />
    <div className="absolute top-1/4 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" 
         style={{ animationDelay: "0.5s" }} />
    <div className="absolute bottom-1/4 left-0 w-1 h-1 bg-yellow-500 rounded-full animate-ping" 
         style={{ animationDelay: "1s" }} />
    <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" 
         style={{ animationDelay: "1.5s" }} />
  </div>
);

// Contextual help tooltips that appear near the mascot
export const MascotTooltip: React.FC<{ 
  message: string; 
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}> = ({ message, position = "top", className }) => {
  const positionClasses = {
    top: "-top-12 left-1/2 transform -translate-x-1/2",
    bottom: "-bottom-12 left-1/2 transform -translate-x-1/2",
    left: "-left-32 top-1/2 transform -translate-y-1/2",
    right: "-right-32 top-1/2 transform -translate-y-1/2",
  };

  return (
    <div className={cn(
      "absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded-md shadow-lg",
      "animate-in fade-in-0 zoom-in-95 duration-200",
      positionClasses[position],
      className
    )}>
      {message}
      <div className={cn(
        "absolute w-2 h-2 bg-gray-800 transform rotate-45",
        position === "top" && "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
        position === "bottom" && "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
        position === "left" && "left-full top-1/2 -translate-x-1/2 -translate-y-1/2",
        position === "right" && "right-full top-1/2 translate-x-1/2 -translate-y-1/2"
      )} />
    </div>
  );
};

// Mascot celebration confetti effect
export const MascotConfetti: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 rounded-full animate-ping"
        style={{
          backgroundColor: ["#fbbf24", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"][i % 5],
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: "1.5s",
        }}
      />
    ))}
  </div>
);