import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, Circle, CheckSquare, ChevronDown, Check, MoreVertical, User, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import StandaloneTaskModal from "./standalone-task-modal";

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

interface MyTasksProps {
  filteredKeyResultIds?: string[];
}

export default function MyTasks({ filteredKeyResultIds }: MyTasksProps) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showStandaloneTaskModal, setShowStandaloneTaskModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Type guard to check if user has id property
  const getUserId = () => {
    if (user && typeof user === 'object' && 'id' in user) {
      return (user as any).id;
    }
    return null;
  };

  const userId = getUserId();

  // Fetch user's tasks
  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
  });

  // Mutation for updating task
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tasks/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
      toast({
        title: "Task berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setEditingTask(null);
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast({
        title: "Gagal mengupdate task",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
      toast({
        title: "Task berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setTaskToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast({
        title: "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  const handleAddQuickTask = () => {
    setShowStandaloneTaskModal(true);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const taskData = {
      id: taskId,
      status: newStatus,
    };
    updateTaskMutation.mutate(taskData);
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Circle className="h-4 w-4" />;
      case "not_started":
        return <Circle className="h-4 w-4" />;
      case "cancelled":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "in_progress":
        return "Sedang Dikerjakan";
      case "not_started":
        return "Belum Dimulai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Belum Dimulai";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critical":
        return "Kritis";
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

  const calculateHealthScore = (task: any) => {
    let score = 100;
    
    // Status impact
    if (task.status === "completed") {
      return 100;
    } else if (task.status === "cancelled") {
      return 0;
    } else if (task.status === "in_progress") {
      score = 70;
    } else {
      score = 50;
    }
    
    // Due date impact
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        score = Math.max(0, score - 30);
      } else if (daysUntilDue <= 3) {
        score = Math.max(0, score - 15);
      }
    }
    
    // Priority impact
    if (task.priority === "critical") {
      score = Math.max(0, score - 10);
    } else if (task.priority === "high") {
      score = Math.max(0, score - 5);
    }
    
    return Math.round(score);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getHealthCategory = (score: number) => {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "At Risk";
    if (score >= 40) return "Warning";
    return "Critical";
  };

  // Filter tasks based on filters and key result filter
  const filteredTasks = tasks.filter((task: any) => {
    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    
    // Key result filter - if filteredKeyResultIds is provided, only show tasks from those key results
    if (filteredKeyResultIds && filteredKeyResultIds.length > 0) {
      // Show tasks that are either:
      // 1. From initiatives linked to filtered key results
      // 2. Assigned to current user (regardless of filter)
      if (task.initiative && task.initiative.keyResultId) {
        const isFromFilteredKeyResult = filteredKeyResultIds.includes(task.initiative.keyResultId);
        const isAssignedToUser = task.assignedTo === userId;
        if (!isFromFilteredKeyResult && !isAssignedToUser) return false;
      } else if (task.assignedTo !== userId) {
        // For standalone tasks (no initiative), only show if assigned to current user
        return false;
      }
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">My Tasks</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Tasks</h3>
        <Button
          onClick={handleAddQuickTask}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah Task
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex space-x-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="not_started">Belum Dimulai</SelectItem>
            <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            <SelectItem value="low">Rendah</SelectItem>
            <SelectItem value="medium">Sedang</SelectItem>
            <SelectItem value="high">Tinggi</SelectItem>
            <SelectItem value="critical">Kritis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Tidak ada task yang ditemukan.
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: any) => {
            const healthScore = calculateHealthScore(task);
            const healthColor = getHealthColor(healthScore);
            const healthCategory = getHealthCategory(healthScore);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Health Score Dot */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`w-3 h-3 rounded-full ${healthColor}`}></div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Health Score: {healthScore}%</div>
                              <div className="text-muted-foreground">{healthCategory}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Link href={`/task/${task.id}`}>
                            <span className="font-medium hover:text-blue-600 cursor-pointer">
                              {task.title}
                            </span>
                          </Link>
                        </div>
                        
                        {/* Due Date */}
                        {task.dueDate && (
                          <div className={`text-sm flex items-center space-x-1 mt-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), "dd MMM yyyy")}</span>
                          </div>
                        )}
                        
                        {/* Assigned User */}
                        {task.assignedUser && (
                          <div className="text-sm text-muted-foreground flex items-center space-x-1 mt-1">
                            <User className="h-3 w-3" />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span>{task.assignedUser.firstName} {task.assignedUser.lastName}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span>{task.assignedUser.firstName} {task.assignedUser.lastName}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Status Badge with Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`${getStatusColor(task.status)} hover:opacity-80`}
                          >
                            {getStatusIcon(task.status)}
                            <span className="ml-1">{getStatusLabel(task.status)}</span>
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "not_started")}>
                            <Circle className="h-4 w-4 mr-2" />
                            Belum Dimulai
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "in_progress")}>
                            <Circle className="h-4 w-4 mr-2" />
                            Sedang Dikerjakan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Selesai
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "cancelled")}>
                            <Circle className="h-4 w-4 mr-2" />
                            Dibatalkan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Priority Badge */}
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>

                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingTask(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Standalone Task Modal */}
      <StandaloneTaskModal
        open={showStandaloneTaskModal}
        onOpenChange={setShowStandaloneTaskModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Task</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus task "{taskToDelete?.title}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700"
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