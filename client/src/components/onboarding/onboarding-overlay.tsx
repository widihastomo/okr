import React, { useEffect, useState } from "react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, ArrowRight, SkipForward, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipPosition {
  top: number;
  left: number;
  placement: "top" | "bottom" | "left" | "right";
}

export const OnboardingOverlay: React.FC = () => {
  const {
    isOnboardingActive,
    currentTour,
    currentStep,
    currentStepIndex,
    nextStep,
    prevStep,
    skipStep,
    completeTour,
    skipTour,
    showTooltip,
    hideTooltip
  } = useOnboarding();

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  // Calculate tooltip position based on target element
  useEffect(() => {
    if (isOnboardingActive && currentStep?.target) {
      const updatePosition = () => {
        const element = document.querySelector(currentStep.target!);
        if (element) {
          const rect = element.getBoundingClientRect();
          const placement = currentStep.position || "bottom";
          
          let top = 0;
          let left = 0;

          switch (placement) {
            case "top":
              top = rect.top - 10;
              left = rect.left + rect.width / 2;
              break;
            case "bottom":
              top = rect.bottom + 10;
              left = rect.left + rect.width / 2;
              break;
            case "left":
              top = rect.top + rect.height / 2;
              left = rect.left - 10;
              break;
            case "right":
              top = rect.top + rect.height / 2;
              left = rect.right + 10;
              break;
          }

          setTooltipPosition({ top, left, placement });
          showTooltip(currentStep);
        }
      };

      // Update position after a short delay to ensure DOM is ready
      setTimeout(updatePosition, 100);
      
      // Update on window resize
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    } else {
      setTooltipPosition(null);
      hideTooltip();
    }
  }, [isOnboardingActive, currentStep, showTooltip, hideTooltip]);

  if (!isOnboardingActive || !currentTour || !currentStep) {
    return null;
  }

  const progress = ((currentStepIndex + 1) / currentTour.steps.length) * 100;

  // Render center modal for steps without target
  if (!currentStep.target || !tooltipPosition) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {currentTour.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="text-lg">{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{currentStepIndex + 1} dari {currentTour.steps.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Custom content */}
            {currentStep.content && (
              <div className="py-2">
                {currentStep.content}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-2">
              <div className="flex gap-2">
                {currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </Button>
                )}
                
                {currentStep.canSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipStep}
                    className="flex items-center gap-1"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={nextStep}
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 flex items-center gap-1"
                >
                  {currentStepIndex === currentTour.steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Selesai
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render positioned tooltip
  const tooltipClass = cn(
    "fixed z-[9999] bg-white rounded-lg shadow-2xl border p-4 max-w-sm",
    {
      "transform -translate-x-1/2": tooltipPosition.placement === "top" || tooltipPosition.placement === "bottom",
      "transform -translate-y-1/2": tooltipPosition.placement === "left" || tooltipPosition.placement === "right",
      "transform -translate-x-full -translate-y-1/2": tooltipPosition.placement === "left",
      "transform -translate-y-1/2": tooltipPosition.placement === "right",
      "transform -translate-x-1/2 -translate-y-full": tooltipPosition.placement === "top",
    }
  );

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/30 z-[9998] pointer-events-none" />
      
      {/* Tooltip */}
      <div
        className={tooltipClass}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Tooltip arrow */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-white border rotate-45",
            {
              "top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0": tooltipPosition.placement === "top",
              "bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0": tooltipPosition.placement === "bottom",
              "top-1/2 left-full transform -translate-x-1/2 -translate-y-1/2 border-t-0 border-r-0": tooltipPosition.placement === "left",
              "top-1/2 right-full transform translate-x-1/2 -translate-y-1/2 border-b-0 border-l-0": tooltipPosition.placement === "right",
            }
          )}
        />

        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {currentStepIndex + 1}/{currentTour.steps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{currentStep.title}</h3>
            <p className="text-sm text-gray-600">{currentStep.description}</p>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1" />

          {/* Navigation */}
          <div className="flex justify-between gap-2">
            <div className="flex gap-1">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="h-8 px-2 text-xs"
                >
                  <ArrowLeft className="w-3 h-3" />
                </Button>
              )}
              
              {currentStep.canSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipStep}
                  className="h-8 px-2 text-xs"
                >
                  Skip
                </Button>
              )}
            </div>

            <Button
              onClick={nextStep}
              size="sm"
              className="h-8 px-3 text-xs bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {currentStepIndex === currentTour.steps.length - 1 ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Selesai
                </>
              ) : (
                <>
                  Lanjut
                  <ArrowRight className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};