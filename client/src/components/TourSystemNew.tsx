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
  Activity,
  Filter,
  Medal,
  Briefcase,
  HelpCircle,
  LayoutDashboard,
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
    id: "dashboard",
    title: "Dashboard - Pusat Kendali",
    description:
      "Pusat kendali produktivitas harian Anda. Di sini Anda dapat melihat tugas yang harus diselesaikan hari ini, update progress angka target, dan mengelola inisiatif yang sedang berjalan. Dashboard ini membantu Anda tetap fokus pada prioritas utama dan tidak kehilangan momentum dalam mencapai tujuan.",
    icon: LayoutDashboard,
    selector: '[data-tour="dashboard"]',
    position: "right",
    category: "action",
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
    category: "feature",
    targetPath: "/goals",
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
  },


  // Analytics page tour
  {
    id: "analytics",
    title: "Analytics - Laporan & Analisa",
    description:
      "Halaman Analytics menyediakan dashboard komprehensif untuk monitor progress dan performa Goal, Initiative, serta Tim. Anda dapat melihat berbagai grafik, chart, dan statistik untuk evaluasi pencapaian organisasi secara data-driven.",
    icon: Activity,
    selector: '[data-tour="analytics"]',
    position: "right",
    category: "navigation",
    targetPath: "/analytics",
  },

  {
    id: "users",
    title: "Manajemen Tim - Kelola Pengguna",
    description:
      "Menu Manajemen Tim untuk mengelola anggota organisasi. Di sini Anda dapat mengundang pengguna baru, mengatur role dan permission, mengelola tim, serta mengontrol akses pengguna ke sistem.",
    icon: Users,
    selector: '[data-tour="users"]',
    position: "right",
    category: "navigation",
    targetPath: "/client-users",
  },

  {
    id: "settings",
    title: "Pengaturan - Konfigurasi Sistem",
    description:
      "Menu Pengaturan untuk mengonfigurasi organisasi, profil perusahaan, preferensi sistem, dan berbagai pengaturan yang mempengaruhi seluruh tim dalam organisasi.",
    icon: Settings,
    selector: '[data-tour="settings"]',
    position: "right",
    category: "navigation",
    targetPath: "/organization-settings",
  },

  {
    id: "help",
    title: "Help Center - Bantuan & Dukungan",
    description:
      "Help Center berisi dokumentasi lengkap, FAQ, tutorial, dan berbagai sumber daya untuk membantu Anda menggunakan platform dengan optimal. Akses panduan, tips, dan dukungan teknis di sini.",
    icon: HelpCircle,
    selector: '[data-tour="help"]',
    position: "right",
    category: "navigation",
    targetPath: "/help",
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const { user, isLoading } = useAuth();
  const totalSteps = TOUR_STEPS.length;

  // Function to check if two steps are on the same page
  const areStepsOnSamePage = (step1Index: number, step2Index: number) => {
    if (step1Index < 0 || step1Index >= TOUR_STEPS.length || 
        step2Index < 0 || step2Index >= TOUR_STEPS.length) {
      return false;
    }
    
    const step1 = TOUR_STEPS[step1Index];
    const step2 = TOUR_STEPS[step2Index];
    
    // Check if both steps have the same targetPath or both don't have targetPath
    return step1.targetPath === step2.targetPath;
  };

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

  const completeTour = async () => {
    try {
      // Call API to mark tour as completed
      const response = await fetch('/api/tour/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
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

  console.log("TourSystemNew state:", { isActive, currentStep, totalSteps });

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
    const handleStartTour = async (event: any) => {
      try {
        // Call API to mark tour as started
        const response = await fetch('/api/tour/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log("✅ Tour marked as started in database");
        } else {
          console.warn("⚠️ Failed to mark tour as started in database");
        }
      } catch (error) {
        console.warn("⚠️ Error marking tour as started:", error);
      }

      // If event comes from welcome screen, start tour directly
      if (event?.detail?.fromWelcomeScreen) {
        setIsActive(true);
        setCurrentStep(0);
        setIsVisible(true);
        localStorage.removeItem("tour-completed");
        console.log("🚀 Tour started from welcome screen");
        return;
      }
      
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

  // Function to detect if we're on mobile
  const isMobile = () => {
    return window.innerWidth <= 768; // Tailwind's md breakpoint
  };

  // Function to check if the current step is a menu item
  const isMenuStep = (stepId: string) => {
    const menuSteps = [
      "daily-focus",
      "goals", 
      "tasks",
      "timeline",
      "cycles",
      "achievements",
      "analytics",
      "users",
      "settings"
    ];
    return menuSteps.includes(stepId);
  };

  // Function to expand sidebar on mobile for menu items
  const expandSidebarForMobile = () => {
    if (isMobile()) {
      // Find the hamburger menu button and click it to expand sidebar
      const hamburgerButton = document.querySelector('[data-tour="hamburger-menu"]');
      if (hamburgerButton) {
        // Only click if sidebar is not already open
        const sidebar = document.querySelector('[data-sidebar="sidebar"]');
        if (!sidebar || !sidebar.classList.contains('translate-x-0')) {
          (hamburgerButton as HTMLElement).click();
          // Return promise to wait for sidebar animation
          return new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    return Promise.resolve();
  };

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

    // Handle sidebar expansion/closing logic for mobile
    if (isMobile()) {
      const previousStepData = currentStep > 0 ? TOUR_STEPS[currentStep - 1] : null;
      const isCurrentMenuStep = isMenuStep(currentStepData.id);
      const isPreviousMenuStep = previousStepData ? isMenuStep(previousStepData.id) : false;
      const areOnSamePage = previousStepData ? areStepsOnSamePage(currentStep - 1, currentStep) : false;
      
      if (isCurrentMenuStep) {
        // Expand sidebar for menu items
        expandSidebarForMobile().then(() => {
          // Re-highlight after sidebar animation completes
          setTimeout(() => {
            const updatedElement = document.querySelector(currentStepData.selector);
            if (updatedElement) {
              // Remove any existing highlights first
              document.querySelectorAll(".tour-highlight, .tour-mobile-pulse").forEach((el) => {
                el.classList.remove("tour-highlight", "tour-click-required", "tour-mobile-pulse");
              });
              // Then highlight the current element with mobile pulse
              updatedElement.classList.add("tour-highlight", "tour-mobile-pulse");
              
              // Also add pulse to button inside if it exists
              const button = updatedElement.querySelector("button");
              if (button) {
                button.classList.add("tour-mobile-pulse");
              }
              
              console.log(`Mobile: Re-highlighted menu item ${currentStepData.id} after sidebar expansion`);
            }
          }, 200);
        });
      } else if (isPreviousMenuStep && !areOnSamePage) {
        // Only close sidebar if transitioning from menu step to non-menu step AND changing pages
        console.log(`Closing sidebar: moving from ${previousStepData?.id} to ${currentStepData.id} (different pages)`);
        const hamburgerButton = document.querySelector('[data-tour="hamburger-menu"]');
        if (hamburgerButton) {
          (hamburgerButton as HTMLElement).click();
        }
      } else if (isPreviousMenuStep && areOnSamePage) {
        // Keep sidebar open when transitioning between steps on the same page
        console.log(`Keeping sidebar open: moving from ${previousStepData?.id} to ${currentStepData.id} (same page)`);
      }
    }

    if (element) {
      // For mobile menu items, we still need to add highlights but handle them differently
      if (isMobile() && isMenuStep(currentStepData.id)) {
        console.log(`Mobile: Adding pulse to menu item ${currentStepData.id} in expanded sidebar`);
        
        // Make sure to add pulse to the menu item even in mobile
        element.classList.add("tour-highlight", "tour-mobile-pulse");
        const button = element.querySelector("button");
        if (button) {
          button.classList.add("tour-mobile-pulse");
        }
      } else {
        // Remove existing highlights and click handlers
        document.querySelectorAll(".tour-highlight, .tour-mobile-pulse").forEach((el) => {
          el.classList.remove("tour-highlight", "tour-click-required", "tour-mobile-pulse");
        });

        // Add highlight to current element
        element.classList.add("tour-highlight");
        
        // Add mobile pulse for better visibility on mobile
        if (isMobile()) {
          element.classList.add("tour-mobile-pulse");
          const button = element.querySelector("button");
          if (button) {
            button.classList.add("tour-mobile-pulse");
          }
        }
      }

      // If this step requires a click, add click handler
      if (currentStepData.requiresClick) {
        setWaitingForClick(true);

        // Add click event listener
        const handleClick = (e: Event) => {
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
      // Add extra delay for mobile menu items to ensure sidebar animation completes
      const delay = isMobile() && isMenuStep(currentStepData.id) ? 500 : 300;
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const tooltipWidth = isMobile() ? Math.min(window.innerWidth - 30, 380) : 380;
        const tooltipHeight = 300; // Increased height to accommodate content
        const padding = 20;
        let x, y;

        // Smart positioning logic to avoid covering highlighted element
        if (isMobile() && isMenuStep(currentStepData.id)) {
          // For mobile menu items, position tooltip far to the right or bottom
          const sidebarWidth = 280; // Approximate sidebar width
          if (window.innerWidth > sidebarWidth + tooltipWidth + 30) {
            // Position to the right of sidebar
            x = sidebarWidth + 15;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
          } else {
            // Position at bottom with full width, ensuring it doesn't cover element
            x = 15;
            y = Math.max(rect.bottom + padding, window.innerHeight - tooltipHeight - 15);
          }
        } else if (isMobile()) {
          // For mobile non-menu items, use smart positioning
          x = 15; // Left edge with padding

          const spaceAbove = rect.top;
          const spaceBelow = window.innerHeight - rect.bottom;
          
          // Check if element is in center, top, or bottom of screen
          const elementCenter = rect.top + rect.height / 2;
          const screenCenter = window.innerHeight / 2;
          
          if (elementCenter < screenCenter && spaceBelow >= tooltipHeight + padding) {
            // Element in top half, position below
            y = rect.bottom + padding;
          } else if (elementCenter >= screenCenter && spaceAbove >= tooltipHeight + padding) {
            // Element in bottom half, position above
            y = rect.top - tooltipHeight - padding;
          } else {
            // Use the side with more space
            if (spaceBelow > spaceAbove) {
              y = rect.bottom + padding;
            } else {
              y = Math.max(15, rect.top - tooltipHeight - padding);
            }
          }
        } else {
          // Desktop smart positioning with collision avoidance
          const spaceRight = window.innerWidth - rect.right;
          const spaceLeft = rect.left;
          const spaceAbove = rect.top;
          const spaceBelow = window.innerHeight - rect.bottom;
          
          // Determine best position based on available space and preference
          switch (currentStepData.position) {
            case "right":
              if (spaceRight >= tooltipWidth + padding) {
                x = rect.right + padding;
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              } else if (spaceLeft >= tooltipWidth + padding) {
                // Fallback to left
                x = rect.left - tooltipWidth - padding;
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              } else if (spaceBelow >= tooltipHeight + padding) {
                // Fallback to bottom
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = rect.bottom + padding;
              } else {
                // Fallback to top
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = Math.max(15, rect.top - tooltipHeight - padding);
              }
              break;
              
            case "left":
              if (spaceLeft >= tooltipWidth + padding) {
                x = rect.left - tooltipWidth - padding;
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              } else if (spaceRight >= tooltipWidth + padding) {
                // Fallback to right
                x = rect.right + padding;
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              } else if (spaceBelow >= tooltipHeight + padding) {
                // Fallback to bottom
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = rect.bottom + padding;
              } else {
                // Fallback to top
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = Math.max(15, rect.top - tooltipHeight - padding);
              }
              break;
              
            case "bottom":
              if (spaceBelow >= tooltipHeight + padding) {
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = rect.bottom + padding;
              } else if (spaceAbove >= tooltipHeight + padding) {
                // Fallback to top
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = rect.top - tooltipHeight - padding;
              } else if (spaceRight >= tooltipWidth + padding) {
                // Fallback to right
                x = rect.right + padding;
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              } else {
                // Fallback to left
                x = Math.max(15, rect.left - tooltipWidth - padding);
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              }
              break;
              
            case "top":
            default:
              if (spaceAbove >= tooltipHeight + padding) {
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = rect.top - tooltipHeight - padding;
              } else if (spaceBelow >= tooltipHeight + padding) {
                // Fallback to bottom
                x = Math.max(15, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 15));
                y = rect.bottom + padding;
              } else if (spaceRight >= tooltipWidth + padding) {
                // Fallback to right
                x = rect.right + padding;
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              } else {
                // Fallback to left
                x = Math.max(15, rect.left - tooltipWidth - padding);
                y = Math.max(15, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 15));
              }
              break;
          }
        }

        // Final viewport boundary check with collision detection
        // Ensure modal doesn't overlap with highlighted element
        const modalRect = {
          left: x,
          top: y,
          right: x + tooltipWidth,
          bottom: y + tooltipHeight
        };
        
        // Check for overlap with highlighted element
        const hasOverlap = !(modalRect.right < rect.left || 
                            modalRect.left > rect.right || 
                            modalRect.bottom < rect.top || 
                            modalRect.top > rect.bottom);
        
        if (hasOverlap) {
          // If there's still overlap, push modal away from element
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const modalCenterX = x + tooltipWidth / 2;
          const modalCenterY = y + tooltipHeight / 2;
          
          // Determine which direction to move modal
          if (Math.abs(modalCenterX - centerX) > Math.abs(modalCenterY - centerY)) {
            // Move horizontally
            if (modalCenterX < centerX) {
              x = Math.max(15, rect.left - tooltipWidth - padding);
            } else {
              x = Math.min(window.innerWidth - tooltipWidth - 15, rect.right + padding);
            }
          } else {
            // Move vertically
            if (modalCenterY < centerY) {
              y = Math.max(15, rect.top - tooltipHeight - padding);
            } else {
              y = Math.min(window.innerHeight - tooltipHeight - 15, rect.bottom + padding);
            }
          }
        }

        // Final boundary check
        x = Math.max(15, Math.min(x, window.innerWidth - tooltipWidth - 15));
        y = Math.max(15, Math.min(y, window.innerHeight - tooltipHeight - 15));

        setTooltipPosition({ x, y });
      }, delay);
    } else {
      console.warn(
        `Element not found for selector: ${currentStepData.selector}`,
      );
    }
  };

  const cleanupHighlights = () => {
    document.querySelectorAll(".tour-highlight, .tour-mobile-pulse").forEach((el) => {
      el.classList.remove("tour-highlight", "tour-click-required", "tour-mobile-pulse");
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
  
  // Safety check: if currentStepData is undefined, complete the tour
  if (!currentStepData) {
    completeTour();
    return null;
  }
  
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
