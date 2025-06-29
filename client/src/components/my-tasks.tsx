import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, Circle, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
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
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
        <div className="space-y-4">
          {filteredTasks.map((task: any) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(task.status)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link href={`/tasks/${task.id}`}>
                          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer">
                            {task.title}
                          </h3>
                        </Link>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Context information */}
                        {task.initiative && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Initiative:</span> {task.initiative.title}
                            {task.initiative.keyResult && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="font-medium">KR:</span> {task.initiative.keyResult.title}
                              </>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          {/* Status dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Status:</span>
                            <Select
                              value={task.status}
                              onValueChange={(value) => updateTaskStatusMutation.mutate({ taskId: task.id, status: value })}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(task.priority)}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/key-results/${task.initiative?.keyResultId}`;
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}