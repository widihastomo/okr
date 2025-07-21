import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TourRestartButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export default function TourRestartButton({
  variant = "outline",
  size = "sm",
  className = "",
  showIcon = true,
  text = "Ulangi Tour"
}: TourRestartButtonProps) {
  const { toast } = useToast();

  const handleRestartTour = () => {
    // Reset tour completion flag
    localStorage.removeItem("tour-completed");
    localStorage.removeItem("welcome-screen-shown");
    
    // Dispatch event to restart tour
    const restartTourEvent = new CustomEvent('startTourDirect', {
      detail: { fromRestartButton: true }
    });
    window.dispatchEvent(restartTourEvent);
    
    toast({
      title: "Tour dimulai ulang",
      description: "Tutorial interaktif akan dimulai dari awal",
      variant: "default",
    });
    
    console.log("🔄 Tour restarted manually");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRestartTour}
      className={className}
    >
      {showIcon && <RotateCcw className="h-4 w-4 mr-2" />}
      {text}
    </Button>
  );
}

// Floating restart tour button component
export function FloatingTourRestartButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <TourRestartButton
        variant="default"
        size="default"
        className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
        text="Ulangi Tour"
      />
    </div>
  );
}

// Compact restart button for help menu
export function CompactTourRestartButton() {
  return (
    <TourRestartButton
      variant="ghost"
      size="sm"
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
      showIcon={true}
      text="Mulai Tour"
    />
  );
}