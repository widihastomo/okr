import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import refokusLogo from "@assets/refokus_1751810711179.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Target,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  UserPlus,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Building,
  BarChart,
  MessageSquare,
  Zap,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { ReminderSettings } from "@/components/ReminderSettings";
import { type CompanyOnboardingData } from "@shared/schema";

// Onboarding steps following the reference structure
const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Fokus",
    description: "Bagian mana di bisnis Anda yang ingin ditingkatkan?",
    icon: Building,
  },
  {
    id: 2,
    title: "Buat Goal",
    description:
      "Pilih satu tujuan yang paling penting dan bermakna. Anda dapat merubahnya setelah onboarding selesai",
    icon: Target,
  },
  {
    id: 3,
    title: "Ukur Dengan Angka Target",
    description: "Bagaimana Anda tahu bahwa tujuan tadi benar-benar tercapai?",
    icon: TrendingUp,
  },
  {
    id: 4,
    title: "Rancang Aksinya (Inisiatif)",
    description:
      "Tentukan strategi yang tepat untuk bisa mencapai angka target",
    icon: CheckCircle,
  },
  {
    id: 5,
    title: "Pecah Jadi Tugas Harian (Task)",
    description:
      "Jadikan beberapa langkah kecil yang jelas agar strategi tidak hanya tertulis, namun benar - benar ter-eksekusi dengan maksimal",
    icon: BarChart,
  },
  {
    id: 6,
    title: "Pilih Ritme",
    description: "Seberapa sering Anda ingin update progress?",
    icon: Clock,
  },
  {
    id: 7,
    title: "Ringkasan",
    description:
      "Lihat ringkasan dari goal dan strategi eksekusi yang sudah anda buat",
    icon: MessageSquare,
  },
];

interface OnboardingData extends CompanyOnboardingData {
  // All fields are already defined in CompanyOnboardingData schema
}

// Custom hook for typing effect
const useTypingEffect = (text: string, speed: number = 30) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
    }

    setDisplayText("");
    setIsTyping(true);

    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
        typewriterRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
      }
    };

    // Start typing after a brief delay
    typewriterRef.current = setTimeout(typeNextChar, 100);

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [text, speed]);

  return { displayText, isTyping };
};

export default function CompanyOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 0, // Start at welcome screen
    completedSteps: [],
    teamFocus: "",
    cycleDuration: "",
    cycleStartDate: "",
    cycleEndDate: "",
    objective: "",
    keyResults: [],
    cadence: "",
    reminderTime: "",
    reminderDay: "",
    reminderDate: "",
    invitedMembers: [],
    initiatives: [],
    tasks: [],
    firstCheckIn: "",
    isCompleted: false,
  });

  // Error handling for ResizeObserver and other common errors
  useEffect(() => {
    const handleGlobalError = (e: ErrorEvent) => {
      if (e.message && typeof e.message === "string") {
        if (
          e.message.includes(
            "ResizeObserver loop completed with undelivered notifications",
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (e.message.includes("Non-Error promise rejection captured")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (
          e.message.includes(
            "Cannot read properties of undefined (reading 'frame')",
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (e.reason && String(e.reason).includes("ResizeObserver")) {
        e.preventDefault();
        return false;
      }
    };

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = String(args[0] || "");
      if (
        message.includes(
          "ResizeObserver loop completed with undelivered notifications",
        ) ||
        message.includes("Non-Error promise rejection captured") ||
        message.includes(
          "Cannot read properties of undefined (reading 'frame')",
        )
      ) {
        return;
      }
      // Log important errors for debugging
      if (
        message.includes("completeOnboardingMutation") ||
        (message.includes("TypeError") && !message.includes("frame")) ||
        message.includes("ReferenceError")
      ) {
        console.log("🔍 Important error caught:", args);
      }
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      const message = String(args[0] || "");
      if (
        message.includes(
          "ResizeObserver loop completed with undelivered notifications",
        ) ||
        message.includes(
          "Cannot read properties of undefined (reading 'frame')",
        )
      ) {
        return;
      }
      originalConsoleWarn(...args);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Fetch onboarding progress with optimized caching
  const { data: progress } = useQuery({
    queryKey: ["/api/onboarding/progress"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds cache
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: false, // Don't auto-refetch
  });

  // Update local state when progress data is loaded
  useEffect(() => {
    if (progress) {
      setOnboardingData((prevData) => ({
        ...prevData,
        ...progress,
        currentStep: progress.currentStep || 0, // Ensure it starts at 0 if no progress
      }));
    }
  }, [progress]);

  // Validation function for each step
  const validateStep = (
    step: number,
    data: OnboardingData,
  ): { isValid: boolean; message?: string } => {
    switch (step) {
      case 1:
        if (!data.teamFocus) {
          return {
            isValid: false,
            message: "Silakan pilih fokus bisnis terlebih dahulu",
          };
        }
        break;
      case 2:
        if (!data.objective.trim()) {
          return {
            isValid: false,
            message: "Silakan pilih atau tulis goal yang ingin dicapai",
          };
        }
        break;
      case 3:
        if (data.keyResults.length === 0) {
          return {
            isValid: false,
            message: "Silakan pilih minimal 1 angka target",
          };
        }
        break;
      case 4:
        if (data.initiatives.length === 0) {
          return {
            isValid: false,
            message: "Silakan pilih minimal 1 inisiatif prioritas",
          };
        }
        break;
      case 5:
        if (data.tasks.length === 0) {
          return {
            isValid: false,
            message: "Silakan pilih minimal 1 tugas untuk inisiatif",
          };
        }
        break;
      case 6:
        if (!data.cadence) {
          return { isValid: false, message: "Silakan pilih ritme check-in" };
        }
        if (!data.reminderTime) {
          return { isValid: false, message: "Silakan pilih waktu reminder" };
        }
        // Additional validation based on cadence type
        if (data.cadence === "mingguan" && !data.reminderDay) {
          return {
            isValid: false,
            message: "Silakan pilih hari reminder untuk check-in mingguan",
          };
        }
        if (data.cadence === "bulanan" && !data.reminderDate) {
          return {
            isValid: false,
            message: "Silakan pilih tanggal reminder untuk check-in bulanan",
          };
        }
        break;
      case 7:
        // Step 7 is now just a summary page - no validation needed
        break;
      default:
        break;
    }
    return { isValid: true };
  };

  // Save onboarding progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingData>) => {
      return apiRequest("PUT", "/api/onboarding/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
    },
    onError: (error) => {
      console.error("Frontend mutation error:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan progress onboarding",
        variant: "destructive",
      });
    },
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      console.log("🔄 Sending onboarding completion with data:", {
        cadence: onboardingData.cadence,
        reminderTime: onboardingData.reminderTime,
        reminderDay: onboardingData.reminderDay,
        reminderDate: onboardingData.reminderDate,
        teamFocus: onboardingData.teamFocus,
        fullData: onboardingData,
      });
      return apiRequest("POST", "/api/onboarding/complete", { onboardingData });
    },
    onSuccess: () => {
      // Set redirecting state first to prevent double clicks
      setIsRedirecting(true);

      toast({
        title: "Selamat!",
        description:
          "Onboarding berhasil diselesaikan. Goal pertama telah dibuat!",
        variant: "success",
      });

      // Immediate cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });

      // Force redirect with both navigate and window.location as fallback
      console.log("🔄 Attempting redirect to dashboard...");

      // Try wouter navigation first
      try {
        navigate("/");
        console.log("✅ Wouter navigation called successfully");
      } catch (error) {
        console.error("❌ Wouter navigation failed:", error);
      }

      // Add window.location fallback after short delay
      setTimeout(() => {
        console.log("🔄 Fallback redirect using window.location");
        window.location.href = "/";
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menyelesaikan onboarding",
        variant: "destructive",
      });
    },
  });

  const currentStepData = ONBOARDING_STEPS.find(
    (step) => step.id === onboardingData.currentStep,
  );

  // Welcome screen data
  const welcomeScreenData = {
    title: "",
    description:
      "Tim hebat bukan hanya tentang kerja keras, tapi tentang kerja yang selaras dan terarah. Refokus hadir untuk menyelaraskan tujuan, waktu, dan tindakan tim agar benar-benar bergerak menuju tujuan.",
    icon: Sparkles,
  };

  const progressPercentage =
    onboardingData.currentStep === 0
      ? 0
      : onboardingData.currentStep === 7
        ? 100 // Show 100% when at the final step (step 7)
        : (onboardingData.completedSteps.length / ONBOARDING_STEPS.length) *
          100;

  // Dynamic color system based on progress
  const getProgressColor = () => {
    if (progressPercentage === 0) return "from-gray-400 to-gray-500"; // Start - Gray
    if (progressPercentage <= 25) return "from-red-400 to-red-500"; // 0-25% - Red
    if (progressPercentage <= 50) return "from-orange-400 to-orange-500"; // 25-50% - Orange
    if (progressPercentage <= 75) return "from-yellow-400 to-yellow-500"; // 50-75% - Yellow
    if (progressPercentage < 100) return "from-blue-400 to-blue-500"; // 75-99% - Blue
    return "from-green-400 to-green-500"; // 100% - Green
  };

  const getContainerBackgroundColor = () => {
    if (progressPercentage === 0)
      return "from-gray-50 to-gray-100 border-gray-200"; // Start - Gray
    if (progressPercentage <= 25)
      return "from-red-50 to-pink-50 border-red-200"; // 0-25% - Red
    if (progressPercentage <= 50)
      return "from-orange-50 to-yellow-50 border-orange-200"; // 25-50% - Orange
    if (progressPercentage <= 75)
      return "from-yellow-50 to-amber-50 border-yellow-200"; // 50-75% - Yellow
    if (progressPercentage < 100)
      return "from-blue-50 to-indigo-50 border-blue-200"; // 75-99% - Blue
    return "from-green-50 to-emerald-50 border-green-200"; // 100% - Green
  };

  const canProceedToNext = () => {
    // Allow proceeding from welcome screen (step 0) without validation
    if (onboardingData.currentStep === 0) return true;
    
    // Validate current step
    const validation = validateStep(onboardingData.currentStep, onboardingData);
    return validation.isValid;
  };

  const handleNext = () => {
    // Validate current step before proceeding (skip validation for welcome screen)
    if (onboardingData.currentStep > 0) {
      const validation = validateStep(
        onboardingData.currentStep,
        onboardingData,
      );
      if (!validation.isValid) {
        toast({
          title: "Input tidak lengkap",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
    }

    if (onboardingData.currentStep < 7) {
      const newCompletedSteps =
        onboardingData.currentStep === 0
          ? []
          : [...onboardingData.completedSteps, onboardingData.currentStep];
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep + 1,
        completedSteps: newCompletedSteps,
      };
      setOnboardingData(newData);
      // Only save progress if we're past the welcome screen
      if (onboardingData.currentStep > 0) {
        console.log("Saving progress data:", newData);
        saveProgressMutation.mutate(newData);
      }

      // Scroll to top to show virtual assistant
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handlePrevious = () => {
    if (onboardingData.currentStep > 0) {
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep - 1,
      };
      setOnboardingData(newData);
      if (onboardingData.currentStep > 1) {
        saveProgressMutation.mutate(newData);
      }

      // Scroll to top to show virtual assistant
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleComplete = () => {
    // Prevent double clicks
    if (completeOnboardingMutation.isPending || isRedirecting) {
      return;
    }

    const finalData = {
      ...onboardingData,
      completedSteps: [
        ...onboardingData.completedSteps,
        onboardingData.currentStep,
      ],
      isCompleted: true,
    };
    setOnboardingData(finalData);
    completeOnboardingMutation.mutate();
  };

  const renderStepContent = () => {
    switch (onboardingData.currentStep) {
      case 0: // Welcome Screen
        return <div className="space-y-6"></div>;
      case 1: // Fokus Tim
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih fokus bisnis Anda:
              </Label>
              <p className="text-sm text-gray-600">
                Pilih area yang paling ingin Anda tingkatkan dalam 1 - 3 bulan
                kedepan.
              </p>
            </div>
            <RadioGroup
              value={onboardingData.teamFocus}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, teamFocus: value })
              }
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "penjualan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "penjualan",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="penjualan"
                    id="penjualan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="penjualan"
                        className="font-medium cursor-pointer"
                      >
                        Penjualan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tingkatkan performa penjualan, konversi, dan pertumbuhan
                      revenue
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "operasional"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "operasional",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="operasional"
                    id="operasional"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="operasional"
                        className="font-medium cursor-pointer"
                      >
                        Operasional
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Optimalisasi proses, efisiensi, dan produktivitas
                      operasional
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "customer_service"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "customer_service",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="customer_service"
                    id="customer_service"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="customer_service"
                        className="font-medium cursor-pointer"
                      >
                        Customer Service
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tingkatkan kepuasan pelanggan, respon time, dan loyalitas
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "marketing"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "marketing",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="marketing"
                    id="marketing"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="marketing"
                        className="font-medium cursor-pointer"
                      >
                        Marketing
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Perluas jangkauan, engagement, dan brand awareness
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {onboardingData.teamFocus && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-800">
                    <strong>Fokus terpilih:</strong>{" "}
                    {onboardingData.teamFocus === "penjualan"
                      ? "Penjualan"
                      : onboardingData.teamFocus === "operasional"
                        ? "Operasional"
                        : onboardingData.teamFocus === "customer_service"
                          ? "Customer Service"
                          : onboardingData.teamFocus === "marketing"
                            ? "Marketing"
                            : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Buat Objective
        const getObjectiveOptions = (teamFocus: string) => {
          const options = {
            penjualan: [
              "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan",
              "Membangun basis pelanggan yang kuat dan loyal",
              "Mengoptimalkan konversi prospek menjadi pelanggan",
            ],
            operasional: [
              "Mencapai efisiensi operasional yang optimal dan berkelanjutan",
              "Mempercepat proses produksi dengan kualitas terjaga",
              "Mengoptimalkan biaya operasional tanpa mengurangi kualitas",
            ],
            customer_service: [
              "Mencapai kepuasan pelanggan yang luar biasa dan berkelanjutan",
              "Memberikan respon pelanggan yang cepat dan efektif",
              "Membangun loyalitas pelanggan dan advokasi yang tinggi",
            ],
            marketing: [
              "Meningkatkan kesadaran merek di pasar target",
              "Membangun komunitas yang aktif dan engaged di media sosial",
              "Menghasilkan lead berkualitas tinggi secara konsisten",
            ],
          };
          return options[teamFocus] || [];
        };

        const objectiveOptions = getObjectiveOptions(onboardingData.teamFocus);

        return (
          <div className="space-y-4">
            {objectiveOptions.length > 0 && (
              <div className="space-y-3">
                <Label>
                  Dari beberapa goal yang bisa dipilih, mana yang bisa anda
                  fokuskan supaya terjadi peningkatan {onboardingData.teamFocus}
                  :
                </Label>
                <RadioGroup
                  value={onboardingData.objective}
                  onValueChange={(value) =>
                    setOnboardingData({ ...onboardingData, objective: value })
                  }
                >
                  {objectiveOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <RadioGroupItem
                        value={option}
                        id={`objective-${index}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`objective-${index}`}
                        className="flex-1 cursor-pointer leading-relaxed"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {onboardingData.objective &&
              objectiveOptions.includes(onboardingData.objective) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Goal terpilih:</strong> {onboardingData.objective}
                  </p>
                </div>
              )}
          </div>
        );

      case 3: // Ukuran Keberhasilan
        const getKeyResultOptions = (objective: string) => {
          // Key Results untuk objective penjualan
          const salesKeyResults = {
            "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan":
              [
                "Mencapai target penjualan Rp 500 juta per bulan",
                "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta",
                "Menambah 100 transaksi baru setiap bulan",
              ],
            "Membangun basis pelanggan yang kuat dan loyal": [
              "Mendapatkan 100 pelanggan baru setiap bulan",
              "Mencapai conversion rate 15% dari lead ke customer",
              "Meningkatkan customer retention rate menjadi 85%",
            ],
            "Mengoptimalkan konversi prospek menjadi pelanggan": [
              "Mencapai conversion rate 25% dari total lead",
              "Mengurangi waktu follow-up lead menjadi maksimal 24 jam",
              "Meningkatkan kualitas lead scoring menjadi 80% akurat",
            ],
          };

          // Key Results untuk objective operasional
          const operationalKeyResults = {
            "Mencapai efisiensi operasional yang optimal dan berkelanjutan": [
              "Mengurangi waktu proses produksi menjadi 4 jam per unit",
              "Meningkatkan utilitas mesin menjadi 85%",
              "Mengurangi waste produksi menjadi maksimal 5%",
            ],
            "Mempercepat proses produksi dengan kualitas terjaga": [
              "Mencapai waktu siklus 3 jam per produk",
              "Meningkatkan throughput menjadi 50 unit per hari",
              "Mengurangi downtime mesin menjadi maksimal 2%",
            ],
            "Mengoptimalkan biaya operasional tanpa mengurangi kualitas": [
              "Menurunkan biaya per unit menjadi Rp 50,000",
              "Meningkatkan rasio efisiensi menjadi 90%",
              "Mengurangi biaya overhead sebesar 20%",
            ],
          };

          // Key Results untuk objective customer service
          const customerServiceKeyResults = {
            "Mencapai kepuasan pelanggan yang luar biasa dan berkelanjutan": [
              "Mencapai CSAT score 4.8/5 dalam survey bulanan",
              "Meningkatkan customer retention rate menjadi 95%",
              "Mengurangi complaint rate menjadi di bawah 1%",
            ],
            "Memberikan respon pelanggan yang cepat dan efektif": [
              "Mencapai rata-rata waktu respons 1 jam",
              "Meningkatkan tingkat respons pertama menjadi 95%",
              "Mencapai waktu penyelesaian maksimal 24 jam",
            ],
            "Membangun loyalitas pelanggan dan advokasi yang tinggi": [
              "Mencapai skor NPS 70+ dalam survei triwulanan",
              "Meningkatkan tingkat advokasi pelanggan menjadi 40%",
              "Mencapai tingkat rekomendasi pelanggan 80%",
            ],
          };

          // Key Results untuk objective marketing
          const marketingKeyResults = {
            "Meningkatkan kesadaran merek di pasar target": [
              "Mencapai brand recall 60% dalam market research",
              "Meningkatkan social media reach menjadi 100,000 per post",
              "Mencapai top-of-mind awareness 25% di kategori produk",
            ],
            "Membangun komunitas yang aktif dan engaged di media sosial": [
              "Mencapai 10,000 pengikut baru di Instagram",
              "Meningkatkan tingkat pertumbuhan pengikut 15% per bulan",
              "Mencapai tingkat engagement 8% di semua platform",
            ],
            "Menghasilkan lead berkualitas tinggi secara konsisten": [
              "Mencapai 500 qualified leads per bulan",
              "Meningkatkan lead quality score menjadi 85%",
              "Mencapai cost per lead di bawah Rp 100,000",
            ],
          };

          // Gabungkan semua key results
          const allKeyResults = {
            ...salesKeyResults,
            ...operationalKeyResults,
            ...customerServiceKeyResults,
            ...marketingKeyResults,
          };

          return allKeyResults[objective] || [];
        };

        const keyResultOptions = getKeyResultOptions(onboardingData.objective);
        const selectedKeyResults = onboardingData.keyResults.filter(
          (kr) => kr && kr.trim() !== "",
        );

        return (
          <div className="space-y-4">
            {keyResultOptions.length > 0 && (
              <div className="space-y-3">
                <Label>
                  Pilih Angka Target (Alat ukur kuantitatif) untuk mengetahui
                  kemajual Goal : "{onboardingData.objective}"
                </Label>
                <div className="space-y-2">
                  {keyResultOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`keyresult-${index}`}
                        checked={selectedKeyResults.includes(option)}
                        onCheckedChange={(checked) => {
                          let newKeyResults = [...onboardingData.keyResults];
                          if (checked) {
                            newKeyResults.push(option);
                          } else {
                            newKeyResults = newKeyResults.filter(
                              (kr) => kr !== option,
                            );
                          }
                          setOnboardingData({
                            ...onboardingData,
                            keyResults: newKeyResults,
                          });
                        }}
                      />
                      <Label
                        htmlFor={`keyresult-${index}`}
                        className="flex-1 cursor-pointer leading-relaxed"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedKeyResults.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Angka target terpilih:</strong>
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedKeyResults.map((kr, index) => (
                    <li key={index}>• {kr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 5: // Task untuk Inisiatif
        // Define task mapping for initiatives
        const taskMapping = {
          // Penjualan & Marketing Tasks
          "Menjalankan kampanye promosi bulanan": [
            "Buat creative design untuk promosi diskon",
            "Setup campaign di Facebook Ads dan Google Ads",
            "Siapkan landing page untuk campaign",
          ],
          "Melatih sales team untuk closing technique": [
            "Buat materi training closing technique",
            "Jadwalkan session training dengan sales team",
            "Evaluasi dan feedback setelah training",
          ],
          "Mengimplementasikan CRM untuk follow-up lead": [
            "Pilih dan setup CRM software",
            "Import database lead ke CRM",
            "Training tim untuk menggunakan CRM",
          ],
          "Mempersonalisasi approach berdasarkan lead profile": [
            "Buat database profil lengkap untuk setiap lead",
            "Develop template komunikasi untuk setiap persona",
            "Training sales team untuk personalisasi approach",
          ],
          "Mengotomatisasi lead notification system": [
            "Setup real-time notification untuk lead baru",
            "Konfigurasi assignment rule untuk sales team",
            "Implementasi lead routing berdasarkan criteria",
          ],
          "Membuat program bundling produk dengan harga spesial": [
            "Analisis produk yang cocok untuk bundling",
            "Tentukan harga bundling yang kompetitif",
            "Buat marketing material untuk bundling",
          ],
        };
        
        const selectedInitiatives = onboardingData.initiatives.filter(
          (init) => init && init.trim() !== "",
        );
        
        const selectedTasks = (() => {
          const tasks: string[] = [];
          selectedInitiatives.forEach((initiative) => {
            const mapping = taskMapping[initiative];
            if (mapping) {
              tasks.push(...mapping);
            }
          });
          return tasks;
        })();
        
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih task untuk inisiatif:
              </Label>
              <p className="text-sm text-gray-600">
                Pilih tugas-tugas yang akan membantu eksekusi inisiatif
              </p>
            </div>
            
            {selectedTasks.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Task yang direkomendasikan:
                </p>
                <div className="space-y-3">
                  {selectedInitiatives.map((initiative) => {
                    const initiativeTasks = taskMapping[initiative];
                    if (!initiativeTasks || initiativeTasks.length === 0) return null;

                    return (
                      <div key={initiative} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium text-purple-700">
                            {initiative}
                          </span>
                        </div>
                        <div className="ml-4 space-y-1">
                          {initiativeTasks.map((task, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                {task}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-green-700 mt-3">
                  <strong>Total: {selectedTasks.length} task terpilih</strong>
                </p>
              </div>
            )}
          </div>
        );
        
      case 6: // Pilih Cadence
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih frekuensi check-in progress:
              </Label>
              <p className="text-sm text-gray-600">
                Seberapa sering Anda ingin menerima reminder dan melakukan
                update progress goal?
              </p>
            </div>
            <RadioGroup
              value={onboardingData.cadence}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, cadence: value })
              }
              className="space-y-4"
            >
              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "harian"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "harian" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="harian" id="harian" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="harian"
                        className="font-medium cursor-pointer"
                      >
                        Setiap Hari
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Cocok untuk goal yang memerlukan perhatian harian dan
                      monitoring ketat
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "mingguan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "mingguan" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="mingguan"
                    id="mingguan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="mingguan"
                        className="font-medium cursor-pointer"
                      >
                        Setiap Minggu
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ideal untuk goal jangka menengah dengan review progress
                      mingguan
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "bulanan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "bulanan" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="bulanan"
                    id="bulanan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="bulanan"
                        className="font-medium cursor-pointer"
                      >
                        Setiap Bulan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tepat untuk goal strategis dengan evaluasi bulanan yang
                      komprehensif
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
            {onboardingData.cadence && (
              <div className="space-y-3">
                {/* Harian - Waktu reminder */}
                {onboardingData.cadence === "harian" && (
                  <div className="space-y-3">
                    <Label htmlFor="reminder-time">
                      Waktu reminder harian:
                    </Label>
                    <div className="space-y-3">
                      {/* Common time options */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "08:00", label: "08:00 - Pagi" },
                          { value: "12:00", label: "12:00 - Siang" },
                          { value: "17:00", label: "17:00 - Sore" },
                          { value: "09:00", label: "09:00 - Pagi" },
                          { value: "15:00", label: "15:00 - Siang" },
                          { value: "19:00", label: "19:00 - Malam" },
                        ].map((timeOption) => (
                          <Button
                            key={timeOption.value}
                            variant={
                              onboardingData.reminderTime === timeOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderTime: timeOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderTime === timeOption.value
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-orange-50 hover:border-orange-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {timeOption.label}
                          </Button>
                        ))}
                      </div>

                      {/* Custom time input */}
                      <div className="space-y-3">
                        <Label className="text-sm text-gray-600">
                          Atau pilih waktu custom:
                        </Label>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="custom-time"
                              type="time"
                              value={onboardingData.reminderTime}
                              onChange={(e) =>
                                setOnboardingData({
                                  ...onboardingData,
                                  reminderTime: e.target.value,
                                })
                              }
                              className="w-32 cursor-pointer focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02]"
                              placeholder="HH:MM"
                              step="60"
                              min="00:00"
                              max="23:59"
                            />
                            <span className="text-sm text-gray-500">
                              Format: HH:MM
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mingguan - Hari dan waktu reminder */}
                {onboardingData.cadence === "mingguan" && (
                  <div className="space-y-4">
                    <Label>Pengaturan reminder mingguan:</Label>

                    {/* Pilih hari */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih hari reminder:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {[
                          { value: "senin", label: "Senin" },
                          { value: "selasa", label: "Selasa" },
                          { value: "rabu", label: "Rabu" },
                          { value: "kamis", label: "Kamis" },
                          { value: "jumat", label: "Jumat" },
                          { value: "sabtu", label: "Sabtu" },
                          { value: "minggu", label: "Minggu" },
                        ].map((dayOption) => (
                          <Button
                            key={dayOption.value}
                            variant={
                              onboardingData.reminderDay === dayOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderDay: dayOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderDay === dayOption.value
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {dayOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Pilih waktu */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih waktu reminder:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "08:00", label: "08:00 - Pagi" },
                          { value: "12:00", label: "12:00 - Siang" },
                          { value: "17:00", label: "17:00 - Sore" },
                          { value: "09:00", label: "09:00 - Pagi" },
                          { value: "15:00", label: "15:00 - Siang" },
                          { value: "19:00", label: "19:00 - Malam" },
                        ].map((timeOption) => (
                          <Button
                            key={timeOption.value}
                            variant={
                              onboardingData.reminderTime === timeOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderTime: timeOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderTime === timeOption.value
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-orange-50 hover:border-orange-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {timeOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulanan - Tanggal dan waktu reminder */}
                {onboardingData.cadence === "bulanan" && (
                  <div className="space-y-4">
                    <Label>Pengaturan reminder bulanan:</Label>

                    {/* Pilih tanggal */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih tanggal reminder setiap bulan:
                      </Label>
                      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (date) => (
                            <Button
                              key={date}
                              variant={
                                onboardingData.reminderDate === date.toString()
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setOnboardingData({
                                  ...onboardingData,
                                  reminderDate: date.toString(),
                                })
                              }
                              className={
                                onboardingData.reminderDate === date.toString()
                                  ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                  : "hover:bg-purple-50 hover:border-purple-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                              }
                            >
                              {date}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Pilih waktu */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih waktu reminder:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "08:00", label: "08:00 - Pagi" },
                          { value: "12:00", label: "12:00 - Siang" },
                          { value: "17:00", label: "17:00 - Sore" },
                          { value: "09:00", label: "09:00 - Pagi" },
                          { value: "15:00", label: "15:00 - Siang" },
                          { value: "19:00", label: "19:00 - Malam" },
                        ].map((timeOption) => (
                          <Button
                            key={timeOption.value}
                            variant={
                              onboardingData.reminderTime === timeOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderTime: timeOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderTime === timeOption.value
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-orange-50 hover:border-orange-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {timeOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected reminder display */}
                {onboardingData.reminderTime && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm text-orange-800">
                        <strong>Pengaturan reminder:</strong>{" "}
                        {onboardingData.cadence === "harian" && (
                          <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                            Setiap hari jam {onboardingData.reminderTime}
                          </span>
                        )}
                        {onboardingData.cadence === "mingguan" && (
                          <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                            Setiap {onboardingData.reminderDay} jam{" "}
                            {onboardingData.reminderTime}
                          </span>
                        )}
                        {onboardingData.cadence === "bulanan" && (
                          <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                            Setiap tanggal {onboardingData.reminderDate} jam{" "}
                            {onboardingData.reminderTime}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4: // Pilih Inisiatif Prioritas
        const initiativeMapping = {
          // Penjualan - Omzet
          "Mencapai target penjualan Rp 500 juta per bulan": [
            "Menjalankan kampanye promosi bulanan",
            "Melatih sales team untuk closing technique",
            "Mengimplementasikan CRM untuk follow-up lead",
          ],
          "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta": [
            "Membuat program bundling produk dengan harga spesial",
            "Melatih tim sales untuk upselling",
            "Mengembangkan strategi cross-selling kepada existing customer",
          ],
          "Menambah 100 transaksi baru setiap bulan": [
            "Menjalankan digital marketing campaign di social media",
            "Membuat referral program dengan reward menarik",
            "Membangun partnership dengan marketplace online",
          ],

          // Penjualan - Pelanggan Baru
          "Mendapatkan 100 pelanggan baru setiap bulan": [
            "Mengembangkan content marketing strategy di blog dan sosmed",
            "Mengadakan event networking dan product demo",
            "Menyediakan program trial gratis untuk prospek",
          ],
          "Mencapai conversion rate 15% dari lead ke customer": [
            "Mengoptimalkan landing page untuk konversi",
            "Membuat follow-up sequence email marketing",
            "Menjalankan telemarketing campaign yang lebih personal",
          ],
          "Meningkatkan customer retention rate menjadi 85%": [
            "Membuat program loyalty dengan point reward",
            "Menugaskan customer success manager untuk onboarding",
            "Melakukan survey kepuasan dan improvement action",
          ],

          // Penjualan - Konversi Lead
          "Mencapai conversion rate 25% dari total lead": [
            "Mengembangkan lead scoring system untuk prioritas",
            "Mempersonalisasi approach berdasarkan lead profile",
            "Menjalankan A/B testing untuk sales pitch",
          ],
          "Mengurangi waktu follow-up lead menjadi maksimal 24 jam": [
            "Mengotomatisasi lead notification system",
            "Menugaskan dedicated lead response team",
            "Mengembangkan mobile app untuk quick response",
          ],
          "Meningkatkan kualitas lead scoring menjadi 80% akurat": [
            "Menerapkan machine learning untuk lead analysis",
            "Membangun feedback loop dari sales ke marketing",
            "Melakukan regular review dan update criteria",
          ],

          // Operasional - Efisiensi
          "Mengurangi waktu proses produksi menjadi 4 jam per unit": [
            "Mengimplementasikan lean manufacturing principles",
            "Mengotomatisasi production line setup",
            "Melakukan time and motion study untuk bottleneck",
          ],
          "Meningkatkan utilitas mesin menjadi 85%": [
            "Menjadwalkan preventive maintenance",
            "Melatih operator untuk efisiensi maksimal",
            "Mengimplementasikan real-time monitoring system",
          ],
          "Mengurangi waste produksi menjadi maksimal 5%": [
            "Menerapkan quality control di setiap stage produksi",
            "Membuat recycling program untuk material waste",
            "Mengevaluasi supplier untuk kualitas raw material",
          ],

          // Customer Service - Satisfaction
          "Mencapai CSAT score 4.8/5 dalam survey bulanan": [
            "Melatih customer service excellence",
            "Mengimplementasikan feedback system yang real-time",
            "Membuat reward program untuk high performing agent",
          ],
          "Meningkatkan customer retention rate menjadi 95%": [
            "Menjalankan proactive customer outreach program",
            "Mempersonalisasi customer journey mapping",
            "Mengembangkan churn prediction dan prevention strategy",
          ],
          "Mengurangi complaint rate menjadi di bawah 1%": [
            "Melakukan root cause analysis untuk recurring issues",
            "Mengimplementasikan preventive quality assurance program",
            "Membuat customer education dan self-service portal",
          ],

          // Marketing - Brand Awareness
          "Mencapai brand recall 60% dalam market research": [
            "Menjalankan integrated marketing campaign di multiple channel",
            "Membangun influencer partnership program",
            "Mengadakan brand activation event di target market",
          ],
          "Meningkatkan social media reach menjadi 100,000 per post": [
            "Kalender konten dengan potensi viral",
            "Kampanye iklan berbayar di media sosial",
            "Program membangun komunitas dan engagement",
          ],
          "Mencapai 500 qualified leads per bulan": [
            "Optimisasi SEO untuk organic traffic",
            "Lead magnet dan landing page optimization",
            "Content marketing dan thought leadership",
          ],

          // Marketing - Social Media
          "Mencapai 10,000 pengikut baru di Instagram": [
            "Kampanye iklan berbayar di media sosial",
            "Program membangun komunitas dan engagement",
            "Program kemitraan dengan influencer",
          ],
          "Meningkatkan tingkat pertumbuhan pengikut 15% per bulan": [
            "Kalender konten dengan potensi viral",
            "Kampanye konten buatan pengguna",
            "Kontes dan hadiah di media sosial",
          ],
          "Mencapai tingkat engagement 8% di semua platform": [
            "Strategi konten interaktif",
            "Program manajemen komunitas",
            "Optimisasi social listening dan respon",
          ],

          // Customer Service - Response Time
          "Mencapai rata-rata waktu respons 1 jam": [
            "Implementasi chatbot untuk respons instan",
            "Tim dukungan pelanggan khusus",
            "Sistem routing tiket otomatis",
          ],
          "Meningkatkan tingkat respons pertama menjadi 95%": [
            "Sistem dukungan pelanggan 24/7",
            "Integrasi live chat di website",
            "Aplikasi mobile untuk layanan pelanggan",
          ],
          "Mencapai waktu penyelesaian maksimal 24 jam": [
            "Proses eskalasi yang efisien",
            "Optimisasi basis pengetahuan",
            "Integrasi CRM lanjutan",
          ],

          // Customer Service - Loyalty
          "Mencapai skor NPS 70+ dalam survei triwulanan": [
            "Sistem feedback loop pelanggan",
            "Program pengalaman pelanggan yang dipersonalisasi",
            "Program rewards loyalitas",
          ],
          "Meningkatkan tingkat advokasi pelanggan menjadi 40%": [
            "Program referral dengan insentif",
            "Kampanye kisah sukses pelanggan",
            "Program membangun komunitas",
          ],
          "Mencapai tingkat rekomendasi pelanggan 80%": [
            "Strategi pemasaran dari mulut ke mulut",
            "Program testimoni pelanggan",
            "Program duta merek",
          ],

          // Operational - Production Speed
          "Mencapai waktu siklus 3 jam per produk": [
            "Optimisasi dan otomasi alur kerja",
            "Pelatihan tim untuk efisiensi",
            "Penyederhanaan kontrol kualitas",
          ],
          "Meningkatkan throughput menjadi 50 unit per hari": [
            "Peningkatan kapasitas produksi",
            "Program upgrade peralatan",
            "Optimisasi penjadwalan staff",
          ],
          "Mengurangi downtime mesin menjadi maksimal 2%": [
            "Program maintenance preventif",
            "Sistem monitoring peralatan",
            "Implementasi sistem backup",
          ],

          // Operational - Cost Efficiency
          "Menurunkan cost per unit menjadi Rp 50,000": [
            "Supplier negotiation program",
            "Process optimization initiative",
            "Material waste reduction program",
          ],
          "Meningkatkan efficiency ratio menjadi 90%": [
            "Performance monitoring system",
            "Employee productivity training",
            "Resource allocation optimization",
          ],
          "Mengurangi overhead cost sebesar 20%": [
            "Cost analysis dan reduction program",
            "Administrative process automation",
            "Energy efficiency program",
          ],
        };

        const getInitiativeOptions = (keyResults: string[]) => {
          let allInitiatives = [];
          keyResults.forEach((kr) => {
            if (initiativeMapping[kr]) {
              allInitiatives.push(...initiativeMapping[kr]);
            }
          });

          // Remove duplicates
          return [...new Set(allInitiatives)];
        };

        const selectedKeyResultsForInitiatives =
          onboardingData.keyResults.filter((kr) => kr && kr.trim() !== "");
        const initiativeOptions = getInitiativeOptions(
          selectedKeyResultsForInitiatives,
        );
        // Use the same mapping as the one defined above
        const initiativeKeyResultMapping = initiativeMapping;

        // Group initiatives by their corresponding key results
        const getInitiativesByKeyResult = (keyResults: string[]) => {
          const initiativesByKR: { [key: string]: string[] } = {};

          keyResults.forEach((keyResult) => {
            const relatedInitiatives =
              initiativeKeyResultMapping[keyResult] || [];
            if (relatedInitiatives.length > 0) {
              initiativesByKR[keyResult] = relatedInitiatives;
            }
          });

          return initiativesByKR;
        };

        const initiativesByKeyResult = getInitiativesByKeyResult(
          selectedKeyResultsForInitiatives,
        );

        return (
          <div className="space-y-6">
            {Object.keys(initiativesByKeyResult).length > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Pilih inisiatif untuk setiap Angka Target yang sudah
                  ditentukan:
                </Label>

                {Object.entries(initiativesByKeyResult).map(
                  ([keyResult, initiatives], groupIndex) => (
                    <div
                      key={groupIndex}
                      className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-blue-800">
                          {keyResult}
                        </h4>
                      </div>

                      <div className="space-y-2 ml-4">
                        {initiatives.map((initiative, initIndex) => (
                          <div
                            key={initIndex}
                            className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-white bg-white"
                          >
                            <Checkbox
                              id={`initiative-${groupIndex}-${initIndex}`}
                              checked={onboardingData.initiatives.includes(initiative)}
                              onCheckedChange={(checked) => {
                                let newInitiatives = [
                                  ...onboardingData.initiatives,
                                ];
                                if (checked) {
                                  newInitiatives.push(initiative);
                                } else {
                                  newInitiatives = newInitiatives.filter(
                                    (init) => init !== initiative,
                                  );
                                }
                                setOnboardingData({
                                  ...onboardingData,
                                  initiatives: newInitiatives,
                                });
                              }}
                            />
                            <Label
                              htmlFor={`initiative-${groupIndex}-${initIndex}`}
                              className="flex-1 cursor-pointer leading-relaxed text-sm"
                            >
                              {initiative}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {onboardingData.initiatives.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">
                  🎯 Inisiatif yang Dipilih ({onboardingData.initiatives.length})
                </h4>
                <div className="space-y-2">
                  {Object.entries(initiativesByKeyResult).map(
                    ([keyResult, initiatives]) => {
                      const selectedInThisKR = initiatives.filter((init) =>
                        onboardingData.initiatives.includes(init),
                      );
                      if (selectedInThisKR.length === 0) return null;

                      return (
                        <div key={keyResult} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-700">
                              {keyResult}
                            </span>
                          </div>
                          <div className="ml-4 space-y-1">
                            {selectedInThisKR.map((init, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-700">
                                  {init}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
                <p className="text-sm text-green-700 mt-3">
                  <strong>
                    Total: {onboardingData.initiatives.length} inisiatif terpilih
                  </strong>
                </p>
              </div>
            )}
          </div>
        );

      case 6: // Pilih Cadence
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih frekuensi check-in progress:
              </Label>
              <p className="text-sm text-gray-600">
                Seberapa sering Anda ingin menerima reminder dan melakukan
                update progress goal?
              </p>
            </div>
            <RadioGroup
              value={onboardingData.cadence}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, cadence: value })
              }
              className="space-y-4"
            >
              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "harian"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "harian" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="harian" id="harian" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="harian"
                        className="text-lg font-medium text-gray-800 cursor-pointer"
                      >
                        Harian
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Check-in setiap hari untuk tracking progress yang konsisten
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>💡</span>
                      <span>Cocok untuk goal yang membutuhkan monitoring ketat</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "mingguan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "mingguan" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="mingguan" id="mingguan" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <Label
                        htmlFor="mingguan"
                        className="text-lg font-medium text-gray-800 cursor-pointer"
                      >
                        Mingguan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Check-in setiap minggu untuk review progress berkala
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>📅</span>
                      <span>Cocok untuk goal dengan milestone jangka menengah</span>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
            
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih waktu pengingat:
              </Label>
              <Input
                type="time"
                value={onboardingData.reminderTime}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    reminderTime: e.target.value,
                  })
                }
                className="w-48"
              />
            </div>
          </div>
        );

      case 7: // Dashboard Summary
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">
                🎉 Selamat! Setup Goal Sudah Selesai
              </h2>
              <p className="text-gray-600">
                Berikut adalah ringkasan goal yang sudah Anda buat:
              </p>
            </div>

            {/* Goal Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Goal</h3>
              <p className="text-blue-700">{onboardingData.goalTitle}</p>
            </div>

            {/* Key Results Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                🎯 Angka Target ({onboardingData.keyResults.length})
              </h3>
              <ul className="space-y-2">
                {onboardingData.keyResults.map((kr, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span className="text-green-700">{kr}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Initiatives Summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">
                🚀 Inisiatif ({onboardingData.initiatives.length})
              </h3>
              <ul className="space-y-2">
                {onboardingData.initiatives.map((init, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span className="text-orange-700">{init}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tasks Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">
                ✅ Task ({onboardingData.tasks.length})
              </h3>
              <div className="space-y-2">
                {onboardingData.tasks.map((task, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <span className="text-purple-700">{task.title}</span>
                      <div className="text-sm text-purple-600 mt-1">
                        Tenggat: {task.dueDate} | PIC: {task.assignee}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">⚙️ Pengaturan</h3>
              <div className="space-y-1 text-gray-700">
                <p>
                  <strong>Frekuensi Check-in:</strong>{" "}
                  {onboardingData.cadence === "harian"
                    ? "Harian"
                    : "Mingguan"}
                </p>
                <p>
                  <strong>Waktu Pengingat:</strong> {onboardingData.reminderTime}
                </p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Klik "Selesai" untuk mulai menggunakan sistem manajemen goal
                Anda!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      console.log("🚀 Starting onboarding completion process...");

      // Step 1: Create cycle
      const cycleData = {
        title: `Siklus ${onboardingData.goalTitle}`,
        startDate: onboardingData.cycleStartDate,
        endDate: onboardingData.cycleEndDate,
        type: "monthly",
      };

      console.log("📅 Creating cycle with data:", cycleData);
      const cycleResponse = await apiRequest("POST", "/api/cycles", cycleData);
      const createdCycle = await cycleResponse.json();
      console.log("✅ Created cycle:", createdCycle);

      // Step 2: Create goal (objective)
      const goalData = {
        title: onboardingData.goalTitle,
        description: onboardingData.goalDescription,
        cycleId: createdCycle.id,
        ownerId: user.id,
        status: "active",
        type: "quarterly",
      };

      console.log("🎯 Creating goal with data:", goalData);
      const goalResponse = await apiRequest(
        "POST",
        "/api/objectives",
        goalData
      );
      const createdGoal = await goalResponse.json();
      console.log("✅ Created goal:", createdGoal);

      // Step 3: Create key results
      const keyResultPromises = onboardingData.keyResults.map(
        async (keyResult, index) => {
          const krData = {
            title: keyResult,
            description: "",
            objectiveId: createdGoal.id,
            responsibleUserId: user.id,
            targetValue: 100,
            currentValue: 0,
            unit: "percentage",
            keyResultType: "increase_to",
            baseline: 0,
            status: "active",
          };

          console.log(`🎯 Creating key result ${index + 1}:`, krData);
          const krResponse = await apiRequest(
            "POST",
            "/api/keyResults",
            krData
          );
          return await krResponse.json();
        }
      );

      const createdKeyResults = await Promise.all(keyResultPromises);
      console.log("✅ Created key results:", createdKeyResults);

      // Step 4: Create initiatives
      const initiativePromises = onboardingData.initiatives.map(
        async (initiative, index) => {
          const keyResultIndex = index % createdKeyResults.length;
          const keyResultId = createdKeyResults[keyResultIndex].id;

          const initiativeData = {
            title: initiative,
            description: `Inisiatif untuk mendukung: ${createdKeyResults[keyResultIndex].title}`,
            keyResultId: keyResultId,
            responsibleUserId: user.id,
            startDate: onboardingData.cycleStartDate,
            dueDate: onboardingData.cycleEndDate,
            status: "draft",
            priority: "medium",
          };

          console.log(`🚀 Creating initiative ${index + 1}:`, initiativeData);
          const initResponse = await apiRequest(
            "POST",
            "/api/initiatives",
            initiativeData
          );
          return await initResponse.json();
        }
      );

      const createdInitiatives = await Promise.all(initiativePromises);
      console.log("✅ Created initiatives:", createdInitiatives);

      // Step 5: Create tasks
      const taskPromises = onboardingData.tasks.map(
        async (task, index) => {
          const initiativeIndex = index % createdInitiatives.length;
          const initiativeId = createdInitiatives[initiativeIndex].id;

          const taskData = {
            title: task.title,
            description: `Task untuk mendukung: ${createdInitiatives[initiativeIndex].title}`,
            initiativeId: initiativeId,
            assignedUserId: user.id,
            dueDate: task.dueDate,
            priority: "medium",
            status: "belum_mulai",
          };

          console.log(`✅ Creating task ${index + 1}:`, taskData);
          const taskResponse = await apiRequest("POST", "/api/tasks", taskData);
          return await taskResponse.json();
        }
      );

      const createdTasks = await Promise.all(taskPromises);
      console.log("✅ Created tasks:", createdTasks);

      // Step 6: Update reminder configuration
      const reminderData = {
        cadence: onboardingData.cadence,
        reminderTime: onboardingData.reminderTime,
        isActive: true,
        teamFocus: "penjualan",
      };

      console.log("⏰ Updating reminder config:", reminderData);
      await apiRequest("POST", "/api/reminder-config", reminderData);

      console.log("🎉 Onboarding completed successfully!");
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error during onboarding:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyelesaikan onboarding",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Building className="w-6 h-6" />
              Setup Goal Perusahaan
            </CardTitle>
            <CardDescription className="text-orange-100">
              Langkah {onboardingData.currentStep} dari 7 - {currentStepData?.title || "Setup"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress: {Math.round((onboardingData.currentStep / 7) * 100)}%
                </span>
                <span className="text-sm text-gray-500">
                  {onboardingData.currentStep} / 7
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(onboardingData.currentStep / 7) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">{renderStepContent()}</div>
          </CardContent>

          <CardFooter className="flex justify-between p-6 bg-gray-50">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={onboardingData.currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>

            <div className="flex items-center gap-2">
              {onboardingData.currentStep < 7 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2"
                >
                  Lanjutkan
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Selesai
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
