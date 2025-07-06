import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{task?.title}</CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${getTaskStatusColor(task?.status || '')} text-sm`}>
                {getTaskStatusLabel(task?.status || '')}
              </Badge>
              <Badge className={`${getTaskPriorityColor(task?.priority || '')} text-sm`}>
                <Flag className="w-3 h-3 mr-1" />
                {getTaskPriorityLabel(task?.priority || '')}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-800 border-red-200 text-sm">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Terlambat
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        {task?.description && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Deskripsi
            </h3>
            <p className="text-gray-700 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Due Date */}
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Tenggat Waktu</p>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {task?.dueDate ? formatDate(task.dueDate) : "Tidak ditentukan"}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dibuat</p>
                <p className="text-sm text-gray-600">
                  {task?.createdAt ? formatDate(task.createdAt) : "Tidak diketahui"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Assigned User */}
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">PIC</p>
                <div className="flex items-center gap-2">
                  {assignedUser ? (
                    <>
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignedUser.firstName} ${assignedUser.lastName}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {assignedUser.firstName?.[0]}{assignedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">
                        {assignedUser.firstName} {assignedUser.lastName}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Belum ditentukan</span>
                  )}
                </div>
              </div>
            </div>

            {/* Initiative */}
            {initiative && (
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Inisiatif</p>
                  <Link href={`/initiatives/${initiative.id}`} className="text-sm text-blue-600 hover:underline">
                    {initiative.title}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Progress (for visual appeal) */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Status Progress</span>
            <span>{task?.status === 'completed' ? '100%' : task?.status === 'in_progress' ? '50%' : '0%'}</span>
          </div>
          <Progress 
            value={task?.status === 'completed' ? 100 : task?.status === 'in_progress' ? 50 : 0} 
            className="h-2"
          />
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
  // For now, create a placeholder history. In future this could be actual task activity logs
  const historyItems = [
    {
      id: 1,
      action: "Task dibuat",
      user: "Widi Hastomo",
      timestamp: "2025-01-07 10:30",
      type: "created"
    },
    {
      id: 2,
      action: "Status diubah menjadi 'Sedang Berjalan'",
      user: "Widi Hastomo", 
      timestamp: "2025-01-07 11:15",
      type: "status_change"
    },
    {
      id: 3,
      action: "Due date diperbarui",
      user: "Admin User",
      timestamp: "2025-01-07 14:20",
      type: "due_date_change"
    },
    {
      id: 4,
      action: "PIC diubah",
      user: "Admin User",
      timestamp: "2025-01-07 16:45",
      type: "assignee_change"
    }
  ];

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
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Riwayat Task</CardTitle>
        <CardDescription>Timeline aktivitas dan perubahan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historyItems.map((item, index) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-gray-100">
                  {getHistoryIcon(item.type)}
                </div>
                {index < historyItems.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium text-gray-900">
                  {item.action}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{item.user}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{item.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
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
        className: "border-green-200 bg-green-50 text-green-800",
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
        className: "border-green-200 bg-green-50 text-green-800",
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