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
    id: 'cycles',
    title: 'Siklus',
    description: 'Atur periode waktu untuk goals (bulanan, kuartalan, tahunan).',
    icon: Calendar,
    selector: '[data-tour="cycles"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'achievements',
    title: 'Pencapaian',
    description: 'Lihat badges dan rewards yang telah diraih untuk motivasi tim.',
    icon: Trophy,
    selector: '[data-tour="achievements"]',
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
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'settings',
    title: 'Pengaturan',
    description: 'Kelola preferensi organisasi, billing, dan konfigurasi sistem.',
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
      // Remove existing highlights
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
      
      // Add highlight to current element
      element.classList.add('tour-highlight');
      
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
        const tooltipHeight = 180;
        
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

  const cleanupHighlights = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  };

  // Handle window resize
  useEffect(() => {
    if (isActive) {
      const handleResize = () => {
        setTimeout(() => highlightCurrentStep(), 100);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isActive, currentStep]);

  if (!isActive || !isVisible) return null;

  const currentStepData = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-[9999]" 
        onClick={skipTour}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Tour tooltip */}
      <div
        className="fixed z-[10002] bg-white rounded-xl shadow-2xl border border-gray-200"
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
          <CardDescription className="text-sm text-gray-600 mb-4">
            {currentStepData.description}
          </CardDescription>
          
          <Progress value={progress} className="h-1 mb-4" />
          
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