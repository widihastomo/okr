import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Target,
  BarChart3,
  Trophy,
  MoveUp,
  MoveDown,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  MoreHorizontal,
  Eye,
  User,
  Edit,
  Trash2,
  Check,
  ExternalLink,
  Plus,
  ChevronsUpDown,
  Rocket,
  Sparkles,
  CheckCircle2,
  UserPlus,
  Users,
  Lightbulb,
  CheckSquare,
  LineChart,
  Zap,
  MessageSquare,
  Info,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import MetricsUpdateModal from "@/components/metrics-update-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { UserStatsCard } from "@/components/gamification/user-stats-card";
import { DailyAchievements } from "@/components/daily-achievements";
import { DailyUpdateSimple } from "@/components/daily-update-simple";
import { useAuth } from "@/hooks/useAuth";
import GoalFormModal from "@/components/goal-form-modal";
import TaskModal from "@/components/task-modal";
import InitiativeFormModal from "@/components/initiative-form-modal";
import TourStartButton from "@/components/tour-start-button";

// Icon mapping for mission cards
const iconMapping = {
  UserPlus: UserPlus,
  Users: Users,
  Target: Target,
  BarChart3: BarChart3,
  Lightbulb: Lightbulb,
  CheckSquare: CheckSquare,
  TrendingUp: TrendingUp,
  LineChart: LineChart,
  CheckCircle2: CheckCircle2,
  Zap: Zap,
};

// Mission action functions
const missionActions = {
  addMember: () => (window.location.href = "/client-users"),
  createTeam: () => (window.location.href = "/teams"),
  createObjective: () => (window.location.href = "/"),
  addKeyResult: () => (window.location.href = "/"),
  addInitiative: () => (window.location.href = "/"),
  addTask: () => (window.location.href = "/daily-focus"),
  updateKeyResult: () => (window.location.href = "/"),
  updateMetrics: () => (window.location.href = "/"),
  updateTaskStatus: () => (window.location.href = "/daily-focus"),
  dailyUpdate: () => (window.location.href = "/daily-focus"),
};

// Mission Card Component
interface MissionCardProps {
  missions: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
  }>;
  title: string;
  description: string;
  className?: string;
}

function MissionCard({
  missions,
  title,
  description,
  className,
}: MissionCardProps) {
  const completedMissions = missions.filter((m) => m.unlocked).length;
  const totalMissions = missions.length;
  const [isExpanded, setIsExpanded] = useState(false);

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
                {title}
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                >
                  {completedMissions}/{totalMissions}
                </Badge>
              </CardTitle>
              <p className="text-sm text-orange-600 mt-1">{description}</p>
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
            {missions.map((mission, index) => {
              const IconComponent = iconMapping[mission.icon] || Target;
              const missionKey =
                mission.name.includes("Tambah Pengguna") ||
                mission.name.includes("Menambahkan Member")
                  ? "addMember"
                  : mission.name.includes("Buat Tim") ||
                      mission.name.includes("Membuat Tim")
                    ? "createTeam"
                    : mission.name.includes("Buat Objective") ||
                        mission.name.includes("Membuat Objective")
                      ? "createObjective"
                      : mission.name.includes("Tambah Key Result") ||
                          mission.name.includes("Menambahkan Key Result")
                        ? "addKeyResult"
                        : mission.name.includes("Buat Inisiatif") ||
                            mission.name.includes("Menambahkan Inisiatif")
                          ? "addInitiative"
                          : mission.name.includes("Tambah Task") ||
                              mission.name.includes("Menambahkan Task")
                            ? "addTask"
                            : mission.name.includes("Update Capaian Key Result")
                              ? "updateKeyResult"
                              : mission.name.includes("Update Capaian Metrik")
                                ? "updateMetrics"
                                : mission.name.includes("Update Status Task")
                                  ? "updateTaskStatus"
                                  : mission.name.includes("Update Harian")
                                    ? "dailyUpdate"
                                    : "addMember";

              return (
                <div
                  key={mission.id}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    mission.unlocked
                      ? "bg-green-50 border-green-200 opacity-75"
                      : "bg-white border-orange-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-full flex-shrink-0 ${
                        mission.unlocked
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {mission.unlocked ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-orange-600 min-w-[20px]">
                          {index + 1}.
                        </span>
                        <h4
                          className={`font-medium text-sm ${
                            mission.unlocked
                              ? "text-green-700 line-through"
                              : "text-gray-800"
                          }`}
                        >
                          {mission.name.replace(
                            /🎯 Misi: |📊 Misi: |💡 Misi: |✅ Misi: |🔄 Misi: |📈 Misi: |⚡ Misi: |🎖️ Misi: /g,
                            "",
                          )}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {mission.description}
                      </p>
                      {!mission.unlocked && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs h-7"
                          onClick={() => missionActions[missionKey]()}
                        >
                          Mulai
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function DailyFocusPage() {
  const { user } = useAuth();
  const userId =
    user && typeof user === "object" && "id" in user ? (user as any).id : null;

  // Move all hooks before any early returns
  const [selectedKeyResult, setSelectedKeyResult] = useState<any>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSuccessMetricsModalOpen, setIsSuccessMetricsModalOpen] =
    useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "all"); // Filter state - default to current user
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Goal creation modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Initiative creation modal state
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);







  // Status update mutation
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusUpdateMutation = useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
    }: {
      taskId: string;
      newStatus: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });
      toast({
        title: "Status berhasil diupdate",
        description: "Status task telah diperbarui",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle status update from dropdown
  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    statusUpdateMutation.mutate({ taskId, newStatus });
  };

  // Fetch data with status calculation
  const { data: objectives = [], isLoading: isLoadingObjectives } = useQuery({
    queryKey: ["/api/okrs"],
  });



  // Extract key results from objectives data (includes calculated status)
  const keyResults = React.useMemo(() => {
    return objectives.flatMap((obj: any) => obj.keyResults || []);
  }, [objectives]);

  const { data: initiatives = [], isLoading: isLoadingInitiatives } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: myTasks = [], isLoading: isLoadingMyTasks } = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
  });

  const { data: allTasks = [], isLoading: isLoadingAllTasks } = useQuery({
    queryKey: ["/api/tasks"],
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Filter active users for better performance
  const activeUsers = users.filter((user: any) => user.isActive === true);

  const { data: cycles = [], isLoading: isLoadingCycles } = useQuery({
    queryKey: ["/api/cycles"],
  });

  // Trial achievements query for missions
  const { data: achievements = [], isLoading: isLoadingAchievements } =
    useQuery({
      queryKey: ["/api/trial/achievements"],
      enabled: !!userId,
    });

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

  // Specific 10-step sequential missions configuration
  const missionSequence = [
    {
      name: "Menambahkan Member",
      icon: "UserPlus",
      description:
        "Tambahkan anggota baru ke tim Anda untuk memulai kolaborasi",
    },
    {
      name: "Membuat Tim",
      icon: "Users",
      description: "Buat tim dengan struktur yang jelas untuk mengelola proyek",
    },
    {
      name: "Membuat Objective",
      icon: "Target",
      description: "Definisikan tujuan utama yang ingin dicapai tim Anda",
    },
    {
      name: "Menambahkan Key Result",
      icon: "BarChart3",
      description:
        "Tentukan indikator pencapaian yang dapat diukur secara kuantitatif",
    },
    {
      name: "Menambahkan Inisiatif",
      icon: "Lightbulb",
      description: "Buat rencana aksi konkret untuk mencapai tujuan",
    },
    {
      name: "Menambahkan Task",
      icon: "CheckSquare",
      description:
        "Breakdown inisiatif menjadi tugas-tugas yang dapat dikerjakan",
    },
    {
      name: "Update Capaian Key Result",
      icon: "TrendingUp",
      description: "Pantau dan update progress pencapaian target angka",
    },
    {
      name: "Update Capaian Metrik Inisiatif",
      icon: "LineChart",
      description: "Evaluasi kemajuan pelaksanaan inisiatif secara berkala",
    },
    {
      name: "Update Status Task",
      icon: "CheckCircle2",
      description: "Pantau dan update status penyelesaian tugas harian",
    },
    {
      name: "Update Harian Instan",
      icon: "Zap",
      description:
        "Lakukan review harian untuk memastikan kemajuan yang konsisten",
    },
  ];

  // Transform achievements to match mission sequence order
  const orderlyMissions = missionSequence.map((mission, index) => {
    const achievement = achievements.find(
      (a) =>
        a.name.includes(mission.name) ||
        a.description.includes(mission.name.toLowerCase()),
    );

    return {
      id: `mission-${index + 1}`,
      name: mission.name,
      description: mission.description,
      icon: mission.icon,
      unlocked: achievement ? achievement.unlocked : false,
    };
  });

  // Task creation mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });

      // Force refetch to ensure data is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      }, 100);

      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan",
        variant: "success",
      });
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal membuat task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Task deletion mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });
      toast({
        title: "Task berhasil dihapus",
        description: "Task telah dihapus dari sistem",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menghapus task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle opening goal modal
  const handleOpenGoalModal = () => {
    setIsGoalModalOpen(true);
  };

  // Task action handlers

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const { data: stats } = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: any;
    }) => {
      return await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });
      toast({
        title: "Task berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get today's date info using GMT+7 timezone
  const today = new Date();
  const utc = today.getTime() + today.getTimezoneOffset() * 60000;
  const gmt7Date = new Date(utc + 7 * 3600000); // GMT+7
  const todayStr =
    gmt7Date.getFullYear() +
    "-" +
    String(gmt7Date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(gmt7Date.getDate()).padStart(2, "0");

  // Helper function for key result type icons
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
          tooltip: "Target Binary - 100% jika tercapai, 0% jika tidak",
        };
      default:
        return {
          icon: Target,
          tooltip: "Tipe target tidak diketahui",
        };
    }
  };

  // Helper functions
  const calculateKeyResultProgress = (keyResult: any): number => {
    const current = Number(keyResult.currentValue) || 0;
    const target = Number(keyResult.targetValue) || 0;
    const base = Number(keyResult.baseValue) || 0;

    if (keyResult.keyResultType === "achieve_or_not") {
      return keyResult.achieved ? 100 : 0;
    }

    if (keyResult.keyResultType === "increase_to") {
      if (base === target) return 0;
      return Math.min(
        100,
        Math.max(0, ((current - base) / (target - base)) * 100),
      );
    }

    if (keyResult.keyResultType === "decrease_to") {
      if (base === target) return 0;
      return Math.min(
        100,
        Math.max(0, ((base - current) / (base - target)) * 100),
      );
    }

    if (keyResult.keyResultType === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (keyResult.keyResultType === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

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

  // Helper functions for priority styling
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

  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleCheckInKeyResult = (keyResult: any) => {
    setSelectedKeyResult(keyResult);
    setIsCheckInModalOpen(true);
  };

  const handleUpdateMetrics = (initiative: any) => {
    setSelectedInitiative(initiative);
    setIsSuccessMetricsModalOpen(true);
  };

  // Helper function to get user name by ID (using consolidated name field)
  const getUserName = (userId: string): string => {
    if (!users || !userId) return "Tidak ditentukan";
    const user = users.find((u: any) => u.id === userId);

    // Use the consolidated name field
    if (user?.name && user.name.trim() !== "") {
      return user.name.trim();
    }

    // Fallback to email username if name is not available
    if (user?.email) {
      return user.email.split('@')[0];
    }

    return "Pengguna";
  };

  // Helper function to get user initials for avatar (using consolidated name field)
  const getUserInitials = (userId: string): string => {
    if (!users || !userId) return "?";
    const user = users.find((u: any) => u.id === userId);

    // Use the consolidated name field
    if (user?.name && user.name.trim() !== "") {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        // Get first letter of first name and first letter of last name
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
      } else {
        // Just use first letter of single name
        return nameParts[0].charAt(0).toUpperCase();
      }
    }

    // Fallback to email first letter
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  // Helper function to get user profile image URL
  const getUserProfileImage = (userId: string): string | undefined => {
    if (!userId || !users) return undefined;
    const user = users.find((u: any) => u.id === userId);
    return user?.profileImageUrl || undefined;
  };

  // Helper function to get initiative count for a key result
  const getInitiativeCount = (keyResultId: string): number => {
    return initiatives.filter((init: any) => init.keyResultId === keyResultId)
      .length;
  };

  // Check for welcome screen for new users
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  
  useEffect(() => {
    // Show welcome screen if user just registered and hasn't seen it yet
    const welcomeShown = localStorage.getItem("welcome-screen-shown");
    const onboardingCompleted = localStorage.getItem("onboarding-completed");
    
    // Show welcome screen if onboarding was completed (new user) but welcome screen hasn't been shown
    if (onboardingCompleted === "true" && !welcomeShown) {
      setShowWelcomeScreen(true);
    }
  }, []);

  const handleCloseWelcomeScreen = () => {
    setShowWelcomeScreen(false);
    localStorage.setItem("welcome-screen-shown", "true");
  };

  // Early return check - must be AFTER all hooks are called
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton />
      </div>
    );
  }

  // Welcome Screen Dialog for new users
  if (showWelcomeScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Selamat Datang di Refokus!
            </h2>
            <p className="text-gray-600">
              Ubah tujuan menjadi aksi nyata yang terukur. Mari mulai perjalanan produktivitas Anda bersama kami.
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-left">
              <Target className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">Buat tujuan yang jelas dan terukur</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">Pantau progress secara real-time</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">Kolaborasi tim yang efektif</span>
            </div>
          </div>
          
          <Button
            onClick={handleCloseWelcomeScreen}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium h-11"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Mulai Sekarang
          </Button>
        </div>
      </div>
    );
  }

  // Apply user filter to tasks and key results
  const filteredTasks =
    selectedUserId === "all"
      ? (allTasks as any[])
      : (allTasks as any[]).filter(
          (task: any) => task.assignedTo === selectedUserId,
        );

  const filteredKeyResults =
    selectedUserId === "all"
      ? (keyResults as any[])
      : (keyResults as any[]).filter(
          (kr: any) => kr.assignedTo === selectedUserId,
        );

  const filteredInitiatives =
    selectedUserId === "all"
      ? (initiatives as any[])
      : (initiatives as any[]).filter(
          (init: any) => init.picId === selectedUserId,
        );



  // Helper function to categorize tasks by date - matching Tasks page logic
  const categorizeTaskByDate = (task: any): 'overdue' | 'today' | 'upcoming' => {
    if (!task.dueDate) return 'upcoming';
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today && task.status !== 'completed' && task.status !== 'cancelled') {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  // Filter data for today's focus
  const todayTasks = filteredTasks.filter((task: any) => {
    // For today's tasks, use startDate if available, otherwise fallback to dueDate
    // Also include in-progress tasks regardless of date
    if (task.status === "in_progress") return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check startDate first for today's tasks
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate.getTime() === today.getTime()) return true;
    }
    
    // Fallback to dueDate logic for backward compatibility
    return categorizeTaskByDate(task) === 'today';
  });

  const overdueTasks = filteredTasks.filter((task: any) => {
    // Overdue tasks use dueDate (tasks that were due before today)
    return categorizeTaskByDate(task) === 'overdue';
  });

  // Tomorrow's tasks - use startDate if available, otherwise fallback to dueDate
  const tomorrowTasks = filteredTasks.filter((task: any) => {
    if (task.status === "completed" || task.status === "cancelled") return false;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Check startDate first for tomorrow's tasks
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate.getTime() === tomorrow.getTime();
    }
    
    // Fallback to dueDate logic for backward compatibility
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === tomorrow.getTime();
    }
    
    return false;
  });

  const activeKeyResults = filteredKeyResults.filter((kr: any) => {
    // Include key results that are not cancelled
    // This allows showing all active key results including 100% completed ones
    return kr.status !== "cancelled";
  });

  const activeInitiatives = filteredInitiatives.filter((init: any) => {
    // Include draft and running initiatives
    if (init.status === "sedang_berjalan" || init.status === "draft") {
      return true;
    }
    
    // Include cancelled initiatives - they can be reopened
    if (init.status === "dibatalkan") {
      return true;
    }
    
    // Include completed initiatives if they are still within today's timeline
    if (init.status === "selesai") {
      const dueDate = init.dueDate ? init.dueDate.split("T")[0] : null;
      const startDate = init.startDate ? init.startDate.split("T")[0] : null;
      
      // Show completed initiatives if:
      // 1. Due date is today or later (still within timeline), OR
      // 2. Start date is today (recently started and completed), OR
      // 3. No due date but started recently (within last 7 days)
      let shouldInclude = false;
      
      if (dueDate && dueDate >= todayStr) {
        shouldInclude = true; // Due date is today or future
      } else if (startDate && startDate === todayStr) {
        shouldInclude = true; // Started today
      } else if (!dueDate && startDate) {
        // No due date - check if started recently (within last 7 days)
        const startTime = new Date(startDate).getTime();
        const todayTime = new Date(todayStr).getTime();
        const daysDiff = (todayTime - startTime) / (1000 * 60 * 60 * 24);
        shouldInclude = daysDiff <= 7; // Show if completed within last 7 days
      }
      
      return shouldInclude;
    }
    
    return false;
  });



  // Get related objectives for today's activities
  const getRelatedObjectives = () => {
    const relatedObjIds = new Set();

    // From key results
    activeKeyResults.forEach((kr: any) => {
      if (kr.objectiveId) relatedObjIds.add(kr.objectiveId);
    });

    // From initiatives
    activeInitiatives.forEach((init: any) => {
      if (init.keyResultId) {
        const kr = (keyResults as any[]).find(
          (k: any) => k.id === init.keyResultId,
        );
        if (kr?.objectiveId) relatedObjIds.add(kr.objectiveId);
      }
    });

    // Filter objectives by related IDs or status
    let filteredObjectives = (objectives as any[]).filter(
      (obj: any) =>
        relatedObjIds.has(obj.id) ||
        obj.status === "on_track" ||
        obj.status === "at_risk" ||
        obj.status === "in_progress" ||
        obj.status === "not_started",
    );

    // Apply user filter - show objectives that are owned by user or have key results assigned to the selected user
    if (selectedUserId !== "all") {
      filteredObjectives = filteredObjectives.filter((obj: any) => {
        // Include objective if user is the owner
        if (obj.ownerId === selectedUserId) {
          return true;
        }

        // Include objective if any of its key results are assigned to the selected user
        const objectiveKeyResults = (keyResults as any[]).filter(
          (kr: any) => kr.objectiveId === obj.id,
        );
        return objectiveKeyResults.some(
          (kr: any) => kr.assignedTo === selectedUserId,
        );
      });
    }

    return filteredObjectives;
  };

  const relatedObjectives = getRelatedObjectives();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between sm:block">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Daily Focus
              </h1>
              {/* Date display - top-right on mobile, positioned at title level */}
              <div className="flex items-center gap-2 text-sm text-gray-500 sm:hidden">
                <Calendar className="h-4 w-4" />
                <span>
                  {today.toLocaleDateString("id-ID", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              Kelola aktivitas harian Anda hari ini
            </p>
          </div>

          {/* Welcome Screen Button and Date display - desktop */}
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Welcome Screen button clicked');
                window.dispatchEvent(new CustomEvent('showWelcomeScreen'));
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer border-0 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="button"
              style={{ pointerEvents: 'auto' }}
            >
              Welcome Screen
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {today.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Onboarding Missions Section - Only for client owners */}
        {user && (
          <div data-testid="onboarding-missions">
            <MissionCard
              missions={orderlyMissions}
              title="Panduan Onboarding Platform"
              description="Ikuti langkah-langkah ini untuk memulai menggunakan platform"
              className="mb-6"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* User Filter */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Pilih anggota tim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Anggota Tim</SelectItem>
                {activeUsers?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name && user.name.trim() !== ''
                      ? user.name.trim()
                      : user.email?.split('@')[0] || user.username || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div data-tour="update-harian-instan">
              <DailyUpdateSimple />
            </div>
            <TourStartButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
      {/* Filter Indicator - Only show when viewing another user's data */}
      {selectedUserId !== "all" && selectedUserId !== userId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <User className="h-4 w-4" />
            <span>
              Menampilkan objective, task, dan aktivitas untuk:{" "}
              <span className="font-medium">
                {(() => {
                  const selectedUser = activeUsers?.find((u: any) => u.id === selectedUserId);
                  if (selectedUser?.name && selectedUser.name.trim() !== '') {
                    return selectedUser.name.trim();
                  }
                  return selectedUser?.email?.split('@')[0] || selectedUser?.username || "Unknown";
                })()}
              </span>
            </span>
          </div>
        </div>
      )}
      {/* Overview Cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        data-tour="overview-cards"
      >
        {isLoadingAllTasks || isLoadingObjectives ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            {/* Task Hari Ini */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Task Hari Ini
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{todayTasks.length}</div>
                  {todayTasks.filter((t) => t.status === "completed").length >
                    0 && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      +
                      {todayTasks.filter((t) => t.status === "completed")
                        .length * 10}{" "}
                      poin
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {todayTasks.filter((t) => t.status === "completed").length}{" "}
                  selesai
                </p>
              </CardContent>
            </Card>

            {/* Task Terlambat */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Task Terlambat
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {overdueTasks.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Perlu perhatian segera
                </p>
              </CardContent>
            </Card>

            {/* Angka Target Aktif */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Angka Target
                </CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeKeyResults.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Termasuk yang sudah 100%
                </p>
              </CardContent>
            </Card>

            {/* Level & Progress */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Level & Progress
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                      Level {(stats as any)?.level || 1}
                    </div>
                    <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      {(stats as any)?.totalPoints || 0} poin
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Streak: {(stats as any)?.currentStreak || 0} hari
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {/* Compact Progress & Motivation */}
      <Card
        className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50"
      >
        <CardContent className="p-3 md:p-4">
          {/* Mobile: 3-column layout */}
          <div className="block md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                Progress Hari Ini
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Task Selesai */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-green-700">
                  {todayTasks.filter((t) => t.status === "completed").length}
                </div>
                <div className="text-xs text-green-600">Task Selesai</div>
                {todayTasks.filter((t) => t.status === "completed").length >
                  0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1">
                    +
                    {todayTasks.filter((t) => t.status === "completed").length *
                      10}{" "}
                    poin
                  </div>
                )}
              </div>

              {/* Target Aktif */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-lg font-semibold text-blue-700">
                  {activeKeyResults.length}
                </div>
                <div className="text-xs text-blue-600">Total Target</div>
              </div>

              {/* Streak */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-sm">🔥</span>
                </div>
                <div className="text-lg font-semibold text-orange-700">
                  {(stats as any)?.currentStreak || 0}
                </div>
                <div className="text-xs text-orange-600">Hari Berturut</div>
              </div>
            </div>
          </div>

          {/* Desktop: Original horizontal layout */}
          <div className="hidden md:block">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Progress Hari Ini
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">
                      {
                        todayTasks.filter((t) => t.status === "completed")
                          .length
                      }{" "}
                      task selesai
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-700">
                      {activeKeyResults.length} total target
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(stats as any)?.currentStreak &&
                  (stats as any).currentStreak > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full cursor-help">
                          <span>🔥</span>
                          <span>
                            {(stats as any).currentStreak} hari berturut
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Jumlah hari berturut-turut Anda menyelesaikan
                          setidaknya satu task
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                {todayTasks.filter((t) => t.status === "completed").length >
                  0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    +
                    {todayTasks.filter((t) => t.status === "completed").length *
                      10}{" "}
                    poin hari ini
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Goal Section - Always Show */}
      <Card className="border-blue-200 bg-blue-50" data-tour="goal-terkait-aktivitas">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">
                  Goal Terkait Aktivitas Hari Ini
                </span>
              </CardTitle>
              <CardDescription className="text-blue-700 text-sm mt-1">
                {relatedObjectives.length > 0
                  ? "Tetap ingat tujuan utama yang mendorong aktivitas harian Anda"
                  : "Mulai dengan menetapkan goal utama untuk mengarahkan aktivitas harian Anda"}
              </CardDescription>
            </div>
            {relatedObjectives.length > 0 && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto flex-shrink-0"
                onClick={handleOpenGoalModal}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tambah Goal</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {relatedObjectives.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-2 min-w-max">
                  {relatedObjectives.map((obj: any) => {
                    const objKeyResults = (keyResults as any[]).filter(
                      (kr) => kr.objectiveId === obj.id,
                    );
                    const objProgress =
                      objKeyResults.length > 0
                        ? objKeyResults.reduce(
                            (sum, kr) => sum + calculateKeyResultProgress(kr),
                            0,
                          ) / objKeyResults.length
                        : 0;

                    return (
                      <div
                        key={obj.id}
                        className="p-4 bg-white border border-blue-200 rounded-lg flex-shrink-0 w-80 sm:w-72"
                      >
                        <div className="space-y-3">
                          <div>
                            <Link
                              href={`/objectives/${obj.id}`}
                              className="font-medium text-blue-900 hover:text-blue-600 hover:underline cursor-pointer"
                            >
                              <h3 className="line-clamp-2">{obj.title}</h3>
                            </Link>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-700">Progress</span>
                              <span className="font-medium text-blue-900">
                                {objProgress.toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={objProgress} className="h-2" />
                          </div>

                          {/* Target Ideal Information */}
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Target Ideal: {obj.targetIdeal || "70"}% pada
                            periode ini
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={
                                obj.status === "on_track"
                                  ? "border-green-300 text-green-700 bg-green-50"
                                  : obj.status === "at_risk"
                                    ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                    : obj.status === "behind"
                                      ? "border-red-300 text-red-700 bg-red-50"
                                      : obj.status === "not_started"
                                        ? "border-gray-300 text-gray-700 bg-gray-50"
                                        : "border-blue-300 text-blue-700 bg-blue-50"
                              }
                            >
                              {obj.status === "on_track"
                                ? "On Track"
                                : obj.status === "at_risk"
                                  ? "At Risk"
                                  : obj.status === "behind"
                                    ? "Behind"
                                    : obj.status === "not_started"
                                      ? "Belum Mulai"
                                      : obj.status === "in_progress"
                                        ? "Sedang Berjalan"
                                        : obj.status}
                            </Badge>

                            <div className="text-xs text-blue-600">
                              {objKeyResults.length} Angka Target
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {relatedObjectives.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-blue-600">
                    Geser ke kanan untuk melihat goal lainnya
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 px-4">
              <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Belum Ada Goal
              </h3>
              <p className="text-sm text-blue-600 mb-4 max-w-md mx-auto">
                Buat goal pertama Anda untuk mengarahkan aktivitas harian dan
                mencapai target yang jelas
              </p>
              <Button
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto"
                onClick={handleOpenGoalModal}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Goal Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-tour="daily-focus-tabs">
          <TabsTrigger value="tasks" data-tour="task-prioritas">
            Task Prioritas ({overdueTasks.length + todayTasks.length + tomorrowTasks.length})
          </TabsTrigger>
          <TabsTrigger value="progress" data-tour="update-progress-tab">
            Update Progress ({activeKeyResults.length})
          </TabsTrigger>
          <TabsTrigger value="initiatives" data-tour="kelola-inisiatif-tab">
            Kelola Inisiatif ({activeInitiatives.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">
                    Task Prioritas Hari Ini
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Fokus pada task yang perlu diselesaikan hari ini
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto flex-shrink-0"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Tambah Task</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAllTasks ? (
                <div className="space-y-4">
                  {/* Desktop Table Skeleton */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prioritas
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal Mulai
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenggat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PIC
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4" />
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                            </td>
                            <td className="px-4 py-4">
                              <Skeleton className="h-6 w-20 rounded-full" />
                            </td>
                            <td className="px-4 py-4">
                              <Skeleton className="h-4 w-16" />
                            </td>
                            <td className="px-4 py-4">
                              <Skeleton className="h-4 w-16" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Skeleton className="h-6 w-6 rounded mx-auto" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Skeleton */}
                  <div className="md:hidden space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-6 w-6 rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : overdueTasks.length === 0 &&
                todayTasks.length === 0 &&
                tomorrowTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada task untuk hari ini dan besok</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prioritas
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal Mulai
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenggat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PIC
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Overdue Tasks Section */}
                        {overdueTasks.length > 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-3 bg-red-50 border-b-2 border-red-200"
                            >
                              <div className="flex items-center gap-2 font-semibold text-red-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span>
                                  Task Terlambat ({overdueTasks.length})
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {overdueTasks.map((task: any) => (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 bg-red-50"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <div>
                                  <Link
                                    href={`/tasks/${task.id}`}
                                    className="font-medium text-red-900 hover:text-red-600 hover:underline cursor-pointer"
                                  >
                                    {task.title}
                                  </Link>

                                  {task.initiative && (
                                    <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                  <div className="mt-1">
                                    <TaskCommentCount taskId={task.id} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge
                                className={getTaskPriorityColor(
                                  task.priority || "medium",
                                )}
                              >
                                {getTaskPriorityLabel(
                                  task.priority || "medium",
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                  >
                                    {getTaskStatusLabel(task.status)}
                                    <ChevronDown className="h-3 w-3" />
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
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600">
                                {task.startDate
                                  ? new Date(task.startDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak diatur"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-red-600 font-medium">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak ada"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage
                                      src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {task.assignedTo
                                    ? getUserName(task.assignedTo)
                                    : "Belum ditentukan"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="cursor-pointer flex items-center"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Lihat Detail
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTask(task)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}

                        {/* Today's Tasks Section */}
                        {todayTasks.length > 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-3 bg-blue-50 border-b-2 border-blue-200"
                            >
                              <div className="flex items-center gap-2 font-semibold text-blue-800">
                                <Calendar className="h-4 w-4" />
                                <span>Task Hari Ini ({todayTasks.length})</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {todayTasks.map((task: any) => (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <div>
                                  <Link
                                    href={`/tasks/${task.id}`}
                                    className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                                  >
                                    {task.title}
                                  </Link>

                                  {task.initiative && (
                                    <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                  <div className="mt-1">
                                    <TaskCommentCount taskId={task.id} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge
                                className={getTaskPriorityColor(
                                  task.priority || "medium",
                                )}
                              >
                                {getTaskPriorityLabel(
                                  task.priority || "medium",
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                  >
                                    {getTaskStatusLabel(task.status)}
                                    <ChevronDown className="h-3 w-3" />
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
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600">
                                {task.startDate
                                  ? new Date(task.startDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak diatur"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak ada tenggat"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage
                                      src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {task.assignedTo
                                    ? getUserName(task.assignedTo)
                                    : "Belum ditentukan"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="cursor-pointer flex items-center"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Lihat Detail
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTask(task)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}

                        {/* Tomorrow's Tasks Section */}
                        {tomorrowTasks.length > 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-3 bg-green-50 border-b-2 border-green-200"
                            >
                              <div className="flex items-center gap-2 font-semibold text-green-800">
                                <Clock className="h-4 w-4" />
                                <span>Task Besok ({tomorrowTasks.length})</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {tomorrowTasks.map((task: any) => (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 bg-green-50"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-600" />
                                <div>
                                  <Link
                                    href={`/tasks/${task.id}`}
                                    className="font-medium text-green-900 hover:text-green-600 hover:underline cursor-pointer"
                                  >
                                    {task.title}
                                  </Link>

                                  {task.initiative && (
                                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                  <div className="mt-1">
                                    <TaskCommentCount taskId={task.id} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge
                                className={getTaskPriorityColor(
                                  task.priority || "medium",
                                )}
                              >
                                {getTaskPriorityLabel(
                                  task.priority || "medium",
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                  >
                                    {getTaskStatusLabel(task.status)}
                                    <ChevronDown className="h-3 w-3" />
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
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600">
                                {task.startDate
                                  ? new Date(task.startDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak diatur"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-green-600 font-medium">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak ada"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage
                                      src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {task.assignedTo
                                    ? getUserName(task.assignedTo)
                                    : "Belum ditugaskan"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 hover:bg-gray-100 rounded-full">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="cursor-pointer flex items-center"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Lihat Detail
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTask(task)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {/* Overdue Tasks */}
                    {overdueTasks.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-red-700 flex items-center gap-2 pb-2 border-b-2 border-red-200">
                          <AlertTriangle className="h-4 w-4" />
                          Task Terlambat ({overdueTasks.length})
                        </h3>
                        {overdueTasks.map((task: any) => (
                          <div
                            key={task.id}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Link
                                  href={`/tasks/${task.id}`}
                                  className="font-medium text-red-900 hover:text-red-600 hover:underline cursor-pointer"
                                >
                                  {task.title}
                                </Link>
                                {task.initiative && (
                                  <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded mt-1 inline-block">
                                    Inisiatif: {task.initiative.title}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={getTaskPriorityColor(
                                      task.priority || "medium",
                                    )}
                                  >
                                    {getTaskPriorityLabel(
                                      task.priority || "medium",
                                    )}
                                  </Badge>
                                  <TaskCommentCount taskId={task.id} />
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                  >
                                    {getTaskStatusLabel(task.status)}
                                    <ChevronDown className="h-3 w-3" />
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
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="text-sm text-gray-600">
                                Mulai:{" "}
                                {task.startDate
                                  ? new Date(task.startDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak diatur"}
                              </div>
                              <div className="text-sm text-red-600">
                                Tenggat:{" "}
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak ada"}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage
                                      src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {task.assignedTo
                                    ? getUserName(task.assignedTo)
                                    : "Belum ditentukan"}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="cursor-pointer flex items-center"
                                    >
                                      <Eye className="w-3 h-3 mr-2" />
                                      Lihat Detail
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTask(task)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Today's Tasks */}
                    {todayTasks.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-blue-700 flex items-center gap-2 pb-2 border-b-2 border-blue-200">
                          <Calendar className="h-4 w-4" />
                          Task Hari Ini ({todayTasks.length})
                        </h3>
                        {todayTasks.map((task: any) => (
                          <div
                            key={task.id}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Link
                                  href={`/tasks/${task.id}`}
                                  className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {task.title}
                                </Link>
                                {task.initiative && (
                                  <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                                    Inisiatif: {task.initiative.title}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={getTaskPriorityColor(
                                      task.priority || "medium",
                                    )}
                                  >
                                    {getTaskPriorityLabel(
                                      task.priority || "medium",
                                    )}
                                  </Badge>
                                  <TaskCommentCount taskId={task.id} />
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                  >
                                    {getTaskStatusLabel(task.status)}
                                    <ChevronDown className="h-3 w-3" />
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
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="text-sm text-gray-600">
                                Mulai:{" "}
                                {task.startDate
                                  ? new Date(task.startDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak diatur"}
                              </div>
                              <div className="text-sm text-gray-600">
                                Tenggat:{" "}
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                      "id-ID",
                                    )
                                  : "Tidak ada tenggat"}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage
                                      src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {task.assignedTo
                                    ? getUserName(task.assignedTo)
                                    : "Belum ditentukan"}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="cursor-pointer flex items-center"
                                    >
                                      <Eye className="w-3 h-3 mr-2" />
                                      Lihat Detail
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTask(task)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tomorrow's Tasks */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-green-700 flex items-center gap-2 pb-2 border-b-2 border-green-200">
                        <Clock className="h-4 w-4" />
                        Task Besok ({tomorrowTasks.length})
                      </h3>
                      {tomorrowTasks.length > 0 ? (
                        <>
                          {tomorrowTasks.map((task: any) => (
                            <div
                              key={task.id}
                              className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <Link
                                    href={`/tasks/${task.id}`}
                                    className="font-medium text-green-900 hover:text-green-600 hover:underline cursor-pointer"
                                  >
                                    {task.title}
                                  </Link>
                                  {task.initiative && (
                                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      className={getTaskPriorityColor(
                                        task.priority || "medium",
                                      )}
                                    >
                                      {getTaskPriorityLabel(
                                        task.priority || "medium",
                                      )}
                                    </Badge>
                                    <TaskCommentCount taskId={task.id} />
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                    >
                                      {getTaskStatusLabel(task.status)}
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          task.id,
                                          "not_started",
                                        )
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
                                        handleStatusUpdate(
                                          task.id,
                                          "in_progress",
                                        )
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
                              </div>
                              <div className="flex flex-col gap-1 mt-2">
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Mulai:</span>{" "}
                                  {task.startDate
                                    ? new Date(task.startDate).toLocaleDateString(
                                        "id-ID",
                                      )
                                    : "Tidak diatur"}
                                </div>
                                <div className="text-xs text-green-600">
                                  <span className="font-medium">Tenggat:</span>{" "}
                                  {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString(
                                        "id-ID",
                                      )
                                    : "Tidak ada"}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="font-medium">PIC:</span>
                                <div className="flex items-center gap-1">
                                  {task.assignedTo ? (
                                    <Avatar className="w-4 h-4">
                                      <AvatarImage
                                        src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                      />
                                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                        {getUserInitials(task.assignedTo)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <User className="w-3 h-3" />
                                  )}
                                  <span>
                                    {task.assignedTo
                                      ? getUserName(task.assignedTo)
                                      : "Belum ditugaskan"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-end pt-2 border-t border-green-100">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-green-100 rounded-full">
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/tasks/${task.id}`}
                                        className="cursor-pointer flex items-center"
                                      >
                                        <Eye className="w-3 h-3 mr-2" />
                                        Lihat Detail
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleEditTask(task)}
                                      className="cursor-pointer"
                                    >
                                      <Edit className="w-3 h-3 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTask(task)}
                                      className="cursor-pointer text-red-600"
                                    >
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Tidak ada task untuk besok</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Progress Angka Target</CardTitle>
              <CardDescription>
                Lakukan check-in pada angka target (termasuk yang sudah 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingObjectives ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg space-y-2 sm:space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-4" />
                          </div>
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Skeleton className="h-8 w-20 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Skeleton className="h-2 w-full rounded-full" />
                          <div className="flex justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeKeyResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada angka target yang tersedia</p>
                </div>
              ) : (
                activeKeyResults.map((kr: any) => {
                  const progress = calculateKeyResultProgress(kr);
                  const typeConfig = getKeyResultTypeIcon(kr.keyResultType);
                  const IconComponent = typeConfig.icon;

                  return (
                    <div
                      key={kr.id}
                      className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg space-y-2 sm:space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/key-results/${kr.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                            >
                              <h3>{kr.title}</h3>
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
                            onClick={() => handleCheckInKeyResult(kr)}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="sm:hidden">Update</span>
                            <span className="hidden sm:inline">Update</span>
                          </Button>
                          <Link href={`/key-results/${kr.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Progress section with SimpleProgressStatus component */}
                      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                        <div className="w-full sm:flex-1 sm:mr-4">
                          {/* Mobile: Use compact mode, Desktop: Use full progress bar */}
                          <div className="block sm:hidden">
                            <SimpleProgressStatus
                              status={kr.status}
                              progressPercentage={progress}
                              timeProgressPercentage={
                                kr.timeProgressPercentage || 0
                              }
                              dueDate={null}
                              startDate="2025-07-01"
                              compact={true}
                              keyResultType={kr.type}
                            />
                          </div>
                          <div className="hidden sm:block">
                            <SimpleProgressStatus
                              status={kr.status}
                              progressPercentage={progress}
                              timeProgressPercentage={
                                kr.timeProgressPercentage || 0
                              }
                              dueDate={null}
                              startDate="2025-07-01"
                              compact={false}
                              keyResultType={kr.type}
                            />
                          </div>
                        </div>
                      </div>

                      {/* User and Initiative Info - matching objective detail page format */}
                      <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100">
                        {/* Assignee info - Left */}
                        <div className="relative group">
                          <div className="flex items-center gap-2 text-gray-500">
                            {kr.assignedTo ? (
                              <Avatar className="w-6 h-6">
                                <AvatarImage
                                  src={getUserProfileImage(kr.assignedTo)} alt={getUserName(kr.assignedTo)}
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                  {getUserInitials(kr.assignedTo)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            <span className="truncate max-w-20 sm:max-w-28 text-xs">
                              {kr.assignedTo
                                ? getUserName(kr.assignedTo)
                                : "Belum ditentukan"}
                            </span>
                          </div>

                          {/* Tooltip for assignee info */}
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                            {kr.assignedTo
                              ? `Penanggung jawab: ${getUserName(kr.assignedTo)} - Bertanggung jawab untuk memantau dan melaporkan progress angka target ini`
                              : "Belum ada penanggung jawab - Assign seseorang untuk memantau progress angka target ini"}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                          </div>
                        </div>

                        {/* Initiative count - Right */}
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{getInitiativeCount(kr.id)}</span>
                          <span>inisiatif</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Kelola Inisiatif Aktif
                  </CardTitle>
                  <CardDescription>
                    Update metrics dan kelola inisiatif aktif
                    {selectedUserId === "all"
                      ? " semua anggota tim"
                      : " yang ditanggung jawabi"}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsInitiativeModalOpen(true)}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tambah Inisiatif</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInitiatives ? (
                <div className="space-y-4">
                  {/* Desktop Table Skeleton */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Inisiatif
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Update
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Skeleton className="h-6 w-20 rounded-full" />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Skeleton className="h-5 w-8 rounded mx-auto" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <Skeleton className="h-2 w-full rounded-full" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Skeleton className="h-4 w-16" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Skeleton className="h-8 w-16 rounded" />
                            </td>
                            <td className="px-4 py-4">
                              <Skeleton className="h-6 w-6 rounded" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Skeleton */}
                  <div className="md:hidden space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-16 rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-8 rounded" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-2 w-full rounded-full" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeInitiatives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>
                    {selectedUserId === "all"
                      ? "Tidak ada inisiatif aktif dari tim"
                      : `Tidak ada inisiatif aktif untuk ${getUserName(selectedUserId)}`}
                  </p>
                  <p className="text-sm mt-2">
                    {selectedUserId === "all"
                      ? "Semua anggota tim tidak memiliki inisiatif aktif"
                      : "Gunakan filter pengguna untuk melihat inisiatif anggota tim lainnya"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Inisiatif
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Update
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeInitiatives
                          .sort((a, b) => {
                            const scoreA = parseFloat(a.priorityScore || "0");
                            const scoreB = parseFloat(b.priorityScore || "0");
                            return scoreB - scoreA; // Sort by priority score descending
                          })
                          .map((initiative: any) => {
                            const rawScore = initiative.priorityScore;
                            const score = parseFloat(rawScore || "0");

                            let priorityColor: string;
                            let priorityLabel: string;

                            if (score >= 4.0) {
                              priorityColor = "bg-red-100 text-red-800";
                              priorityLabel = "Kritis";
                            } else if (score >= 3.0) {
                              priorityColor = "bg-orange-100 text-orange-800";
                              priorityLabel = "Tinggi";
                            } else if (score >= 2.0) {
                              priorityColor = "bg-yellow-100 text-yellow-800";
                              priorityLabel = "Sedang";
                            } else {
                              priorityColor = "bg-green-100 text-green-800";
                              priorityLabel = "Rendah";
                            }

                            const status = initiative.status || "draft";
                            const getStatusInfo = (status: string) => {
                              const statusMap = {
                                draft: {
                                  label: "Draft",
                                  bgColor: "bg-gray-100",
                                  textColor: "text-gray-800",
                                },
                                sedang_berjalan: {
                                  label: "Sedang Berjalan",
                                  bgColor: "bg-blue-100",
                                  textColor: "text-blue-800",
                                },
                                selesai: {
                                  label: "Selesai",
                                  bgColor: "bg-green-100",
                                  textColor: "text-green-800",
                                },
                                dibatalkan: {
                                  label: "Dibatalkan",
                                  bgColor: "bg-red-100",
                                  textColor: "text-red-800",
                                },
                              };
                              return (
                                statusMap[status as keyof typeof statusMap] ||
                                statusMap.draft
                              );
                            };

                            const statusInfo = getStatusInfo(status);

                            return (
                              <tr
                                key={initiative.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-4">
                                  <div>
                                    <Link
                                      href={`/initiatives/${initiative.id}`}
                                    >
                                      <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                        {initiative.title}
                                      </div>
                                    </Link>

                                    {initiative.keyResultId && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Target className="w-3 h-3 text-blue-600" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Angka Target</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <span className="text-xs text-blue-600 font-medium">
                                          {keyResults.find(
                                            (kr: any) =>
                                              kr.id === initiative.keyResultId,
                                          )?.title || "Unknown"}
                                        </span>
                                      </div>
                                    )}
                                    {initiative.budget && (
                                      <div className="text-sm text-gray-500 mt-1">
                                        Budget: Rp{" "}
                                        {parseFloat(
                                          initiative.budget,
                                        ).toLocaleString("id-ID")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <Badge
                                    className={`${statusInfo.bgColor} ${statusInfo.textColor} text-xs px-2 py-1`}
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Badge
                                      className={`${priorityColor} text-xs px-2 py-0.5`}
                                    >
                                      {priorityLabel}
                                    </Badge>
                                    <span className="text-xs text-gray-400">
                                      {score.toFixed(1)}/5.0
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full ${(() => {
                                            const progress =
                                              initiative.progressPercentage ||
                                              0;
                                            if (progress >= 100)
                                              return "bg-green-600";
                                            if (progress >= 80)
                                              return "bg-green-500";
                                            if (progress >= 60)
                                              return "bg-orange-500";
                                            return "bg-red-500";
                                          })()}`}
                                          style={{
                                            width: `${initiative.progressPercentage || 0}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 min-w-0">
                                      {initiative.progressPercentage || 0}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm">
                                    {initiative.startDate && (
                                      <div className="text-gray-500">
                                        Mulai:{" "}
                                        {new Date(
                                          initiative.startDate,
                                        ).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </div>
                                    )}
                                    {initiative.dueDate ? (
                                      <div
                                        className={`text-sm ${
                                          new Date(initiative.dueDate) <
                                          new Date()
                                            ? "text-red-600 font-medium"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        Selesai:{" "}
                                        {new Date(
                                          initiative.dueDate,
                                        ).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 text-sm">
                                        Selesai: -
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    {initiative.picId ? (
                                      <>
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage 
                                            src={getUserProfileImage(initiative.picId)} 
                                            alt={getUserName(initiative.picId)}
                                          />
                                          <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                            {getUserInitials(initiative.picId)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-gray-900 truncate">
                                          {getUserName(initiative.picId)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-sm text-gray-400">
                                        Tidak ditugaskan
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {initiative.status === "dibatalkan" ? (
                                    <Button
                                      onClick={() => window.location.href = `/initiatives/${initiative.id}`}
                                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 py-1 rounded-md text-sm font-medium"
                                    >
                                      Buka Kembali
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() =>
                                        handleUpdateMetrics(initiative)
                                      }
                                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 py-1 rounded-md text-sm font-medium"
                                    >
                                      Update
                                    </Button>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <Link href={`/initiatives/${initiative.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="Lihat Detail"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {activeInitiatives
                      .sort((a, b) => {
                        const scoreA = parseFloat(a.priorityScore || "0");
                        const scoreB = parseFloat(b.priorityScore || "0");
                        return scoreB - scoreA; // Sort by priority score descending
                      })
                      .map((initiative: any) => {
                        const rawScore = initiative.priorityScore;
                        const score = parseFloat(rawScore || "0");

                        let priorityColor: string;
                        let priorityLabel: string;

                        if (score >= 4.0) {
                          priorityColor = "bg-red-100 text-red-800";
                          priorityLabel = "Kritis";
                        } else if (score >= 3.0) {
                          priorityColor = "bg-orange-100 text-orange-800";
                          priorityLabel = "Tinggi";
                        } else if (score >= 2.0) {
                          priorityColor = "bg-yellow-100 text-yellow-800";
                          priorityLabel = "Sedang";
                        } else {
                          priorityColor = "bg-green-100 text-green-800";
                          priorityLabel = "Rendah";
                        }

                        const status = initiative.status || "draft";
                        const getStatusInfo = (status: string) => {
                          const statusMap = {
                            draft: {
                              label: "Draft",
                              bgColor: "bg-gray-100",
                              textColor: "text-gray-800",
                            },
                            sedang_berjalan: {
                              label: "Sedang Berjalan",
                              bgColor: "bg-blue-100",
                              textColor: "text-blue-800",
                            },
                            selesai: {
                              label: "Selesai",
                              bgColor: "bg-green-100",
                              textColor: "text-green-800",
                            },
                            dibatalkan: {
                              label: "Dibatalkan",
                              bgColor: "bg-red-100",
                              textColor: "text-red-800",
                            },
                          };
                          return (
                            statusMap[status as keyof typeof statusMap] ||
                            statusMap.draft
                          );
                        };

                        const statusInfo = getStatusInfo(status);

                        return (
                          <div
                            key={initiative.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                          >
                            {/* Header */}
                            <div className="space-y-2">
                              <Link href={`/initiatives/${initiative.id}`}>
                                <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                  {initiative.title}
                                </h3>
                              </Link>

                              {initiative.keyResultId && (
                                <div className="flex items-center gap-1">
                                  <Target className="w-3 h-3 text-blue-600" />
                                  <span className="text-xs text-blue-600 font-medium">
                                    {keyResults.find(
                                      (kr: any) =>
                                        kr.id === initiative.keyResultId,
                                    )?.title || "Unknown"}
                                  </span>
                                </div>
                              )}

                              {initiative.budget && (
                                <div className="text-sm text-gray-500">
                                  Budget: Rp{" "}
                                  {parseFloat(initiative.budget).toLocaleString(
                                    "id-ID",
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Status and Priority */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={`${statusInfo.bgColor} ${statusInfo.textColor} text-xs px-2 py-1`}
                              >
                                {statusInfo.label}
                              </Badge>
                              <Badge
                                className={`${priorityColor} text-xs px-2 py-1`}
                              >
                                {priorityLabel} ({score.toFixed(1)}/5.0)
                              </Badge>
                            </div>

                            {/* Progress */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium text-gray-900">
                                  {initiative.progressPercentage || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${(() => {
                                    const progress =
                                      initiative.progressPercentage || 0;
                                    if (progress >= 100) return "bg-green-600";
                                    if (progress >= 80) return "bg-green-500";
                                    if (progress >= 60) return "bg-orange-500";
                                    return "bg-red-500";
                                  })()}`}
                                  style={{
                                    width: `${initiative.progressPercentage || 0}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Dates and PIC */}
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tenggat:</span>
                                <span
                                  className={
                                    initiative.dueDate &&
                                    new Date(initiative.dueDate) < new Date()
                                      ? "text-red-600 font-medium"
                                      : "text-gray-900"
                                  }
                                >
                                  {initiative.dueDate
                                    ? new Date(
                                        initiative.dueDate,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                      })
                                    : "-"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">PIC:</span>
                                <div className="flex items-center gap-2">
                                  {initiative.picId ? (
                                    <>
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage 
                                          src={getUserProfileImage(initiative.picId)} 
                                          alt={getUserName(initiative.picId)}
                                        />
                                        <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                          {getUserInitials(initiative.picId)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-gray-900 text-sm">
                                        {getUserName(initiative.picId)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">
                                      Tidak ditugaskan
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              {initiative.status === "dibatalkan" ? (
                                <Button
                                  onClick={() => window.location.href = `/initiatives/${initiative.id}`}
                                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium flex-1 mr-2"
                                >
                                  Buka Kembali
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleUpdateMetrics(initiative)}
                                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium flex-1 mr-2"
                                >
                                  Update Metrics
                                </Button>
                              )}
                              <Link href={`/initiatives/${initiative.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Modals */}
      {selectedKeyResult && (
        <CheckInModal
          open={isCheckInModalOpen}
          onOpenChange={setIsCheckInModalOpen}
          keyResultId={selectedKeyResult.id}
          keyResultTitle={selectedKeyResult.title}
          currentValue={selectedKeyResult.currentValue}
          targetValue={selectedKeyResult.targetValue}
          unit={selectedKeyResult.unit}
          keyResultType={selectedKeyResult.keyResultType}
        />
      )}
      {selectedInitiative && (
        <MetricsUpdateModal
          open={isSuccessMetricsModalOpen}
          onOpenChange={setIsSuccessMetricsModalOpen}
          initiativeId={selectedInitiative.id}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Task</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus task "{taskToDelete?.title}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteTaskMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTaskMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Goal Creation Modal using existing GoalFormModal */}
      <GoalFormModal open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen} />

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        initiativeId=""
        isAdding={!selectedTask}
      />

      {/* Initiative Creation Modal */}
      <InitiativeFormModal
        open={isInitiativeModalOpen}
        onOpenChange={setIsInitiativeModalOpen}
        onSuccess={() => {
          // Invalidate queries to refresh the initiative list and related data
          queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
          queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
          queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
        }}
      />
      
    </div>
  );
}
