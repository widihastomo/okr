import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  X,
  MousePointer2,
  Sun,
  Target,
  CheckSquare as TaskIcon,
  Clock,
  Calendar,
  Medal,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import WelcomeScreen from "./WelcomeScreen";
import TourCompletionModal from "./TourCompletionModal";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  selector: string;
  position: "top" | "bottom" | "left" | "right";
  category: "navigation" | "feature" | "action";
  targetPath?: string;
  requiresClick?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "daily-focus",
    title: "Daily Focus - Fokus Harian",
    description:
      "Pusat kendali produktivitas harian Anda. Di sini Anda dapat melihat tugas yang harus diselesaikan hari ini, update progress angka target, dan mengelola inisiatif yang sedang berjalan. Fitur ini membantu Anda tetap fokus pada prioritas utama dan tidak kehilangan momentum dalam mencapai tujuan.",
    icon: Sun,
    selector: '[data-tour="daily-focus"]',
    position: "right",
    category: "navigation",
    targetPath: "/",
  },
  {
    id: "goals",
    title: "Goals - Manajemen Tujuan",
    description:
      "Kelola seluruh tujuan organisasi menggunakan metodologi OKR (Objectives and Key Results). Buat objectives yang inspiratif dan tentukan key results yang terukur untuk melacak pencapaian. Sistem ini membantu menyelaraskan visi organisasi dengan eksekusi yang nyata dan terukur.",
    icon: Target,
    selector: '[data-tour="goals"]',
    position: "right",
    category: "navigation",
    targetPath: "/goals",
    requiresClick: true,
  },
  {
    id: "tasks",
    title: "Tasks - Manajemen Tugas",
    description:
      "Pantau dan kelola semua tugas yang terkait dengan objectives dan key results. Atur prioritas, deadline, dan assignee untuk setiap tugas. Fitur ini memungkinkan kolaborasi tim yang efektif dan memastikan setiap pekerjaan berkontribusi pada pencapaian tujuan organisasi.",
    icon: TaskIcon,
    selector: '[data-tour="tasks"]',
    position: "right",
    category: "navigation",
    targetPath: "/tasks",
    requiresClick: true,
  },
  {
    id: "timeline",
    title: "Timeline - Riwayat Progress",
    description:
      "Visualisasi kronologis dari semua aktivitas dan progress yang telah dicapai. Lihat check-in, pencapaian milestone, dan perkembangan key results dalam format timeline yang mudah dipahami. Fitur ini memberikan gambaran historis yang komprehensif tentang perjalanan organisasi.",
    icon: Clock,
    selector: '[data-tour="timeline"]',
    position: "right",
    category: "navigation",
    targetPath: "/timeline",
    requiresClick: true,
  },
  {
    id: "cycles",
    title: "Siklus - Periode Waktu",
    description:
      "Atur periode waktu untuk goals Anda (bulanan, kuartalan, atau tahunan). Siklus membantu mengorganisir objectives berdasarkan timeframe yang realistis dan memungkinkan perencanaan yang lebih terstruktur. Setiap siklus memiliki target dan milestone yang jelas.",
    icon: Calendar,
    selector: '[data-tour="cycles"]',
    position: "right",
    category: "navigation",
    targetPath: "/cycles",
    requiresClick: true,
  },
  {
    id: "achievements",
    title: "Pencapaian - Gamifikasi",
    description:
      "Sistem gamifikasi yang memotivasi pencapaian individu dan tim. Pantau progress personal, kumpulkan badge prestasi, dan lihat leaderboard tim. Fitur ini membuat proses pencapaian tujuan lebih engaging dan membangun budaya kompetisi yang sehat.",
    icon: Medal,
    selector: '[data-tour="achievements"]',
    position: "right",
    category: "navigation",
    targetPath: "/achievements",
    requiresClick: true,
  },
  {
    id: "analytics",
    title: "Analytics - Dashboard Performa",
    description:
      "Analisis performa organisasi dengan dashboard yang komprehensif. Lihat metrics kunci, trend pencapaian, perbandingan tim, dan insights berbasis data untuk pengambilan keputusan strategis. Dashboard ini menyediakan visibility lengkap terhadap kesehatan organisasi.",
    icon: BarChart3,
    selector: '[data-tour="analytics"]',
    position: "right",
    category: "navigation",
    targetPath: "/analytics",
    requiresClick: true,
  },
  {
    id: "users",
    title: "Pengguna - Manajemen Tim",
    description:
      "Kelola anggota tim dan struktur organisasi. Undang pengguna baru, atur roles dan permissions, kelola tim dan departemen. Fitur ini memungkinkan admin mengatur akses dan kolaborasi yang efektif dalam organisasi.",
    icon: Users,
    selector: '[data-tour="users"]',
    position: "right", 
    category: "navigation",
    targetPath: "/client-users",
    requiresClick: true,
  },
  {
    id: "settings",
    title: "Pengaturan - Konfigurasi Organisasi",
    description:
      "Atur konfigurasi organisasi, preferensi sistem, notifikasi, dan pengaturan keamanan. Bagian ini memungkinkan admin mengoptimalkan sistem sesuai kebutuhan organisasi dan mengelola berbagai aspek operasional platform.",
    icon: Settings,
    selector: '[data-tour="settings"]',
    position: "right",
    category: "navigation",
    targetPath: "/organization-settings", 
    requiresClick: true,
  },
  {
    id: "help",
    title: "Bantuan - Dokumentasi & Support",
    description:
      "Akses dokumentasi lengkap, FAQ, tutorial video, dan support center. Bagian ini menyediakan semua resources yang dibutuhkan untuk memaksimalkan penggunaan platform dan mengatasi berbagai pertanyaan atau kendala yang mungkin muncul.",
    icon: HelpCircle,
    selector: '[data-tour="help"]',
    position: "right",
    category: "navigation",
    targetPath: "/help",
    requiresClick: true,
  },
];

export default function TourSystem() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [location, setLocation] = useLocation();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const { user, isLoading } = useAuth();
  const totalSteps = TOUR_STEPS.length;

  console.log("TourSystemSimplified state:", { isActive, currentStep, totalSteps });

  // Check user tour completion status and show welcome screen if needed
  useEffect(() => {
    console.log("🔍 Company details check:", {
      companyDetailsCompleted: localStorage.getItem("company-details-completed"),
      onboardingCompleted: localStorage.getItem("onboarding-completed"),
      welcomeShown: localStorage.getItem("welcome-screen-shown"),
      tourStarted: localStorage.getItem("tour-started"),
      tourCompleted: localStorage.getItem("tour-completed")
    });
    
    console.log("🔍 Current user data:", user);
    console.log("🔍 Is loading:", isLoading);
    
    if (!isLoading && user) {
      // Check if user hasn't completed the tour
      if (!(user as any).tourCompleted) {
        console.log("🔍 User hasn't completed tour, showing welcome screen");
        setShowWelcomeScreen(true);
      } else {
        console.log("🔍 User has completed tour, not showing welcome screen");
      }
    }
  }, [user, isLoading]);

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

  // Tour control functions for welcome screen
  const handleWelcomeScreenClose = () => {
    setShowWelcomeScreen(false);
    // Don't set localStorage flag so welcome screen can appear again for incomplete tours
  };

  const handleStartTourFromWelcome = () => {
    setShowWelcomeScreen(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const showWelcomeScreenManually = () => {
    console.log("showWelcomeScreenManually called");
    localStorage.removeItem("welcome-screen-shown");
    localStorage.setItem("onboarding-completed", "true");
    setShowWelcomeScreen(true);
  };

  // Function to check if device is mobile
  const isMobile = () => window.innerWidth <= 768;

  // Function to highlight current step
  const highlightCurrentStep = () => {
    const currentStepData = TOUR_STEPS[currentStep];
    if (!currentStepData) return;

    // Clean up previous highlights
    cleanupHighlights();

    // Find the target element
    const targetElement = document.querySelector(currentStepData.selector);
    if (!targetElement) {
      console.warn(`Element not found for selector: ${currentStepData.selector}`);
      return;
    }

    // Add highlight class
    targetElement.classList.add("tour-highlight");

    // Position tooltip
    positionTooltip(targetElement as HTMLElement, currentStepData.position);

    // Check if this step requires a click
    if (currentStepData.requiresClick) {
      setWaitingForClick(true);
      
      // Add click listener
      const clickHandler = () => {
        console.log(`Element clicked for step: ${currentStepData.id}`);
        setWaitingForClick(false);
        
        // Navigate if needed
        if (currentStepData.targetPath && location !== currentStepData.targetPath) {
          setLocation(currentStepData.targetPath);
        }
        
        // Clean up listener
        targetElement.removeEventListener('click', clickHandler);
        
        // Auto advance after navigation
        setTimeout(() => {
          nextStep();
        }, 500);
      };
      
      targetElement.addEventListener('click', clickHandler);
    }
  };

  // Function to position tooltip
  const positionTooltip = (element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    let x = 0;
    let y = 0;

    const tooltipWidth = isMobile() ? window.innerWidth - 30 : 380;
    const tooltipHeight = 400;

    switch (position) {
      case "right":
        x = rect.right + 10;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case "left":
        x = rect.left - tooltipWidth - 10;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case "top":
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - 10;
        break;
      case "bottom":
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + 10;
        break;
    }

    // Adjust for screen boundaries
    if (x < 15) x = 15;
    if (x + tooltipWidth > window.innerWidth - 15) {
      x = window.innerWidth - tooltipWidth - 15;
    }
    if (y < 15) y = 15;
    if (y + tooltipHeight > window.innerHeight - 15) {
      y = window.innerHeight - tooltipHeight - 15;
    }

    setTooltipPosition({ x, y });
  };

  // Function to clean up highlights
  const cleanupHighlights = () => {
    document.querySelectorAll(".tour-highlight").forEach((el) => {
      el.classList.remove("tour-highlight");
    });
  };

  // Tour control functions
  const nextStep = () => {
    cleanupHighlights();

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
    localStorage.setItem("tour-completed", "true");
    cleanupHighlights();
    
    // Show completion modal with celebration
    setShowCompletionModal(true);
  };

  const completeTour = async () => {
    try {
      // Call API to mark tour as completed
      const response = await fetch('/api/tour/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log("✅ Tour marked as completed in database");
      } else {
        console.warn("⚠️ Failed to mark tour as completed in database");
      }
    } catch (error) {
      console.warn("⚠️ Error marking tour as completed:", error);
    }

    setIsActive(false);
    setIsVisible(false);
    localStorage.setItem("tour-completed", "true");
    cleanupHighlights();
    
    // Show completion modal with celebration
    setShowCompletionModal(true);
  };

  // Get current step data
  const currentStepData = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Tour restart function (called from hamburger menu)
  const restartTour = () => {
    console.log("Auto-restarting tour from hamburger menu");
    setIsActive(true);
    setCurrentStep(0);
    setIsVisible(true);
    
    // Update onboarding progress
    fetch('/api/auth/update-onboarding-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        progress: "missions_completed",
      }),
    }).then(response => {
      if (response.ok) {
        console.log("✅ Onboarding progress updated: missions_completed");
      }
    }).catch(error => {
      console.warn("⚠️ Failed to update onboarding progress:", error);
    });

    // Call tour start endpoint 
    fetch('/api/tour/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => {
      if (response.ok) {
        console.log("✅ Tour started status updated in database");
      }
    }).catch(error => {
      console.warn("⚠️ Failed to update tour started in database:", error);
    });
    
    console.log("Tour restarted from hamburger menu step");
  };

  // Expose restart function globally for hamburger menu
  useEffect(() => {
    (window as any).restartTour = restartTour;
    return () => {
      delete (window as any).restartTour;
    };
  }, []);

  // Expose manual welcome screen function
  useEffect(() => {
    (window as any).showWelcomeScreenManually = showWelcomeScreenManually;
    return () => {
      delete (window as any).showWelcomeScreenManually;
    };
  }, []);

  // Debug tour elements
  useEffect(() => {
    const elements = TOUR_STEPS.map(step => step.id).map(id => 
      document.querySelector(`[data-tour="${id.replace(/-/g, '-')}"]`)
    ).filter(Boolean);
    
    console.log("All available tour elements:", TOUR_STEPS.map(step => step.id));
  }, [location]);

  return (
    <>
      {/* Tour tooltip - only show when tour is active */}
      {isActive && isVisible && (
        <div
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-orange-200 border-2"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            width: isMobile() ? "calc(100vw - 30px)" : "380px",
            maxWidth: isMobile() ? "calc(100vw - 30px)" : "380px",
            maxHeight: "400px",
            pointerEvents: "auto",
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

          <CardContent
            className="pt-0 flex flex-col"
            style={{ maxHeight: "280px" }}
          >
            <div className="flex-1 overflow-y-auto">
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

              <Progress value={progress} className="h-1 mb-3" />
            </div>

            <div className="flex justify-between items-center mt-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={currentStep === 0 || waitingForClick}
                className={cn(
                  "flex items-center gap-1",
                  waitingForClick && "opacity-50 cursor-not-allowed",
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
                    waitingForClick && "opacity-50 cursor-not-allowed",
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
      )}

      {/* Welcome Screen */}
      <WelcomeScreen
        isOpen={showWelcomeScreen}
        onClose={handleWelcomeScreenClose}
        onStartTour={handleStartTourFromWelcome}
      />

      {/* Tour Completion Modal */}
      <TourCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        isSkipped={false}
      />
    </>
  );
}