import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, Play, Target, Users, Calendar, CheckSquare, Clock, Settings, BarChart3, Bell, Home, Sun, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTour } from '@/hooks/useTour';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  category: 'navigation' | 'feature' | 'action';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'daily-focus',
    title: 'Daily Focus',
    description: 'Mulai hari Anda dengan fokus pada tugas prioritas dan progress yang perlu diperbarui.',
    icon: Sun,
    selector: '[data-tour="daily-focus"]',
    position: 'right',
    category: 'action'
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Kelola tujuan organisasi dengan sistem OKR yang terstruktur dan mudah dipahami.',
    icon: Flag,
    selector: '[data-tour="goals"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Pantau dan kelola semua tugas yang terkait dengan objectives Anda.',
    icon: CheckSquare,
    selector: '[data-tour="tasks"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Lihat perkembangan progress dalam format timeline yang mudah dipahami.',
    icon: Clock,
    selector: '[data-tour="timeline"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Analisis performa dan pencapaian tim melalui dashboard yang komprehensif.',
    icon: BarChart3,
    selector: '[data-tour="analytics"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'users',
    title: 'Kelola Pengguna',
    description: 'Undang anggota tim, kelola peran, dan atur akses pengguna.',
    icon: Users,
    selector: '[data-tour="users"]',
    position: 'right',
    category: 'navigation'
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Dapatkan update terbaru tentang aktivitas tim dan perkembangan objectives.',
    icon: Bell,
    selector: '[data-tour="notifications"]',
    position: 'left',
    category: 'feature'
  },
  {
    id: 'settings',
    title: 'Pengaturan Organisasi',
    description: 'Konfigurasi profil organisasi, subscription, dan pengaturan sistem.',
    icon: Settings,
    selector: '[data-tour="settings"]',
    position: 'right',
    category: 'navigation'
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Terima update real-time tentang progress tim dan aktivitas penting.',
    icon: Bell,
    selector: '[data-tour="notifications"]',
    position: 'left',
    category: 'feature'
  }
];

interface TourSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function TourSystem({ isOpen, onClose, onComplete }: TourSystemProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const currentTourStep = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Start tour
  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
    highlightElement(TOUR_STEPS[0]);
  };

  // Highlight element
  const highlightElement = (step: TourStep) => {
    const element = document.querySelector(step.selector);
    if (element) {
      setHighlightedElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      let x = 0;
      let y = 0;
      
      switch (step.position) {
        case 'right':
          x = rect.right + scrollLeft + 20;
          y = rect.top + scrollTop + (rect.height / 2);
          break;
        case 'left':
          x = rect.left + scrollLeft - 320;
          y = rect.top + scrollTop + (rect.height / 2);
          break;
        case 'bottom':
          x = rect.left + scrollLeft + (rect.width / 2);
          y = rect.bottom + scrollTop + 20;
          break;
        case 'top':
          x = rect.left + scrollLeft + (rect.width / 2);
          y = rect.top + scrollTop - 20;
          break;
      }
      
      setTooltipPosition({ x, y });
      
      // Add highlight class
      element.classList.add('tour-highlight');
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Remove highlight
  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
      setHighlightedElement(null);
    }
  };

  // Next step
  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      removeHighlight();
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      highlightElement(TOUR_STEPS[nextStepIndex]);
    } else {
      completeTour();
    }
  };

  // Previous step
  const prevStep = () => {
    if (currentStep > 0) {
      removeHighlight();
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      highlightElement(TOUR_STEPS[prevStepIndex]);
    }
  };

  // Complete tour
  const completeTour = () => {
    removeHighlight();
    setIsActive(false);
    onComplete();
    onClose();
  };

  // Skip tour
  const skipTour = () => {
    removeHighlight();
    setIsActive(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isActive) {
      startTour();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      removeHighlight();
    };
  }, []);

  if (!isOpen || !isActive) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return 'bg-blue-500';
      case 'feature': return 'bg-green-500';
      case 'action': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation': return 'Navigasi';
      case 'feature': return 'Fitur';
      case 'action': return 'Aksi';
      default: return 'Lainnya';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={skipTour} />
      
      {/* Tooltip */}
      <div
        className="fixed z-50 w-80"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: currentTourStep.position === 'top' || currentTourStep.position === 'bottom' 
            ? 'translateX(-50%)' 
            : currentTourStep.position === 'right' 
              ? 'translateY(-50%)' 
              : 'translateX(0) translateY(-50%)'
        }}
      >
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <currentTourStep.icon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs text-white", getCategoryColor(currentTourStep.category))}
                  >
                    {getCategoryLabel(currentTourStep.category)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              {currentTourStep.description}
            </CardDescription>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{currentStep + 1} / {TOUR_STEPS.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-muted-foreground"
                >
                  Lewati
                </Button>
                
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Selesai' : 'Lanjut'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Tour trigger component
interface TourTriggerProps {
  onStart: () => void;
}

export function TourTrigger({ onStart }: TourTriggerProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onStart}
      className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      <Play className="h-4 w-4" />
      Mulai Tour
    </Button>
  );
}