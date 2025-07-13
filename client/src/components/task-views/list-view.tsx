import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MoreVertical, 
  User, 
  Edit, 
  Trash2, 
  ChevronDown, 
  Check,
  Clock,
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ListViewProps {
  tasks: any[];
  onEditTask: (task: any) => void;
  onDeleteTask: (task: any) => void;
  userId: string;
}

export default function ListView({ tasks, onEditTask, onDeleteTask, userId }: ListViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for updating task status
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Task status berhasil diupdate",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error updating task status:", error);
      toast({
        title: "Gagal mengupdate status task",
        variant: "destructive",
      });
    },
  });

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-200 text-green-800';
      case 'in_progress': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'cancelled': return 'bg-red-100 border-red-200 text-red-800';
      case 'not_started': return 'bg-gray-100 border-gray-200 text-gray-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Sedang Dikerjakan';
      case 'cancelled': return 'Dibatalkan';
      case 'not_started': return 'Belum Dimulai';
      default: return 'Belum Dimulai';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-200 text-green-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTaskPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return 'Sedang';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const calculateTaskHealthScore = (task: any) => {
    let score = 50; // Base score

    // Status impact
    switch (task.status) {
      case 'completed':
        score = 100;
        break;
      case 'cancelled':
        score = 0;
        break;
      case 'in_progress':
        score += 20;
        break;
      case 'not_started':
        score -= 10;
        break;
    }

    // Due date impact
    if (task.dueDate) {
      const daysUntilDue = Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) {
        score -= 30; // Overdue
      } else if (daysUntilDue <= 1) {
        score -= 20; // Due soon
      } else if (daysUntilDue <= 3) {
        score -= 10; // Due within 3 days
      }
    }

    // Priority impact
    switch (task.priority) {
      case 'high':
        score += 10;
        break;
      case 'low':
        score -= 5;
        break;
    }

    return Math.max(0, Math.min(100, score));
  };

  const getTaskHealthLabel = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'At Risk';
    if (score >= 40) return 'Warning';
    return 'Critical';
  };

  // Sort tasks by due date (earliest first), then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    // Handle null/undefined due dates (put them at the end)
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    
    // Sort by due date (earliest first)
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    // If due dates are equal, sort by priority (critical > high > medium > low)
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) - 
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 99);
  });

  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
        <div className="col-span-1">Health</div>
        <div className="col-span-4">Task</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-2">Due Date</div>
        <div className="col-span-1">Assignee</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Task Rows */}
      {sortedTasks.map((task: any) => (
        <div key={task.id} className="grid grid-cols-12 gap-4 px-4 py-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
          {/* Health Score */}
          <div className="col-span-1 flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-3 h-3 rounded-full cursor-help ${
                    calculateTaskHealthScore(task) >= 80 ? 'bg-green-500' :
                    calculateTaskHealthScore(task) >= 60 ? 'bg-yellow-500' :
                    calculateTaskHealthScore(task) >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <div className="font-medium">
                      Task Health: {getTaskHealthLabel(calculateTaskHealthScore(task))} ({calculateTaskHealthScore(task)}%)
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <div>• Status: {getTaskStatusLabel(task.status)}</div>
                      <div>• Priority: {getTaskPriorityLabel(task.priority)}</div>
                      <div>• Due Date: {formatDate(task.dueDate) || 'No due date'}</div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Task Title */}
          <div className="col-span-4">
            <Link href={`/tasks/${task.id}`}>
              <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                {task.title}
              </h4>
            </Link>
            
          </div>

          {/* Status */}
          <div className="col-span-2">
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
                  onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: 'not_started' })}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {task.status === 'not_started' && <Check className="h-3 w-3" />}
                    <span>Belum Dimulai</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {task.status === 'in_progress' && <Check className="h-3 w-3" />}
                    <span>Sedang Dikerjakan</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: 'completed' })}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' && <Check className="h-3 w-3" />}
                    <span>Selesai</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateTaskStatusMutation.mutate({ taskId: task.id, status: 'cancelled' })}
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

          {/* Priority */}
          <div className="col-span-1">
            <Badge className={`${getTaskPriorityColor(task.priority)} text-xs px-2 py-1`}>
              {getTaskPriorityLabel(task.priority)}
            </Badge>
          </div>

          {/* Due Date */}
          <div className="col-span-2 text-sm">
            {task.dueDate ? (
              <div className="flex items-center gap-1">
                <Calendar className={`h-3 w-3 ${
                  new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-500'
                }`} />
                <span className={
                  new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'
                }>
                  {formatDate(task.dueDate)}
                </span>
                {new Date(task.dueDate) < new Date() && (
                  <AlertCircle className="h-3 w-3 text-red-600" />
                )}
              </div>
            ) : (
              <span className="text-gray-400">No due date</span>
            )}
          </div>

          {/* Assignee */}
          <div className="col-span-1">
            {task.assignedUser ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium cursor-help">
                      {task.assignedUser.firstName?.charAt(0)}{task.assignedUser.lastName?.charAt(0)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {task.assignedUser.firstName} {task.assignedUser.lastName}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="col-span-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditTask(task)} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteTask(task)} className="cursor-pointer text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-sm">Create a new task to get started</p>
        </div>
      )}
    </div>
  );
}