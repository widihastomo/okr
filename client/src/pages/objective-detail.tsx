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
} from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import EditKeyResultModal from "@/components/edit-key-result-modal";
import EditObjectiveModal from "@/components/edit-objective-modal";
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

// Type for tasks with initiative info
type TaskWithInitiative = Task & {
  initiative?: {
    id: string;
    title: string;
  };
};

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
  const [editObjectiveModal, setEditObjectiveModal] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const [expandedKeyResults, setExpandedKeyResults] = useState<Set<string>>(
    new Set(),
  );
  const [keyResultForm, setKeyResultForm] = useState({
    title: "",
    description: "",
    keyResultType: "increase_to",
    baseValue: "",
    targetValue: "",
    currentValue: "",
    unit: "number",
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
    mutationFn: async (keyResultData: any) => {
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
      setKeyResultForm({
        title: "",
        description: "",
        keyResultType: "increase_to",
        baseValue: "",
        targetValue: "",
        currentValue: "",
        unit: "number",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat Ukuran Keberhasilan",
        variant: "destructive",
      });
    },
  });

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="key-results">
            Ukuran Keberhasilan ({goal.keyResults.length})
          </TabsTrigger>
          <TabsTrigger value="initiatives">
            Rencana ({rencana.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">Tugas ({tugas.length})</TabsTrigger>
        </TabsList>

        {/* Ukuran Keberhasilan Tab */}
        <TabsContent
          value="key-results"
          className={`space-y-4 transition-all duration-1000 ${
            shouldHighlight
              ? "ring-4 ring-blue-300 ring-opacity-50 bg-blue-50/30 rounded-lg p-4"
              : ""
          }`}
        >
          {/* Add Ukuran Keberhasilan Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setAddKeyResultModal({ open: true })}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Ukuran Keberhasilan
            </Button>
          </div>

          {goal.keyResults.length === 0 ? (
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
              <CardContent className="p-8 text-center">
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
              </CardContent>
            </Card>
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCheckIn(kr)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
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

                  {/* Progress section - using same structure as dashboard */}
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="w-full sm:flex-1 sm:mr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Lebih Cepat
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                          <Progress value={progress} className="h-2" />
                          {cycle &&
                            (() => {
                              const now = new Date();
                              const start = new Date(cycle.startDate);
                              const end = new Date(cycle.endDate);
                              const totalTime = end.getTime() - start.getTime();
                              const timePassed =
                                now.getTime() - start.getTime();
                              const idealProgress = Math.max(
                                0,
                                Math.min(100, (timePassed / totalTime) * 100),
                              );

                              return (
                                <div
                                  className="absolute top-0 h-2 w-0.5 bg-gray-400 opacity-70"
                                  style={{ left: `${idealProgress}%` }}
                                  title={`Target ideal: ${idealProgress.toFixed(1)}%`}
                                />
                              );
                            })()}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {progress.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 sm:text-right sm:ml-4 sm:shrink-0">
                      Terakhir update: 3 Jul 2025
                    </div>
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
        </TabsContent>

        {/* Rencana Tab */}
        <TabsContent value="initiatives" className="space-y-4">
          {rencana.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Belum ada rencana untuk goal ini
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rencana.map((initiative) => (
                <Card
                  key={initiative.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
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
                          {initiative.status?.replace("_", " ") || "pending"}
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
                    </div>
                    <CardTitle className="text-lg">
                      <Link href={`/initiatives/${initiative.id}`}>
                        <span className="hover:text-blue-600 cursor-pointer">
                          {initiative.title}
                        </span>
                      </Link>
                    </CardTitle>
                    {initiative.description && (
                      <CardDescription className="line-clamp-2">
                        {initiative.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Kemajuan</span>
                        <span className="font-medium">
                          {initiative.progressPercentage || 0}%
                        </span>
                      </div>
                      <Progress
                        value={initiative.progressPercentage || 0}
                        className="h-2"
                      />
                    </div>

                    {/* Due Date */}
                    {initiative.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Tenggat:</span>
                        <span
                          className={`font-medium ${
                            new Date(initiative.dueDate) < new Date()
                              ? "text-red-600"
                              : ""
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
                      </div>
                    )}

                    {/* PIC */}
                    {initiative.picId && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">PIC:</span>
                        <span className="font-medium truncate">
                          {getUserName(initiative.picId)}
                        </span>
                      </div>
                    )}

                    {/* Budget */}
                    {initiative.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Anggaran:</span>
                        <span className="font-medium">
                          Rp{" "}
                          {parseFloat(initiative.budget).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tugas Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {tugas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum ada tugas
                </h3>
                <p className="text-gray-500">
                  Tugas akan muncul ketika inisiatif dibuat.
                </p>
              </CardContent>
            </Card>
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

                        return (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div
                                className={`w-3 h-3 rounded-full ${getHealthColor(healthScore)}`}
                                title={`Health Score: ${healthScore}%`}
                              />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Ukuran Keberhasilan Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Judul Ukuran Keberhasilan *</Label>
                <Input
                  id="title"
                  value={keyResultForm.title}
                  onChange={(e) =>
                    setKeyResultForm({
                      ...keyResultForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Contoh: Meningkatkan pendapatan bulanan menjadi 100 juta"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={keyResultForm.description}
                  onChange={(e) =>
                    setKeyResultForm({
                      ...keyResultForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Deskripsi detail tentang Ukuran Keberhasilan ini"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="keyResultType">
                    Tipe Ukuran Keberhasilan *
                  </Label>
                  <Select
                    value={keyResultForm.keyResultType}
                    onValueChange={(value) =>
                      setKeyResultForm({
                        ...keyResultForm,
                        keyResultType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase_to">
                        Naik ke (Increase To)
                      </SelectItem>
                      <SelectItem value="decrease_to">
                        Turun ke (Decrease To)
                      </SelectItem>
                      <SelectItem value="should_stay_above">
                        Harus tetap di atas (Stay Above)
                      </SelectItem>
                      <SelectItem value="should_stay_below">
                        Harus tetap di bawah (Stay Below)
                      </SelectItem>
                      <SelectItem value="achieve_or_not">
                        Ya/Tidak (Achieve or Not)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={keyResultForm.unit}
                    onValueChange={(value) =>
                      setKeyResultForm({ ...keyResultForm, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Angka</SelectItem>
                      <SelectItem value="percentage">Persentase (%)</SelectItem>
                      <SelectItem value="currency">Mata Uang (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="baseValue">Nilai Awal *</Label>
                  <Input
                    id="baseValue"
                    type="number"
                    value={keyResultForm.baseValue}
                    onChange={(e) =>
                      setKeyResultForm({
                        ...keyResultForm,
                        baseValue: e.target.value,
                      })
                    }
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="targetValue">Target *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={keyResultForm.targetValue}
                    onChange={(e) =>
                      setKeyResultForm({
                        ...keyResultForm,
                        targetValue: e.target.value,
                      })
                    }
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currentValue">Nilai Saat Ini</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    value={keyResultForm.currentValue}
                    onChange={(e) =>
                      setKeyResultForm({
                        ...keyResultForm,
                        currentValue: e.target.value,
                      })
                    }
                    placeholder="Akan otomatis sama dengan nilai awal"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddKeyResultModal({ open: false })}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => createKeyResultMutation.mutate(keyResultForm)}
                disabled={
                  createKeyResultMutation.isPending ||
                  !keyResultForm.title ||
                  !keyResultForm.baseValue ||
                  !keyResultForm.targetValue
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createKeyResultMutation.isPending
                  ? "Menyimpan..."
                  : "Buat Ukuran Keberhasilan"}
              </Button>
            </div>
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
