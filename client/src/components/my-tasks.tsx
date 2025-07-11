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
import StandaloneTugasModal from "./standalone-task-modal";
import TugasViewSelector, { ViewMode } from "./task-view-selector";
import KanbanView from "./task-views/kanban-view";
import ListView from "./task-views/list-view";
import TimelineView from "./task-views/timeline-view";

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

interface MyTugasProps {
  filteredKeyResultIds?: string[];
  userFilter?: string;
}

export default function MyTugas({ filteredKeyResultIds, userFilter }: MyTugasProps) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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

  // Determine which user's tasks to fetch based on filter
  const currentUserId = getUserId();
  const showAllUsers = userFilter === 'all' || userFilter === '' || !userFilter;
  const targetUserId = showAllUsers ? null : userFilter;

  // Fetch tasks for the selected user or all tasks
  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: showAllUsers ? ['/api/tasks'] : [`/api/users/${targetUserId}/tasks`],
    enabled: showAllUsers || !!targetUserId,
  });

  // Mutation for updating task
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tasks/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both all tasks and specific user tasks queries
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/tasks`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
      toast({
        title: "Task berhasil diupdate",
        variant: "success",
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
      // Invalidate both all tasks and specific user tasks queries
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/tasks`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
      toast({
        title: "Task berhasil dihapus",
        variant: "success",
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

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
          <p className="text-sm text-gray-600">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          onClick={handleAddQuickTask}
          size="sm"
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah Task
        </Button>
      </div>

      {/* Filter Controls and View Selector */}
      <div className="flex items-center justify-between">
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

        <TugasViewSelector 
          currentView={viewMode} 
          onViewChange={setViewMode}
        />
      </div>

      {/* Task Views */}
      <div className="mt-6">
        {viewMode === 'kanban' && (
          <KanbanView
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            userId={targetUserId || currentUserId || ''}
          />
        )}
        
        {viewMode === 'list' && (
          <ListView
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            userId={targetUserId || currentUserId || ''}
          />
        )}
        
        {viewMode === 'timeline' && (
          <TimelineView
            tasks={filteredTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            userId={targetUserId || currentUserId || ''}
          />
        )}
      </div>

      {/* Standalone Tugas Modal */}
      <StandaloneTugasModal
        open={showStandaloneTaskModal}
        onOpenChange={setShowStandaloneTaskModal}
        onSuccess={() => {
          // Invalidate both all tasks and specific user tasks queries
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          if (targetUserId) {
            queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/tasks`] });
          }
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