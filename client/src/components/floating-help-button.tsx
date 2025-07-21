import { HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function FloatingHelpButton() {
  const [location] = useLocation();
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/help">
            <Button
              size="lg"
              className={cn(
                "rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200",
                location === "/help"
                  ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-orange-300"
              )}
            >
              <HelpCircle className="w-6 h-6" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Help & Support</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}