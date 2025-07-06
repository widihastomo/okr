import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import SuccessMetricsModalSimple from "@/components/success-metrics-modal-simple";
import OneClickHabitButton from "@/components/one-click-habit-button";
import { SimpleProgressStatus } from "@/components/progress-status";
import { UserStatsCard } from "@/components/gamification/user-stats-card";
import { DailyAchievements } from "@/components/daily-achievements";
import { DailyInstantUpdate } from "@/components/daily-instant-update";
import { useAuth } from "@/hooks/useAuth";

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

  const { data: stats } = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
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

  // Get today's date info
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

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

  // Filter data for today's focus
  const todayTasks = filteredTasks.filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split("T")[0] : null;
    // Include tasks due today, in progress tasks, or overdue incomplete tasks
    return (
      dueDate === todayStr ||
      task.status === "in_progress" ||
      (dueDate &&
        dueDate < todayStr &&
        task.status !== "completed" &&
        task.status !== "cancelled")
    );
  });

  const overdueTasks = filteredTasks.filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split("T")[0] : null;
    return (
      dueDate &&
      dueDate < todayStr &&
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

  const activeInitiatives = (initiatives as any[]).filter(
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

    return (objectives as any[]).filter(
      (obj: any) =>
        relatedObjIds.has(obj.id) ||
        obj.status === "on_track" ||
        obj.status === "at_risk",
    );
  };

  const relatedObjectives = getRelatedObjectives();

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daily Focus</h1>
            <p className="text-sm md:text-base text-gray-600">Kelola aktivitas harian Anda hari ini</p>
          </div>
          
          {/* Date display - show on mobile */}
          <div className="flex items-center gap-2 text-sm text-gray-500 sm:hidden">
            <Calendar className="h-4 w-4" />
            {today.toLocaleDateString("id-ID", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <DailyInstantUpdate />
            <OneClickHabitButton />
          </div>
          
          {/* Date display - show on desktop */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 sm:ml-auto">
            <Calendar className="h-4 w-4" />
            {today.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Filter Indicator - Only show when viewing another user's data */}
      {selectedUserId !== "all" && selectedUserId !== userId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <User className="h-4 w-4" />
            <span>
              Menampilkan prioritas harian untuk: {" "}
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
                  <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    <span>🔥</span>
                    <span>{(stats as any).currentStreak} hari berturut</span>
                  </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {relatedObjectives.slice(0, 4).map((obj: any) => {
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
                    className="p-4 bg-white border border-blue-200 rounded-lg"
                  >
                    <div className="space-y-3">
                      <div>
                        <Link href={`/objectives/${obj.id}`} className="font-medium text-blue-900 hover:text-blue-600 hover:underline cursor-pointer">
                          <h3 className="line-clamp-2">
                            {obj.title}
                          </h3>
                        </Link>
                        {obj.description && (
                          <p className="text-sm text-blue-700 mt-1 line-clamp-2">
                            {obj.description}
                          </p>
                        )}
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
                                  : "border-blue-300 text-blue-700 bg-blue-50"
                          }
                        >
                          {obj.status === "on_track"
                            ? "On Track"
                            : obj.status === "at_risk"
                              ? "At Risk"
                              : obj.status === "behind"
                                ? "Behind"
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

            {relatedObjectives.length > 4 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-blue-600">
                  +{relatedObjectives.length - 4} objective lainnya terkait
                  aktivitas Anda
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
              <CardTitle>Task Prioritas Hari Ini</CardTitle>
              <CardDescription>
                Fokus pada task yang perlu diselesaikan hari ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Task Terlambat
                  </h3>
                  {overdueTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg md:flex-row md:items-center md:justify-between md:gap-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{task.title}</p>
                        <p className="text-sm text-red-600">
                          Tenggat:{" "}
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString("id-ID")
                            : "Tidak ada"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTaskStatusColor(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Today's Tasks */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Task Hari Ini
                </h3>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada task untuk hari ini</p>
                  </div>
                ) : (
                  todayTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg md:flex-row md:items-center md:justify-between md:gap-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString("id-ID")
                            : "Tidak ada tenggat"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTaskStatusColor(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
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
              <CardTitle>Kelola Inisiatif Aktif</CardTitle>
              <CardDescription>
                Update metrics dan kelola inisiatif yang sedang berjalan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeInitiatives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada inisiatif aktif</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                                        {initiative.keyResultTitle || 'Unknown'}
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
                              <td className="px-4 py-4 text-right">
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
                                    <DropdownMenuItem asChild>
                                      <Link href={`/initiatives/${initiative.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Lihat Detail
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateMetrics(initiative)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Update Metrics
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
        <SuccessMetricsModalSimple
          open={isSuccessMetricsModalOpen}
          onOpenChange={setIsSuccessMetricsModalOpen}
          initiativeId={selectedInitiative.id}
        />
      )}
    </div>
  );
}
