import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingProgress, useUpdateOnboardingProgress } from "@/hooks/useOnboardingProgress";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right";
  action?: "click" | "navigate" | "input" | "observe";
  nextRoute?: string;
  content?: React.ReactNode;
  canSkip?: boolean;
  isCompleted?: boolean;
}

export interface OnboardingTour {
  id: string;
  name: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  isActive?: boolean;
}

interface OnboardingContextType {
  // Current state
  isOnboardingActive: boolean;
  currentTour: OnboardingTour | null;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  
  // Tour management
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  completeTour: () => void;
  skipTour: () => void;
  
  // Progress tracking
  completedTours: string[];
  markTourCompleted: (tourId: string) => void;
  isFirstTimeUser: boolean;
  
  // Tour control
  highlightElement: (selector: string) => void;
  removeHighlight: () => void;
  showTooltip: (step: OnboardingStep) => void;
  hideTooltip: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};

// Define available tours
export const ONBOARDING_TOURS: OnboardingTour[] = [
  {
    id: "welcome",
    name: "Welcome Tour",
    title: "Selamat Datang di OKR Management!",
    description: "Mari kenali fitur-fitur utama platform ini",
    steps: [
      {
        id: "welcome-1",
        title: "Selamat Datang!",
        description: "Platform OKR Management akan membantu Anda mengelola objectives dan key results dengan efektif. Mari mulai perjalanan Anda!",
        action: "observe",
        canSkip: false
      },
      {
        id: "welcome-2", 
        title: "Dashboard Goals",
        description: "Ini adalah halaman utama untuk melihat semua objectives dan progress Anda. Di sini Anda bisa memantau seluruh pencapaian.",
        target: "[data-tour='dashboard-header']",
        action: "observe",
        canSkip: true
      },
      {
        id: "welcome-3",
        title: "Buat Objective Pertama",
        description: "Klik tombol 'Buat OKR' untuk membuat objective dan key results pertama Anda.",
        target: "[data-tour='create-okr-button']",
        action: "click",
        canSkip: true
      },
      {
        id: "welcome-4",
        title: "Sidebar Navigasi",
        description: "Gunakan sidebar ini untuk mengakses semua fitur seperti Daily Focus, Templates, dan Analytics.",
        target: "[data-tour='sidebar-nav']",
        action: "observe",
        canSkip: true
      }
    ]
  },
  {
    id: "daily-focus",
    name: "Daily Focus Tour", 
    title: "Mengelola Aktivitas Harian",
    description: "Pelajari cara menggunakan Daily Focus untuk produktivitas optimal",
    steps: [
      {
        id: "daily-1",
        title: "Daily Focus Dashboard",
        description: "Halaman ini membantu Anda fokus pada prioritas harian dan mengelola task yang perlu diselesaikan hari ini.",
        target: "[data-tour='daily-focus-header']",
        action: "observe",
        nextRoute: "/daily-focus"
      },
      {
        id: "daily-2",
        title: "Overview Cards",
        description: "Cards ini menampilkan ringkasan task harian, key results aktif, dan initiative yang sedang berjalan.",
        target: "[data-tour='daily-overview']",
        action: "observe",
        canSkip: true
      },
      {
        id: "daily-3",
        title: "Task Prioritas",
        description: "Di sini Anda bisa melihat dan mengelola task berdasarkan prioritas: overdue, hari ini, dan besok.",
        target: "[data-tour='task-priority-section']",
        action: "observe",
        canSkip: true
      },
      {
        id: "daily-4",
        title: "Tambah Task Baru",
        description: "Klik tombol ini untuk menambahkan task baru ke daftar prioritas harian Anda.",
        target: "[data-tour='add-task-button']",
        action: "click",
        canSkip: true
      }
    ]
  },
  {
    id: "okr-creation",
    name: "OKR Creation Tour",
    title: "Membuat OKR Pertama",
    description: "Tutorial lengkap membuat Objective dan Key Results",
    steps: [
      {
        id: "okr-1",
        title: "Form Objective",
        description: "Mulai dengan menulis objective yang jelas dan terukur. Objective adalah tujuan yang ingin Anda capai.",
        target: "[data-tour='objective-form']",
        action: "observe",
        canSkip: false
      },
      {
        id: "okr-2",
        title: "Pilih Owner",
        description: "Tentukan siapa yang bertanggung jawab atas objective ini. Bisa Anda sendiri atau anggota tim lain.",
        target: "[data-tour='objective-owner']",
        action: "observe",
        canSkip: true
      },
      {
        id: "okr-3",
        title: "Tambah Key Results",
        description: "Key Results adalah metrik terukur yang menunjukkan kemajuan objective. Tambahkan minimal 2-3 key results.",
        target: "[data-tour='add-key-result']",
        action: "click",
        canSkip: true
      },
      {
        id: "okr-4",
        title: "Set Target Values",
        description: "Tetapkan nilai target yang spesifik dan terukur untuk setiap key result. Ini akan membantu tracking progress.",
        target: "[data-tour='key-result-targets']",
        action: "observe",
        canSkip: true
      }
    ]
  },
  {
    id: "team-collaboration",
    name: "Team Collaboration Tour",
    title: "Kolaborasi Tim",
    description: "Pelajari cara berkolaborasi dengan tim dalam mencapai objectives",
    steps: [
      {
        id: "team-1",
        title: "Goals Perusahaan",
        description: "Di halaman ini Anda bisa melihat objectives di level perusahaan dan tim. Klik untuk menjelajahi.",
        target: "[data-tour='company-goals']",
        action: "click",
        nextRoute: "/company-goals"
      },
      {
        id: "team-2",
        title: "Team Objectives",
        description: "Lihat bagaimana objectives Anda terhubung dengan tujuan tim dan perusahaan secara keseluruhan.",
        target: "[data-tour='team-objectives']",
        action: "observe",
        canSkip: true
      },
      {
        id: "team-3",
        title: "Assign Team Members",
        description: "Anda bisa menugaskan anggota tim ke key results spesifik untuk kolaborasi yang lebih baik.",
        target: "[data-tour='assign-members']",
        action: "observe",
        canSkip: true
      }
    ]
  },
  {
    id: "progress-tracking",
    name: "Progress Tracking Tour",
    title: "Tracking Progress",
    description: "Pelajari cara memantau dan update progress objectives",
    steps: [
      {
        id: "progress-1",
        title: "Progress Indicators",
        description: "Lihat berbagai indikator progress seperti progress bar, status badge, dan persentase completion.",
        target: "[data-tour='progress-indicators']",
        action: "observe",
        canSkip: false
      },
      {
        id: "progress-2",
        title: "Check-in Updates",
        description: "Gunakan fitur check-in untuk melaporkan progress secara berkala dan memberikan update status.",
        target: "[data-tour='checkin-button']",
        action: "click",
        canSkip: true
      },
      {
        id: "progress-3",
        title: "Analytics Dashboard",
        description: "Akses analytics untuk mendapatkan insights mendalam tentang performance dan trend progress.",
        target: "[data-tour='analytics-menu']",
        action: "click",
        nextRoute: "/analytics"
      }
    ]
  }
];
        description: "Lihat dan kelola task yang perlu diselesaikan hari ini.",
        target: "[data-tour='today-tasks']",
        action: "observe"
      },
      {
        id: "daily-3",
        title: "Update Progress",
        description: "Gunakan fitur ini untuk memperbarui progress key results Anda.",
        target: "[data-tour='progress-update']",
        action: "observe"
      }
    ]
  },
  {
    id: "create-okr",
    name: "Create OKR Tour",
    title: "Membuat OKR Pertama",
    description: "Panduan lengkap membuat Objective dan Key Results",
    steps: [
      {
        id: "okr-1",
        title: "Form Objective",
        description: "Mulai dengan menulis objective yang jelas dan menginspirasi.",
        target: "[data-tour='objective-title']",
        action: "input"
      },
      {
        id: "okr-2", 
        title: "Tambah Key Results",
        description: "Key Results adalah angka target yang dapat diukur untuk mencapai objective.",
        target: "[data-tour='add-key-result']",
        action: "click"
      },
      {
        id: "okr-3",
        title: "Simpan OKR",
        description: "Setelah selesai, simpan OKR Anda untuk mulai tracking progress.",
        target: "[data-tour='save-okr']",
        action: "click"
      }
    ]
  }
];

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentTour, setCurrentTour] = useState<OnboardingTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Get user onboarding progress using real API
  const { data: onboardingProgress } = useOnboardingProgress();
  const updateProgressMutation = useUpdateOnboardingProgress();

  const completedTours = onboardingProgress?.stepsCompleted || [];
  const isFirstTimeUser = !onboardingProgress?.isWelcomeWizardCompleted;

  const currentStep = currentTour?.steps[currentStepIndex] || null;

  // Tour management functions
  const startTour = (tourId: string) => {
    const tour = ONBOARDING_TOURS.find(t => t.id === tourId);
    if (tour) {
      setCurrentTour(tour);
      setCurrentStepIndex(0);
      setIsOnboardingActive(true);
      
      // Navigate to tour start route if specified
      if (tour.steps[0]?.nextRoute) {
        window.location.href = tour.steps[0].nextRoute;
      }
    }
  };

  const nextStep = () => {
    if (currentTour && currentStepIndex < currentTour.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = currentTour.steps[nextIndex];
      
      setCurrentStepIndex(nextIndex);
      
      // Navigate if needed
      if (nextStep.nextRoute) {
        window.location.href = nextStep.nextRoute;
      }
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const skipStep = () => {
    if (currentStep?.canSkip) {
      nextStep();
    }
  };

  const completeTour = () => {
    if (currentTour) {
      markTourCompleted(currentTour.id);
    }
    setIsOnboardingActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);
    removeHighlight();
    hideTooltip();
  };

  const skipTour = () => {
    setIsOnboardingActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);
    removeHighlight();
    hideTooltip();
  };

  const markTourCompleted = (tourId: string) => {
    const newCompletedTours = [...completedTours, tourId];
    updateProgressMutation.mutate({ completedTours: newCompletedTours });
  };

  // Visual helpers
  const highlightElement = (selector: string) => {
    setHighlightedElement(selector);
    
    // Add highlight class to element
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('onboarding-highlight');
    }
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      const element = document.querySelector(highlightedElement);
      if (element) {
        element.classList.remove('onboarding-highlight');
      }
    }
    setHighlightedElement(null);
  };

  const showTooltip = (step: OnboardingStep) => {
    setTooltipVisible(true);
    if (step.target) {
      highlightElement(step.target);
    }
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
    removeHighlight();
  };

  // Auto-start welcome tour for first-time users
  useEffect(() => {
    if (isAuthenticated && isFirstTimeUser && !isOnboardingActive) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        startTour("welcome");
      }, 1000);
    }
  }, [isAuthenticated, isFirstTimeUser, isOnboardingActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeHighlight();
    };
  }, []);

  const value: OnboardingContextType = {
    isOnboardingActive,
    currentTour,
    currentStepIndex,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipStep,
    completeTour,
    skipTour,
    completedTours,
    markTourCompleted,
    isFirstTimeUser,
    highlightElement,
    removeHighlight,
    showTooltip,
    hideTooltip
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};