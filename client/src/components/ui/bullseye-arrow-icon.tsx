import React from "react";
import { cn } from "@/lib/utils";

interface BullseyeArrowIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BullseyeArrowIcon: React.FC<BullseyeArrowIconProps> = ({
  className,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Middle circle */}
      <circle cx="12" cy="12" r="6" />
      {/* Inner circle (bullseye center) */}
      <circle cx="12" cy="12" r="2" />
      {/* Arrow hitting the target */}
      <path d="M6 6l6 6" />
      <path d="M6 6l3 0" />
      <path d="M6 6l0 3" />
    </svg>
  );
};

export default BullseyeArrowIcon;