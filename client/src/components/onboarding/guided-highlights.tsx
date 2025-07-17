import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Sparkles, Target, TrendingUp, Users, Calendar, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  category: 'welcome' | 'navigation' | 'feature' | 'action';
  order: number;
}

const HIGHLIGHT_STEPS: HighlightStep[] = [
  {
    id: 'welcome',
    title: 'Selamat Datang!',
    description: 'Terima kasih telah bergabung. Mari kita mulai dengan mengenal fitur-fitur utama.',
    icon: Sparkles,
    selector: '[data-tour="today-tasks-card"]',
    position: 'bottom',
    category: 'welcome',
    order: 1
  },
  {
    id: 'daily-focus',
    title: 'Daily Focus',
    description: 'Mulai hari Anda dengan fokus pada tugas prioritas dan progress yang perlu diperbarui.',
    icon: Target,
    selector: '[data-tour="daily-focus"]',
    position: 'right',
    category: 'navigation',
    order: 2
  },
  {
    id: 'goals',
    title: 'Goals & OKR',
    description: 'Kelola tujuan organisasi dengan sistem OKR yang terstruktur dan mudah dipahami.',
    icon: Target,
    selector: '[data-tour="goals"]',
    position: 'right',
    category: 'feature',
    order: 3
  },
  {
    id: 'tasks',
    title: 'Task Management',
    description: 'Pantau dan kelola semua tugas yang terkait dengan objectives Anda.',
    icon: CheckCircle,
    selector: '[data-tour="tasks"]',
    position: 'right',
    category: 'feature',
    order: 4
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Analisis performa dan pencapaian tim melalui dashboard yang komprehensif.',
    icon: TrendingUp,
    selector: '[data-tour="analytics"]',
    position: 'right',
    category: 'feature',
    order: 5
  },
  {
    id: 'users',
    title: 'Team Management',
    description: 'Undang anggota tim dan kelola akses user dalam organisasi.',
    icon: Users,
    selector: '[data-tour="users"]',
    position: 'right',
    category: 'feature',
    order: 6
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Dapatkan update terbaru tentang aktivitas tim dan perkembangan objectives.',
    icon: Bell,
    selector: '[data-tour="notifications"]',
    position: 'bottom',
    category: 'action',
    order: 7
  }
];

interface GuidedHighlightsProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function GuidedHighlights({ isActive, onComplete, onSkip }: GuidedHighlightsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const totalSteps = HIGHLIGHT_STEPS.length;
  const step = HIGHLIGHT_STEPS[currentStep];

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setTimeout(() => highlightCurrentStep(), 100);
    } else {
      setIsVisible(false);
      cleanupHighlights();
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && step) {
      setTimeout(() => highlightCurrentStep(), 100);
    }
  }, [currentStep, isActive]);

  const highlightCurrentStep = () => {
    cleanupHighlights();
    
    if (!step) return;

    const element = document.querySelector(step.selector) as HTMLElement;
    if (!element) return;

    // Add highlight class
    element.classList.add('onboarding-highlight');
    setHighlightedElement(element);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    document.body.appendChild(overlay);

    // Calculate tooltip position
    const rect = element.getBoundingClientRect();
    const position = calculateTooltipPosition(rect, step.position);
    setTooltipPosition(position);

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const calculateTooltipPosition = (rect: DOMRect, position: string) => {
    const padding = 20;
    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - padding;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - padding;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + padding;
        y = rect.top + rect.height / 2;
        break;
    }

    return { x, y };
  };

  const cleanupHighlights = () => {
    // Remove highlight from all elements
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });

    // Remove overlay
    document.querySelectorAll('.onboarding-overlay').forEach(el => {
      el.remove();
    });

    setHighlightedElement(null);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    cleanupHighlights();
    onComplete();
  };

  const handleSkip = () => {
    cleanupHighlights();
    onSkip();
  };

  if (!isVisible || !step) return null;

  const Icon = step.icon;

  return (
    <>
      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-[9999] transition-all duration-300 ease-in-out",
          step.position === 'top' && "transform -translate-x-1/2 -translate-y-full",
          step.position === 'bottom' && "transform -translate-x-1/2",
          step.position === 'left' && "transform -translate-x-full -translate-y-1/2",
          step.position === 'right' && "transform -translate-y-1/2"
        )}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
      >
        <Card className="w-80 shadow-2xl border-orange-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {step.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {currentStep + 1} dari {totalSteps}
                  </Badge>
                  <Badge 
                    variant={step.category === 'welcome' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {step.category === 'welcome' ? 'Selamat Datang' : 
                     step.category === 'navigation' ? 'Navigasi' :
                     step.category === 'feature' ? 'Fitur' : 'Aksi'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm text-gray-600 leading-relaxed mb-4">
              {step.description}
            </CardDescription>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="text-xs"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-gray-500"
                >
                  Lewati
                </Button>
              </div>
              
              <Button
                onClick={nextStep}
                size="sm"
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs"
              >
                {currentStep === totalSteps - 1 ? 'Selesai' : 'Selanjutnya'}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9998]">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {HIGHLIGHT_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep ? "bg-orange-600" : 
                    index < currentStep ? "bg-orange-300" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-2">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}