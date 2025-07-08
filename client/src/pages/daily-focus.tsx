import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { DailyInstantUpdate } from "@/components/daily-instant-update";
import { useAuth } from "@/hooks/useAuth";
import TrialStatusBanner from "@/components/trial-status-banner";
import TrialMascot from "@/components/trial-mascot";

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
  addMember: () => window.location.href = "/client-users",
  createTeam: () => window.location.href = "/teams", 
  createObjective: () => window.location.href = "/",
  addKeyResult: () => window.location.href = "/",
  addInitiative: () => window.location.href = "/",
  addTask: () => window.location.href = "/daily-focus",
  updateKeyResult: () => window.location.href = "/",
  updateMetrics: () => window.location.href = "/",
  updateTaskStatus: () => window.location.href = "/daily-focus",
  dailyUpdate: () => window.location.href = "/daily-focus",
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

function MissionCard({ missions, title, description, className }: MissionCardProps) {
  const completedMissions = missions.filter(m => m.unlocked).length;
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
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
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
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-3 pt-0">
            {missions.map((mission, index) => {
              const IconComponent = iconMapping[mission.icon] || Target;
              const missionKey = mission.name.includes("Tambah Pengguna") || mission.name.includes("Menambahkan Member") ? "addMember" :
                                mission.name.includes("Buat Tim") || mission.name.includes("Membuat Tim") ? "createTeam" :
                                mission.name.includes("Buat Objective") || mission.name.includes("Membuat Objective") ? "createObjective" :
                                mission.name.includes("Tambah Key Result") || mission.name.includes("Menambahkan Key Result") ? "addKeyResult" :
                                mission.name.includes("Buat Inisiatif") || mission.name.includes("Menambahkan Inisiatif") ? "addInitiative" :
                                mission.name.includes("Tambah Task") || mission.name.includes("Menambahkan Task") ? "addTask" :
                                mission.name.includes("Update Capaian Key Result") ? "updateKeyResult" :
                                mission.name.includes("Update Capaian Metrik") ? "updateMetrics" :
                                mission.name.includes("Update Status Task") ? "updateTaskStatus" :
                                mission.name.includes("Update Harian") ? "dailyUpdate" :
                                "addMember";
              
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
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      mission.unlocked 
                        ? "bg-green-100 text-green-600" 
                        : "bg-orange-100 text-orange-600"
                    }`}>
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
                        <h4 className={`font-medium text-sm ${
                          mission.unlocked ? "text-green-700 line-through" : "text-gray-800"
                        }`}>
                          {mission.name.replace(/🎯 Misi: |📊 Misi: |💡 Misi: |✅ Misi: |🔄 Misi: |📈 Misi: |⚡ Misi: |🎖️ Misi: /g, "")}
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

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const [selectedKeyResult, setSelectedKeyResult] = useState<any>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSuccessMetricsModalOpen, setIsSuccessMetricsModalOpen] =
    useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "all"); // Filter state - default to current user
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: userId || "unassigned", // Default to current user
    dueDate: null as Date | null,
    initiativeId: "none",
  });

  // Status update mutation
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Status berhasil diupdate",
        description: "Status task telah diperbarui",
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
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/okrs"],
  });

  // Extract key results from objectives data (includes calculated status)
  const keyResults = React.useMemo(() => {
    return objectives.flatMap((obj: any) => obj.keyResults || []);
  }, [objectives]);

  const { data: initiatives = [] } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Trial achievements query for missions
  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/trial-achievements"],
    enabled: !!userId,
  });

  // Specific 10-step sequential missions configuration
  const missionSequence = [
    { name: "Menambahkan Member", icon: "UserPlus", description: "Tambahkan anggota baru ke tim Anda untuk memulai kolaborasi" },
    { name: "Membuat Tim", icon: "Users", description: "Buat tim dengan struktur yang jelas untuk mengelola proyek" },
    { name: "Membuat Objective", icon: "Target", description: "Definisikan tujuan utama yang ingin dicapai tim Anda" },
    { name: "Menambahkan Key Result", icon: "BarChart3", description: "Tentukan indikator pencapaian yang dapat diukur secara kuantitatif" },
    { name: "Menambahkan Inisiatif", icon: "Lightbulb", description: "Buat rencana aksi konkret untuk mencapai tujuan" },
    { name: "Menambahkan Task", icon: "CheckSquare", description: "Breakdown inisiatif menjadi tugas-tugas yang dapat dikerjakan" },
    { name: "Update Capaian Key Result", icon: "TrendingUp", description: "Pantau dan update progress pencapaian target angka" },
    { name: "Update Capaian Metrik Inisiatif", icon: "LineChart", description: "Evaluasi kemajuan pelaksanaan inisiatif secara berkala" },
    { name: "Update Status Task", icon: "CheckCircle2", description: "Pantau dan update status penyelesaian tugas harian" },
    { name: "Update Harian Instan", icon: "Zap", description: "Lakukan review harian untuk memastikan kemajuan yang konsisten" },
  ];

  // Transform achievements to match mission sequence order
  const orderlyMissions = missionSequence.map((mission, index) => {
    const achievement = achievements.find(a => 
      a.name.includes(mission.name) || 
      a.description.includes(mission.name.toLowerCase())
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan",
      });
      setIsTaskModalOpen(false);
      setTaskFormData({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: userId || "unassigned", // Reset to current user
        dueDate: null,
        initiativeId: "none",
      });
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
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Task berhasil dihapus",
        description: "Task telah dihapus dari sistem",
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

  // Task edit mutation
  const editTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/tasks/${data.taskId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Task berhasil diperbarui",
        description: "Task telah diperbarui",
      });
      setIsEditTaskModalOpen(false);
      setSelectedTask(null);
      setTaskFormData({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: userId || "unassigned",
        dueDate: null,
        initiativeId: "none",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal memperbarui task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Task action handlers


  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      assignedTo: task.assignedTo || userId || "unassigned",
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      initiativeId: task.initiativeId || "none",
    });
    setIsEditTaskModalOpen(true);
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

  const handleEditTaskSubmit = () => {
    if (!taskFormData.title.trim()) {
      toast({
        title: "Error",
        description: "Title task harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTask) return;

    const updateData = {
      ...taskFormData,
      assignedTo: taskFormData.assignedTo === "unassigned" ? null : taskFormData.assignedTo || null,
      dueDate: taskFormData.dueDate || null,
      initiativeId: taskFormData.initiativeId === "none" || !taskFormData.initiativeId ? null : taskFormData.initiativeId,
    };

    editTaskMutation.mutate({
      taskId: selectedTask.id,
      updates: updateData,
    });
  };

  const { data: stats } = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  // Reset task form when modal opens
  const handleOpenTaskModal = () => {
    setTaskFormData({
      title: "",
      description: "",
      priority: "medium",
      assignedTo: userId || "unassigned", // Default to current user
      dueDate: null,
      initiativeId: "none",
    });
    setIsTaskModalOpen(true);
  };

  // Handle task form submission
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) {
      toast({
        title: "Title diperlukan",
        description: "Mohon masukkan title untuk task",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      ...taskFormData,
      assignedTo: taskFormData.assignedTo === "unassigned" ? null : taskFormData.assignedTo || null,
      dueDate: taskFormData.dueDate || null,
      initiativeId: taskFormData.initiativeId === "none" || !taskFormData.initiativeId ? null : taskFormData.initiativeId,
      createdBy: userId, // Add the required createdBy field
    };

    createTaskMutation.mutate(taskData);
  };

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
  const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  const gmt7Date = new Date(utc + (7 * 3600000)); // GMT+7
  const todayStr = gmt7Date.getFullYear() + '-' + 
    String(gmt7Date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(gmt7Date.getDate()).padStart(2, '0');

  // Helper function for key result type icons
  const getKeyResultTypeIcon = (type: string) => {
    switch (type) {
      case "increase_to":
        return {
          icon: TrendingUp,
          tooltip: "Target Peningkatan - Progress dihitung dari nilai awal ke target",
        };
      case "decrease_to":
        return {
          icon: TrendingDown,
          tooltip: "Target Penurunan - Progress dihitung mundur dari nilai awal ke target",
        };
      case "should_stay_above":
        return {
          icon: MoveUp,
          tooltip: "Tetap Di Atas - Nilai harus tetap berada di atas ambang batas target",
        };
      case "should_stay_below":
        return {
          icon: MoveDown,
          tooltip: "Tetap Di Bawah - Nilai harus tetap berada di bawah ambang batas target",
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

  // Helper function to get user name by ID (matching objective detail page format)
  const getUserName = (userId: string): string => {
    if (!users || !userId) return "Tidak ditentukan";
    const user = users.find((u: any) => u.id === userId);
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || user?.username || "Tidak ditentukan";
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (userId: string): string => {
    if (!users || !userId) return "?";
    const user = users.find((u: any) => u.id === userId);
    if (user && user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  // Helper function to get initiative count for a key result
  const getInitiativeCount = (keyResultId: string): number => {
    return initiatives.filter((init: any) => init.keyResultId === keyResultId).length;
  };

  // Apply user filter to tasks and key results
  const filteredTasks = selectedUserId === "all" 
    ? (allTasks as any[])
    : (allTasks as any[]).filter((task: any) => task.assignedTo === selectedUserId);

  const filteredKeyResults = selectedUserId === "all"
    ? (keyResults as any[])
    : (keyResults as any[]).filter((kr: any) => kr.assignedTo === selectedUserId);

  const filteredInitiatives = selectedUserId === "all"
    ? (initiatives as any[])
    : (initiatives as any[]).filter((init: any) => init.picId === selectedUserId);

  // Filter data for today's focus
  const todayTasks = filteredTasks.filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split("T")[0] : null;
    // Include tasks due today or in progress tasks
    return (
      dueDate === todayStr ||
      task.status === "in_progress"
    );
  });

  const overdueTasks = filteredTasks.filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split("T")[0] : null;
    // Only consider tasks overdue if they were due BEFORE today (not including today)
    return (
      dueDate &&
      dueDate < todayStr &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  });

  // Tomorrow's tasks - tasks due tomorrow (using GMT+7 timezone)
  const tomorrowTasks = filteredTasks.filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split("T")[0] : null;
    // Calculate tomorrow's date using GMT+7 timezone
    const tomorrow = new Date();
    const utcTomorrow = tomorrow.getTime() + (tomorrow.getTimezoneOffset() * 60000);
    const gmt7Tomorrow = new Date(utcTomorrow + (7 * 3600000)); // GMT+7
    gmt7Tomorrow.setDate(gmt7Tomorrow.getDate() + 1);
    const tomorrowStr = gmt7Tomorrow.getFullYear() + '-' + 
      String(gmt7Tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
      String(gmt7Tomorrow.getDate()).padStart(2, '0');
    return (
      dueDate === tomorrowStr &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  });

  const activeKeyResults = filteredKeyResults.filter((kr: any) => {
    const progress = calculateKeyResultProgress(kr);
    return (
      progress < 100 && kr.status !== "completed" && kr.status !== "cancelled"
    );
  });

  const activeInitiatives = filteredInitiatives.filter(
    (init: any) => init.status === "sedang_berjalan" || init.status === "draft",
  );

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
          (kr: any) => kr.objectiveId === obj.id
        );
        return objectiveKeyResults.some((kr: any) => kr.assignedTo === selectedUserId);
      });
    }

    return filteredObjectives;
  };

  const relatedObjectives = getRelatedObjectives();

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 ml-[4px] mr-[4px] mt-[55px] mb-[55px] pt-[10px] pb-[10px]">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between sm:block">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daily Focus</h1>
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
            <p className="text-sm md:text-base text-gray-600">Kelola aktivitas harian Anda hari ini</p>
          </div>
          
          {/* Date display - desktop only */}
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

        {/* Trial Status Banner */}
        <TrialStatusBanner />

        {/* Trial Mascot Guide */}
        <TrialMascot 
          className="mb-6"
          missions={orderlyMissions}
          onMissionAction={(missionName) => {
            console.log("Mission action triggered:", missionName);
            // Handle mission-specific actions here
            if (missionName.includes("Member")) {
              window.location.href = "/client-users";
            } else if (missionName.includes("Tim")) {
              window.location.href = "/teams";
            } else if (missionName.includes("Objective")) {
              window.location.href = "/dashboard";
            } else if (missionName.includes("Key Result")) {
              window.location.href = "/dashboard";
            } else if (missionName.includes("Inisiatif")) {
              window.location.href = "/dashboard";
            } else if (missionName.includes("Task")) {
              setIsTaskModalOpen(true);
            } else if (missionName.includes("Update")) {
              setIsInstantUpdateOpen(true);
            } else {
              // Default scroll to missions
              document.querySelector('[data-testid="onboarding-missions"]')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* Onboarding Missions Section */}
        <div data-testid="onboarding-missions">
          <MissionCard
            missions={orderlyMissions}
            title="Panduan Onboarding Platform"
            description="Ikuti langkah-langkah ini untuk memulai menggunakan platform"
            className="mb-6"
          />
        </div>

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
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email || user.username || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <DailyInstantUpdate />
          </div>
        </div>
      </div>
      {/* Filter Indicator - Only show when viewing another user's data */}
      {selectedUserId !== "all" && selectedUserId !== userId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <User className="h-4 w-4" />
            <span>
              Menampilkan objective, task, dan aktivitas untuk: {" "}
              <span className="font-medium">
                {users?.find((u: any) => u.id === selectedUserId)?.firstName && 
                 users?.find((u: any) => u.id === selectedUserId)?.lastName
                  ? `${users.find((u: any) => u.id === selectedUserId)?.firstName} ${users.find((u: any) => u.id === selectedUserId)?.lastName}`
                  : users?.find((u: any) => u.id === selectedUserId)?.email || "Unknown"}
              </span>
            </span>
          </div>
        </div>
      )}
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Hari Ini</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              {todayTasks.filter((t) => t.status === "completed").length >
                0 && (
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  +
                  {todayTasks.filter((t) => t.status === "completed").length *
                    10}{" "}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Angka Target Aktif
            </CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeyResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Belum mencapai target
            </p>
          </CardContent>
        </Card>

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
      </div>
      {/* Compact Progress & Motivation */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-3 md:p-4">
          {/* Mobile: 3-column layout */}
          <div className="block md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Progress Hari Ini</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Task Selesai */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-green-700">
                  {todayTasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-xs text-green-600">Task Selesai</div>
                {todayTasks.filter(t => t.status === 'completed').length > 0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1">
                    +{todayTasks.filter(t => t.status === 'completed').length * 10} poin
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
                <div className="text-xs text-blue-600">Target Aktif</div>
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
                  <span className="font-medium text-blue-900">Progress Hari Ini</span>
                </div>
                
                <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">{todayTasks.filter(t => t.status === 'completed').length} task selesai</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-700">{activeKeyResults.length} target aktif</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {(stats as any)?.currentStreak && (stats as any).currentStreak > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full cursor-help">
                        <span>🔥</span>
                        <span>{(stats as any).currentStreak} hari berturut</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Jumlah hari berturut-turut Anda menyelesaikan setidaknya satu task</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {todayTasks.filter(t => t.status === 'completed').length > 0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    +{todayTasks.filter(t => t.status === 'completed').length * 10} poin hari ini
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Objective Awareness Section */}
      {relatedObjectives.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objective Terkait Aktivitas Hari Ini
            </CardTitle>
            <CardDescription className="text-blue-700">
              Tetap ingat tujuan utama yang mendorong aktivitas harian Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    className="p-4 bg-white border border-blue-200 rounded-lg flex-shrink-0 w-80"
                  >
                    <div className="space-y-3">
                      <div>
                        <Link href={`/objectives/${obj.id}`} className="font-medium text-blue-900 hover:text-blue-600 hover:underline cursor-pointer">
                          <h3 className="line-clamp-2">
                            {obj.title}
                          </h3>
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
                        Target Ideal: {obj.targetIdeal || "70"}% pada periode ini
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
                  Geser ke kanan untuk melihat objective lainnya
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Task Prioritas</TabsTrigger>
          <TabsTrigger value="progress">Update Progress</TabsTrigger>
          <TabsTrigger value="initiatives">Kelola Inisiatif</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Prioritas Hari Ini</CardTitle>
                  <CardDescription>
                    Fokus pada task yang perlu diselesaikan hari ini
                  </CardDescription>
                </div>
                <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      onClick={handleOpenTaskModal}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Buat Task Baru</DialogTitle>
                      <DialogDescription>
                        Tambahkan task baru untuk aktivitas harian
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTaskSubmit} className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={taskFormData.title}
                            onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                            placeholder="Masukkan title task"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Deskripsi</Label>
                          <Textarea
                            id="description"
                            value={taskFormData.description}
                            onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                            placeholder="Masukkan deskripsi task (opsional)"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="initiativeId">Inisiatif (Opsional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {taskFormData.initiativeId && taskFormData.initiativeId !== "none" 
                                  ? initiatives?.find((initiative: any) => initiative.id === taskFormData.initiativeId)?.title 
                                  : "Pilih inisiatif (opsional)"
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Cari inisiatif..." />
                                <CommandList>
                                  <CommandEmpty>Tidak ada inisiatif ditemukan</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        setTaskFormData({ ...taskFormData, initiativeId: "none" });
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          taskFormData.initiativeId === "none" ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      Tidak terkait inisiatif
                                    </CommandItem>
                                    {initiatives?.map((initiative: any) => (
                                      <CommandItem
                                        key={initiative.id}
                                        value={initiative.title}
                                        onSelect={() => {
                                          setTaskFormData({ ...taskFormData, initiativeId: initiative.id });
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            taskFormData.initiativeId === initiative.id ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {initiative.title}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="priority">Prioritas</Label>
                            <Select 
                              value={taskFormData.priority} 
                              onValueChange={(value) => setTaskFormData({ ...taskFormData, priority: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih prioritas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Rendah</SelectItem>
                                <SelectItem value="medium">Sedang</SelectItem>
                                <SelectItem value="high">Tinggi</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="assignedTo">PIC</Label>
                            <Select 
                              value={taskFormData.assignedTo} 
                              onValueChange={(value) => setTaskFormData({ ...taskFormData, assignedTo: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih PIC" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Belum ditentukan</SelectItem>
                                {users?.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="dueDate">Tenggat Waktu</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !taskFormData.dueDate && "text-muted-foreground"
                                )}
                              >
                                {taskFormData.dueDate ? (
                                  format(taskFormData.dueDate, "dd/MM/yyyy", { locale: id })
                                ) : (
                                  <span>Pilih tanggal tenggat</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <DateCalendar
                                mode="single"
                                selected={taskFormData.dueDate}
                                onSelect={(date) => {
                                  if (date) {
                                    // Adjust for GMT+7 timezone to prevent date shifting
                                    const adjustedDate = new Date(date);
                                    adjustedDate.setHours(adjustedDate.getHours() + 7);
                                    setTaskFormData({ ...taskFormData, dueDate: adjustedDate });
                                  } else {
                                    setTaskFormData({ ...taskFormData, dueDate: date });
                                  }
                                }}
                                disabled={(date) => {
                                  // Use GMT+7 timezone for date comparison
                                  const now = new Date();
                                  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                                  const todayGMT7 = new Date(utc + (7 * 3600000)); // GMT+7
                                  todayGMT7.setHours(0, 0, 0, 0); // Start of today in GMT+7
                                  return date < todayGMT7 || date < new Date("1900-01-01");
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                          Batal
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTaskMutation.isPending}
                          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                        >
                          {createTaskMutation.isPending ? "Membuat..." : "Buat Task"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Check if we have any tasks to show */}
              {overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0 ? (
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
                            <td colSpan={6} className="px-4 py-3 bg-red-50 border-b-2 border-red-200">
                              <div className="flex items-center gap-2 font-semibold text-red-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Task Terlambat ({overdueTasks.length})</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {overdueTasks.map((task: any) => (
                          <tr key={task.id} className="hover:bg-gray-50 bg-red-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <div>
                                  <Link href={`/tasks/${task.id}`} className="font-medium text-red-900 hover:text-red-600 hover:underline cursor-pointer">
                                    {task.title}
                                  </Link>

                                  {task.initiative && (
                                    <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={getTaskPriorityColor(task.priority || "medium")}>
                                {getTaskPriorityLabel(task.priority || "medium")}
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
                                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'not_started' && <Check className="h-3 w-3" />}
                                      <span>Belum Mulai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                                      <span>Sedang Berjalan</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'completed' && <Check className="h-3 w-3" />}
                                      <span>Selesai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'cancelled' && <Check className="h-3 w-3" />}
                                      <span>Dibatalkan</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-red-600 font-medium">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString("id-ID")
                                  : "Tidak ada"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {task.assignedTo ? getUserName(task.assignedTo) : "Belum ditentukan"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/tasks/${task.id}`} className="cursor-pointer flex items-center">
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
                            <td colSpan={6} className="px-4 py-3 bg-blue-50 border-b-2 border-blue-200">
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
                                  <Link href={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer">
                                    {task.title}
                                  </Link>

                                  {task.initiative && (
                                    <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={getTaskPriorityColor(task.priority || "medium")}>
                                {getTaskPriorityLabel(task.priority || "medium")}
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
                                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'not_started' && <Check className="h-3 w-3" />}
                                      <span>Belum Mulai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                                      <span>Sedang Berjalan</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'completed' && <Check className="h-3 w-3" />}
                                      <span>Selesai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'cancelled' && <Check className="h-3 w-3" />}
                                      <span>Dibatalkan</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString("id-ID")
                                  : "Tidak ada tenggat"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {task.assignedTo ? getUserName(task.assignedTo) : "Belum ditentukan"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/tasks/${task.id}`} className="cursor-pointer flex items-center">
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
                            <td colSpan={6} className="px-4 py-3 bg-green-50 border-b-2 border-green-200">
                              <div className="flex items-center gap-2 font-semibold text-green-800">
                                <Clock className="h-4 w-4" />
                                <span>Task Besok ({tomorrowTasks.length})</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {tomorrowTasks.map((task: any) => (
                          <tr key={task.id} className="hover:bg-gray-50 bg-green-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-600" />
                                <div>
                                  <Link href={`/tasks/${task.id}`} className="font-medium text-green-900 hover:text-green-600 hover:underline cursor-pointer">
                                    {task.title}
                                  </Link>

                                  {task.initiative && (
                                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-1 inline-block">
                                      Inisiatif: {task.initiative.title}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={getTaskPriorityColor(task.priority || "medium")}>
                                {getTaskPriorityLabel(task.priority || "medium")}
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
                                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'not_started' && <Check className="h-3 w-3" />}
                                      <span>Belum Mulai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                                      <span>Sedang Berjalan</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'completed' && <Check className="h-3 w-3" />}
                                      <span>Selesai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'cancelled' && <Check className="h-3 w-3" />}
                                      <span>Dibatalkan</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-green-600 font-medium">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString("id-ID")
                                  : "Tidak ada"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {task.assignedTo ? getUserName(task.assignedTo) : "Belum ditugaskan"}
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
                                    <Link href={`/tasks/${task.id}`} className="cursor-pointer flex items-center">
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
                                <Link href={`/tasks/${task.id}`} className="font-medium text-red-900 hover:text-red-600 hover:underline cursor-pointer">
                                  {task.title}
                                </Link>
                                {task.initiative && (
                                  <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded mt-1 inline-block">
                                    Inisiatif: {task.initiative.title}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getTaskPriorityColor(task.priority || "medium")}>
                                    {getTaskPriorityLabel(task.priority || "medium")}
                                  </Badge>
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
                                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'not_started' && <Check className="h-3 w-3" />}
                                      <span>Belum Mulai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                                      <span>Sedang Berjalan</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'completed' && <Check className="h-3 w-3" />}
                                      <span>Selesai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'cancelled' && <Check className="h-3 w-3" />}
                                      <span>Dibatalkan</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="text-sm text-red-600">
                              Tenggat: {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString("id-ID")
                                : "Tidak ada"}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {task.assignedTo ? getUserName(task.assignedTo) : "Belum ditentukan"}
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
                                    <Link href={`/tasks/${task.id}`} className="cursor-pointer flex items-center">
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
                                <Link href={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer">
                                  {task.title}
                                </Link>
                                {task.initiative && (
                                  <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                                    Inisiatif: {task.initiative.title}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getTaskPriorityColor(task.priority || "medium")}>
                                    {getTaskPriorityLabel(task.priority || "medium")}
                                  </Badge>
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
                                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'not_started' && <Check className="h-3 w-3" />}
                                      <span>Belum Mulai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                                      <span>Sedang Berjalan</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'completed' && <Check className="h-3 w-3" />}
                                      <span>Selesai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'cancelled' && <Check className="h-3 w-3" />}
                                      <span>Dibatalkan</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="text-sm text-gray-600">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString("id-ID")
                                : "Tidak ada tenggat"}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {task.assignedTo ? (
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {task.assignedTo ? getUserName(task.assignedTo) : "Belum ditentukan"}
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
                                    <Link href={`/tasks/${task.id}`} className="cursor-pointer flex items-center">
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
                                <Link href={`/tasks/${task.id}`} className="font-medium text-green-900 hover:text-green-600 hover:underline cursor-pointer">
                                  {task.title}
                                </Link>
                                {task.initiative && (
                                  <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-1 inline-block">
                                    Inisiatif: {task.initiative.title}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getTaskPriorityColor(task.priority || "medium")}>
                                    {getTaskPriorityLabel(task.priority || "medium")}
                                  </Badge>
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
                                    onClick={() => handleStatusUpdate(task.id, 'not_started')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'not_started' && <Check className="h-3 w-3" />}
                                      <span>Belum Mulai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                                      <span>Sedang Berjalan</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'completed' && <Check className="h-3 w-3" />}
                                      <span>Selesai</span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {task.status === 'cancelled' && <Check className="h-3 w-3" />}
                                      <span>Dibatalkan</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="text-xs text-green-600 mt-2">
                              <span className="font-medium">Tenggat:</span>{" "}
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString("id-ID")
                                : "Tidak ada"}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <span className="font-medium">PIC:</span>
                              <div className="flex items-center gap-1">
                                {task.assignedTo ? (
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                      {getUserInitials(task.assignedTo)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-3 h-3" />
                                )}
                                <span>{task.assignedTo ? getUserName(task.assignedTo) : "Belum ditugaskan"}</span>
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
                                    <Link href={`/tasks/${task.id}`} className="cursor-pointer flex items-center">
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
                Lakukan check-in pada angka target yang aktif
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeKeyResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Semua angka target sudah tercapai</p>
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
                            <Link href={`/key-results/${kr.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left">
                              <h3>
                                {kr.title}
                              </h3>
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
                              timeProgressPercentage={kr.timeProgressPercentage || 0}
                              dueDate={null}
                              startDate="2025-07-01"
                              compact={true}
                            />
                          </div>
                          <div className="hidden sm:block">
                            <SimpleProgressStatus
                              status={kr.status}
                              progressPercentage={progress}
                              timeProgressPercentage={kr.timeProgressPercentage || 0}
                              dueDate={null}
                              startDate="2025-07-01"
                              compact={false}
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
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(kr.assignedTo)}`} />
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
              <CardTitle className="flex items-center gap-2">
                Kelola Inisiatif Aktif
                {selectedUserId !== "all" && (
                  <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {getUserName(selectedUserId)}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Update metrics dan kelola inisiatif aktif{selectedUserId === "all" ? " semua anggota tim" : " yang ditanggung jawabi"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeInitiatives.length === 0 ? (
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
                              'draft': {
                                label: 'Draft',
                                bgColor: 'bg-gray-100',
                                textColor: 'text-gray-800',
                              },
                              'sedang_berjalan': {
                                label: 'Sedang Berjalan',
                                bgColor: 'bg-blue-100',
                                textColor: 'text-blue-800',
                              },
                              'selesai': {
                                label: 'Selesai',
                                bgColor: 'bg-green-100',
                                textColor: 'text-green-800',
                              },
                              'dibatalkan': {
                                label: 'Dibatalkan',
                                bgColor: 'bg-red-100',
                                textColor: 'text-red-800',
                              },
                            };
                            return statusMap[status as keyof typeof statusMap] || statusMap.draft;
                          };

                          const statusInfo = getStatusInfo(status);

                          return (
                            <tr
                              key={initiative.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-4">
                                <div>
                                  <Link href={`/initiatives/${initiative.id}`}>
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
                                        {keyResults.find((kr: any) => kr.id === initiative.keyResultId)?.title || 'Unknown'}
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
                                  <Badge className={`${priorityColor} text-xs px-2 py-0.5`}>
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
                                          const progress = initiative.progressPercentage || 0;
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
                                  <span className="text-sm font-medium text-gray-900 min-w-0">
                                    {initiative.progressPercentage || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm">
                                  {initiative.startDate && (
                                    <div className="text-gray-500">
                                      Mulai: {new Date(initiative.startDate).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </div>
                                  )}
                                  {initiative.dueDate ? (
                                    <div
                                      className={`text-sm ${
                                        new Date(initiative.dueDate) < new Date()
                                          ? "text-red-600 font-medium"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      Selesai: {new Date(initiative.dueDate).toLocaleDateString("id-ID", {
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
                                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                        {getUserName(initiative.picId)
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase() || "?"}
                                      </div>
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
                                <Button
                                  onClick={() => handleUpdateMetrics(initiative)}
                                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 py-1 rounded-md text-sm font-medium"
                                >
                                  Update
                                </Button>
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
                            'draft': {
                              label: 'Draft',
                              bgColor: 'bg-gray-100',
                              textColor: 'text-gray-800',
                            },
                            'sedang_berjalan': {
                              label: 'Sedang Berjalan',
                              bgColor: 'bg-blue-100',
                              textColor: 'text-blue-800',
                            },
                            'selesai': {
                              label: 'Selesai',
                              bgColor: 'bg-green-100',
                              textColor: 'text-green-800',
                            },
                            'dibatalkan': {
                              label: 'Dibatalkan',
                              bgColor: 'bg-red-100',
                              textColor: 'text-red-800',
                            },
                          };
                          return statusMap[status as keyof typeof statusMap] || statusMap.draft;
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
                                    {keyResults.find((kr: any) => kr.id === initiative.keyResultId)?.title || 'Unknown'}
                                  </span>
                                </div>
                              )}
                              
                              {initiative.budget && (
                                <div className="text-sm text-gray-500">
                                  Budget: Rp{" "}
                                  {parseFloat(initiative.budget).toLocaleString("id-ID")}
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
                              <Badge className={`${priorityColor} text-xs px-2 py-1`}>
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
                                    const progress = initiative.progressPercentage || 0;
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
                                <span className={initiative.dueDate && new Date(initiative.dueDate) < new Date() ? "text-red-600 font-medium" : "text-gray-900"}>
                                  {initiative.dueDate ? new Date(initiative.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">PIC:</span>
                                <div className="flex items-center gap-2">
                                  {initiative.picId ? (
                                    <>
                                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                        {getUserName(initiative.picId)
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase() || "?"}
                                      </div>
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
                              <Button
                                onClick={() => handleUpdateMetrics(initiative)}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium flex-1 mr-2"
                              >
                                Update Metrics
                              </Button>
                              <Link href={`/initiatives/${initiative.id}`}>
                                <Button variant="outline" size="sm" title="Lihat Detail">
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
      {/* Edit Task Modal */}
      <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Judul Task *
              </label>
              <Input
                value={taskFormData.title}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, title: e.target.value })
                }
                placeholder="Masukkan judul task"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <Textarea
                value={taskFormData.description}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Masukkan deskripsi task"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Prioritas
              </label>
              <Select
                value={taskFormData.priority}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, priority: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="critical">Kritis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PIC</label>
              <Select
                value={taskFormData.assignedTo || "unassigned"}
                onValueChange={(value) =>
                  setTaskFormData({ ...taskFormData, assignedTo: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Belum ditentukan</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Tenggat Waktu
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskFormData.dueDate
                      ? taskFormData.dueDate.toLocaleDateString("id-ID")
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateCalendar
                    mode="single"
                    selected={taskFormData.dueDate}
                    onSelect={(date) => {
                      if (date) {
                        // Adjust for GMT+7 timezone to prevent date shifting
                        const adjustedDate = new Date(date);
                        adjustedDate.setHours(adjustedDate.getHours() + 7);
                        setTaskFormData({ ...taskFormData, dueDate: adjustedDate });
                      } else {
                        setTaskFormData({ ...taskFormData, dueDate: date });
                      }
                    }}
                    disabled={(date) => {
                      // Use GMT+7 timezone for date comparison
                      const now = new Date();
                      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                      const gmt7Date = new Date(utc + (7 * 3600000));
                      const today = new Date(gmt7Date.getFullYear(), gmt7Date.getMonth(), gmt7Date.getDate());
                      
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTaskModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleEditTaskSubmit}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
              disabled={editTaskMutation.isPending}
            >
              {editTaskMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
