import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Eye, Edit, Trash2, Target, CheckCircle, Clock, Calendar, Lightbulb, TrendingUp, BarChart3, User, ChevronDown, Check, MoreVertical } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatNumberWithSeparator } from "@/lib/number-utils";
import { calculateKeyResultStatus } from "@shared/status-helper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: number;
}

interface KeyResult {
  id: number;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  keyResultType: string;
  status: string;
  assignedTo?: number;
}

interface Initiative {
  id: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  endDate: string;
  assignedToUser?: number;
  ownerId?: number;
}

interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface DailyFocusCardsProps {
  // Task props
  overdueTasks: Task[];
  todayTasks: Task[];
  tomorrowTasks: Task[];
  isLoadingAllTasks: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenTaskModal: () => void;
  onToggleTaskStatus: (taskId: number, newStatus: string) => void;
  
  // Key Results props
  activeKeyResults: KeyResult[];
  isLoadingObjectives: boolean;
  onOpenCheckInModal: (keyResult: KeyResult) => void;
  
  // Initiative props
  activeInitiatives: Initiative[];
  isLoadingInitiatives: boolean;
  onUpdateMetrics: (initiative: Initiative) => void;
  
  // Cycle data for timeline calculation
  cycles: Cycle[];
  
  // Users data
  users: User[];
  
  // Common
  userFilter: string;
  formatDate: (date: Date) => string;
}

export function DailyFocusCards({
  overdueTasks,
  todayTasks,
  tomorrowTasks,
  isLoadingAllTasks,
  onEditTask,
  onDeleteTask,
  onOpenTaskModal,
  onToggleTaskStatus,
  activeKeyResults,
  isLoadingObjectives,
  onOpenCheckInModal,
  activeInitiatives,
  isLoadingInitiatives,
  onUpdateMetrics,
  cycles,
  users,
  userFilter,
  formatDate
}: DailyFocusCardsProps) {

  // Helper function to get user name
  const getUserName = (userId: string | null | undefined): string => {
    if (!userId || !users) return "Pengguna";
    const user = users.find((u: any) => u.id === userId);
    
    // Use consolidated name field
    if (user?.name && user.name.trim() !== "") {
      return user.name.trim();
    }
    
    // Fallback to email username
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return "Pengguna";
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (userId: string | null | undefined): string => {
    if (!userId || !users) return "?";
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

  // Helper function to get key result title by ID
  const getKeyResultTitle = (keyResultId: string | null | undefined): string => {
    if (!keyResultId || !activeKeyResults) return "Key Result tidak ditemukan";
    const keyResult = activeKeyResults.find((kr: any) => kr.id === keyResultId);
    return keyResult?.title || "Key Result tidak ditemukan";
  };

  // Format value with thousand separator and rupiah formatting
  const formatValue = (value: number, unit: string) => {
    if (!value && value !== 0) return "0";
    
    // Check if unit is rupiah/currency
    const isRupiah = unit?.toLowerCase() === "rp" || unit?.toLowerCase() === "rupiah" || unit?.toLowerCase() === "idr";
    
    if (isRupiah) {
      // Format as currency with Rp prefix
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      // Format with thousand separator
      return formatNumberWithSeparator(value.toString());
    }
  };

  // Calculate ideal progress based on timeline (same as objective detail page)
  const calculateIdealProgress = (keyResult: KeyResult) => {
    // Find the cycle for this key result's objective
    if (!cycles || cycles.length === 0) return 70; // Fallback to 70% if no cycle data
    const cycle = cycles[0]; // Get the first active cycle
    if (!cycle) return 70; // Fallback to 70% if no cycle data
    
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate);
    const now = new Date();

    const totalDuration = cycleEnd.getTime() - cycleStart.getTime();
    const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
    const idealProgress = Math.min(100, Math.max(0, (timePassed / totalDuration) * 100));
    
    return Math.round(idealProgress);
  };

  const renderTaskPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return (
      <Badge className={`text-xs ${colors[priority as keyof typeof colors] || colors.medium}`}>
        {priority === 'high' ? 'Tinggi' : priority === 'medium' ? 'Sedang' : 'Rendah'}
      </Badge>
    );
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Helper functions for task status
  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "not_started":
        return "Belum Mulai";
      case "in_progress":
        return "Sedang Berjalan";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Tidak Diketahui";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Task status update mutation
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Status task berhasil diperbarui",
        description: "Status task berhasil diperbarui",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui status",
        description: error.message || "Terjadi kesalahan saat memperbarui status task",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  const renderTaskStatusDropdown = (task: Task) => (
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
          onClick={() => handleStatusUpdate(task.id.toString(), "not_started")}
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
          onClick={() => handleStatusUpdate(task.id.toString(), "in_progress")}
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
          onClick={() => handleStatusUpdate(task.id.toString(), "completed")}
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
          onClick={() => handleStatusUpdate(task.id.toString(), "cancelled")}
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
  );

  return (
    <>
      {/* Task Prioritas and Update Progress Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Task Prioritas Card */}
        <div className="flex-1">
          <Card data-tour="task-prioritas">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">
                    Task Prioritas ({overdueTasks.length + todayTasks.length + tomorrowTasks.length})
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Fokus pada task yang perlu diselesaikan hari ini
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto flex-shrink-0"
                  onClick={onOpenTaskModal}
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
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overdue Tasks */}
                  {overdueTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Terlambat ({overdueTasks.length})
                      </h4>
                      {overdueTasks.map((task) => (
                        <div key={task.id} className="p-2 bg-red-50 border border-red-200 rounded-lg mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <div className="flex items-center gap-2 mb-1">
                                {renderTaskPriorityBadge(task.priority)}
                                <span className="text-xs text-red-600">
                                  Due: {formatDate(new Date(task.dueDate))}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {renderTaskStatusDropdown(task)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => onEditTask(task)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Today Tasks */}
                  {todayTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Hari Ini ({todayTasks.length})
                      </h4>
                      {todayTasks.map((task) => (
                        <div key={task.id} className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <div className="flex items-center gap-2 mb-1">
                                {renderTaskPriorityBadge(task.priority)}
                                <span className="text-xs text-blue-600">
                                  Due: {formatDate(new Date(task.dueDate))}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {renderTaskStatusDropdown(task)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => onEditTask(task)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tomorrow Tasks */}
                  {tomorrowTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Besok ({tomorrowTasks.length})
                      </h4>
                      {tomorrowTasks.map((task) => (
                        <div key={task.id} className="p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <div className="flex items-center gap-2 mb-1">
                                {renderTaskPriorityBadge(task.priority)}
                                <span className="text-xs text-green-600">
                                  Due: {formatDate(new Date(task.dueDate))}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {renderTaskStatusDropdown(task)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => onEditTask(task)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Tasks */}
                  {overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm mb-2">Tidak ada task prioritas</p>
                      <p className="text-xs text-gray-400">
                        Task baru akan muncul di sini berdasarkan prioritas dan tanggal
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Progress Card */}
        <div className="flex-1">
          <Card data-tour="update-progress-tab">
            <CardHeader>
              <CardTitle>Update Progress Angka Target ({activeKeyResults.length})</CardTitle>
              <CardDescription>
                Lakukan check-in pada angka target (termasuk yang sudah 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingObjectives ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : activeKeyResults.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {activeKeyResults
                      .filter((kr) => {
                        if (!userFilter || userFilter === 'all') return true;
                        return kr.assignedTo?.toString() === userFilter;
                      })
                      .map((keyResult) => {
                        const progress = keyResult.keyResultType === 'achieve_or_not' 
                          ? (keyResult.currentValue >= keyResult.targetValue ? 100 : 0)
                          : keyResult.keyResultType === 'decrease_to'
                          ? Math.max(0, Math.min(100, ((keyResult.currentValue - keyResult.targetValue) / (keyResult.currentValue - keyResult.targetValue)) * 100))
                          : Math.max(0, Math.min(100, (keyResult.currentValue / keyResult.targetValue) * 100));
                        
                        // Calculate dynamic status based on progress vs timeline
                        const currentCycle = cycles && cycles.length > 0 ? cycles[0] : null;
                        const dynamicStatus = currentCycle 
                          ? calculateKeyResultStatus(
                              progress,
                              new Date(currentCycle.startDate),
                              new Date(currentCycle.endDate)
                            )
                          : { status: keyResult.status || 'on_track', statusText: 'On Track' };

                        return (
                          <div
                            key={keyResult.id}
                            className="p-2 md:p-3 bg-white border border-gray-200 rounded-lg space-y-2 md:space-y-3"
                          >
                            {/* Mobile: Vertical Stack Layout, Desktop: Horizontal */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
                              <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                                {/* Title and Badge Row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link href={`/key-results/${keyResult.id}`}>
                                    <h3 className="text-xs md:text-sm font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors">
                                      {keyResult.title}
                                    </h3>
                                  </Link>
                                  <Badge
                                    className={`text-xs shrink-0 ${
                                      dynamicStatus.status === 'on_track'
                                        ? 'bg-green-100 text-green-700'
                                        : dynamicStatus.status === 'at_risk'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {dynamicStatus.statusText}
                                  </Badge>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full space-y-1">
                                  <div className="relative">
                                    <Progress value={Math.min(Math.max(progress, 0), 100)} className="h-2 md:h-3" />
                                    {/* Ideal target marker based on timeline */}
                                    {(() => {
                                      const idealProgress = currentCycle ? (() => {
                                        const cycleStart = new Date(currentCycle.startDate);
                                        const cycleEnd = new Date(currentCycle.endDate);
                                        const now = new Date();
                                        const totalDuration = cycleEnd.getTime() - cycleStart.getTime();
                                        const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
                                        return Math.round(Math.min(100, Math.max(0, (timePassed / totalDuration) * 100)));
                                      })() : 70; // Fallback to 70% if no cycle data
                                      return (
                                        <>
                                          <div 
                                            className="absolute top-0 h-2 md:h-3 w-0.5 bg-orange-500 rounded-full" 
                                            style={{ left: `${idealProgress}%` }}
                                            title={`Target Ideal: ${idealProgress}%`}
                                          />
                                          <div 
                                            className="absolute -top-0.5 md:-top-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full border border-white" 
                                            style={{ left: `calc(${idealProgress}% - 3px)` }}
                                            title={`Target Ideal: ${idealProgress}%`}
                                          />
                                        </>
                                      );
                                    })()}
                                  </div>
                                  
                                  {/* Progress Info - Mobile: 2 rows, Desktop: 1 row */}
                                  <div className="flex flex-col md:flex-row md:justify-between text-xs text-gray-500 gap-1 md:gap-0">
                                    <div className="flex justify-between md:justify-start md:gap-4">
                                      <span>{Math.round(progress)}%</span>
                                      <span className="text-orange-600 font-medium">Target: {currentCycle ? (() => {
                                        const cycleStart = new Date(currentCycle.startDate);
                                        const cycleEnd = new Date(currentCycle.endDate);
                                        const now = new Date();
                                        const totalDuration = cycleEnd.getTime() - cycleStart.getTime();
                                        const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
                                        return Math.round(Math.min(100, Math.max(0, (timePassed / totalDuration) * 100)));
                                      })() : 70}%</span>
                                    </div>
                                    <span className="text-center md:text-right">
                                      {(() => {
                                        const isRupiah = keyResult.unit?.toLowerCase() === "rp" || keyResult.unit?.toLowerCase() === "rupiah" || keyResult.unit?.toLowerCase() === "idr";
                                        const currentFormatted = formatValue(keyResult.currentValue, keyResult.unit);
                                        const targetFormatted = formatValue(keyResult.targetValue, keyResult.unit);
                                        return isRupiah ? `${currentFormatted} / ${targetFormatted}` : `${currentFormatted} / ${targetFormatted} ${keyResult.unit}`;
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Check-in Button - Mobile: Full width at bottom, Desktop: Right side */}
                              <div className="flex items-center gap-1 shrink-0 w-full md:w-auto">
                                <Button
                                  onClick={() => onOpenCheckInModal(keyResult)}
                                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium flex items-center justify-center gap-1 md:gap-2 w-full md:w-auto"
                                >
                                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                                  <span className="md:inline">Check-in</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm mb-2">Belum ada angka target aktif</p>
                  <p className="text-xs text-gray-400">
                    Angka target akan muncul saat Anda membuat goals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kelola Inisiatif Card */}
      <Card data-tour="kelola-inisiatif-tab">
        <CardHeader>
          <CardTitle>Kelola Inisiatif ({activeInitiatives.length})</CardTitle>
          <CardDescription>
            Monitor dan perbarui progress inisiatif yang sedang berjalan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingInitiatives ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : activeInitiatives.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b">
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inisiatif
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioritas
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tenggat
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PIC
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-gray-200">
                    {activeInitiatives
                      .filter((initiative) => {
                        if (!userFilter || userFilter === 'all') return true;
                        return (
                          initiative.picId?.toString() === userFilter ||
                          initiative.createdBy?.toString() === userFilter
                        );
                      })
                      .sort((a, b) => {
                        const scoreA = parseFloat(a.priorityScore || "0");
                        const scoreB = parseFloat(b.priorityScore || "0");
                        return scoreB - scoreA; // Sort by priority score descending
                      })
                      .map((initiative) => {
                        const rawScore = initiative.priorityScore;
                        const score = parseFloat(rawScore || "0");
                        
                        let color: string;
                        let label: string;
                        
                        if (score >= 4.0) {
                          color = "bg-red-100 text-red-800";
                          label = "Kritis";
                        } else if (score >= 3.0) {
                          color = "bg-orange-100 text-orange-800";
                          label = "Tinggi";
                        } else if (score >= 2.0) {
                          color = "bg-yellow-100 text-yellow-800";
                          label = "Sedang";
                        } else {
                          color = "bg-green-100 text-green-800";
                          label = "Rendah";
                        }

                        return (
                          <TableRow
                            key={initiative.id}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="px-4 py-4">
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
                                      {getKeyResultTitle(initiative.keyResultId)}
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
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              {(() => {
                                const status = initiative.status || "draft";
                                const getStatusInfo = (status: string) => {
                                  const statusMap = {
                                    'draft': {
                                      label: 'Draft',
                                      bgColor: 'bg-yellow-100',
                                      textColor: 'text-yellow-800',
                                    },
                                    'not_started': {
                                      label: 'Belum Mulai',
                                      bgColor: 'bg-gray-100',
                                      textColor: 'text-gray-800',
                                    },
                                    'in_progress': {
                                      label: 'Berlangsung',
                                      bgColor: 'bg-blue-100',
                                      textColor: 'text-blue-800',
                                    },
                                    'completed': {
                                      label: 'Selesai',
                                      bgColor: 'bg-green-100',
                                      textColor: 'text-green-800',
                                    },
                                    'cancelled': {
                                      label: 'Dibatalkan',
                                      bgColor: 'bg-red-100',
                                      textColor: 'text-red-800',
                                    }
                                  };
                                  return statusMap[status] || statusMap['draft'];
                                };

                                const statusInfo = getStatusInfo(status);
                                return (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                    {statusInfo.label}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                                {label} ({score.toFixed(1)})
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="w-full">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-600">{Math.round(initiative.progressPercentage || 0)}%</span>
                                </div>
                                <Progress 
                                  value={initiative.progressPercentage || 0} 
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="text-sm">
                                <div 
                                  className={
                                    new Date(initiative.dueDate) < new Date()
                                      ? "text-red-600 font-medium"
                                      : "text-gray-900"
                                  }
                                >
                                  {new Date(initiative.dueDate).toLocaleDateString("id-ID")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={users.find((u: any) => u.id === (initiative.picId || initiative.createdBy))?.profileImageUrl} />
                                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                                    {getUserInitials(initiative.picId || initiative.createdBy)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-900 font-medium">
                                  {getUserName(initiative.picId || initiative.createdBy)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                {initiative.status === 'completed' ? (
                                  <Button
                                    disabled
                                    size="sm"
                                    className="bg-gray-300 text-gray-500 cursor-not-allowed"
                                  >
                                    Selesai
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => onUpdateMetrics(initiative)}
                                    size="sm"
                                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                                  >
                                    Update
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {activeInitiatives
                  .filter((initiative) => {
                    if (!userFilter || userFilter === 'all') return true;
                    return (
                      initiative.picId?.toString() === userFilter ||
                      initiative.createdBy?.toString() === userFilter
                    );
                  })
                  .sort((a, b) => {
                    const scoreA = parseFloat(a.priorityScore || "0");
                    const scoreB = parseFloat(b.priorityScore || "0");
                    return scoreB - scoreA;
                  })
                  .map((initiative) => {
                    const rawScore = initiative.priorityScore;
                    const score = parseFloat(rawScore || "0");
                    
                    let color: string;
                    let label: string;
                    
                    if (score >= 4.0) {
                      color = "bg-red-100 text-red-800";
                      label = "Kritis";
                    } else if (score >= 3.0) {
                      color = "bg-orange-100 text-orange-800";
                      label = "Tinggi";
                    } else if (score >= 2.0) {
                      color = "bg-yellow-100 text-yellow-800";
                      label = "Sedang";
                    } else {
                      color = "bg-green-100 text-green-800";
                      label = "Rendah";
                    }

                    return (
                      <div
                        key={initiative.id}
                        className="p-3 bg-white border border-gray-200 rounded-lg space-y-3"
                      >
                        {/* Title and Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Link href={`/initiatives/${initiative.id}`}>
                              <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
                                {initiative.title}
                              </h3>
                            </Link>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                              initiative.status === 'not_started'
                                ? 'bg-gray-100 text-gray-700'
                                : initiative.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700'
                                : initiative.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : initiative.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {initiative.status === 'not_started'
                              ? 'Belum Mulai'
                              : initiative.status === 'draft'
                              ? 'Draft'
                              : initiative.status === 'in_progress'
                              ? 'Berlangsung'
                              : initiative.status === 'completed'
                              ? 'Selesai'
                              : 'Dibatalkan'}
                          </span>
                        </div>
                        
                        {/* Priority and Progress Row */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                              {label} ({score.toFixed(1)})
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(initiative.progressPercentage || 0)}%
                            </span>
                          </div>
                          <Progress 
                            value={initiative.progressPercentage || 0} 
                            className="h-1.5"
                          />
                        </div>
                        
                        {/* Due Date and PIC */}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${
                            new Date(initiative.dueDate) < new Date()
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}>
                            Due: {new Date(initiative.dueDate).toLocaleDateString("id-ID")}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={users.find((u: any) => u.id === (initiative.picId || initiative.createdBy))?.profileImageUrl} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                                {getUserInitials(initiative.picId || initiative.createdBy)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-700 font-medium">
                              {getUserName(initiative.picId || initiative.createdBy)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {initiative.status === 'completed' ? (
                            <Button
                              disabled
                              size="sm"
                              className="flex-1 bg-gray-300 text-gray-500 cursor-not-allowed"
                            >
                              Selesai
                            </Button>
                          ) : (
                            <Button
                              onClick={() => onUpdateMetrics(initiative)}
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm mb-2">Belum ada inisiatif yang aktif</p>
              <p className="text-xs text-gray-400">
                Inisiatif akan muncul saat Anda membuat goals dengan strategi implementasi
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}