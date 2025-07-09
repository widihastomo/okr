import { cn } from "@/lib/utils";

interface SkeletonLoadingProps {
  className?: string;
  shape?: "text" | "card" | "avatar" | "button";
}

export function SkeletonLoading({ className, shape = "text" }: SkeletonLoadingProps) {
  const baseStyles = "animate-pulse bg-gray-200 rounded";
  
  const shapeStyles = {
    text: "h-4 w-full",
    card: "h-24 w-full",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24"
  };

  return (
    <div className={cn(baseStyles, shapeStyles[shape], className)} />
  );
}