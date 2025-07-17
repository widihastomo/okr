import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, CheckSquare, Sun, Flag, Clock, BarChart3, Bell, Users, Settings, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTour } from '@/hooks/useTour';
import { tourSteps } from '@/data/tour-steps';

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
    description: 'Klik menu Daily Focus untuk melihat tugas harian dan prioritas Anda.',
    icon: Sun,
    selector: '[data-tour="daily-focus"]',
    position: 'right',
    category: 'action'
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Klik menu Goals untuk mengelola tujuan organisasi dengan sistem OKR.',
    icon: Flag,
    selector: '[data-tour="goals"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Klik menu Tasks untuk melihat dan mengelola semua tugas tim.',
    icon: CheckSquare,
    selector: '[data-tour="tasks"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Klik menu Timeline untuk melihat progress dalam format kronologis.',
    icon: Clock,
    selector: '[data-tour="timeline"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'cycles',
    title: 'Siklus',
    description: 'Klik menu Siklus untuk mengatur periode waktu goals Anda.',
    icon: Calendar,
    selector: '[data-tour="cycles"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'achievements',
    title: 'Pencapaian',
    description: 'Klik menu Pencapaian untuk melihat badges dan rewards tim.',
    icon: Trophy,
    selector: '[data-tour="achievements"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Klik menu Analytics untuk melihat dashboard performa tim.',
    icon: BarChart3,
    selector: '[data-tour="analytics"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'users',
    title: 'Kelola Pengguna',
    description: 'Klik menu Kelola Pengguna untuk mengundang dan mengelola anggota tim.',
    icon: Users,
    selector: '[data-tour="users"]',
    position: 'right',
    category: 'navigation'
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Klik ikon notifikasi untuk melihat update terbaru aktivitas tim.',
    icon: Bell,
    selector: '[data-tour="notifications"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'settings',
    title: 'Pengaturan',
    description: 'Klik menu Pengaturan untuk mengelola konfigurasi organisasi.',
    icon: Settings,
    selector: '[data-tour="settings"]',
    position: 'right',
    category: 'navigation'
  }
];

export default function TourSystem() {
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
  } = useTour();

  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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
    if (isActive) {
      setTimeout(() => highlightCurrentStep(), 100);
    }
  }, [currentStep]);

  const highlightCurrentStep = () => {
    const currentStepData = TOUR_STEPS[currentStep];
    const element = document.querySelector(currentStepData.selector);
    
    if (element) {
      // Remove existing highlights and click listeners
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
        el.removeEventListener('click', handleElementClick);
      });
      
      // Add highlight to current element
      element.classList.add('tour-highlight');
      
      // Add click listener to highlighted element
      element.addEventListener('click', handleElementClick);
      
      // Scroll element into view smoothly
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
      
      // Wait for scroll to complete then calculate position
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 160;
        
        let x = rect.left + rect.width / 2 - tooltipWidth / 2;
        let y = rect.top - tooltipHeight - 15;
        
        // Adjust position based on step position
        switch (currentStepData.position) {
          case 'right':
            x = rect.right + 15;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case 'left':
            x = rect.left - tooltipWidth - 15;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case 'bottom':
            y = rect.bottom + 15;
            break;
          case 'top':
          default:
            // Keep default values
            break;
        }
        
        // Ensure tooltip stays within viewport
        x = Math.max(15, Math.min(x, window.innerWidth - tooltipWidth - 15));
        y = Math.max(15, Math.min(y, window.innerHeight - tooltipHeight - 15));
        
        setTooltipPosition({ x, y });
      }, 300);
    }
  };

  const handleElementClick = (e: Event) => {
    e.stopPropagation();
    // Auto advance to next step when element is clicked
    nextStep();
  };

  const cleanupHighlights = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      el.removeEventListener('click', handleElementClick);
    });
  };

  // Handle window resize and cleanup
  useEffect(() => {
    if (isActive) {
      const handleResize = () => {
        setTimeout(() => highlightCurrentStep(), 100);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        cleanupHighlights();
      };
    }
  }, [isActive, currentStep]);

  if (!isActive || !isVisible) return null;

  const currentStepData = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Tour tooltip - floating without backdrop */}
      <div
        className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-orange-200 border-2"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          width: '320px',
          pointerEvents: 'auto'
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} dari {totalSteps}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5 text-orange-600" />
            {currentStepData.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-sm text-gray-600 mb-3">
            {currentStepData.description}
          </CardDescription>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-orange-700 font-medium">
              💡 Klik pada menu yang berkedip untuk melanjutkan
            </p>
          </div>
          
          <Progress value={progress} className="h-1 mb-3" />
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="text-gray-500"
              >
                Lewati
              </Button>
              
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Selesai
                  </>
                ) : (
                  <>
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </>
  );
}