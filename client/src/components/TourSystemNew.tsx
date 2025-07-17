import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, CheckSquare, Sun, Flag, Clock, BarChart3, Bell, Users, Settings, Trophy, Calendar, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  category: 'navigation' | 'feature' | 'action';
  targetPath?: string; // Path to navigate to when clicked
  requiresClick?: boolean; // Whether this step requires user to click the element
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
    category: 'action',
    targetPath: '/daily-focus',
    requiresClick: true
  },
  {
    id: 'daily-focus-content',
    title: 'Daily Focus - Tab Prioritas',
    description: 'Tiga tab utama membantu Anda mengatur fokus harian: Task Prioritas untuk tugas yang harus diselesaikan, Update Progress untuk key results yang perlu diperbarui, dan Kelola Inisiatif untuk proyek yang sedang berjalan.',
    icon: Sun,
    selector: '[data-tour="daily-focus-tabs"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'timeline',
    title: 'Timeline - Riwayat Progress',
    description: 'Visualisasi kronologis dari semua aktivitas dan progress yang telah dicapai. Lihat check-in, pencapaian milestone, dan perkembangan key results dalam format timeline yang mudah dipahami. Fitur ini memberikan gambaran historis yang komprehensif tentang perjalanan organisasi.',
    icon: Clock,
    selector: '[data-tour="timeline"]',
    position: 'right',
    category: 'feature',
    targetPath: '/timeline',
    requiresClick: true
  },
  {
    id: 'timeline-content',
    title: 'Timeline - Daily Check-in',
    description: 'Tombol Daily Check-in memungkinkan Anda mencatat progress harian dengan mudah. Setiap check-in akan ditampilkan dalam timeline kronologis untuk tracking yang lebih baik.',
    icon: Clock,
    selector: '[data-tour="timeline-checkin"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'tasks',
    title: 'Tasks - Manajemen Tugas',
    description: 'Pantau dan kelola semua tugas yang terkait dengan objectives dan key results. Atur prioritas, deadline, dan assignee untuk setiap tugas. Fitur ini memungkinkan kolaborasi tim yang efektif dan memastikan setiap pekerjaan berkontribusi pada pencapaian tujuan organisasi.',
    icon: CheckSquare,
    selector: '[data-tour="tasks"]',
    position: 'right',
    category: 'feature',
    targetPath: '/tasks',
    requiresClick: true
  },
  {
    id: 'tasks-content',
    title: 'Tasks - Filter & Pencarian',
    description: 'Gunakan filter dan pencarian untuk menemukan tugas dengan cepat. Anda dapat memfilter berdasarkan status, prioritas, penanggungjawab, dan tim untuk manajemen yang lebih efisien.',
    icon: CheckSquare,
    selector: '[data-tour="tasks-filter"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'goals',
    title: 'Goals - Manajemen Tujuan',
    description: 'Kelola seluruh tujuan organisasi menggunakan metodologi OKR (Objectives and Key Results). Buat objectives yang inspiratif dan tentukan key results yang terukur untuk melacak pencapaian. Sistem ini membantu menyelaraskan visi organisasi dengan eksekusi yang nyata dan terukur.',
    icon: Flag,
    selector: '[data-tour="goals"]',
    position: 'right',
    category: 'feature',
    targetPath: '/goals',
    requiresClick: true
  },
  {
    id: 'goals-content',
    title: 'Goals - Tambah Tujuan Baru',
    description: 'Tombol "Tambah Tujuan Baru" memungkinkan Anda membuat objectives dan key results baru. Setiap tujuan dapat memiliki multiple key results untuk pengukuran yang lebih akurat.',
    icon: Flag,
    selector: '[data-tour="add-goal"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'cycles',
    title: 'Siklus - Periode Waktu',
    description: 'Atur periode waktu untuk goals Anda (bulanan, kuartalan, atau tahunan). Siklus membantu mengorganisir objectives berdasarkan timeframe yang realistis dan memungkinkan perencanaan yang lebih terstruktur. Setiap siklus memiliki target dan milestone yang jelas.',
    icon: Calendar,
    selector: '[data-tour="cycles"]',
    position: 'right',
    category: 'feature',
    targetPath: '/cycles',
    requiresClick: true
  },
  {
    id: 'cycles-content',
    title: 'Siklus - Kelola Periode',
    description: 'Tabel siklus menampilkan semua periode waktu yang telah dibuat. Anda dapat melihat tanggal mulai, berakhir, dan status setiap siklus untuk perencanaan yang lebih baik.',
    icon: Calendar,
    selector: '[data-tour="cycles-table"]',
    position: 'top',
    category: 'feature'
  },
  {
    id: 'achievements',
    title: 'Pencapaian - Sistem Reward',
    description: 'Lihat badges, rewards, dan pencapaian yang telah diraih oleh tim. Sistem gamifikasi ini dirancang untuk meningkatkan motivasi dan engagement anggota tim. Setiap pencapaian mencerminkan kontribusi nyata terhadap tujuan organisasi.',
    icon: Trophy,
    selector: '[data-tour="achievements"]',
    position: 'right',
    category: 'feature',
    targetPath: '/achievements',
    requiresClick: true
  },
  {
    id: 'achievements-content',
    title: 'Pencapaian - Leaderboard',
    description: 'Leaderboard menampilkan ranking anggota tim berdasarkan poin yang diperoleh. Sistem ini menciptakan kompetisi sehat dan memotivasi tim untuk mencapai target lebih baik.',
    icon: Trophy,
    selector: '[data-tour="leaderboard"]',
    position: 'top',
    category: 'feature'
  },
  {
    id: 'analytics',
    title: 'Analytics - Dashboard Performa',
    description: 'Analisis mendalam tentang performa tim dan pencapaian objectives. Dashboard ini menyediakan insights berbasis data untuk membantu pengambilan keputusan strategis. Lihat tren progress, identifikasi area yang perlu perbaikan, dan ukur ROI dari setiap inisiatif.',
    icon: BarChart3,
    selector: '[data-tour="analytics"]',
    position: 'right',
    category: 'feature',
    targetPath: '/analytics',
    requiresClick: true
  },
  {
    id: 'analytics-content',
    title: 'Analytics - Grafik Performa',
    description: 'Grafik dan chart memberikan visualisasi performa tim dalam bentuk yang mudah dipahami. Analisis tren ini membantu dalam pengambilan keputusan strategis.',
    icon: BarChart3,
    selector: '[data-tour="analytics-chart"]',
    position: 'top',
    category: 'feature'
  },
  {
    id: 'users',
    title: 'Kelola Pengguna - Tim Management',
    description: 'Undang anggota tim baru, kelola peran dan permissions, serta atur akses pengguna ke berbagai fitur. Sistem role-based access control memastikan setiap anggota tim memiliki akses yang tepat sesuai dengan tanggung jawab mereka dalam organisasi.',
    icon: Users,
    selector: '[data-tour="users"]',
    position: 'right',
    category: 'navigation',
    targetPath: '/users',
    requiresClick: true
  },
  {
    id: 'users-content',
    title: 'Kelola Pengguna - Undang Tim',
    description: 'Tombol "Undang Pengguna" memungkinkan Anda menambahkan anggota tim baru dengan mengatur peran dan permissions yang sesuai. Setiap pengguna dapat memiliki akses yang berbeda sesuai tanggung jawabnya.',
    icon: Users,
    selector: '[data-tour="invite-user"]',
    position: 'bottom',
    category: 'feature'
  },
  {
    id: 'settings',
    title: 'Pengaturan - Konfigurasi Sistem',
    description: 'Kelola preferensi organisasi, konfigurasi billing dan subscription, pengaturan security, dan customization sistem. Area ini memberikan kontrol penuh terhadap bagaimana platform OKR bekerja sesuai dengan kebutuhan spesifik organisasi Anda.',
    icon: Settings,
    selector: '[data-tour="settings"]',
    position: 'right',
    category: 'navigation',
    targetPath: '/settings',
    requiresClick: true
  },
  {
    id: 'settings-content',
    title: 'Pengaturan - Organisasi',
    description: 'Pengaturan organisasi memungkinkan Anda mengonfigurasi nama perusahaan, informasi kontak, dan preferensi sistem yang akan mempengaruhi seluruh tim dalam organisasi.',
    icon: Settings,
    selector: '[data-tour="org-settings"]',
    position: 'top',
    category: 'feature'
  }
];

export default function TourSystem() {
  // Own state management (not using useTour hook)
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [location, setLocation] = useLocation();
  
  const totalSteps = TOUR_STEPS.length;
  
  // Tour control functions
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setIsVisible(false);
    localStorage.setItem('tour-completed', 'true');
    cleanupHighlights();
  };

  const completeTour = () => {
    setIsActive(false);
    setIsVisible(false);
    localStorage.setItem('tour-completed', 'true');
    cleanupHighlights();
  };
  
  console.log('TourSystemNew state:', { isActive, currentStep, totalSteps });

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

  // Listen for start tour event
  useEffect(() => {
    const handleStartTour = () => {
      setIsActive(true);
      setCurrentStep(0);
      setIsVisible(true);
      localStorage.removeItem('tour-completed');
    };

    window.addEventListener('startTour', handleStartTour);
    return () => window.removeEventListener('startTour', handleStartTour);
  }, []);

  const highlightCurrentStep = () => {
    const currentStepData = TOUR_STEPS[currentStep];
    const element = document.querySelector(currentStepData.selector);
    
    console.log(`Step ${currentStep + 1}: Looking for element: ${currentStepData.selector}`, element);
    
    // Debug: Show all available data-tour elements
    const allTourElements = document.querySelectorAll('[data-tour]');
    console.log('All available tour elements:', Array.from(allTourElements).map(el => el.getAttribute('data-tour')));
    
    if (element) {
      // Remove existing highlights and click handlers
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
        el.classList.remove('tour-click-required');
      });
      
      // Add highlight to current element
      element.classList.add('tour-highlight');
      
      // If this step requires a click, add click handler
      if (currentStepData.requiresClick) {
        setWaitingForClick(true);
        
        // Add click event listener
        const handleClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Remove click handler
          element.removeEventListener('click', handleClick);
          setWaitingForClick(false);
          
          // Navigate to target path if specified
          if (currentStepData.targetPath) {
            console.log('Navigating to:', currentStepData.targetPath);
            setLocation(currentStepData.targetPath);
          }
          
          // Continue to next step after a short delay
          setTimeout(() => {
            nextStep();
          }, 500);
        };
        
        element.addEventListener('click', handleClick);
        
        // Add visual indication that click is required
        element.classList.add('tour-click-required');
      }
      
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
    } else {
      console.warn(`Element not found for selector: ${currentStepData.selector}`);
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
            {currentStepData.requiresClick && waitingForClick && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <MousePointer2 className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Klik menu ini untuk melanjutkan tour
                  </span>
                </div>
              </div>
            )}
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
              disabled={currentStep === 0 || waitingForClick}
              className={cn(
                "flex items-center gap-1",
                waitingForClick && "opacity-50 cursor-not-allowed"
              )}
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
                disabled={waitingForClick}
                className={cn(
                  "bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1",
                  waitingForClick && "opacity-50 cursor-not-allowed"
                )}
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