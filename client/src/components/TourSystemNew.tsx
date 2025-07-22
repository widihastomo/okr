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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
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
      "Tab Update Progress memungkinkan Anda memperbarui capaian angka target yang sedang aktif. Tab ini menampilkan angka target yang memerlukan update. Fitur ini penting untuk melacak kemajuan menuju target yang telah ditetapkan.",
    icon: TrendingUp,
    selector: '[data-tour="update-progress-tab"]',
    position: "bottom",
    category: "action",
  },
  {
    id: "kelola-inisiatif-tab",
    title: "Tab Kelola Inisiatif - Manajemen Proyek",
    description:
      "Tab Kelola Inisiatif menampilkan semua inisiatif (proyek) yang sedang berjalan dan memerlukan perhatian. Tab ini menampilkan inisiatif yang dapat dikelola, success metrics yang dapat diperbarui, dan progress proyek. Fitur ini membantu koordinasi tim dalam menjalankan inisiatif strategis.",
    icon: Rocket,
    selector: '[data-tour="kelola-inisiatif-tab"]',
    position: "bottom",
    category: "action",
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
    id: "tasks-add-button",
    title: "Tambah Task - Buat Tugas Baru",
    description:
      "Tombol 'Tambah Task' memungkinkan Anda membuat tugas baru dengan mudah. Klik untuk membuka form pembuatan task di mana Anda bisa mengatur judul, deskripsi, prioritas, deadline, dan menentukan penanggungjawab. Setiap task bisa dikaitkan dengan objective atau key result tertentu.",
    icon: CheckSquare,
    selector: '[data-tour="add-task-button"]',
    position: "bottom",
    category: "action",
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
    id: "tasks-list-view",
    title: "Tasks - Tampilan List",
    description:
      "Tampilan List menampilkan semua tugas dalam format tabel yang mudah dibaca. Anda dapat melihat detail task, status, prioritas, deadline, dan penanggungjawab dalam satu view yang komprehensif. Ideal untuk mendapatkan overview lengkap dari semua tugas.",
    icon: CheckSquare,
    selector: '[data-tour="tasks-list-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "tasks-kanban-view",
    title: "Tasks - Tampilan Kanban",
    description:
      "Tampilan Kanban mengorganisir tugas berdasarkan status dalam kolom-kolom yang visual. Anda dapat drag & drop task antar kolom untuk mengubah status dengan mudah. View ini sangat efektif untuk workflow management dan tracking progress secara visual.",
    icon: CheckSquare,
    selector: '[data-tour="tasks-kanban-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "tasks-timeline-view",
    title: "Tasks - Tampilan Timeline",
    description:
      "Tampilan Timeline menunjukkan tugas dalam format kronologis berdasarkan tanggal mulai dan deadline. View ini membantu Anda memahami urutan pekerjaan, mendeteksi potensi konflik jadwal, dan merencanakan resource allocation yang optimal.",
    icon: Clock,
    selector: '[data-tour="tasks-timeline-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "tasks-calendar-view",
    title: "Tasks - Tampilan Calendar",
    description:
      "Tampilan Calendar menampilkan tugas dalam format kalender bulanan yang familiar. Anda dapat melihat distribusi beban kerja harian, deadline yang mendekat, dan merencanakan jadwal dengan lebih efektif. View ini sangat berguna untuk time management dan perencanaan kapasitas tim.",
    icon: Calendar,
    selector: '[data-tour="tasks-calendar-tab"]',
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
    id: "timeline-daily-checkin",
    title: "Timeline - Daily Check-in",
    description:
      "Tombol Daily Check-in memungkinkan Anda mencatat progress harian dengan mudah. Klik untuk membuka form update harian dimana Anda dapat melaporkan kemajuan task, key results, dan aktivitas lainnya. Setiap check-in akan ditampilkan dalam timeline kronologis untuk tracking yang lebih baik.",
    icon: Clock,
    selector: '[data-tour="daily-checkin-button"]',
    position: "bottom",
    category: "action",
  },
  {
    id: "timeline-filter",
    title: "Timeline - Filter & Pencarian",
    description:
      "Panel filter memungkinkan Anda menyaring aktivitas timeline berdasarkan tipe aktivitas (update harian, check-in progress), pengguna, dan periode waktu. Gunakan filter ini untuk fokus pada aktivitas tertentu atau melihat progress anggota tim secara spesifik.",
    icon: Filter,
    selector: '[data-tour="timeline-filter"]',
    position: "left",
    category: "feature",
  },
  {
    id: "timeline-feed",
    title: "Timeline - Activity Feed",
    description:
      "Area utama timeline menampilkan semua aktivitas tim dalam urutan kronologis. Anda dapat melihat update harian, check-in progress, pencapaian milestone, dan aktivitas kolaboratif lainnya. Setiap kartu menampilkan detail lengkap dengan fitur interaksi seperti like, komentar, dan reaksi.",
    icon: Activity,
    selector: '[data-tour="timeline-feed"]',
    position: "top",
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
    id: "achievement-progress-tab",
    title: "Progress Tab - Personal Statistics",
    description:
      "Tab Progress menampilkan statistik personal Anda dalam sistem gamifikasi. Anda dapat melihat total poin yang dikumpulkan, level pencapaian, dan performa individual dalam menyelesaikan task dan mencapai target key results.",
    icon: Trophy,
    selector: '[data-tour="achievement-progress-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "achievement-medals-tab",
    title: "Achievements Tab - Badge & Medals",
    description:
      "Tab Achievements menampilkan koleksi badge dan medal yang telah Anda raih. Setiap pencapaian milestone seperti menyelesaikan task pertama, mencapai target key result, atau konsistensi update harian akan memberikan badge khusus sebagai pengakuan prestasi.",
    icon: Medal,
    selector: '[data-tour="achievement-medals-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "achievement-leaderboard-tab",
    title: "Leaderboard Tab - Team Rankings",
    description:
      "Tab Leaderboard menampilkan peringkat tim berdasarkan total poin yang dikumpulkan. Sistem ini menciptakan kompetisi sehat antar anggota tim dan memotivasi pencapaian target bersama. Anda dapat melihat posisi ranking Anda dibandingkan rekan tim lainnya.",
    icon: Users,
    selector: '[data-tour="achievement-leaderboard-tab"]',
    position: "bottom",
    category: "feature",
  },

  // Analytics page tour
  {
    id: "analytics",
    title: "Analytics - Laporan & Analisa",
    description:
      "Halaman Analytics menyediakan dashboard komprehensif untuk monitor progress dan performa Goal, Initiative, serta Tim. Anda dapat melihat berbagai grafik, chart, dan statistik untuk evaluasi pencapaian organisasi secara data-driven.",
    icon: Activity,
    selector: '[data-tour="analytics"]',
    position: "bottom",
    category: "navigation",
    targetPath: "/analytics",
    requiresClick: true,
  },
  {
    id: "analytics-filters",
    title: "Analytics Filters - Filter Data",
    description:
      "Filter ini memungkinkan Anda menyaring data analytics berdasarkan Cycle (periode waktu) dan Team tertentu. Gunakan filter untuk fokus pada analisis periode atau tim spesifik yang ingin dievaluasi performanya.",
    icon: Filter,
    selector: '[data-tour="analytics-filters"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "analytics-overview-tab",
    title: "Overview Tab - Dashboard Umum",
    description:
      "Tab Overview menampilkan ringkasan dashboard dengan chart distribusi status objective, progress over time, dan metrics utama seperti total initiatives, key results, dan task completion rate. Ini memberikan gambaran cepat performa organisasi secara keseluruhan.",
    icon: Activity,
    selector: '[data-tour="analytics-overview-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "analytics-teams-tab",
    title: "Team Performance Tab - Performa Tim",
    description:
      "Tab Team Performance menyajikan perbandingan performa antar tim melalui bar chart dan detail performance table. Anda dapat melihat rata-rata progress, jumlah objectives, key results yang selesai, dan ranking tim berdasarkan pencapaian.",
    icon: Users,
    selector: '[data-tour="analytics-teams-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "analytics-users-tab",
    title: "User Performance Tab - Performa Individu",
    description:
      "Tab User Performance menampilkan ranking individual berdasarkan progress Goal. Menampilkan top performers dengan badge khusus, statistik personal achievement, dan radar chart untuk visualisasi performa tim member secara individu.",
    icon: TrendingUp,
    selector: '[data-tour="analytics-users-tab"]',
    position: "bottom",
    category: "feature",
  },
  {
    id: "analytics-initiatives-tab",
    title: "Initiatives & Tasks Tab - Analisis Proyek",
    description:
      "Tab Initiatives & Tasks menyediakan analisis distribusi progress initiative, overview status task, dan priority matrix. Membantu memahami status executing dari berbagai proyek dan task management secara visual melalui chart dan diagram.",
    icon: Briefcase,
    selector: '[data-tour="analytics-initiatives-tab"]',
    position: "bottom",
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
    targetPath: "/client-users",
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
    targetPath: "/organization-settings",
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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

        let x = rect.left + rect.width / 2 - tooltipWidth / 2;
        let y = rect.top - tooltipHeight - 150; // Moved tooltip even higher up

        // Mobile-specific positioning for menu items
        if (isMobile() && isMenuStep(currentStepData.id)) {
          // For mobile menu items, position tooltip far to the right or bottom
          // Check if we have enough space to the right of the sidebar
          const sidebarWidth = 280; // Approximate sidebar width
          if (window.innerWidth > sidebarWidth + tooltipWidth + 30) {
            // Position to the right of sidebar
            x = sidebarWidth + 15;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
          } else {
            // Position at bottom with full width
            x = 15; // Left edge with padding
            y = Math.max(rect.bottom + 20, window.innerHeight - tooltipHeight - 15); // Below menu or at bottom
          }
        } else if (isMobile()) {
          // For mobile non-menu items, position at bottom or top based on available space
          x = 15; // Left edge with padding
          if (rect.bottom + tooltipHeight + 30 > window.innerHeight) {
            // Position above if not enough space below
            y = Math.max(15, rect.top - tooltipHeight - 15);
          } else {
            // Position below if enough space
            y = rect.bottom + 15;
          }
        } else {
          // Desktop positioning - adjust based on step position
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
        }

        // Ensure tooltip stays within viewport
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
