import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import HabitAlignmentWizard from "./habit-alignment-wizard";

interface OneClickHabitButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export default function OneClickHabitButton({ 
  variant = "default", 
  size = "default",
  className = ""
}: OneClickHabitButtonProps) {
  return (
    <HabitAlignmentWizard
      trigger={
        <Button 
          variant={variant}
          size={size}
          className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ${className}`}
        >
          <Zap className="h-4 w-4 mr-2" />
          One-Click Habits
        </Button>
      }
    />
  );
}