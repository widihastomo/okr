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
    id: 'notifications',
    title: 'Notifikasi - Update Real-time',
    description: 'Dapatkan notifikasi real-time tentang aktivitas tim, deadline yang mendekat, pencapaian milestone, dan update penting lainnya. Sistem notifikasi yang cerdas membantu Anda tetap up-to-date tanpa mengganggu fokus kerja.',
    icon: Bell,
    selector: '[data-tour="notifications"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'daily-focus',
    title: 'Daily Focus - Fokus Harian',
    description: 'Pusat kendali produktivitas harian Anda. Di sini Anda dapat melihat tugas yang harus diselesaikan hari ini, update progress key results, dan mengelola inisiatif yang sedang berjalan. Fitur ini membantu Anda tetap fokus pada prioritas utama dan tidak kehilangan momentum dalam mencapai tujuan.',
    icon: Sun,
    selector: '[data-tour="daily-focus"]',
    position: 'right',
    category: 'action'
  },
  {
    id: 'goals',
    title: 'Goals - Manajemen Tujuan',
    description: 'Kelola seluruh tujuan organisasi menggunakan metodologi OKR (Objectives and Key Results). Buat objectives yang inspiratif dan tentukan key results yang terukur untuk melacak pencapaian. Sistem ini membantu menyelaraskan visi organisasi dengan eksekusi yang nyata dan terukur.',
    icon: Flag,
    selector: '[data-tour="goals"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'tasks',
    title: 'Tasks - Manajemen Tugas',
    description: 'Pantau dan kelola semua tugas yang terkait dengan objectives dan key results. Atur prioritas, deadline, dan assignee untuk setiap tugas. Fitur ini memungkinkan kolaborasi tim yang efektif dan memastikan setiap pekerjaan berkontribusi pada pencapaian tujuan organisasi.',
    icon: CheckSquare,
    selector: '[data-tour="tasks"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'timeline',
    title: 'Timeline - Riwayat Progress',
    description: 'Visualisasi kronologis dari semua aktivitas dan progress yang telah dicapai. Lihat check-in, pencapaian milestone, dan perkembangan key results dalam format timeline yang mudah dipahami. Fitur ini memberikan gambaran historis yang komprehensif tentang perjalanan organisasi.',
    icon: Clock,
    selector: '[data-tour="timeline"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'cycles',
    title: 'Siklus - Periode Waktu',
    description: 'Atur periode waktu untuk goals Anda (bulanan, kuartalan, atau tahunan). Siklus membantu mengorganisir objectives berdasarkan timeframe yang realistis dan memungkinkan perencanaan yang lebih terstruktur. Setiap siklus memiliki target dan milestone yang jelas.',
    icon: Calendar,
    selector: '[data-tour="cycles"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'achievements',
    title: 'Pencapaian - Sistem Reward',
    description: 'Lihat badges, rewards, dan pencapaian yang telah diraih oleh tim. Sistem gamifikasi ini dirancang untuk meningkatkan motivasi dan engagement anggota tim. Setiap pencapaian mencerminkan kontribusi nyata terhadap tujuan organisasi.',
    icon: Trophy,
    selector: '[data-tour="achievements"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'analytics',
    title: 'Analytics - Dashboard Performa',
    description: 'Analisis mendalam tentang performa tim dan pencapaian objectives. Dashboard ini menyediakan insights berbasis data untuk membantu pengambilan keputusan strategis. Lihat tren progress, identifikasi area yang perlu perbaikan, dan ukur ROI dari setiap inisiatif.',
    icon: BarChart3,
    selector: '[data-tour="analytics"]',
    position: 'right',
    category: 'feature'
  },
  {
    id: 'users',
    title: 'Kelola Pengguna - Tim Management',
    description: 'Undang anggota tim baru, kelola peran dan permissions, serta atur akses pengguna ke berbagai fitur. Sistem role-based access control memastikan setiap anggota tim memiliki akses yang tepat sesuai dengan tanggung jawab mereka dalam organisasi.',
    icon: Users,
    selector: '[data-tour="users"]',
    position: 'right',
    category: 'navigation'
  },
  {
    id: 'settings',
    title: 'Pengaturan - Konfigurasi Sistem',
    description: 'Kelola preferensi organisasi, konfigurasi billing dan subscription, pengaturan security, dan customization sistem. Area ini memberikan kontrol penuh terhadap bagaimana platform OKR bekerja sesuai dengan kebutuhan spesifik organisasi Anda.',
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
        const tooltipWidth = 380;
        const tooltipHeight = 220;
        
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
          width: '380px',
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-700 font-medium">
              ℹ️ Menu yang berkedip menunjukkan lokasi fitur yang sedang dijelaskan
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