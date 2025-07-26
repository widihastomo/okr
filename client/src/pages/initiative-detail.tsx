import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Flag,
  Target,
  User,
  Users,
  Clock,
  FileText,
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Info,
  ChevronDown,
  CheckCircle,
  XCircle,
  Plus,
  MessageSquare,
  Award,
  Rocket,
  Sparkles,
  ChevronRight,
  HelpCircle,
  CheckSquare,
  Eye,
  AlertTriangle,
  Minus,
  RotateCcw,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TaskModal from "@/components/task-modal";
import { QuickUpdateButton } from "@/components/quick-update-button";
import InitiativeFormModal from "@/components/initiative-form-modal";
import { InitiativeHistory } from "@/components/initiative-history";
import SuccessMetricsModal from "@/components/success-metrics-modal-simple";
import InitiativeClosureModal from "@/components/initiative-closure-modal";
import { InitiativeCommentsCard } from "@/components/initiative-comments-card";
import { SearchableKeyResultSelect } from "@/components/ui/searchable-key-result-select";
import { calculateKeyResultProgress } from "@shared/progress-calculator";
import type { SuccessMetricWithUpdates } from "@shared/schema";

// Helper functions for task status and priority
const getTaskStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTaskStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Selesai";
    case "in_progress":
      return "Sedang Berjalan";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "Belum Dimulai";
  }
};

const getTaskPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTaskPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Tinggi";
    case "medium":
      return "Sedang";
    case "low":
      return "Rendah";
    default:
      return "Sedang";
  }
};

// Helper function to get task priority icon with tooltip
const getTaskPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        icon: <div className="w-3 h-3 bg-red-500 rounded-full"></div>,
        color: "text-red-600",
        label: "Prioritas Tinggi",
      };
    case "medium":
      return {
        icon: <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>,
        color: "text-yellow-600",
        label: "Prioritas Sedang",
      };
    case "low":
      return {
        icon: <div className="w-3 h-3 bg-green-500 rounded-full"></div>,
        color: "text-green-600",
        label: "Prioritas Rendah",
      };
    default:
      return {
        icon: <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>,
        color: "text-yellow-600",
        label: "Prioritas Sedang",
      };
  }
};

// Helper function to translate priority to Indonesian
const translatePriority = (priority: string): string => {
  const translations: { [key: string]: string } = {
    low: "rendah",
    medium: "sedang",
    high: "tinggi",
    urgent: "mendesak",
    rendah: "rendah",
    sedang: "sedang",
    tinggi: "tinggi",
    mendesak: "mendesak",
  };
  return translations[priority?.toLowerCase()] || priority;
};

// Helper functions for task management (reuse from daily focus) - moved inside component

// Helper function to calculate progress stats
const calculateProgressStats = (tasks: any[]) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedTasks = safeTasks.filter(
    (task) => task.status === "completed",
  ).length;
  const totalTasks = safeTasks.length;
  const percentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    completed: completedTasks,
    total: totalTasks,
    percentage,
    notStarted: safeTasks.filter((task) => task.status === "not_started")
      .length,
    inProgress: safeTasks.filter((task) => task.status === "in_progress")
      .length,
    cancelled: safeTasks.filter((task) => task.status === "cancelled").length,
  };
};

// QuickUpdateButton Component

// Mission Card Component - Consistent with Daily Focus & Objective Detail
interface MissionCardProps {
  missions: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    isCompleted: boolean;
    points: number;
    difficulty: "easy" | "medium" | "hard";
  }>;
  className?: string;
  successMetrics?: any[];
  tasks?: any[];
}

function MissionCard({
  missions,
  className,
  successMetrics,
  tasks,
}: MissionCardProps) {
  const completedMissions = missions.filter((m) => m.isCompleted).length;
  const totalMissions = missions.length;
  // Auto-expand if initiative has no metrics and no tasks
  const shouldAutoExpand =
    (!successMetrics || successMetrics.length === 0) &&
    (!tasks || tasks.length === 0);
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
        <CardHeader
          className="pb-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Rocket className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-bold text-orange-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Misi Aktivasi Inisiatif
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                >
                  {completedMissions}/{totalMissions}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <Progress
                  value={(completedMissions / totalMissions) * 100}
                  className="h-1.5 bg-orange-100 flex-1"
                />
                <span className="text-xs text-orange-600 font-medium">
                  {Math.round((completedMissions / totalMissions) * 100)}%
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:bg-orange-100 p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-3 pt-0">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  mission.isCompleted
                    ? "bg-green-50 border-green-200 opacity-75"
                    : "bg-white border-orange-200 hover:border-orange-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      mission.isCompleted
                        ? "bg-green-100 text-green-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {mission.isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      mission.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-medium text-sm ${
                          mission.isCompleted
                            ? "text-green-900"
                            : "text-gray-900"
                        }`}
                      >
                        {mission.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            mission.difficulty === "easy"
                              ? "bg-green-500"
                              : mission.difficulty === "medium"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="text-xs text-gray-500">
                          {mission.difficulty === "easy"
                            ? "Mudah"
                            : mission.difficulty === "medium"
                              ? "Sedang"
                              : "Sulit"}
                        </span>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        +{mission.points} poin
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {mission.description}
                    </p>
                    {!mission.isCompleted && (
                      <Button
                        onClick={mission.action}
                        size="sm"
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Mulai Sekarang
                      </Button>
                    )}
                    {mission.isCompleted && (
                      <div className="flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        <span className="font-medium">Misi Selesai!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Milestone Component - Horizontal Bar Design
const MilestoneBar = ({
  initiative,
  tasks,
}: {
  initiative: any;
  tasks: any[];
}) => {
  // Determine current milestone based on initiative status and task progress
  const getCurrentMilestone = () => {
    if (initiative.status === "selesai" || initiative.status === "completed") {
      return 3; // Selesai
    }

    // Check if any task is in progress or completed
    const hasProgressingTasks = tasks.some(
      (task) => task.status === "in_progress" || task.status === "completed",
    );

    if (hasProgressingTasks) {
      return 2; // Eksekusi
    }

    return 1; // Perencanaan
  };

  const currentMilestone = getCurrentMilestone();

  const milestones = [
    { id: 1, name: "Perencanaan", description: "Inisiatif baru dibuat" },
    { id: 2, name: "Eksekusi", description: "Ada task yang berjalan" },
    { id: 3, name: "Selesai", description: "Inisiatif sudah ditutup" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
        Tahapan Inisiatif
      </h3>
      {/* Mobile View - Vertical Stack */}
      <div className="block sm:hidden space-y-3">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                milestone.id <= currentMilestone
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {milestone.id <= currentMilestone ? (
                <Check className="w-4 h-4" />
              ) : (
                milestone.id
              )}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium ${
                  milestone.id <= currentMilestone
                    ? "text-orange-600"
                    : "text-gray-600"
                }`}
              >
                {milestone.name}
                {milestone.id === currentMilestone && milestone.id < 3 && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    Saat ini
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {milestone.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop View - Horizontal Bars */}
      <div className="hidden sm:flex items-center gap-2">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center flex-1">
            {/* Step Bar */}
            <div
              className={`flex-1 h-12 rounded-lg flex items-center justify-between px-4 transition-all duration-300 ${
                milestone.id <= currentMilestone
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    milestone.id <= currentMilestone
                      ? "bg-white/20 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {milestone.id <= currentMilestone ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    milestone.id
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{milestone.name}</div>
                  <div
                    className={`text-xs ${
                      milestone.id <= currentMilestone
                        ? "text-orange-100"
                        : "text-gray-400"
                    }`}
                  >
                    {milestone.description}
                  </div>
                </div>
              </div>

              {/* Progress indicator for current step */}
              {milestone.id === currentMilestone && milestone.id < 3 && (
                <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                  Saat ini
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Closure Summary Component
const ClosureSummary = ({ initiative }: { initiative: any }) => {
  const closureData = initiative.closureData;

  if (!closureData || initiative.status !== "selesai") {
    return null;
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "berhasil":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "gagal":
        return <XCircle className="h-3 w-3 text-red-600" />;
      case "perlu_diulang":
        return <RotateCcw className="h-3 w-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "berhasil":
        return "Berhasil";
      case "gagal":
        return "Gagal";
      case "perlu_diulang":
        return "Perlu Diulang";
      default:
        return "";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "berhasil":
        return "bg-green-50 border-green-200 text-green-800";
      case "gagal":
        return "bg-red-50 border-red-200 text-red-800";
      case "perlu_diulang":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getClosureContainerStyle = (result: string) => {
    switch (result) {
      case "berhasil":
        return "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50";
      case "gagal":
        return "border-red-200 bg-gradient-to-br from-red-50 to-rose-50";
      case "perlu_diulang":
        return "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50";
      default:
        return "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50";
    }
  };

  const getClosureTextColor = (result: string) => {
    switch (result) {
      case "berhasil":
        return "text-green-600";
      case "gagal":
        return "text-red-600";
      case "perlu_diulang":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getClosureTextSecondary = (result: string) => {
    switch (result) {
      case "berhasil":
        return "text-green-700";
      case "gagal":
        return "text-red-700";
      case "perlu_diulang":
        return "text-orange-700";
      default:
        return "text-gray-700";
    }
  };

  const getClosureTextMuted = (result: string) => {
    switch (result) {
      case "berhasil":
        return "text-green-900";
      case "gagal":
        return "text-red-900";
      case "perlu_diulang":
        return "text-orange-900";
      default:
        return "text-gray-900";
    }
  };

  const getClosureBorderColor = (result: string) => {
    switch (result) {
      case "berhasil":
        return "border-green-200";
      case "gagal":
        return "border-red-200";
      case "perlu_diulang":
        return "border-orange-200";
      default:
        return "border-gray-200";
    }
  };

  return (
    <div
      className={`mb-6 border-2 border-dashed ${getClosureContainerStyle(closureData.result)} shadow-lg rounded-lg p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText
          className={`h-4 w-4 ${getClosureTextColor(closureData.result)}`}
        />
        <h3
          className={`text-sm font-semibold ${getClosureTextMuted(closureData.result)}`}
        >
          Resume Penutupan
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {/* Result Status */}
        <div className="flex items-center gap-2">
          <span
            className={`${getClosureTextSecondary(closureData.result)} font-medium`}
          >
            Hasil:
          </span>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getResultColor(closureData.result)}`}
          >
            {getResultIcon(closureData.result)}
            {getResultLabel(closureData.result)}
          </div>
        </div>

        {/* Closure Date */}
        <div className="flex items-center gap-2">
          <span
            className={`${getClosureTextSecondary(closureData.result)} font-medium`}
          >
            Ditutup:
          </span>
          <span className={getClosureTextMuted(closureData.result)}>
            {formatDate(closureData.closedAt || initiative.completedAt)}
          </span>
        </div>

        {/* Closed By */}
        {initiative.closedBy && (
          <div className="flex items-center gap-2">
            <span
              className={`${getClosureTextSecondary(closureData.result)} font-medium`}
            >
              Oleh:
            </span>
            <span className={getClosureTextMuted(closureData.result)}>
              {getUserName(initiative.closedBy)}
            </span>
          </div>
        )}

        {/* Budget Usage */}
        {closureData.budgetUsed && (
          <div className="flex items-center gap-2">
            <span
              className={`${getClosureTextSecondary(closureData.result)} font-medium`}
            >
              Budget:
            </span>
            <span className={getClosureTextMuted(closureData.result)}>
              Rp {Number(closureData.budgetUsed).toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>

      {/* Notes - Compact format */}
      {(closureData.reason ||
        closureData.learningNote ||
        closureData.notes) && (
        <div
          className={`mt-3 pt-3 border-t ${getClosureBorderColor(closureData.result)}`}
        >
          {closureData.reason && (
            <div className="mb-2">
              <span
                className={`text-xs font-medium ${getClosureTextSecondary(closureData.result)}`}
              >
                Alasan:{" "}
              </span>
              <span
                className={`text-xs ${getClosureTextMuted(closureData.result)}`}
              >
                {closureData.reason}
              </span>
            </div>
          )}
          {closureData.learningNote && (
            <div className="mb-2">
              <span
                className={`text-xs font-medium ${getClosureTextSecondary(closureData.result)}`}
              >
                Pembelajaran:{" "}
              </span>
              <span
                className={`text-xs ${getClosureTextMuted(closureData.result)}`}
              >
                {closureData.learningNote}
              </span>
            </div>
          )}
          {closureData.notes && (
            <div>
              <span
                className={`text-xs font-medium ${getClosureTextSecondary(closureData.result)}`}
              >
                Catatan:{" "}
              </span>
              <span
                className={`text-xs ${getClosureTextMuted(closureData.result)}`}
              >
                {closureData.notes}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// getUserInitials and getUserName are already defined above

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Custom hook to get comment count for a specific task
const useTaskCommentCount = (taskId: string) => {
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/tasks/${taskId}/comments`],
    enabled: !!taskId,
    staleTime: 30000, // Cache for 30 seconds
  });
  return comments.length;
};

// Task Comment Count Component
const TaskCommentCount = ({ taskId }: { taskId: string }) => {
  const commentCount = useTaskCommentCount(taskId);

  if (commentCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
            <MessageSquare className="h-3 w-3" />
            <span>{commentCount}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{commentCount} komentar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Prevent auto-scroll when page loads
  useEffect(() => {
    // Prevent any automatic scrolling by overriding scroll behavior temporarily
    const preventScroll = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Add event listener to prevent scroll during initial load
    window.addEventListener("scroll", preventScroll, { passive: false });

    // Remove the event listener after component has fully loaded
    const timer = setTimeout(() => {
      window.removeEventListener("scroll", preventScroll);
      // Ensure we're at the top of the page
      window.scrollTo(0, 0);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", preventScroll);
    };
  }, []);

  // All state variables declared at the top level
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditInitiativeModalOpen, setIsEditInitiativeModalOpen] =
    useState(false);
  const [isSuccessMetricsModalOpen, setIsSuccessMetricsModalOpen] =
    useState(false);
  const [editingMetric, setEditingMetric] = useState<any>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [isDeleteMetricModalOpen, setIsDeleteMetricModalOpen] = useState(false);
  const [isAddDeliverableModalOpen, setIsAddDeliverableModalOpen] = useState(false);
  const [isEditDeliverableModalOpen, setIsEditDeliverableModalOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<any>(null);
  const [metricToDelete, setMetricToDelete] = useState<any>(null);
  const [isDeleteDeliverableModalOpen, setIsDeleteDeliverableModalOpen] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState<any>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCloseInitiativeModalOpen, setIsCloseInitiativeModalOpen] =
    useState(false);
  const [isReopenInitiativeModalOpen, setIsReopenInitiativeModalOpen] =
    useState(false);
  const [isDeleteInitiativeModalOpen, setIsDeleteInitiativeModalOpen] =
    useState(false);
  const [selectedKeyResultForReopen, setSelectedKeyResultForReopen] =
    useState<string>("");

  // All queries declared at the top level
  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: [`/api/initiatives/${id}`],
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: [`/api/initiatives/${id}/tasks`],
    enabled: !!id,
  });

  const { data: successMetrics = [] } = useQuery<any[]>({
    queryKey: [`/api/initiatives/${id}/success-metrics`],
    enabled: !!id,
  });

  // Fetch output items for the initiative
  const { data: definitionOfDoneItems = [] } = useQuery<any[]>({
    queryKey: [`/api/initiatives/${id}/definition-of-done`],
    enabled: !!id,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/organization/users"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: keyResults = [] } = useQuery<any[]>({
    queryKey: ["/api/key-results"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper functions that need users data
  const getUserName = (userId: string): string => {
    const user = users?.find((u) => u.id === userId);
    if (!user) return "Unknown";

    // Use consolidated name field
    if (user.name && user.name.trim() !== "") {
      return user.name.trim();
    }

    // Fallback to email username
    if (user.email) {
      return user.email.split("@")[0];
    }

    return "Unknown";
  };

  const getUserInitials = (userId: string): string => {
    const user = users?.find((u) => u.id === userId);
    if (!user) return "U";
    const name = user.name || "";
    if (name && name.trim() !== "") {
      const nameParts = name.trim().split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : "U";
  };

  // Helper function to get user profile image URL
  const getUserProfileImage = (userId: string): string | undefined => {
    if (!userId || !users) return undefined;
    const user = users.find((u: any) => u.id === userId);
    return user?.profileImageUrl || undefined;
  };

  // Helper function specifically for member profile images
  const getMemberProfileImage = (member: any): string | undefined => {
    // First try to get from member.user data
    if (member.user?.profileImageUrl) {
      return member.user.profileImageUrl;
    }
    // Fallback to getUserProfileImage with member.userId
    return getUserProfileImage(member.userId);
  };

  // Helper function specifically for member initials
  const getMemberInitials = (member: any): string => {
    // First try to get from member.user data
    if (member.user) {
      const name = member.user.name || "";
      if (name && name.trim() !== "") {
        const nameParts = name.trim().split(" ");
        if (nameParts.length >= 2) {
          return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return nameParts[0][0].toUpperCase();
      }
      return member.user.email ? member.user.email[0].toUpperCase() : "U";
    }
    // Fallback to getUserInitials with member.userId
    return getUserInitials(member.userId);
  };

  const { data: relatedInitiatives } = useQuery({
    queryKey: ["/api/initiatives"],
    enabled: !!initiative,
    select: (data: any[]) => {
      const initiativeData = initiative as any;
      const keyResult = initiativeData?.keyResult;
      return (
        data?.filter(
          (init) => init.keyResultId === keyResult?.id && init.id !== id,
        ) || []
      );
    },
  });

  // All mutations declared at the top level
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/tasks`],
      });
      // Invalidate initiative detail (to refresh status)
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      // Invalidate initiative list (if user navigates back)
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      
      // Show task deletion toast
      toast({
        title: "Task berhasil dihapus",
        description: "Task berhasil dihapus",
        variant: "success",
      });
      
      // Show initiative status change toast if applicable
      if (data?.initiativeStatusChange?.changed) {
        const getStatusLabel = (status: string) => {
          switch (status) {
            case 'draft': return 'Draft';
            case 'sedang_berjalan': return 'Sedang Berjalan';
            case 'selesai': return 'Selesai';
            case 'dibatalkan': return 'Dibatalkan';
            case 'on_hold': return 'Ditunda';
            default: return status;
          }
        };
        
        const { oldStatus, newStatus } = data.initiativeStatusChange;
        toast({
          title: "Status inisiatif berubah otomatis",
          description: `Status inisiatif berubah dari "${getStatusLabel(oldStatus)}" ke "${getStatusLabel(newStatus)}" karena task dihapus`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  const deleteSuccessMetricMutation = useMutation({
    mutationFn: async (metricId: string) => {
      return apiRequest("DELETE", `/api/success-metrics/${metricId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/success-metrics`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      setIsDeleteMetricModalOpen(false);
      setMetricToDelete(null);
      toast({
        title: "Berhasil",
        description: "Metrik keberhasilan berhasil dihapus",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus metrik keberhasilan",
        variant: "destructive",
      });
    },
  });

  // Toggle Definition of Done item completion
  const toggleDoLItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
    }: {
      itemId: string;
      isCompleted: boolean;
    }) => {
      return apiRequest("PATCH", `/api/definition-of-done/${itemId}/toggle`, {
        isCompleted,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/definition-of-done`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      
      // Show DOD update toast
      toast({
        title: "Deliverable berhasil diperbarui",
        description: "Status deliverable berhasil diperbarui",
        variant: "success",
      });
      
      // Show initiative status change toast if applicable
      if (data?.initiativeStatusChange?.changed) {
        const getStatusLabel = (status: string) => {
          switch (status) {
            case 'draft': return 'Draft';
            case 'sedang_berjalan': return 'Sedang Berjalan';
            case 'selesai': return 'Selesai';
            case 'dibatalkan': return 'Dibatalkan';
            case 'on_hold': return 'Ditunda';
            default: return status;
          }
        };
        
        const { oldStatus, newStatus } = data.initiativeStatusChange;
        const action = newStatus === 'sedang_berjalan' ? 'deliverable diselesaikan' : 'semua deliverable dan task tidak aktif';
        toast({
          title: "Status inisiatif berubah otomatis",
          description: `Status inisiatif berubah dari "${getStatusLabel(oldStatus)}" ke "${getStatusLabel(newStatus)}" karena ${action}`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate Definition of Done",
        variant: "destructive",
      });
    },
  });

  const cancelInitiativeMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      return await apiRequest("POST", `/api/initiatives/${id}/cancel`, {
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      setIsCancelModalOpen(false);
      setCancelReason("");
      toast({
        title: "Inisiatif dibatalkan",
        description: "Inisiatif telah dibatalkan secara permanen",
        className: "border-yellow-200 bg-yellow-50 text-yellow-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membatalkan inisiatif",
        description:
          error.message || "Terjadi kesalahan saat membatalkan inisiatif",
        variant: "destructive",
      });
    },
  });

  const deleteInitiativeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/initiatives/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      toast({
        title: "Inisiatif dihapus",
        description:
          "Inisiatif dan semua data terkait telah dihapus secara permanen",
        variant: "success",
      });
      // Navigate back to previous page using browser history
      window.history.back();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus inisiatif",
        description:
          error.message || "Terjadi kesalahan saat menghapus inisiatif",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: string;
    }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, { status });
    },
    onSuccess: (data: any) => {
      // Invalidate task list
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/tasks`],
      });
      // Invalidate initiative detail (to refresh status)
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      // Invalidate initiative list (if user navigates back)
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      
      // Show task status update toast
      toast({
        title: "Status task berhasil diperbarui",
        description: "Status task berhasil diperbarui",
        variant: "success",
      });
      
      // Show initiative status change toast if applicable
      if (data?.initiativeStatusChange?.changed) {
        const getStatusLabel = (status: string) => {
          switch (status) {
            case 'draft': return 'Draft';
            case 'sedang_berjalan': return 'Sedang Berjalan';
            case 'selesai': return 'Selesai';
            case 'dibatalkan': return 'Dibatalkan';
            case 'on_hold': return 'Ditunda';
            default: return status;
          }
        };
        
        const { oldStatus, newStatus } = data.initiativeStatusChange;
        toast({
          title: "Status inisiatif berubah otomatis",
          description: `Status inisiatif berubah dari "${getStatusLabel(oldStatus)}" ke "${getStatusLabel(newStatus)}" berdasarkan progress task`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui status",
        description:
          error.message || "Terjadi kesalahan saat memperbarui status task",
        variant: "destructive",
      });
    },
  });

  const reopenInitiativeMutation = useMutation({
    mutationFn: async ({ keyResultId }: { keyResultId?: string }) => {
      return await apiRequest("POST", `/api/initiatives/${id}/reopen`, {
        keyResultId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      setIsReopenInitiativeModalOpen(false);
      setSelectedKeyResultForReopen("");
      toast({
        title: "Inisiatif dibuka kembali",
        description:
          "Inisiatif berhasil dibuka kembali dan statusnya diubah ke sedang berjalan",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuka kembali inisiatif",
        description:
          error.message || "Terjadi kesalahan saat membuka kembali inisiatif",
        variant: "destructive",
      });
    },
  });

  const addDeliverableMutation = useMutation({
    mutationFn: async ({
      initiativeId,
      title,
    }: {
      initiativeId: string;
      title: string;
    }) => {
      return await apiRequest("POST", `/api/initiatives/${initiativeId}/definition-of-done`, {
        title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/definition-of-done`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      toast({
        title: "Deliverable berhasil ditambahkan",
        description: "Deliverable baru telah ditambahkan ke inisiatif",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menambahkan deliverable",
        description:
          error.message || "Terjadi kesalahan saat menambahkan deliverable",
        variant: "destructive",
      });
    },
  });

  const editDeliverableMutation = useMutation({
    mutationFn: async ({
      itemId,
      title,
    }: {
      itemId: string;
      title: string;
    }) => {
      return await apiRequest("PATCH", `/api/definition-of-done/${itemId}`, {
        title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/definition-of-done`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      toast({
        title: "Deliverable berhasil diubah",
        description: "Deliverable telah diperbarui",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal mengubah deliverable",
        description:
          error.message || "Terjadi kesalahan saat mengubah deliverable",
        variant: "destructive",
      });
    },
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/definition-of-done/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/definition-of-done`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/${id}/history`],
      });
      toast({
        title: "Deliverable berhasil dihapus",
        description: "Deliverable telah dihapus dari inisiatif",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus deliverable",
        description:
          error.message || "Terjadi kesalahan saat menghapus deliverable",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDeliverable = (item: any) => {
    setDeliverableToDelete(item);
    setIsDeleteDeliverableModalOpen(true);
  };

  const confirmDeleteDeliverable = () => {
    if (deliverableToDelete) {
      deleteDeliverableMutation.mutate(deliverableToDelete.id);
      setIsDeleteDeliverableModalOpen(false);
      setDeliverableToDelete(null);
    }
  };

  const handleCancelInitiative = () => {
    if (cancelReason.trim()) {
      cancelInitiativeMutation.mutate({ reason: cancelReason });
    }
  };

  // Helper function for status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
      sedang_berjalan: {
        label: "Sedang Berjalan",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      selesai: {
        label: "Selesai",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      dibatalkan: {
        label: "Dibatalkan",
        className: "bg-red-100 text-red-800 border-red-200",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig["draft"];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Helper function to check permissions based on status
  const canEdit = (status: string) =>
    status === "draft" || status === "sedang_berjalan";
  const canClose = (status: string) => status === "sedang_berjalan";
  const canCancel = (status: string) =>
    status === "draft" || status === "sedang_berjalan";

  // Helper functions - use shared progress calculator
  const calculateMetricProgress = (metric: any): number => {
    const result = calculateKeyResultProgress(
      metric.currentValue,
      metric.targetValue,
      metric.type,
      metric.baseValue,
    );
    return result.progressPercentage;
  };

  // Event handlers
  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
    setIsDeleteTaskModalOpen(true);
  }

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
      setIsDeleteTaskModalOpen(false);
      setTaskToDelete(null);
    }
  };

  // Extract data
  const initiativeData = initiative as any;
  const members = initiativeData?.members || [];
  const pic = initiativeData?.pic;
  const keyResult = initiativeData?.keyResult;

  if (initiativeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-orange-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Inisiatif tidak ditemukan
          </div>
          <div className="text-gray-500 text-sm mb-4">
            Inisiatif yang Anda cari tidak ada atau tidak tersedia dalam
            organisasi Anda.
          </div>
          <Button
            onClick={() =>
              (window.location.href = "/dashboard?tab=initiatives")
            }
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header with Back Button and Actions */}
      <div className="mb-6">
        {/* Back button and Actions in same row */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/dashboard?tab=initiatives";
              }
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center gap-2">
            {/* Close Initiative Button - Only show when status is sedang_berjalan */}
            {initiativeData.status === "sedang_berjalan" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseInitiativeModalOpen(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tutup Inisiatif
              </Button>
            )}

            {/* Reopen Initiative Button - Only show when status is selesai or dibatalkan */}
            {(initiativeData.status === "selesai" ||
              initiativeData.status === "dibatalkan") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReopenInitiativeModalOpen(true)}
                className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Buka Kembali
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditInitiativeModalOpen(true)}
                  disabled={initiativeData.status === "selesai"}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Inisiatif
                </DropdownMenuItem>
                {/* Cancel Initiative - Only show when status is sedang_berjalan */}
                {initiativeData.status === "sedang_berjalan" && (
                  <DropdownMenuItem
                    className="text-yellow-600 hover:text-yellow-700"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Batalkan Inisiatif
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setIsDeleteInitiativeModalOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Inisiatif
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Milestone Bar */}
      <MilestoneBar initiative={initiativeData} tasks={tasks || []} />

      {/* Closure Summary - Only show for completed initiatives */}
      <ClosureSummary initiative={initiativeData} />

      {/* Mission Card */}
      {/* Only show MissionCard if not all missions are completed */}
      {((successMetrics || []).length === 0 || (tasks || []).length === 0) && (
        <MissionCard
          missions={[
            {
              id: "metrics",
              title: "Tambahkan Ukuran Keberhasilan",
              description:
                "Setiap inisiatif harus memiliki minimal 1 ukuran keberhasilan untuk mengukur pencapaian",
              icon: <Target className="h-4 w-4" />,
              action: () => {
                setEditingMetric(null);
                setIsSuccessMetricsModalOpen(true);
              },
              isCompleted: (successMetrics || []).length > 0,
              points: 50,
              difficulty: "medium" as const,
            },
            {
              id: "tasks",
              title: "Buat Task Pertama",
              description:
                "Setiap inisiatif harus memiliki minimal 1 task untuk memulai eksekusi",
              icon: <FileText className="h-4 w-4" />,
              action: () => setIsAddTaskModalOpen(true),
              isCompleted: (tasks || []).length > 0,
              points: 30,
              difficulty: "easy" as const,
            },
          ]}
          successMetrics={successMetrics}
          tasks={tasks}
        />
      )}

      {/* Main Content Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 mb-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  {initiativeData.title}
                </h1>
                <div className="flex-shrink-0 ml-4">
                  {getStatusBadge(initiativeData.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Description Section */}
                {initiativeData.description && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Tujuan Inisiatif
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {initiativeData.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Flag className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Prioritas:</span>
                      <span className="font-medium capitalize">
                        {translatePriority(initiativeData.priority)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">Anggaran:</span>
                      <span className="font-medium">
                        {initiativeData.budget
                          ? `Rp ${Number(initiativeData.budget).toLocaleString("id-ID")}`
                          : "Tidak ada"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Tim:</span>
                      <div className="flex items-center gap-2">
                        {pic && (
                          <div className="flex items-center gap-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage 
                                src={getUserProfileImage(pic.id)} 
                                alt={pic.name || pic.email?.split("@")[0] || "Unknown"}
                              />
                              <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                                {getUserInitials(pic.id)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">
                              {pic.name ||
                                pic.email?.split("@")[0] ||
                                "Unknown"}
                            </span>
                          </div>
                        )}
                        {(members || []).filter(
                          (member: any) => member.userId !== pic?.id,
                        ).length > 0 && (
                          <div className="flex items-center gap-1">
                            <span
                              className="text-xs text-gray-500 hover:text-orange-600 cursor-pointer underline"
                              onClick={() => setIsTeamModalOpen(true)}
                            >
                              +
                              {
                                (members || []).filter(
                                  (member: any) => member.userId !== pic?.id,
                                ).length
                              }{" "}
                              anggota
                            </span>
                          </div>
                        )}
                        {!pic && (members || []).length === 0 && (
                          <span className="text-xs text-gray-500">
                            Belum ada anggota
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">Mulai:</span>
                      <span className="font-medium">
                        {initiativeData.startDate
                          ? new Date(
                              initiativeData.startDate,
                            ).toLocaleDateString("id-ID")
                          : "Belum diatur"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span className="text-gray-600">Berakhir:</span>
                      <span className="font-medium">
                        {initiativeData.dueDate
                          ? new Date(initiativeData.dueDate).toLocaleDateString(
                              "id-ID",
                            )
                          : "Belum diatur"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Initiative Progress Bar */}
                {(() => {
                  const progressStats = calculateProgressStats(tasks || []);
                  return (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Progress Inisiatif
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {progressStats.completed}/{progressStats.total} task
                          selesai ({progressStats.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                          style={{ width: `${progressStats.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Belum Mulai: {progressStats.notStarted}</span>
                        <span>Sedang Berjalan: {progressStats.inProgress}</span>
                        <span>Selesai: {progressStats.completed}</span>
                        <span>Dibatalkan: {progressStats.cancelled}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Key Result Information */}
                {keyResult && (
                  <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg mt-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/key-results/${keyResult.id}`}>
                        <div className="hover:text-blue-700 transition-colors">
                          <span className="text-sm font-semibold text-blue-900">
                            Target Terkait: {keyResult.title}
                          </span>
                        </div>
                      </Link>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">
                          {(keyResult.progress || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </CardContent>
          </Card>

          {/* Metrik Keberhasilan & Deliverables Card - Combined */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Metrik Keberhasilan & Deliverables
                  </h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center ml-1"
                      >
                        <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="max-w-sm">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          Metrik Keberhasilan
                        </h4>
                        <p className="text-sm text-gray-600">
                          Metrik keberhasilan adalah indikator kuantitatif
                          yang digunakan untuk mengukur pencapaian inisiatif
                          ini. Dengan menetapkan target yang jelas dan
                          melacak progress secara berkala, Anda dapat:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                          <li>
                            Memantau kemajuan inisiatif secara objektif
                          </li>
                          <li>
                            Mengevaluasi efektivitas strategi yang
                            dijalankan
                          </li>
                          <li>
                            Mengidentifikasi area yang perlu diperbaiki
                          </li>
                          <li>
                            Memberikan bukti konkret pencapaian kepada
                            stakeholder
                          </li>
                        </ul>
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Contoh:</strong> "Meningkatkan penjualan
                          bulanan menjadi 100 unit", "Mencapai tingkat
                          kepuasan pelanggan 85%"
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingMetric(null);
                      setIsSuccessMetricsModalOpen(true);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                    disabled={
                      initiativeData.status === "selesai" ||
                      initiativeData.status === "dibatalkan"
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Tambah Metrik</span>
                    <span className="sm:hidden">Metrik</span>
                  </Button>
                  <Button
                    onClick={() => setIsAddDeliverableModalOpen(true)}
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                    disabled={
                      initiativeData.status === "selesai" ||
                      initiativeData.status === "dibatalkan"
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Tambah Deliverable</span>
                    <span className="sm:hidden">Deliverable</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Success Metrics Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Metrik Keberhasilan
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center ml-1"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-sm">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Metrik Keberhasilan
                            </h4>
                            <p className="text-sm text-gray-600">
                              Metrik keberhasilan adalah indikator kuantitatif untuk mengukur pencapaian inisiatif ini.
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Contoh:</strong> "Meningkatkan penjualan bulanan menjadi 100 unit", "Mencapai tingkat kepuasan pelanggan 85%"
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Success Metrics List */}
                  <div className="space-y-3">
                    {successMetrics.length === 0 ? (
                      <div className="text-center py-6">
                        <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Belum ada metrik keberhasilan
                        </p>
                      </div>
                    ) : (
                      successMetrics.map((metric: any) => (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {metric.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              Target: <span className="font-medium">{metric.target}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-600">
                                {metric.achievement || 0}
                              </div>
                              <div className="text-xs text-gray-500">saat ini</div>
                            </div>
                            <QuickUpdateButton
                              metric={metric}
                              onUpdateSuccess={() => {
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    `/api/initiatives/${id}/success-metrics`,
                                  ],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [`/api/initiatives/${id}/history`],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [`/api/initiatives/${id}`],
                                });
                              }}
                              disabled={
                                initiativeData.status === "selesai" ||
                                initiativeData.status === "dibatalkan"
                              }
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-orange-200"
                                  disabled={
                                    initiativeData.status === "selesai" ||
                                    initiativeData.status === "dibatalkan"
                                  }
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    const formattedMetric = {
                                      id: metric.id,
                                      name: metric.name,
                                      target: metric.target,
                                      achievement: metric.achievement || "0",
                                    };
                                    setEditingMetric(formattedMetric);
                                    setIsSuccessMetricsModalOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setMetricToDelete(metric);
                                    setIsDeleteMetricModalOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Deliverables Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Deliverables (Output Inisiatif)
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center ml-1"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-sm">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Deliverables / Output Inisiatif
                            </h4>
                            <p className="text-sm text-gray-600">
                              Deliverables adalah hasil konkret yang harus dicapai dari inisiatif ini. 
                              Berbeda dengan task yang merupakan aktivitas, deliverables adalah output atau produk akhir.
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Contoh Deliverables:</strong>
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                              <li>Laporan analisis pasar yang lengkap</li>
                              <li>Website baru dengan fitur tertentu</li>
                              <li>Sistem inventory yang terintegrasi</li>
                              <li>Kampanye marketing dengan materi promosi</li>
                              <li>Training manual untuk karyawan</li>
                            </ul>
                            <p className="text-sm text-gray-600">
                              <strong>Cara Penggunaan:</strong> Centang kotak di samping deliverable ketika sudah benar-benar selesai dan siap diserahkan/digunakan.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Deliverables Progress and List */}
                  {definitionOfDoneItems && definitionOfDoneItems.length > 0 ? (
                    <div className="space-y-4">
                      {/* Progress Summary */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-green-700">
                            Progress Deliverable
                          </span>
                          <span className="text-green-600 font-bold text-lg">
                            {Math.round((definitionOfDoneItems.filter((item: any) => item.isCompleted).length / definitionOfDoneItems.length) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-3 mb-2">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-in-out" 
                            style={{ 
                              width: `${(definitionOfDoneItems.filter((item: any) => item.isCompleted).length / definitionOfDoneItems.length) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-sm text-green-600 text-center">
                          {definitionOfDoneItems.filter((item: any) => item.isCompleted).length} dari {definitionOfDoneItems.length} deliverable selesai
                        </div>
                      </div>

                      {/* Deliverables List */}
                      <div className="space-y-3">
                        {definitionOfDoneItems.map(
                          (item: any, index: number) => (
                            <div
                              key={item.id || index}
                              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                                item.isCompleted 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  if (
                                    initiativeData.status !== "selesai" &&
                                    initiativeData.status !== "dibatalkan"
                                  ) {
                                    toggleDoLItemMutation.mutate({
                                      itemId: item.id,
                                      isCompleted: !item.isCompleted,
                                    });
                                  }
                                }}
                                disabled={
                                  initiativeData.status === "selesai" ||
                                  initiativeData.status === "dibatalkan"
                                }
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors hover:opacity-80 ${
                                  item.isCompleted
                                    ? "bg-green-500 border-green-500"
                                    : "border-gray-300 hover:border-green-400"
                                } ${
                                  initiativeData.status === "selesai" ||
                                  initiativeData.status === "dibatalkan"
                                    ? "cursor-not-allowed opacity-50"
                                    : "cursor-pointer"
                                }`}
                              >
                                {item.isCompleted && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <div className="flex-1">
                                <span
                                  className={`text-sm font-medium ${
                                    item.isCompleted
                                      ? "text-green-700 line-through"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {item.title}
                                </span>
                                {item.isCompleted && item.completedAt && (
                                  <div className="text-xs text-green-600 mt-1">
                                    ✓ Selesai pada {new Date(item.completedAt).toLocaleDateString("id-ID")}
                                  </div>
                                )}
                              </div>
                              
                              {/* Deliverable Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-green-200"
                                    disabled={
                                      initiativeData.status === "selesai" ||
                                      initiativeData.status === "dibatalkan"
                                    }
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingDeliverable(item);
                                      setIsEditDeliverableModalOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Ubah
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDeliverable(item)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Belum ada deliverable
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Implementation & Task Management Card */}
          <Card className="border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Rencana Eksekusi & Manajemen Task
                  </h3>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Implementation Plan Section */}
                {initiativeData.implementationPlan && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Rencana Pelaksanaan
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {initiativeData.implementationPlan}
                    </p>
                  </div>
                )}



                {/* Task Management Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Manajemen Task
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center ml-1"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-sm">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Manajemen Task
                            </h4>
                            <p className="text-sm text-gray-600">
                              Task adalah aktivitas spesifik yang harus
                              diselesaikan untuk mencapai tujuan inisiatif.
                              Sistem task management membantu Anda:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                              <li>
                                Memecah inisiatif besar menjadi langkah-langkah
                                yang dapat dilakukan
                              </li>
                              <li>
                                Menetapkan prioritas dan tenggat waktu untuk
                                setiap aktivitas
                              </li>
                              <li>
                                Melacak progress dan status penyelesaian task
                              </li>
                              <li>
                                Mengassign tanggung jawab kepada anggota tim
                              </li>
                              <li>
                                Mengidentifikasi bottleneck dan hambatan dalam
                                eksekusi
                              </li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Status Task:</strong> Belum (Not Started),
                              Jalan (In Progress), Selesai (Completed), Batal
                              (Cancelled)
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button
                      onClick={() => setIsAddTaskModalOpen(true)}
                      size="sm"
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                      disabled={
                        initiativeData.status === "selesai" ||
                        initiativeData.status === "dibatalkan"
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Tambah Task</span>
                      <span className="sm:hidden">Tambah</span>
                    </Button>
                  </div>

                  {/* Task List */}
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Belum ada task. Tambahkan task pertama untuk memulai.
                      </p>
                    ) : (
                      tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`inline-flex items-center justify-center cursor-pointer ${getTaskPriorityIcon(task.priority || "medium").color}`}
                                    >
                                      {
                                        getTaskPriorityIcon(
                                          task.priority || "medium",
                                        ).icon
                                      }
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {
                                        getTaskPriorityIcon(
                                          task.priority || "medium",
                                        ).label
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Link
                                href={`/tasks/${task.id}`}
                                className="font-medium text-gray-900 hover:text-orange-600 hover:underline cursor-pointer text-sm"
                              >
                                {task.title}
                              </Link>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {task.dueDate
                                ? formatDate(task.dueDate)
                                : "Belum diatur"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                  disabled={
                                    initiativeData.status === "selesai" ||
                                    initiativeData.status === "dibatalkan"
                                  }
                                >
                                  {getTaskStatusLabel(task.status)}
                                  {initiativeData.status !== "selesai" &&
                                    initiativeData.status !== "dibatalkan" && (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(task.id, "not_started")
                                  }
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "not_started" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Belum Mulai</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(task.id, "in_progress")
                                  }
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "in_progress" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Sedang Berjalan</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(task.id, "completed")
                                  }
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "completed" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Selesai</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(task.id, "cancelled")
                                  }
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "cancelled" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Dibatalkan</span>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Profile Image for PIC */}
                            {task.assignedTo && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="w-6 h-6 cursor-pointer">
                                      <AvatarImage 
                                        src={getUserProfileImage(task.assignedTo)} 
                                        alt={getUserName(task.assignedTo)}
                                      />
                                      <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                                        {getUserInitials(task.assignedTo)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      PIC:{" "}
                                      {task.assignedTo
                                        ? getUserName(task.assignedTo)
                                        : "Belum diassign"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={
                                    initiativeData.status === "selesai" ||
                                    initiativeData.status === "dibatalkan"
                                  }
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/tasks/${task.id}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Lihat Detail
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsEditTaskModalOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTask(task)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initiative Comments Section */}
          <InitiativeCommentsCard
            initiativeId={id!}
            disabled={
              initiativeData.status === "selesai" ||
              initiativeData.status === "dibatalkan"
            }
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Initiative History */}
          <InitiativeHistory initiativeId={id!} />
        </div>
      </div>

      {/* Add Deliverable Modal */}
      <Dialog open={isAddDeliverableModalOpen} onOpenChange={setIsAddDeliverableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              Tambah Deliverable Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan output konkret yang harus dicapai dari inisiatif ini.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              
              if (title.trim()) {
                // Create deliverable via API
                addDeliverableMutation.mutate({
                  initiativeId: id!,
                  title: title.trim(),
                });
                setIsAddDeliverableModalOpen(false);
                (e.target as HTMLFormElement).reset();
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="deliverable-title">Nama Deliverable</Label>
              <Input
                id="deliverable-title"
                name="title"
                placeholder="Contoh: Laporan analisis pasar lengkap"
                required
                autoFocus
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tuliskan nama output konkret yang akan dihasilkan
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDeliverableModalOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                disabled={addDeliverableMutation.isPending}
              >
                {addDeliverableMutation.isPending ? "Menambah..." : "Tambah Deliverable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Deliverable Modal */}
      <Dialog open={isEditDeliverableModalOpen} onOpenChange={setIsEditDeliverableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              Ubah Deliverable
            </DialogTitle>
            <DialogDescription>
              Ubah nama deliverable yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              
              if (title.trim() && editingDeliverable) {
                // Update deliverable via API
                editDeliverableMutation.mutate({
                  itemId: editingDeliverable.id,
                  title: title.trim(),
                });
                setIsEditDeliverableModalOpen(false);
                setEditingDeliverable(null);
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit-deliverable-title">Nama Deliverable</Label>
              <Input
                id="edit-deliverable-title"
                name="title"
                placeholder="Contoh: Laporan analisis pasar lengkap"
                defaultValue={editingDeliverable?.title || ""}
                required
                autoFocus
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ubah nama output konkret yang akan dihasilkan
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDeliverableModalOpen(false);
                  setEditingDeliverable(null);
                }}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                disabled={editDeliverableMutation.isPending}
              >
                {editDeliverableMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Deliverable Confirmation Modal */}
      <Dialog open={isDeleteDeliverableModalOpen} onOpenChange={setIsDeleteDeliverableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus Deliverable
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus deliverable ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">
                Deliverable yang akan dihapus:
              </p>
              <p className="text-sm text-gray-900 mt-1">
                "{deliverableToDelete?.title}"
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDeliverableModalOpen(false);
                setDeliverableToDelete(null);
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteDeliverable}
              disabled={deleteDeliverableMutation.isPending}
            >
              {deleteDeliverableMutation.isPending ? "Menghapus..." : "Hapus Deliverable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <TaskModal
        open={
          isAddTaskModalOpen &&
          initiativeData.status !== "selesai" &&
          initiativeData.status !== "dibatalkan"
        }
        onClose={() => setIsAddTaskModalOpen(false)}
        initiativeId={id!}
        isAdding={true}
      />

      <TaskModal
        open={
          isEditTaskModalOpen &&
          initiativeData.status !== "selesai" &&
          initiativeData.status !== "dibatalkan"
        }
        onClose={() => setIsEditTaskModalOpen(false)}
        task={selectedTask}
        initiativeId={id!}
        isAdding={false}
      />

      {initiative && (
        <InitiativeFormModal
          initiative={initiative}
          open={
            isEditInitiativeModalOpen &&
            initiativeData.status !== "selesai" &&
            initiativeData.status !== "dibatalkan"
          }
          onOpenChange={(open) => {
            if (!open) {
              console.log("Closing edit initiative modal");
              setIsEditInitiativeModalOpen(false);
            }
          }}
          onSuccess={() => {
            console.log("Edit initiative success");
            setIsEditInitiativeModalOpen(false);
            queryClient.invalidateQueries({
              queryKey: [`/api/initiatives/${id}`],
            });
          }}
        />
      )}

      <SuccessMetricsModal
        open={
          isSuccessMetricsModalOpen &&
          initiativeData.status !== "selesai" &&
          initiativeData.status !== "dibatalkan"
        }
        onOpenChange={(open) => {
          setIsSuccessMetricsModalOpen(open);
          if (!open) {
            setEditingMetric(null);
          }
        }}
        initiativeId={id!}
        metric={editingMetric}
      />

      {initiativeData && (
        <InitiativeClosureModal
          isOpen={isClosureModalOpen}
          onClose={() => setIsClosureModalOpen(false)}
          initiative={initiativeData}
          successMetrics={successMetrics || []}
          tasks={tasks || []}
          onSuccess={() => {
            // Refresh data after successful closure
            queryClient.invalidateQueries({
              queryKey: [`/api/initiatives/${id}`],
            });
            queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
          }}
        />
      )}

      {/* Cancel Initiative Modal */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Inisiatif</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan inisiatif ini? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Alasan pembatalan:</Label>
            <Input
              id="cancel-reason"
              placeholder="Masukkan alasan pembatalan..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setCancelReason("")}
              className="focus:ring-orange-500"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInitiative}
              disabled={
                !cancelReason.trim() || cancelInitiativeMutation.isPending
              }
              className="bg-red-600 hover:bg-red-700 focus:ring-orange-500"
            >
              {cancelInitiativeMutation.isPending
                ? "Membatalkan..."
                : "Batalkan Inisiatif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Success Metric Modal */}
      <AlertDialog
        open={isDeleteMetricModalOpen}
        onOpenChange={setIsDeleteMetricModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Metrik Keberhasilan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus metrik keberhasilan "
              {metricToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteMetricModalOpen(false);
                setMetricToDelete(null);
              }}
              className="focus:ring-orange-500"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (metricToDelete) {
                  deleteSuccessMetricMutation.mutate(metricToDelete.id);
                }
              }}
              disabled={deleteSuccessMetricMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-orange-500"
            >
              {deleteSuccessMetricMutation.isPending
                ? "Menghapus..."
                : "Hapus Metrik"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Initiative Modal */}
      <AlertDialog
        open={isReopenInitiativeModalOpen}
        onOpenChange={setIsReopenInitiativeModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buka Kembali Inisiatif</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membuka kembali inisiatif ini? Status
              inisiatif akan diubah menjadi "Sedang Berjalan" dan semua fitur
              editing akan diaktifkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="focus:ring-orange-500">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reopenInitiativeMutation.mutate()}
              disabled={reopenInitiativeMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white focus:ring-orange-500"
            >
              {reopenInitiativeMutation.isPending
                ? "Membuka..."
                : "Buka Kembali"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation Modal */}
      <AlertDialog open={isDeleteTaskModalOpen} onOpenChange={setIsDeleteTaskModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus Task
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus task ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">
                Task yang akan dihapus:
              </p>
              <p className="text-sm text-gray-900 mt-1">
                "{taskToDelete?.title}"
              </p>
              {taskToDelete?.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {taskToDelete.description}
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteTaskModalOpen(false);
                setTaskToDelete(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              disabled={deleteTaskMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTaskMutation.isPending ? "Menghapus..." : "Hapus Task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Team Members Modal */}
      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Anggota Tim Inisiatif
            </DialogTitle>
            <DialogDescription>
              Detail informasi anggota tim yang terlibat dalam inisiatif ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* PIC Section */}
            {pic && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  PIC (Person in Charge)
                </h4>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={getUserProfileImage(pic.id)} 
                      alt={pic.name || pic.email?.split("@")[0] || "PIC"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white font-medium">
                      {getUserInitials(pic.id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {pic.name || pic.email?.split("@")[0] || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-600">{pic.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members Section */}
            {members.filter((member: any) => member.userId !== pic?.id).length >
              0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Anggota Tim (
                  {
                    members.filter((member: any) => member.userId !== pic?.id)
                      .length
                  }
                  )
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {members
                    .filter((member: any) => member.userId !== pic?.id)
                    .map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={getMemberProfileImage(member)} 
                            alt={member.user?.name || member.user?.email?.split("@")[0] || "Member"}
                          />
                          <AvatarFallback className="bg-gray-600 text-white font-medium">
                            {getMemberInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {member.user?.name || member.user?.email?.split("@")[0] || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {member.user?.email}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {member.role}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!pic &&
              (members || []).filter((member: any) => member.userId !== pic?.id)
                .length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Belum ada anggota tim</p>
                  <p className="text-xs mt-1">
                    Tim akan ditampilkan setelah ditambahkan
                  </p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Initiative Closure Modal */}
      <InitiativeClosureModal
        isOpen={isCloseInitiativeModalOpen}
        onClose={() => setIsCloseInitiativeModalOpen(false)}
        initiative={initiativeData}
        successMetrics={successMetrics || []}
        tasks={tasks || []}
        dodItems={definitionOfDoneItems || []}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: [`/api/initiatives/${id}`],
          });
          queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
        }}
      />

      {/* Cancel Initiative Modal */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-yellow-600" />
              Batalkan Inisiatif
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Apakah Anda yakin ingin membatalkan inisiatif{" "}
              <strong>"{initiativeData.title}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Alasan pembatalan:</Label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Jelaskan alasan mengapa inisiatif ini dibatalkan..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>
            <p className="text-yellow-600 font-medium text-sm">
              Inisiatif yang dibatalkan akan diubah statusnya menjadi
              "Dibatalkan" dan tidak dapat diaktifkan kembali.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelInitiativeMutation.mutate({ reason: cancelReason })
              }
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white"
              disabled={
                cancelInitiativeMutation.isPending || !cancelReason.trim()
              }
            >
              {cancelInitiativeMutation.isPending
                ? "Membatalkan..."
                : "Batalkan Inisiatif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Initiative Modal */}
      <AlertDialog
        open={isReopenInitiativeModalOpen}
        onOpenChange={setIsReopenInitiativeModalOpen}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              Buka Kembali Inisiatif
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Apakah Anda yakin ingin membuka kembali inisiatif{" "}
              <strong>"{initiativeData.title}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-orange-600 font-medium">
              Inisiatif akan diubah statusnya menjadi "Sedang Berjalan" dan
              dapat dilanjutkan kembali.
            </p>
            <p className="text-gray-600 text-sm">
              Anda dapat melanjutkan pekerjaan pada inisiatif ini, menambah task
              baru, dan memperbarui metrik keberhasilan.
            </p>

            {/* Key Result Selection */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="keyResultSelect"
                  className="text-sm font-medium"
                >
                  Pindah ke Angka Target lain (Opsional)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex">
                      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80"
                    side="right"
                    align="start"
                    sideOffset={10}
                  >
                    <div className="text-sm">
                      <p className="font-medium mb-2">Pindah Angka Target</p>
                      <p>
                        Jika ingin memindahkan inisiatif ini ke angka target
                        yang berbeda, pilih angka target baru. Jika tidak,
                        inisiatif akan tetap pada angka target yang sama.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <SearchableKeyResultSelect
                keyResults={keyResults}
                value={selectedKeyResultForReopen}
                onValueChange={setSelectedKeyResultForReopen}
                placeholder="Pilih angka target baru (kosongkan jika tidak ingin mengubah)"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                reopenInitiativeMutation.mutate({
                  keyResultId: selectedKeyResultForReopen || undefined,
                })
              }
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
              disabled={reopenInitiativeMutation.isPending}
            >
              {reopenInitiativeMutation.isPending
                ? "Membuka..."
                : "Buka Kembali"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Initiative Confirmation Modal */}
      <AlertDialog
        open={isDeleteInitiativeModalOpen}
        onOpenChange={setIsDeleteInitiativeModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Hapus Inisiatif
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus inisiatif{" "}
              <strong>"{initiativeData.title}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-red-600 font-medium mb-2">
                Peringatan: Tindakan ini akan menghapus secara permanen:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Inisiatif dan semua datanya</li>
                <li>Semua task yang terkait ({tasks?.length || 0} task)</li>
                <li>
                  Semua metrik keberhasilan ({successMetrics?.length || 0}{" "}
                  metrik)
                </li>
                <li>Semua komentar dan riwayat aktivitas</li>
              </ul>
            </div>
            <p className="text-red-600 font-medium">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInitiativeMutation.mutate()}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
              disabled={deleteInitiativeMutation.isPending}
            >
              {deleteInitiativeMutation.isPending
                ? "Menghapus..."
                : "Hapus Inisiatif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
