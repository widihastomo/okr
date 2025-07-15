import React, { useEffect, useState } from "react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Target, 
  Info,
  CheckCircle,
  SkipForward,
  Play,
  Sparkles,
  Zap,
  MousePointer,
  Eye
} from "lucide-react";

interface TourTooltipProps {
  onClose?: () => void;
}

export default function TourTooltip({ onClose }: TourTooltipProps) {
  const {
    isOnboardingActive,
    currentTour,
    currentStep,
    currentStepIndex,
    nextStep,
    prevStep,
    skipStep,
    completeTour,
    skipTour
  } = useOnboarding();

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOnboardingActive && currentStep && currentStep.target) {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Position tooltip below and centered relative to target element
        setTooltipPosition({
          top: rect.bottom + scrollTop + 10,
          left: rect.left + scrollLeft + (rect.width / 2) - 200 // 200 is half tooltip width
        });
        
        setIsVisible(true);
        
        // Scroll element into view if needed
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    } else {
      setIsVisible(false);
    }
  }, [isOnboardingActive, currentStep]);

  if (!isOnboardingActive || !currentTour || !currentStep) {
    return null;
  }

  const handleNext = () => {
    if (currentStep.action === 'click' && currentStep.target) {
      // For click actions, trigger the click and then proceed
      const element = document.querySelector(currentStep.target);
      if (element) {
        (element as HTMLElement).click();
      }
    }
    nextStep();
  };

  const handleSkip = () => {
    if (currentStep.canSkip) {
      skipStep();
    }
  };

  const handleClose = () => {
    skipTour();
    onClose?.();
  };

  const progressPercentage = ((currentStepIndex + 1) / currentTour.steps.length) * 100;

  return (
    <div 
      className={`fixed z-50 transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <Card className="w-96 shadow-2xl border-2 border-orange-200 bg-white relative animate-in slide-in-from-bottom-2 duration-300">
        {/* Animated sparkles */}
        <div className="absolute -top-3 -right-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-orange-500" />
        </div>
        <div className="absolute -bottom-3 -left-3 animate-bounce">
          <Zap className="w-5 h-5 text-blue-500" />
        </div>
        
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg animate-pulse">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {currentTour.name}
                </h3>
                <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 animate-pulse">
                  {currentStepIndex + 1} dari {currentTour.steps.length}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Progress: {Math.round(progressPercentage)}%
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              {currentStep.action === 'click' && (
                <MousePointer className="w-4 h-4 text-blue-500 animate-pulse" />
              )}
              {currentStep.action === 'observe' && (
                <Eye className="w-4 h-4 text-green-500 animate-pulse" />
              )}
              {currentStep.action === 'input' && (
                <Play className="w-4 h-4 text-purple-500 animate-pulse" />
              )}
              {currentStep.action === 'navigate' && (
                <Target className="w-4 h-4 text-orange-500 animate-pulse" />
              )}
              {currentStep.title}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {currentStep.description}
            </p>
            
            {currentStep.action === 'click' && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg text-sm text-blue-700 border border-blue-200">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 animate-bounce" />
                  <span className="font-medium">Klik elemen yang disorot untuk melanjutkan</span>
                </div>
              </div>
            )}
            
            {currentStep.action === 'observe' && (
              <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg text-sm text-green-700 border border-green-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 animate-pulse" />
                  <span className="font-medium">Perhatikan elemen yang disorot</span>
                </div>
              </div>
            )}
            
            {currentStep.action === 'input' && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-sm text-purple-700 border border-purple-200">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 animate-pulse" />
                  <span className="font-medium">Isi form atau masukkan data</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="text-xs tour-button"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Kembali
                </Button>
              )}
              
              {currentStep.canSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-gray-500 tour-button"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Lewati
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStepIndex === currentTour.steps.length - 1 ? (
                <Button
                  onClick={completeTour}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-xs tour-button"
                >
                  <CheckCircle className="w-3 h-3 mr-1 animate-pulse" />
                  Selesai
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-xs tour-button"
                >
                  {currentStep.action === 'click' ? (
                    <>
                      Klik & Lanjut
                      <MousePointer className="w-3 h-3 ml-1 animate-pulse" />
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Tour Info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {currentTour.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}