import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User as UserIcon,
  Clock,
  Plus,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  MoreVertical,
  MoreHorizontal,
  Building,
  ClipboardList,
  CheckSquare,
  Trash2,
  FileText,
  Eye,
  MoveUp,
  MoveDown,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import EditKeyResultModal from "@/components/edit-key-result-modal";
import EditObjectiveModal from "@/components/edit-objective-modal";
import InitiativeModal from "@/components/initiative-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AIHelpBubble from "@/components/ai-help-bubble";
import ObjectiveOverviewCard from "@/components/objective-overview-card";
import ObjectiveTimeline from "@/components/objective-timeline";
import type {
  OKRWithKeyResults,
  KeyResult,
  Initiative,
  Task,
  Cycle,
  User,
  Team,
} from "@shared/schema";
import { calculateIdealProgress, getProgressStatus, getStatusColor } from "@shared/status-helper";

// Type for tasks with initiative info
type TaskWithInitiative = Task & {
  initiative?: {
    id: string;
    title: string;
  };
};

// Key Result Form Schema
const keyResultSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  keyResultType: z.enum(["increase_to", "decrease_to", "should_stay_above", "should_stay_below", "achieve_or_not"]),
  baseValue: z.string().optional(),
  targetValue: z.string().optional(),
  currentValue: z.string().optional(),
  unit: z.enum(["number", "percentage", "currency"]),
});

type KeyResultFormData = z.infer<typeof keyResultSchema>;

export default function GoalDetail() {
  const { id } = useParams();
  const [location] = useLocation();
  const { toast } = useToast();
  const [checkInModal, setCheckInModal] = useState<{
    open: boolean;
    keyResult?: KeyResult;
  }>({
    open: false,
  });
  const [editKeyResultModal, setEditKeyResultModal] = useState<{
    open: boolean;
    keyResult?: KeyResult;
  }>({
    open: false,
  });
  const [addKeyResultModal, setAddKeyResultModal] = useState<{ open: boolean }>(
    {
      open: false,
    },
  );
  const [addInitiativeModal, setAddInitiativeModal] = useState<{ open: boolean }>(
    {
      open: false,
    },
  );
  const [editObjectiveModal, setEditObjectiveModal] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const [expandedKeyResults, setExpandedKeyResults] = useState<Set<string>>(
    new Set(),
  );
  // Key Result Form
  const keyResultForm = useForm<KeyResultFormData>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      title: "",
      description: "",
      keyResultType: "increase_to",
      baseValue: "",
      targetValue: "",
      currentValue: "",
      unit: "number",
    },
  });

  // Check for highlight parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split("?")[1] || "");
    if (urlParams.get("highlight") === "keyresults") {
      setShouldHighlight(true);
      // Remove highlight after animation
      setTimeout(() => setShouldHighlight(false), 3000);
    }
  }, [location]);

  // Fetch goal data
  const { data: goal, isLoading } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/okrs/${id}`],
    enabled: !!id,
  });

  // Fetch cycle data
  const { data: cycle } = useQuery<Cycle>({
    queryKey: [`/api/cycles/${goal?.cycleId}`],
    enabled: !!goal?.cycleId,
  });

  // Fetch owner data
  const { data: owner } = useQuery<User | Team>({
    queryKey:
      goal?.ownerType === "user" || goal?.ownerType === "individual"
        ? [`/api/users/${goal?.ownerId}`]
        : [`/api/teams/${goal?.ownerId}`],
    enabled: !!goal?.ownerId && !!goal?.ownerType,
  });

  // Fetch parent objective data
  const { data: parentObjective } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/okrs/${goal?.parentId}`],
    enabled: !!goal?.parentId,
  });

  // Separate owner data by type
  const userOwner =
    goal?.ownerType === "user" || goal?.ownerType === "individual"
      ? (owner as User)
      : undefined;
  const teamOwner = goal?.ownerType === "team" ? (owner as Team) : undefined;

  // Fetch rencana for this goal
  const { data: rencana = [] } = useQuery<Initiative[]>({
    queryKey: [`/api/initiatives/objective/${id}`],
    enabled: !!id,
  });

  // Fetch tugas for rencana
  const { data: tugas = [] } = useQuery<TaskWithInitiative[]>({
    queryKey: [`/api/tasks/objective/${id}`],
    enabled: !!id,
  });

  // Fetch users for name display
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Helper function to get user name
  const getUserName = (userId: string): string => {
    if (!users) return userId;
    const user = users.find((u: any) => u.id === userId);
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || userId;
  };

  // Calculate days remaining based on cycle end date
  const calculateDaysRemaining = () => {
    const today = new Date();

    if (cycle?.endDate) {
      const endDate = new Date(cycle.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    return undefined;
  };

  const daysRemaining = calculateDaysRemaining();

  // Mutation for creating new Key Result
  const createKeyResultMutation = useMutation({
    mutationFn: async (keyResultData: KeyResultFormData) => {
      const response = await apiRequest("POST", "/api/key-results", {
        ...keyResultData,
        objectiveId: id,
        currentValue: keyResultData.currentValue || keyResultData.baseValue,
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ukuran Keberhasilan berhasil dibuat",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/okrs/${id}`] });
      setAddKeyResultModal({ open: false });
      keyResultForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat Ukuran Keberhasilan",
        variant: "destructive",
      });
    },
  });

  const handleCreateKeyResult = (data: KeyResultFormData) => {
    createKeyResultMutation.mutate(data);
  };

  const getKeyResultTypeIcon = (type: string) => {
    switch (type) {
      case "increase_to":
        return <TrendingUp className="w-4 h-4" />;
      case "decrease_to":
        return <TrendingDown className="w-4 h-4" />;
      case "achieve_or_not":
        return <Target className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getKeyResultTypeTooltip = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Target peningkatan: Progress dihitung berdasarkan peningkatan dari nilai awal ke target";
      case "decrease_to":
        return "Target penurunan: Progress dihitung berdasarkan penurunan dari nilai awal ke target";
      case "achieve_or_not":
        return "Target biner: 100% jika tercapai, 0% jika belum";
      default:
        return type;
    }
  };

  const formatCurrency = (value: string | number, unit: string) => {
    if (unit?.toLowerCase() === "rp" || unit?.toLowerCase() === "rupiah") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return `Rp ${numValue.toLocaleString("id-ID")}`;
    }
    return `${value} ${unit || ""}`.trim();
  };

  const calculateProgress = (
    current: string,
    target: string,
    keyResultType: string,
    baseValue?: string | null,
  ): number => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = baseValue ? parseFloat(baseValue) : 0;

    switch (keyResultType) {
      case "increase_to":
        // Formula: (Current - Base) / (Target - Base) * 100%
        if (targetNum <= baseNum) return 0; // Invalid configuration
        const increaseProgress =
          ((currentNum - baseNum) / (targetNum - baseNum)) * 100;
        return Math.min(100, Math.max(0, increaseProgress));

      case "decrease_to":
        // Formula: (Base - Current) / (Base - Target) * 100%
        if (baseNum <= targetNum) return 0; // Invalid configuration
        const decreaseProgress =
          ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));

      case "should_stay_above":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;

      case "should_stay_below":
        // Binary: 100% if current <= target, 0% otherwise
        return currentNum <= targetNum ? 100 : 0;

      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;

      default:
        return 0;
    }
  };

  const calculateOverallProgress = (keyResults: KeyResult[]): number => {
    if (!keyResults || keyResults.length === 0) return 0;

    const progressSum = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(
        kr.currentValue,
        kr.targetValue,
        kr.keyResultType,
        kr.baseValue,
      );
      return sum + progress;
    }, 0);

    return Math.round(progressSum / keyResults.length);
  };

  const handleCheckIn = (keyResult: KeyResult) => {
    setCheckInModal({ open: true, keyResult });
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditKeyResultModal({ open: true, keyResult });
  };

  const toggleKeyResultExpand = (keyResultId: string) => {
    setExpandedKeyResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyResultId)) {
        newSet.delete(keyResultId);
      } else {
        newSet.add(keyResultId);
      }
      return newSet;
    });
  };

  const getOwnerDisplay = () => {
    if (!owner) {
      return "Memuat...";
    }

    if (goal?.ownerType === "user" || goal?.ownerType === "individual") {
      const userOwner = owner as User;
      return (
        `${userOwner.firstName || ""} ${userOwner.lastName || ""}`.trim() ||
        userOwner.email
      );
    } else {
      const teamOwner = owner as Team;
      return teamOwner.name;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTugasByRencana = (rencanaId: string) => {
    return tugas.filter((task) => task.initiativeId === rencanaId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center text-gray-500 mt-2">Memuat goal...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Goal tidak ditemukan</p>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress(goal.keyResults);

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Page Header with Back Button and Actions */}
      <div className="mb-6">
        {/* Back button and Actions in same row */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditObjectiveModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Ubah Goal
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Duplikat Goal
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Visual Overview Section for easy understanding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ObjectiveOverviewCard
            objective={goal}
            initiatives={rencana}
            tasks={tugas}
            daysRemaining={daysRemaining}
            cycle={cycle}
            parentObjective={parentObjective}
            owner={owner}
            team={undefined}
          />
        </div>
        <div className="lg:col-span-1">
          <ObjectiveTimeline
            objective={goal}
            initiatives={rencana}
            tasks={tugas.slice(0, 5)}
          />
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="key-results" className="space-y-6">
        <TabsList className="flex w-full h-auto p-0 bg-transparent gap-0 rounded-none mb-4 sm:mb-6 relative">
          {/* Tab 1 */}
          <TabsTrigger
            value="key-results"
            className="relative bg-gray-100 border border-gray-300 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 flex items-center gap-2 sm:gap-3 justify-start flex-1"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)",
              marginRight: "-15px",
              zIndex: 3,
            }}
          >
            <span className="bg-white text-blue-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
              1
            </span>
            <span className="hidden sm:inline">Ukuran Keberhasilan ({goal.keyResults.length})</span>
            <span className="sm:hidden">Ukuran ({goal.keyResults.length})</span>
          </TabsTrigger>

          {/* Tab 2 */}
          <TabsTrigger
            value="initiatives"
            className="relative bg-gray-100 border border-gray-300 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:border-green-600 flex items-center gap-2 sm:gap-3 justify-start flex-1"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)",
              marginRight: "-15px",
              paddingLeft: "24px",
              zIndex: 2,
            }}
          >
            <span className="bg-white text-green-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
              2
            </span>
            <span className="hidden sm:inline">Rencana ({rencana.length})</span>
            <span className="sm:hidden">Rencana ({rencana.length})</span>
          </TabsTrigger>

          {/* Tab 3 */}
          <TabsTrigger
            value="tasks"
            className="relative bg-gray-100 border border-gray-300 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 flex items-center gap-2 sm:gap-3 justify-start flex-1"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              paddingLeft: "24px",
              zIndex: 1,
            }}
          >
            <span className="bg-white text-purple-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
              3
            </span>
            <span className="hidden sm:inline">Tugas ({tugas.length})</span>
            <span className="sm:hidden">Tugas ({tugas.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Ukuran Keberhasilan Tab */}
        <TabsContent
          value="key-results"
          className={`space-y-6 transition-all duration-1000 ${
            shouldHighlight
              ? "ring-4 ring-blue-300 ring-opacity-50 bg-blue-50/30 rounded-lg p-4"
              : ""
          }`}
        >
          {/* Header with Description and Add Button */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                  Ukuran Keberhasilan
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Ukuran keberhasilan menentukan bagaimana objective ini akan diukur. Setiap ukuran keberhasilan memiliki target yang spesifik dan dapat diukur untuk memastikan pencapaian yang objektif.
                </p>
              </div>
              <Button
                onClick={() => setAddKeyResultModal({ open: true })}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto sm:ml-4 shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Tambah</span>
                <span className="hidden sm:inline">Tambah Ukuran</span>
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Tercapai</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {goal.keyResults.filter(kr => {
                    const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
                    return progress >= 100;
                  }).length}
                </div>
                <div className="text-xs text-gray-500">dari {goal.keyResults.length} ukuran</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Dalam Progress</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {goal.keyResults.filter(kr => {
                    const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
                    return progress > 0 && progress < 100;
                  }).length}
                </div>
                <div className="text-xs text-gray-500">sedang berjalan</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Rata-rata Progress</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {overallProgress}%
                </div>
                <div className="text-xs text-gray-500">dari semua ukuran</div>
              </div>
            </div>

            {/* Key Results List */}
            <div className="mt-6 space-y-4">
              {goal.keyResults.length === 0 ? (
                <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-8 text-center">
                  <Target className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    Belum ada Ukuran Keberhasilan
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Mulai tambahkan Ukuran Keberhasilan untuk mengukur progress
                    goal ini
                  </p>
                  <Button
                    onClick={() => setAddKeyResultModal({ open: true })}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Ukuran Keberhasilan Pertama
                  </Button>
                </div>
              ) : (
                goal.keyResults.map((kr) => {
              const progress = calculateProgress(
                kr.currentValue,
                kr.targetValue,
                kr.keyResultType,
                kr.baseValue,
              );

              const getKeyResultTypeIcon = (type: string) => {
                switch (type) {
                  case "increase_to":
                    return {
                      icon: TrendingUp,
                      tooltip:
                        "Target Peningkatan - Progress dihitung dari nilai awal ke target",
                    };
                  case "decrease_to":
                    return {
                      icon: TrendingDown,
                      tooltip:
                        "Target Penurunan - Progress dihitung mundur dari nilai awal ke target",
                    };
                  case "should_stay_above":
                    return {
                      icon: MoveUp,
                      tooltip:
                        "Tetap Di Atas - Nilai harus tetap berada di atas ambang batas target",
                    };
                  case "should_stay_below":
                    return {
                      icon: MoveDown,
                      tooltip:
                        "Tetap Di Bawah - Nilai harus tetap berada di bawah ambang batas target",
                    };
                  case "achieve_or_not":
                    return {
                      icon: Target,
                      tooltip:
                        "Target Binary - 100% jika tercapai, 0% jika tidak",
                    };
                  default:
                    return {
                      icon: Target,
                      tooltip: "Tipe target tidak diketahui",
                    };
                }
              };

              const typeConfig = getKeyResultTypeIcon(kr.keyResultType);
              const IconComponent = typeConfig.icon;
              const isExpanded = expandedKeyResults.has(kr.id);
              const krInitiatives = rencana.filter(
                (r) => r.keyResultId === kr.id,
              );

              return (
                <div
                  key={kr.id}
                  className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg space-y-2 sm:space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Expand/Collapse Button */}
                        {krInitiatives.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={() => toggleKeyResultExpand(kr.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </Button>
                        )}
                        <Link
                          href={`/key-results/${kr.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                        >
                          {kr.title}
                        </Link>
                        <div className="relative group">
                          <IconComponent className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help" />
                          <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                            {typeConfig.tooltip}
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-black"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {kr.description}
                      </p>

                      {/* Initiative count for this key result */}
                      <div className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>
                          {
                            rencana.filter((r) => r.keyResultId === kr.id)
                              .length
                          }{" "}
                          inisiatif terkait
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        {(() => {
                          // Handle achieve_or_not type
                          if (kr.keyResultType === "achieve_or_not") {
                            return progress >= 100
                              ? "Status: Tercapai"
                              : "Status: Belum tercapai";
                          }

                          // Handle should_stay types
                          if (
                            kr.keyResultType === "should_stay_above" ||
                            kr.keyResultType === "should_stay_below"
                          ) {
                            const currentVal = parseFloat(kr.currentValue);
                            const targetVal = parseFloat(kr.targetValue);
                            const unitDisplay =
                              kr.unit === "Rp"
                                ? "Rp "
                                : kr.unit === "%"
                                  ? ""
                                  : "";
                            const unitSuffix = kr.unit === "%" ? "%" : "";

                            return `Saat ini: ${unitDisplay}${currentVal.toLocaleString("id-ID")}${unitSuffix} | Threshold: ${unitDisplay}${targetVal.toLocaleString("id-ID")}${unitSuffix}`;
                          }

                          // Handle increase_to and decrease_to types
                          const currentVal = parseFloat(kr.currentValue);
                          const targetVal = parseFloat(kr.targetValue);
                          const baseVal = kr.baseValue
                            ? parseFloat(kr.baseValue)
                            : 0;

                          if (kr.keyResultType === "decrease_to") {
                            if (kr.unit === "Rp") {
                              return `Rp ${baseVal.toLocaleString("id-ID")} → Rp ${targetVal.toLocaleString("id-ID")} (capaian: Rp ${currentVal.toLocaleString("id-ID")})`;
                            } else if (kr.unit === "%") {
                              return `${baseVal.toLocaleString("id-ID")}% → ${targetVal.toLocaleString("id-ID")}% (capaian: ${currentVal.toLocaleString("id-ID")}%)`;
                            } else {
                              return `${baseVal.toLocaleString("id-ID")} → ${targetVal.toLocaleString("id-ID")} ${kr.unit || ""} (capaian: ${currentVal.toLocaleString("id-ID")})`;
                            }
                          } else {
                            // increase_to type
                            if (kr.unit === "Rp") {
                              return `Rp ${baseVal.toLocaleString("id-ID")} → Rp ${targetVal.toLocaleString("id-ID")} (capaian: Rp ${currentVal.toLocaleString("id-ID")})`;
                            } else if (kr.unit === "%") {
                              return `${baseVal.toLocaleString("id-ID")}% → ${targetVal.toLocaleString("id-ID")}% (capaian: ${currentVal.toLocaleString("id-ID")}%)`;
                            } else {
                              return `${baseVal.toLocaleString("id-ID")} → ${targetVal.toLocaleString("id-ID")} ${kr.unit || ""} (capaian: ${currentVal.toLocaleString("id-ID")})`;
                            }
                          }
                        })()}
                      </div>
                    </div>
                    
                    {/* Action Buttons - Top Right */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCheckIn(kr)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="sm:hidden">Update</span>
                        <span className="hidden sm:inline">Update</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/key-results/${kr.id}`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditKeyResult(kr)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Ukuran Keberhasilan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress section with last check-in - consistent with dashboard */}
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="w-full sm:flex-1 sm:mr-4">
                      {/* Mobile: Use compact mode, Desktop: Use full progress bar */}
                      <div className="block sm:hidden">
                        <SimpleProgressStatus
                          status={kr.status}
                          progressPercentage={progress}
                          timeProgressPercentage={kr.timeProgressPercentage || 0}
                          dueDate={null}
                          startDate={cycle?.startDate}
                          compact={true}
                        />
                      </div>
                      <div className="hidden sm:block">
                        <SimpleProgressStatus
                          status={kr.status}
                          progressPercentage={progress}
                          timeProgressPercentage={kr.timeProgressPercentage || 0}
                          dueDate={null}
                          startDate={cycle?.startDate}
                          compact={false}
                        />
                      </div>
                    </div>
                    {kr.lastCheckIn && (
                      <div className="text-xs text-gray-500 sm:text-right sm:ml-4 sm:shrink-0">
                        <div className="flex items-center gap-1 sm:justify-end">
                          <span className="text-gray-400">Terakhir update:</span>
                          <span className="text-gray-600">
                            {kr.lastCheckIn.createdAt && new Date(kr.lastCheckIn.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {kr.lastCheckIn.notes && (
                          <div className="relative group mt-1">
                            <div 
                              className="text-gray-400 italic text-xs max-w-xs truncate sm:text-right cursor-help"
                            >
                              "{kr.lastCheckIn.notes}"
                            </div>
                            {/* Custom tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-sm min-w-0 break-words">
                              {kr.lastCheckIn.notes}
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Initiatives Section */}
                  {isExpanded && krInitiatives.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Rencana Terkait ({krInitiatives.length})
                      </h4>
                      <div className="space-y-2">
                        {krInitiatives.map((initiative) => (
                          <div
                            key={initiative.id}
                            className="p-3 bg-gray-50 rounded-md border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex gap-2">
                                <Badge
                                  className={
                                    initiative.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : initiative.status === "in_progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : initiative.status === "on_hold"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {initiative.status?.replace("_", " ") ||
                                    "pending"}
                                </Badge>
                                <Badge
                                  className={
                                    initiative.priority === "critical"
                                      ? "bg-red-100 text-red-800"
                                      : initiative.priority === "high"
                                        ? "bg-orange-100 text-orange-800"
                                        : initiative.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                  }
                                >
                                  {initiative.priority || "medium"}
                                </Badge>
                              </div>
                              <Link href={`/initiatives/${initiative.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Detail
                                </Button>
                              </Link>
                            </div>
                            <div className="mb-2">
                              <Link href={`/initiatives/${initiative.id}`}>
                                <h5 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                  {initiative.title}
                                </h5>
                              </Link>
                              {initiative.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {initiative.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <span>
                                  Progress: {initiative.progressPercentage || 0}
                                  %
                                </span>
                                {initiative.dueDate && (
                                  <span
                                    className={
                                      new Date(initiative.dueDate) < new Date()
                                        ? "text-red-600"
                                        : ""
                                    }
                                  >
                                    Due:{" "}
                                    {new Date(
                                      initiative.dueDate,
                                    ).toLocaleDateString("id-ID")}
                                  </span>
                                )}
                              </div>
                              {initiative.picId && (
                                <span>
                                  PIC: {getUserName(initiative.picId)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
            </div>

          </div>
        </TabsContent>

        {/* Rencana Tab */}
        <TabsContent value="initiatives" className="space-y-6">
          {/* Header with Description and Add Button */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 shrink-0" />
                  Rencana & Inisiatif
                </h3>
                <p className="text-green-700 text-sm leading-relaxed">
                  Rencana adalah langkah-langkah strategis untuk mencapai ukuran keberhasilan. Setiap rencana memiliki timeline, budget, dan PIC yang bertanggung jawab untuk eksekusi.
                </p>
              </div>
              <Button
                onClick={() => setAddInitiativeModal({ open: true })}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto sm:ml-4 shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Tambah</span>
                <span className="hidden sm:inline">Tambah Rencana</span>
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Selesai</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {rencana.filter(r => r.status === 'completed').length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Berlangsung</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {rencana.filter(r => r.status === 'in_progress').length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Total Budget</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  Rp {rencana.reduce((sum, r) => sum + (parseFloat(r.budget || '0')), 0).toLocaleString('id-ID')}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Rata-rata Progress</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {rencana.length > 0 ? Math.round(rencana.reduce((sum, r) => sum + (r.progressPercentage || 0), 0) / rencana.length) : 0}%
                </div>
              </div>
            </div>

            {/* Rencana List */}
            <div className="mt-6 space-y-4">
              {rencana.length === 0 ? (
                <div className="border-2 border-dashed border-green-200 bg-green-50/50 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-900 mb-2">
                    Belum ada rencana
                  </h3>
                  <p className="text-green-700 mb-4">
                    Mulai buat rencana untuk mencapai ukuran keberhasilan yang telah ditetapkan
                  </p>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rencana
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Prioritas
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Progress
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tenggat
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PIC
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rencana.map((initiative) => (
                            <tr key={initiative.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div>
                                  <Link href={`/initiatives/${initiative.id}`}>
                                    <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                      {initiative.title}
                                    </div>
                                  </Link>
                                  {initiative.description && (
                                    <div className="text-sm text-gray-500 line-clamp-1">
                                      {initiative.description}
                                    </div>
                                  )}
                                  {initiative.budget && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      Budget: Rp {parseFloat(initiative.budget).toLocaleString('id-ID')}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <Select
                                  value={initiative.status || 'not_started'}
                                  onValueChange={(newStatus) => {
                                    // Handle status update here
                                    console.log('Update initiative status:', initiative.id, newStatus);
                                  }}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_started">Belum Dimulai</SelectItem>
                                    <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                    <SelectItem value="on_hold">Ditahan</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-4">
                                <Badge
                                  className={
                                    initiative.priority === "critical"
                                      ? "bg-red-100 text-red-800"
                                      : initiative.priority === "high"
                                        ? "bg-orange-100 text-orange-800"
                                        : initiative.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                  }
                                >
                                  {initiative.priority === "critical"
                                    ? "Kritis"
                                    : initiative.priority === "high"
                                      ? "Tinggi"
                                      : initiative.priority === "medium"
                                        ? "Sedang"
                                        : "Rendah"}
                                </Badge>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${(() => {
                                        const progress = initiative.progressPercentage || 0;
                                        // For initiatives, use simpler status logic since they may not be tied to specific cycles
                                        if (progress >= 100) return 'bg-green-600';
                                        if (progress >= 80) return 'bg-green-500';
                                        if (progress >= 60) return 'bg-orange-500';
                                        return 'bg-red-500';
                                      })()}`}
                                      style={{ width: `${initiative.progressPercentage || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {initiative.progressPercentage || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {initiative.dueDate ? (
                                  <span
                                    className={`text-sm ${
                                      new Date(initiative.dueDate) < new Date()
                                        ? "text-red-600 font-medium"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {new Date(initiative.dueDate).toLocaleDateString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {initiative.picId ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                      {getUserName(initiative.picId)?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm text-gray-900 truncate">
                                      {getUserName(initiative.picId)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Tidak ditugaskan</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Ubah
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </TabsContent>

        {/* Tugas Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Header with Description */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-purple-600" />
                  Tugas & Aktivitas
                </h3>
                <p className="text-purple-700 text-sm leading-relaxed">
                  Tugas adalah aktivitas operasional yang mendukung pelaksanaan rencana. Setiap tugas memiliki PIC, deadline, dan tingkat prioritas untuk memastikan eksekusi yang efektif.
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Selesai</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {tugas.filter(t => t.status === 'completed').length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Berlangsung</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {tugas.filter(t => t.status === 'in_progress').length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Terlambat</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {tugas.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Prioritas Tinggi</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {tugas.filter(t => t.priority === 'high').length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Ditugaskan</span>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {tugas.filter(t => t.assignedTo).length}
                </div>
              </div>
            </div>

            {/* Tugas List */}
            <div className="mt-6 space-y-4">
              {tugas.length === 0 ? (
                <div className="border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-lg p-8 text-center">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-lg font-medium text-purple-900 mb-2">
                    Belum ada tugas
                  </h3>
                  <p className="text-purple-700 mb-4">
                    Tugas akan muncul ketika rencana dibuat dan dijabarkan ke aktivitas operasional.
                  </p>
                </div>
              ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kesehatan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tugas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prioritas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenggat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ditugaskan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tugas.map((task) => {
                        // Calculate task health score
                        const calculateHealthScore = (task: any) => {
                          let score = 100;

                          // Status impact
                          if (task.status === "completed") score = 100;
                          else if (task.status === "cancelled") score = 0;
                          else if (task.status === "in_progress") score = 70;
                          else score = 40; // not_started

                          // Due date impact
                          if (task.dueDate) {
                            const now = new Date();
                            const due = new Date(task.dueDate);
                            const daysDiff = Math.ceil(
                              (due.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );

                            if (daysDiff < 0)
                              score = Math.max(0, score - 30); // Overdue
                            else if (daysDiff <= 1)
                              score = Math.max(0, score - 20); // Due today/tomorrow
                            else if (daysDiff <= 3)
                              score = Math.max(0, score - 10); // Due soon
                          }

                          // Priority impact
                          if (
                            task.priority === "high" &&
                            task.status !== "completed"
                          ) {
                            score = Math.max(0, score - 15);
                          }

                          return Math.max(0, Math.min(100, score));
                        };

                        const healthScore = calculateHealthScore(task);
                        const getHealthColor = (score: number) => {
                          if (score >= 80) return "bg-green-500";
                          if (score >= 60) return "bg-yellow-500";
                          if (score >= 40) return "bg-orange-500";
                          return "bg-red-500";
                        };
                        
                        const getHealthTooltip = (score: number) => {
                          if (score >= 80) return "Kesehatan Baik - Tugas berjalan sesuai rencana";
                          if (score >= 60) return "Kesehatan Cukup - Perlu perhatian";
                          if (score >= 40) return "Kesehatan Kurang - Membutuhkan intervensi";
                          return "Kesehatan Buruk - Perlu tindakan segera";
                        };

                        return (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-full ${getHealthColor(healthScore)} flex items-center justify-center`}
                                  title={getHealthTooltip(healthScore)}
                                >
                                  {healthScore >= 80 && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                  {healthScore < 40 && <AlertTriangle className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-xs text-gray-500">{healthScore}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {task.title}
                              </div>
                              {task.initiative && (
                                <div className="text-sm text-gray-500">
                                  Inisiatif: {task.initiative.title}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <Select
                                value={task.status}
                                onValueChange={(newStatus) => {
                                  // Handle status update here
                                  console.log(
                                    "Update status:",
                                    task.id,
                                    newStatus,
                                  );
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">
                                    Belum Dimulai
                                  </SelectItem>
                                  <SelectItem value="in_progress">
                                    Sedang Berjalan
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    Selesai
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Dibatalkan
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-4">
                              <Badge
                                className={
                                  task.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : task.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                }
                              >
                                {task.priority === "high"
                                  ? "Tinggi"
                                  : task.priority === "medium"
                                    ? "Sedang"
                                    : "Rendah"}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {task.dueDate ? (
                                <span
                                  className={`text-sm ${
                                    new Date(task.dueDate) < new Date()
                                      ? "text-red-600 font-medium"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {new Date(task.dueDate).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {task.assignedTo ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {getUserName(task.assignedTo)
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {getUserName(task.assignedTo)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">
                                  Belum Ditugaskan
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Ubah
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
              )}
            </div>

          </div>
        </TabsContent>
      </Tabs>
      {/* Modals */}
      {checkInModal.keyResult && (
        <CheckInModal
          keyResultId={checkInModal.keyResult.id}
          keyResultTitle={checkInModal.keyResult.title}
          currentValue={checkInModal.keyResult.currentValue}
          targetValue={checkInModal.keyResult.targetValue}
          unit={checkInModal.keyResult.unit}
          keyResultType={checkInModal.keyResult.keyResultType}
          open={checkInModal.open}
          onOpenChange={(open) => setCheckInModal({ open, keyResult: open ? checkInModal.keyResult : undefined })}
        />
      )}
      <EditKeyResultModal
        open={editKeyResultModal.open}
        onOpenChange={(open) => setEditKeyResultModal({ open })}
        keyResult={editKeyResultModal.keyResult}
      />
      {/* Add Key Result Modal */}
      <Dialog
        open={addKeyResultModal.open}
        onOpenChange={(open) => setAddKeyResultModal({ open })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tambah Ukuran Keberhasilan Baru
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <Form {...keyResultForm}>
              <form onSubmit={keyResultForm.handleSubmit(handleCreateKeyResult)} className="space-y-6">
                {/* Key Result Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-medium text-gray-900">Informasi Ukuran Keberhasilan</h3>
                  
                  {/* Title */}
                  <FormField
                    control={keyResultForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Judul Ukuran Keberhasilan *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Contoh: Meningkatkan pendapatan bulanan menjadi 100 juta" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={keyResultForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Deskripsi
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Deskripsi detail tentang Ukuran Keberhasilan ini"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type and Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={keyResultForm.control}
                      name="keyResultType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Tipe Ukuran Keberhasilan *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="increase_to">Naik ke (Increase To)</SelectItem>
                              <SelectItem value="decrease_to">Turun ke (Decrease To)</SelectItem>
                              <SelectItem value="should_stay_above">Harus tetap di atas (Stay Above)</SelectItem>
                              <SelectItem value="should_stay_below">Harus tetap di bawah (Stay Below)</SelectItem>
                              <SelectItem value="achieve_or_not">Ya/Tidak (Achieve or Not)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={keyResultForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Unit *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="number">Angka</SelectItem>
                              <SelectItem value="percentage">Persentase (%)</SelectItem>
                              <SelectItem value="currency">Mata Uang (Rp)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={keyResultForm.control}
                      name="baseValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Nilai Awal *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={keyResultForm.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Target *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={keyResultForm.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Nilai Saat Ini
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="Akan otomatis sama dengan nilai awal" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddKeyResultModal({ open: false })}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createKeyResultMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createKeyResultMutation.isPending
                      ? "Menyimpan..."
                      : "Buat Ukuran Keberhasilan"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Objective Modal */}
      {goal && (
        <EditObjectiveModal
          objective={goal}
          open={editObjectiveModal}
          onOpenChange={setEditObjectiveModal}
        />
      )}

      {/* Add Initiative Modal */}
      {goal?.keyResults && goal.keyResults.length > 0 && (
        <InitiativeModal
          keyResultId={goal.keyResults[0].id}
          open={addInitiativeModal.open}
          onClose={() => setAddInitiativeModal({ open: false })}
          onSuccess={() => {
            setAddInitiativeModal({ open: false });
            window.location.reload();
          }}
        />
      )}

      {/* AI Help Bubble */}
      <AIHelpBubble
        context="objective_detail"
        data={{
          objective: goal,
          keyResults: goal?.keyResults || [],
          cycleId: goal?.cycleId,
          cycleName: cycle?.name,
        }}
        position="bottom-right"
      />
    </div>
  );
}
