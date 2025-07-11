import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import React from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Flag,
  Clock,
  Edit,
  Check,
  X,
  MoreVertical,
  Trash2,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Target,
  Building2,
  Plus,
  Users,
  Timer,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TaskCommentList } from "@/components/task-comment-list";
import { TaskCommentEditor } from "@/components/task-comment-editor";

// UI Components
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Task Overview Card Component
function TaskOverviewCard({ task, assignedUser, initiative }: any) {
  const isOverdue = task?.dueDate ? new Date(task.dueDate) < new Date() : false;
  
  const getTaskStatusColor = (status: string) => {
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

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "in_progress":
        return "Sedang Berjalan";
      case "not_started":
        return "Belum Mulai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Tidak Diketahui";
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
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

  const getTaskPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgent";
      case "high":
        return "Tinggi";
      case "medium":
        return "Sedang";
      case "low":
        return "Rendah";
      default:
        return "Tidak Diketahui";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Tanggal tidak valid";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 pr-4">{task?.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <Badge className={`${getTaskStatusColor(task?.status || '')} text-xs`}>
              {getTaskStatusLabel(task?.status || '')}
            </Badge>
            <Badge className={`${getTaskPriorityColor(task?.priority || '')} text-xs`}>
              <Flag className="w-3 h-3 mr-1" />
              {getTaskPriorityLabel(task?.priority || '')}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Terlambat
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Description */}
        {task?.description && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Key Information - Compact Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Due Date */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">Tenggat</p>
              <p className={`text-xs truncate ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                {task?.dueDate ? formatDate(task.dueDate) : "Tidak ditentukan"}
              </p>
            </div>
          </div>

          {/* Assigned User */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {assignedUser ? (
              <span className="text-xs text-gray-700 truncate">
                {assignedUser.firstName} {assignedUser.lastName}
              </span>
            ) : (
              <span className="text-xs text-gray-500">Belum ditentukan</span>
            )}
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">Dibuat</p>
              <p className="text-xs text-gray-600 truncate">
                {task?.createdAt ? formatDate(task.createdAt) : "Tidak diketahui"}
              </p>
            </div>
          </div>

          {/* Initiative */}
          {initiative && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900">Inisiatif</p>
                <Link href={`/initiatives/${initiative.id}`} className="text-xs text-blue-600 hover:underline truncate block">
                  {initiative.title}
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Comments Card Component
function CommentsCard({ taskId }: { taskId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Diskusi Task</CardTitle>
        <CardDescription>Diskusi dan kolaborasi tim</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TaskCommentList taskId={taskId} />
        <div className="border-t pt-4">
          <TaskCommentEditor taskId={taskId} />
        </div>
      </CardContent>
    </Card>
  );
}

// Task History Card Component
function TaskHistoryCard({ taskId }: { taskId: string }) {
  // Get task data for creation info
  const { data: task, isLoading } = useQuery({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId,
  });

  const taskData = task as any;

  // Build history items from task data
  const historyItems = React.useMemo(() => {
    const items: any[] = [];
    
    // Add task creation
    if (taskData?.createdAt) {
      const createdByUser = taskData.createdByUser || {};
      const createdByName = createdByUser.firstName || createdByUser.email || "System";
      
      items.push({
        id: 'created',
        action: `Task dibuat oleh ${createdByName}`,
        user: createdByName,
        timestamp: new Date(taskData.createdAt).toLocaleString('id-ID'),
        type: "created"
      });
    }

    // Add last update info if available
    if (taskData?.updatedAt && taskData.updatedAt !== taskData.createdAt) {
      const updatedByUser = taskData.lastUpdateByUser || {};
      const updatedByName = updatedByUser.firstName || updatedByUser.email || "System";
      
      items.push({
        id: 'updated',
        action: `Task diperbarui oleh ${updatedByName}`,
        user: updatedByName,
        timestamp: new Date(taskData.updatedAt).toLocaleString('id-ID'),
        type: "general"
      });
    }

    // Sort by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [taskData]);

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Riwayat Task</CardTitle>
          <CardDescription className="text-sm">Timeline aktivitas dan perubahan</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex gap-2 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case "created":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "status_change":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "due_date_change":
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case "assignee_change":
        return <User className="w-4 h-4 text-purple-600" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Riwayat Task</CardTitle>
        <CardDescription className="text-sm">Timeline aktivitas dan perubahan</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {historyItems.length > 0 ? (
            historyItems.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className="p-1.5 rounded-full bg-gray-100">
                    {getHistoryIcon(item.type)}
                  </div>
                  {index < historyItems.length - 1 && (
                    <div className="w-px h-6 bg-gray-200 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-medium text-gray-900">
                    {item.action}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">{item.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Belum ada aktivitas pada task ini</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch task data
  const { data: task, isLoading, error } = useQuery({
    queryKey: [`/api/tasks/${id}`],
    enabled: !!id,
  });

  const taskData = task as any;
  const initiative = taskData?.initiative;
  const assignedUser = taskData?.assignedUser;

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/tasks/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Task dihapus",
        description: "Task berhasil dihapus",
        variant: "success",
      });
      window.history.back();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return await apiRequest(`/api/tasks/${id}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
      toast({
        title: "Status diperbarui",
        description: "Status task berhasil diperbarui",
        variant: "success",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task && !isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-full text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-6">Task yang Anda cari tidak ada.</p>
        <Link href="/daily-focus">
          <Button>Kembali ke Daily Focus</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Page Header with Back Button and Actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center gap-2">
            <Select
              value={taskData?.status || ""}
              onValueChange={(value) => updateTaskStatusMutation.mutate({ status: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Belum Mulai</SelectItem>
                <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TaskOverviewCard 
            task={taskData}
            assignedUser={assignedUser}
            initiative={initiative}
          />
          <CommentsCard taskId={id!} />
        </div>
        <div className="lg:col-span-1 h-full">
          <TaskHistoryCard taskId={id!} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Task</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus task "{taskData?.title}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskMutation.mutate()}
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