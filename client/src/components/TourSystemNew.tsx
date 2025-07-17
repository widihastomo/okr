import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Sun,
  Flag,
  Clock,
  BarChart3,
  Bell,
  Users,
  Settings,
  Trophy,
  Calendar,
  MousePointer2,
  Menu,
  Zap,
  TrendingUp,
  Rocket,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import WelcomeScreen from "./WelcomeScreen";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  selector: string;
  position: "top" | "bottom" | "left" | "right";
  category: "navigation" | "feature" | "action";
  targetPath?: string; // Path to navigate to when clicked
  requiresClick?: boolean; // Whether this step requires user to click the element
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "hamburger-menu",
    title: "Menu Navigasi - Hamburger Menu",
    description:
      "Menu hamburger (☰) di bagian kiri atas adalah pusat navigasi utama aplikasi. Klik untuk membuka/menutup sidebar dan mengakses semua fitur seperti Daily Focus, Timeline, Tasks, Goals, dan pengaturan lainnya. Menu ini responsif dan mudah digunakan di desktop maupun mobile.",
    icon: Menu,
    selector: '[data-tour="hamburger-menu"]',
    position: "right",
    category: "navigation",
  },
  {
    id: "notifications",
    title: "Notifikasi - Update Real-time",
    description:
      "Dapatkan notifikasi real-time tentang aktivitas tim, deadline yang mendekat, pencapaian milestone, dan update penting lainnya. Sistem notifikasi yang cerdas membantu Anda tetap up-to-date tanpa mengganggu fokus kerja.",
    icon: Bell,
    selector: '[data-tour="notifications"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "user-profile",
    title: "Profil Pengguna - Akun & Pengaturan",
    description:
      "Kelola profil pengguna Anda dengan mengklik avatar di pojok kanan atas. Dari sini Anda bisa mengubah informasi pribadi, mengatur preferensi notifikasi, mengelola keamanan akun, dan mengakses pengaturan lainnya. Dropdown ini juga menyediakan akses cepat untuk logout.",
    icon: Users,
    selector: '[data-tour="user-profile"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "daily-focus",
    title: "Daily Focus - Fokus Harian",
    description:
      "Pusat kendali produktivitas harian Anda. Di sini Anda dapat melihat tugas yang harus diselesaikan hari ini, update progress angka target, dan mengelola inisiatif yang sedang berjalan. Fitur ini membantu Anda tetap fokus pada prioritas utama dan tidak kehilangan momentum dalam mencapai tujuan.",
    icon: Sun,
    selector: '[data-tour="daily-focus"]',
    position: "right",
    category: "action",
    targetPath: "/daily-focus",
  },

  {
    id: "update-harian-instan",
    title: "Update Harian Instan - Pencatatan Progress Cepat",
    description:
      'Tombol "Update Harian Instan" memungkinkan Anda mencatat progress harian dengan mudah dan cepat. Klik tombol ini untuk melakukan update status task dan mencatat pencapaian harian. Fitur ini membantu mempertahankan momentum dan konsistensi dalam pelacakan progress.',
    icon: Zap,
    selector: '[data-tour="update-harian-instan"]',
    position: "bottom",
    category: "action",
  },
  {
    id: "overview-cards",
    title: "Overview Cards - Ringkasan Aktivitas",
    description:
      "Kartu overview memberikan gambaran cepat tentang aktivitas harian Anda. Lihat jumlah task yang harus diselesaikan, progress angka target, inisiatif yang sedang berjalan, dan statistik gamifikasi. Informasi ini membantu Anda memahami beban kerja dan prioritas untuk hari ini.",
    icon: BarChart3,
    selector: '[data-tour="overview-cards"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "goal-terkait-aktivitas",
    title: "Goal Terkait - Hubungan Aktivitas dengan Tujuan",
    description:
      "Bagian ini menampilkan goal yang terkait dengan aktivitas harian Anda. Fitur ini membantu Anda tetap fokus pada tujuan utama dan memahami bagaimana aktivitas harian berkontribusi pada pencapaian goal organisasi.",
    icon: Target,
    selector: '[data-tour="goal-terkait-aktivitas"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "task-prioritas-tab",
    title: "Tab Task Prioritas - Manajemen Tugas Harian",
    description:
      "Tab Task Prioritas menampilkan semua tugas yang perlu diselesaikan, diurutkan berdasarkan prioritas dan deadline. Anda dapat melihat task yang terlambat, task hari ini, dan task yang akan datang. Klik tab ini untuk mengelola dan mengubah status tugas sesuai progress aktual.",
    icon: CheckSquare,
    selector: '[data-tour="task-prioritas"]',
    position: "bottom",
    category: "action",
  },
  {
    id: "update-progress-tab",
    title: "Tab Update Progress - Update Capaian Angka Target",
    description:
      "Tab Update Progress memungkinkan Anda memperbarui capaian angka target yang sedang aktif. Klik tab ini untuk melakukan update capaian pada angka target. Fitur ini penting untuk melacak kemajuan menuju target yang telah ditetapkan.",
    icon: TrendingUp,
    selector: '[data-tour="update-progress-tab"]',
    position: "bottom",
    category: "action",
    requiresClick: true,
  },
  {
    id: "kelola-inisiatif-tab",
    title: "Tab Kelola Inisiatif - Manajemen Proyek",
    description:
      "Tab Kelola Inisiatif menampilkan semua inisiatif (proyek) yang sedang berjalan dan memerlukan perhatian. Klik tab ini untuk mengelola inisiatif, memperbarui success metrics, dan melacak progress proyek. Fitur ini membantu koordinasi tim dalam menjalankan inisiatif strategis.",
    icon: Rocket,
    selector: '[data-tour="kelola-inisiatif-tab"]',
    position: "bottom",
    category: "action",
    requiresClick: true,
  },
  {
    id: "goals",
    title: "Goals - Manajemen Tujuan",
    description:
      "Kelola seluruh tujuan organisasi menggunakan metodologi OKR (Objectives and Key Results). Buat objectives yang inspiratif dan tentukan key results yang terukur untuk melacak pencapaian. Sistem ini membantu menyelaraskan visi organisasi dengan eksekusi yang nyata dan terukur.",
    icon: Target,
    selector: '[data-tour="goals"]',
    position: "right",
    category: "feature",
    targetPath: "/goals",
    requiresClick: true,
  },
  {
    id: "goals-add-button",
    title: "Goals - Tambah Tujuan Baru",
    description:
      'Tombol "Tambah Tujuan Baru" memungkinkan Anda membuat objectives dan key results baru. Setiap tujuan dapat memiliki multiple key results untuk pengukuran yang lebih akurat.',
    icon: Target,
    selector: '[data-tour="add-goal"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "goals-filter",
    title: "Goals - Filter & Pencarian",
    description:
      "Gunakan filter untuk mencari goals berdasarkan status, siklus, dan penanggungjawab. Filter membantu Anda fokus pada goals yang relevan dengan prioritas saat ini.",
    icon: Target,
    selector: '[data-tour="goals-filter"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "goals-overview",
    title: "Goals - Ringkasan Overview",
    description:
      "Kartu overview menampilkan statistik keseluruhan goals Anda termasuk jumlah total, progress rata-rata, dan distribusi status. Informasi ini memberikan gambaran cepat tentang performa organisasi.",
    icon: Target,
    selector: '[data-tour="goals-overview-card"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "goals-list-view-tab",
    title: "Goals - Tampilan List",
    description:
      "Tampilan List menampilkan semua goals dalam format kartu yang mudah dipahami. Setiap kartu menunjukkan detail lengkap termasuk progress, key results, dan informasi penanggungjawab.",
    icon: Target,
    selector: '[data-tour="goals-list-view"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "goals-hierarchy-view-tab",
    title: "Goals - Tampilan Hierarchy",
    description:
      "Tampilan Hierarchy menunjukkan struktur hubungan antar goals dalam bentuk visual yang mudah dipahami. Fitur ini membantu Anda memahami bagaimana goals saling terkait dan mendukung satu sama lain.",
    icon: Target,
    selector: '[data-tour="goals-hierarchy-view"]',
    position: "bottom",
    category: "feature",
    requiresClick: true,
  },
  {
    id: "tasks",
    title: "Tasks - Manajemen Tugas",
    description:
      "Pantau dan kelola semua tugas yang terkait dengan objectives dan key results. Atur prioritas, deadline, dan assignee untuk setiap tugas. Fitur ini memungkinkan kolaborasi tim yang efektif dan memastikan setiap pekerjaan berkontribusi pada pencapaian tujuan organisasi.",
    icon: CheckSquare,
    selector: '[data-tour="tasks"]',
    position: "right",
    category: "feature",
    targetPath: "/tasks",
    requiresClick: true,
  },
  {
    id: "tasks-content",
    title: "Tasks - Filter & Pencarian",
    description:
      "Gunakan filter dan pencarian untuk menemukan tugas dengan cepat. Anda dapat memfilter berdasarkan status, prioritas, penanggungjawab, dan tim untuk manajemen yang lebih efisien.",
    icon: CheckSquare,
    selector: '[data-tour="tasks-filter"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "timeline",
    title: "Timeline - Riwayat Progress",
    description:
      "Visualisasi kronologis dari semua aktivitas dan progress yang telah dicapai. Lihat check-in, pencapaian milestone, dan perkembangan key results dalam format timeline yang mudah dipahami. Fitur ini memberikan gambaran historis yang komprehensif tentang perjalanan organisasi.",
    icon: Clock,
    selector: '[data-tour="timeline"]',
    position: "right",
    category: "feature",
    targetPath: "/timeline",
    requiresClick: true,
  },
  {
    id: "timeline-content",
    title: "Timeline - Daily Check-in",
    description:
      "Tombol Daily Check-in memungkinkan Anda mencatat progress harian dengan mudah. Setiap check-in akan ditampilkan dalam timeline kronologis untuk tracking yang lebih baik.",
    icon: Clock,
    selector: '[data-tour="timeline-checkin"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "cycles",
    title: "Siklus - Periode Waktu",
    description:
      "Atur periode waktu untuk goals Anda (bulanan, kuartalan, atau tahunan). Siklus membantu mengorganisir objectives berdasarkan timeframe yang realistis dan memungkinkan perencanaan yang lebih terstruktur. Setiap siklus memiliki target dan milestone yang jelas.",
    icon: Calendar,
    selector: '[data-tour="cycles"]',
    position: "right",
    category: "feature",
    targetPath: "/cycles",
    requiresClick: true,
  },
  {
    id: "cycles-content",
    title: "Siklus - Kelola Periode",
    description:
      "Tabel siklus menampilkan semua periode waktu yang telah dibuat. Anda dapat melihat tanggal mulai, berakhir, dan status setiap siklus untuk perencanaan yang lebih baik.",
    icon: Calendar,
    selector: '[data-tour="cycles-table"]',
    position: "top",
    category: "feature",
  },
  {
    id: "achievements",
    title: "Pencapaian - Sistem Reward",
    description:
      "Lihat badges, rewards, dan pencapaian yang telah diraih oleh tim. Sistem gamifikasi ini dirancang untuk meningkatkan motivasi dan engagement anggota tim. Setiap pencapaian mencerminkan kontribusi nyata terhadap tujuan organisasi.",
    icon: Trophy,
    selector: '[data-tour="achievements"]',
    position: "right",
    category: "feature",
    targetPath: "/achievements",
    requiresClick: true,
  },
  {
    id: "achievements-content",
    title: "Pencapaian - Leaderboard",
    description:
      "Leaderboard menampilkan ranking anggota tim berdasarkan poin yang diperoleh. Sistem ini menciptakan kompetisi sehat dan memotivasi tim untuk mencapai target lebih baik.",
    icon: Trophy,
    selector: '[data-tour="leaderboard"]',
    position: "top",
    category: "feature",
  },
  {
    id: "analytics",
    title: "Analytics - Dashboard Performa",
    description:
      "Analisis mendalam tentang performa tim dan pencapaian objectives. Dashboard ini menyediakan insights berbasis data untuk membantu pengambilan keputusan strategis. Lihat tren progress, identifikasi area yang perlu perbaikan, dan ukur ROI dari setiap inisiatif.",
    icon: BarChart3,
    selector: '[data-tour="analytics"]',
    position: "right",
    category: "feature",
    targetPath: "/analytics",
    requiresClick: true,
  },
  {
    id: "analytics-content",
    title: "Analytics - Grafik Performa",
    description:
      "Grafik dan chart memberikan visualisasi performa tim dalam bentuk yang mudah dipahami. Analisis tren ini membantu dalam pengambilan keputusan strategis.",
    icon: BarChart3,
    selector: '[data-tour="analytics-chart"]',
    position: "top",
    category: "feature",
  },
  {
    id: "users",
    title: "Kelola Pengguna - Tim Management",
    description:
      "Undang anggota tim baru, kelola peran dan permissions, serta atur akses pengguna ke berbagai fitur. Sistem role-based access control memastikan setiap anggota tim memiliki akses yang tepat sesuai dengan tanggung jawab mereka dalam organisasi.",
    icon: Users,
    selector: '[data-tour="users"]',
    position: "right",
    category: "navigation",
    targetPath: "/users",
    requiresClick: true,
  },
  {
    id: "users-content",
    title: "Kelola Pengguna - Undang Tim",
    description:
      'Tombol "Undang Pengguna" memungkinkan Anda menambahkan anggota tim baru dengan mengatur peran dan permissions yang sesuai. Setiap pengguna dapat memiliki akses yang berbeda sesuai tanggung jawabnya.',
    icon: Users,
    selector: '[data-tour="invite-user"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "settings",
    title: "Pengaturan - Konfigurasi Sistem",
    description:
      "Kelola preferensi organisasi, konfigurasi billing dan subscription, pengaturan security, dan customization sistem. Area ini memberikan kontrol penuh terhadap bagaimana platform OKR bekerja sesuai dengan kebutuhan spesifik organisasi Anda.",
    icon: Settings,
    selector: '[data-tour="settings"]',
    position: "right",
    category: "navigation",
    targetPath: "/settings",
    requiresClick: true,
  },
  {
    id: "settings-content",
    title: "Pengaturan - Organisasi",
    description:
      "Pengaturan organisasi memungkinkan Anda mengonfigurasi nama perusahaan, informasi kontak, dan preferensi sistem yang akan mempengaruhi seluruh tim dalam organisasi.",
    icon: Settings,
    selector: '[data-tour="org-settings"]',
    position: "top",
    category: "feature",
  },
];

export default function TourSystem() {
  // Own state management (not using useTour hook)
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [location, setLocation] = useLocation();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  const totalSteps = TOUR_STEPS.length;

  // Tour control functions
  const nextStep = () => {
    // Clean up highlights from previous step
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
  };

  const completeTour = () => {
    setIsActive(false);
    setIsVisible(false);
    localStorage.setItem("tour-completed", "true");
    cleanupHighlights();
  };

  console.log("TourSystemNew state:", { isActive, currentStep, totalSteps });

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
    localStorage.setItem("welcome-screen-shown", "true");
  };

  const handleStartTourFromWelcome = () => {
    setShowWelcomeScreen(false);
    localStorage.setItem("welcome-screen-shown", "true");
    setIsActive(true);
    setCurrentStep(0);
  };

  const showWelcomeScreenManually = () => {
    console.log("showWelcomeScreenManually called");
    localStorage.removeItem("welcome-screen-shown");
    localStorage.setItem("onboarding-completed", "true");
    setShowWelcomeScreen(true);
    console.log("Welcome screen state set to true");
  };

  const restartTourFromHamburgerMenu = () => {
    console.log("Tour restarted from hamburger menu step");
    setIsActive(true);
    setCurrentStep(0);
    setIsVisible(true);
    setTimeout(() => highlightCurrentStep(), 100);
  };

  // Auto-restart tour from hamburger menu when component mounts
  useEffect(() => {
    // If tour is already active, restart it from step 0 (hamburger menu)
    if (isActive) {
      console.log("Auto-restarting tour from hamburger menu");
      restartTourFromHamburgerMenu();
    }
  }, [isActive]);

  // Listen for start tour event
  useEffect(() => {
    const handleStartTour = () => {
      // Check if onboarding is completed first
      const onboardingCompleted =
        localStorage.getItem("onboarding-completed") === "true";
      const welcomeScreenShown =
        localStorage.getItem("welcome-screen-shown") === "true";

      if (onboardingCompleted && !welcomeScreenShown) {
        setShowWelcomeScreen(true);
      } else {
        // Start tour directly if no onboarding or welcome screen already shown
        setIsActive(true);
        setCurrentStep(0);
      }
    };

    const handleStartTourDirect = () => {
      setIsActive(true);
      setCurrentStep(0);
      setIsVisible(true);
      localStorage.removeItem("tour-completed");
    };

    const handleShowWelcomeScreen = () => {
      console.log("showWelcomeScreen event received");
      showWelcomeScreenManually();
    };

    window.addEventListener("startTour", handleStartTour);
    window.addEventListener("startTourDirect", handleStartTourDirect);
    window.addEventListener("showWelcomeScreen", handleShowWelcomeScreen);
    return () => {
      window.removeEventListener("startTour", handleStartTour);
      window.removeEventListener("startTourDirect", handleStartTourDirect);
      window.removeEventListener("showWelcomeScreen", handleShowWelcomeScreen);
    };
  }, []);

  const highlightCurrentStep = () => {
    const currentStepData = TOUR_STEPS[currentStep];
    const element = document.querySelector(currentStepData.selector);

    console.log(
      `Step ${currentStep + 1}: Looking for element: ${currentStepData.selector}`,
      element,
    );

    // Debug: Show all available data-tour elements
    const allTourElements = document.querySelectorAll("[data-tour]");
    console.log(
      "All available tour elements:",
      Array.from(allTourElements).map((el) => el.getAttribute("data-tour")),
    );

    if (element) {
      // Remove existing highlights and click handlers
      document.querySelectorAll(".tour-highlight").forEach((el) => {
        el.classList.remove("tour-highlight");
        el.classList.remove("tour-click-required");
      });

      // Add highlight to current element
      element.classList.add("tour-highlight");

      // If this step requires a click, add click handler
      if (currentStepData.requiresClick) {
        setWaitingForClick(true);

        // Add click event listener
        const handleClick = (e) => {
          // Don't prevent default for certain interactive elements - let them work normally
          if (currentStepData.selector === '[data-tour="goals-expand-card"]' || 
              currentStepData.selector === '[data-tour="goals-hierarchy-view"]' ||
              currentStepData.selector === '[data-tour="update-progress-tab"]' ||
              currentStepData.selector === '[data-tour="kelola-inisiatif-tab"]') {
            // Let the original click handler execute first
            // Don't prevent default so the functionality works
          } else {
            e.preventDefault();
            e.stopPropagation();
          }

          // Remove click handler and highlights immediately
          element.removeEventListener("click", handleClick);
          element.classList.remove("tour-highlight");
          element.classList.remove("tour-click-required");
          setWaitingForClick(false);

          // Navigate to target path if specified
          if (currentStepData.targetPath) {
            console.log("Navigating to:", currentStepData.targetPath);
            setLocation(currentStepData.targetPath);
          }

          // Continue to next step after a short delay
          setTimeout(() => {
            nextStep();
          }, 500);
        };

        element.addEventListener("click", handleClick);

        // Add visual indication that click is required
        element.classList.add("tour-click-required");
      } else {
        // Reset waitingForClick to false for steps that don't require a click
        setWaitingForClick(false);
      }

      // Scroll element into view smoothly
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Wait for scroll to complete then calculate position
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 380;
        const tooltipHeight = 300; // Increased height to accommodate content

        let x = rect.left + rect.width / 2 - tooltipWidth / 2;
        let y = rect.top - tooltipHeight - 150; // Moved tooltip even higher up

        // Adjust position based on step position
        switch (currentStepData.position) {
          case "right":
            x = rect.right + 15;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "left":
            x = rect.left - tooltipWidth - 15;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "bottom":
            y = rect.bottom + 30; // Increased spacing for bottom positioning
            break;
          case "top":
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
      console.warn(
        `Element not found for selector: ${currentStepData.selector}`,
      );
    }
  };

  const cleanupHighlights = () => {
    document.querySelectorAll(".tour-highlight").forEach((el) => {
      el.classList.remove("tour-highlight");
      el.classList.remove("tour-click-required");
    });
  };

  // Handle window resize and cleanup
  useEffect(() => {
    if (isActive) {
      const handleResize = () => {
        setTimeout(() => highlightCurrentStep(), 100);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup on unmount
      return () => {
        window.removeEventListener("resize", handleResize);
        cleanupHighlights();
      };
    }
  }, [isActive, currentStep]);

  // Only return null if neither tour is active nor welcome screen should show
  if ((!isActive || !isVisible) && !showWelcomeScreen) return null;

  const currentStepData = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Tour tooltip - only show when tour is active */}
      {isActive && isVisible && (
        <div
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-orange-200 border-2"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            width: "380px",
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
    </>
  );
}
