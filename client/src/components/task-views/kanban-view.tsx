import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MoreVertical, User, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
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

interface KanbanViewProps {
  tasks: any[];
  onEditTask: (task: any) => void;
  onDeleteTask: (task: any) => void;
  userId: string;
}

export default function KanbanView({ tasks, onEditTask, onDeleteTask, userId }: KanbanViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Group tasks by status
  const columns = [
    { id: 'not_started', title: 'Belum Dimulai', color: 'bg-gray-100 border-gray-200' },
    { id: 'in_progress', title: 'Sedang Dikerjakan', color: 'bg-blue-100 border-blue-200' },
    { id: 'completed', title: 'Selesai', color: 'bg-green-100 border-green-200' },
    { id: 'cancelled', title: 'Dibatalkan', color: 'bg-red-100 border-red-200' },
  ];

  const tasksByStatus = columns.map(column => ({
    ...column,
    tasks: tasks.filter(task => task.status === column.id)
  }));

  // Mutation for updating task status via drag and drop
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
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

  const handleDragStart = (e: React.DragEvent, task: any) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (taskData.status !== status) {
      updateTaskStatusMutation.mutate({ taskId: taskData.id, status });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    if (!dateString) return 'No due date';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
      {tasksByStatus.map(column => (
        <div key={column.id} className="flex flex-col">
          <div className={`${column.color} rounded-lg p-4 mb-4`}>
            <h3 className="font-semibold text-gray-800 mb-2">{column.title}</h3>
            <div className="text-sm text-gray-600">{column.tasks.length} tasks</div>
          </div>
          
          <div 
            className="flex-1 space-y-3 min-h-[400px] p-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50"
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
          >
            {column.tasks.map(task => (
              <Card 
                key={task.id} 
                className="cursor-move hover:shadow-md transition-shadow bg-white"
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/tasks/${task.id}`}>
                      <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
                        {task.title}
                      </h4>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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

                  

                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${getTaskPriorityColor(task.priority)} text-xs px-2 py-1`}>
                      {getTaskPriorityLabel(task.priority)}
                    </Badge>
                    
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className={`h-3 w-3 ${
                          new Date(task.dueDate) < new Date() ? 'text-red-600' : ''
                        }`} />
                        <span className={
                          new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : ''
                        }>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.assignedUser && (
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
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
                      <span className="text-xs text-gray-600">
                        {task.assignedUser.firstName} {task.assignedUser.lastName}
                      </span>
                    </div>
                  )}

                  {task.initiative && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <Link href={`/initiatives/${task.initiative.id}`}>
                        <span className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                          📋 {task.initiative.title}
                        </span>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {column.tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm">No tasks</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}