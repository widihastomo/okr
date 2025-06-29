import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, Circle, CheckSquare, ChevronDown, Check, MoreVertical, User } from "lucide-react";
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

interface MyTasksProps {
  filteredKeyResultIds?: string[];
}

export default function MyTasks({ filteredKeyResultIds }: MyTasksProps) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Type guard to check if user has id property
  const userId = user && typeof user === 'object' && 'id' in user ? (user as any).id : null;

  // Mutation for updating task status
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Status Updated",
        description: "Task status has been updated successfully.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  // Fetch tasks assigned to current user
  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
    staleTime: 0, // Always refetch to ensure we get latest tasks
  });

  // Fetch all initiatives to check key result relationships
  const { data: initiatives = [] } = useQuery<any[]>({
    queryKey: ['/api/initiatives'],
    enabled: !!filteredKeyResultIds && filteredKeyResultIds.length > 0,
  });

  // Filter and sort tasks
  const tasks = Array.isArray(rawTasks) ? rawTasks as any[] : [];
  const filteredTasks = tasks
    .filter((task: any) => {
      let statusMatch = statusFilter === "all" || task.status === statusFilter;
      // Handle legacy status values for backwards compatibility
      if (statusFilter === "not_started" && (task.status === "todo" || task.status === "pending")) {
        statusMatch = true;
      }
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      
      // Key Result filter - only show tasks from initiatives linked to filtered key results
      // BUT always show if task is assigned to current user
      let keyResultMatch = true;
      if (filteredKeyResultIds && filteredKeyResultIds.length > 0) {
        // Find the initiative for this task
        const taskInitiative = initiatives.find((init: any) => init.id === task.initiativeId);
        if (taskInitiative) {
          keyResultMatch = filteredKeyResultIds.includes(taskInitiative.keyResultId);
        } else {
          keyResultMatch = false;
        }
        
        // Override filter if task is assigned to current user
        if (task.assignedTo === userId) {
          keyResultMatch = true; // Always show user's own tasks
        }
      }
      
      return statusMatch && priorityMatch && keyResultMatch;
    })
    .sort((a: any, b: any) => {
      // Sort by deadline - earliest first, tasks without deadline go to end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Circle className="w-5 h-5 text-blue-600" />;
      case "cancelled":
        return <Circle className="w-5 h-5 text-red-600" />;
      case "not_started":
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">Belum Dimulai</SelectItem>
            <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 text-center">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? "No tasks match your current filters."
                : "You don't have any tasks assigned to you yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Task Health Score Dot */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`w-2 h-2 rounded-full cursor-help ${
                            calculateTaskHealthScore(task) >= 80 ? 'bg-green-500' :
                            calculateTaskHealthScore(task) >= 60 ? 'bg-yellow-500' :
                            calculateTaskHealthScore(task) >= 40 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`} />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            <div className="font-medium">Task Health Score: {getTaskHealthLabel(calculateTaskHealthScore(task))} ({calculateTaskHealthScore(task)}%)</div>
                            <div className="space-y-1 text-gray-600">
                              <div>• Status: {getTaskStatusLabel(task.status)}</div>
                              <div>• Priority: {getTaskPriorityLabel(task.priority)}</div>
                              <div>• Due Date: {formatDate(task.dueDate)}</div>
                              {(() => {
                                const daysUntilDue = Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                if (daysUntilDue < 0) return <div className="text-red-600">• Overdue by {Math.abs(daysUntilDue)} days</div>;
                                if (daysUntilDue === 0) return <div className="text-orange-600">• Due today</div>;
                                if (daysUntilDue <= 3) return <div className="text-yellow-600">• Due in {daysUntilDue} days</div>;
                                return <div>• Due in {daysUntilDue} days</div>;
                              })()}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Task Title and Info */}
                    <div className="flex-1">
                      <Link href={`/tasks/${task.id}`}>
                        <span className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                          {task.title}
                        </span>
                      </Link>
                      
                      {/* Due Date and User Info */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className={`h-3 w-3 ${
                              new Date(task.dueDate) < new Date() ? 'text-red-600' : ''
                            }`} />
                            <span className={
                              new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : ''
                            }>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        {task.assignedUser && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignedUser.firstName} {task.assignedUser.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
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

                    {/* Priority Badge */}
                    <Badge className={`${getTaskPriorityColor(task.priority)} text-xs px-2 py-1`}>
                      {getTaskPriorityLabel(task.priority)}
                    </Badge>

                    {/* Assigned User Avatar */}
                    {task.assignedTo && task.assignedUser && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white cursor-help">
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
                    )}

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tasks/${task.id}`}>
                            View Task Details
                          </Link>
                        </DropdownMenuItem>
                        {task.initiative && (
                          <DropdownMenuItem asChild>
                            <Link href={`/initiatives/${task.initiative.id}`}>
                              View Initiative
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}