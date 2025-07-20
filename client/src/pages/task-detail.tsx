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
  ChevronsUpDown,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TaskCommentList } from "@/components/task-comment-list";
import { TaskCommentEditor } from "@/components/task-comment-editor";
import TaskModal from "@/components/task-modal";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Task Overview Card Component
function TaskOverviewCard({ task, assignedUser, initiative }: any) {
  const isOverdue = task?.dueDate ? new Date(task.dueDate) < new Date() : false;
  
  // Helper function to get creator name
  const getCreatorName = (task: any): string => {
    if (!task?.createdBy) return "System";
    
    // If createdBy is just an ID string, check if it matches assignedUser
    if (typeof task.createdBy === 'string') {
      // Check if creator is same as assigned user
      if (task.assignedUser && task.createdBy === task.assignedUser.id) {
        // Use assignedUser data for creator name
        if (task.assignedUser.name && task.assignedUser.name.trim() !== "") {
          return task.assignedUser.name.trim();
        }
        
        if (task.assignedUser.email) {
          return task.assignedUser.email.split('@')[0];
        }
      }
      
      // If creator ID is different from assignedUser, we'd need to fetch creator data
      // For now, return a generic name
      return "System";
    }
    
    // If createdBy is an object with user data
    if (task.createdBy.name && task.createdBy.name.trim() !== "") {
      return task.createdBy.name.trim();
    }
    
    if (task.createdBy.email) {
      return task.createdBy.email.split('@')[0];
    }
    
    return "System";
  };
  
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
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">{task?.title}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Key Information - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Start Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">Tanggal Mulai</p>
              <p className="text-xs text-gray-600 break-words">
                {task?.startDate ? formatDate(task.startDate) : "Tidak ditentukan"}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">Tanggal Selesai</p>
              <p className={`text-xs break-words ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                {task?.dueDate ? formatDate(task.dueDate) : "Tidak ditentukan"}
              </p>
            </div>
          </div>

          {/* Assigned User */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">PIC</p>
              {assignedUser ? (
                <p className="text-xs text-gray-700 break-words">
                  {assignedUser.name && assignedUser.name.trim() !== ""
                    ? assignedUser.name.trim()
                    : assignedUser.email
                      ? assignedUser.email.split('@')[0]
                      : "Pengguna"
                  }
                </p>
              ) : (
                <p className="text-xs text-gray-500">Belum ditentukan</p>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">Dibuat</p>
              <p className="text-xs text-gray-600 break-words">
                {task?.createdAt ? formatDate(task.createdAt) : "Tidak diketahui"}
              </p>
              <p className="text-xs text-gray-500 break-words">
                oleh {getCreatorName(task)}
              </p>
            </div>
          </div>

          {/* Initiative */}
          {initiative && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900">Inisiatif</p>
                <Link href={`/initiatives/${initiative.id}`} className="text-xs text-blue-600 hover:underline break-words block">
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
  // Get task audit trail from API
  const { data: auditTrail, isLoading } = useQuery({
    queryKey: [`/api/tasks/${taskId}/audit-trail`],
    enabled: !!taskId,
  });

  const historyItems = auditTrail || [];

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

  const getHistoryIcon = (action: string) => {
    if (action === "created") {
      return <Plus className="w-4 h-4 text-green-600" />;
    } else if (action === "status_changed") {
      return <CheckCircle className="w-4 h-4 text-blue-600" />;
    } else if (action.includes("due_date")) {
      return <Calendar className="w-4 h-4 text-orange-600" />;
    } else if (action.includes("assignee")) {
      return <User className="w-4 h-4 text-purple-600" />;
    } else if (action.includes("comment")) {
      return <MessageSquare className="w-4 h-4 text-indigo-600" />;
    } else {
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
        <div className="max-h-96 overflow-y-auto space-y-3">
          {historyItems.length > 0 ? (
            historyItems.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className="p-1.5 rounded-full bg-gray-100">
                    {getHistoryIcon(item.action)}
                  </div>
                  {index < historyItems.length - 1 && (
                    <div className="w-px h-6 bg-gray-200 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-medium text-gray-900">
                    {item.changeDescription || item.action}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">{item.user?.name && item.user.name.trim() !== "" ? item.user.name.trim() : item.user?.email?.split('@')[0] || "System"}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Jakarta'
                      })}
                    </span>
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  // Helper function to get status display with visual indicator
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "not_started":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Belum Mulai
          </div>
        );
      case "in_progress":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Sedang Berjalan
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Selesai
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Dibatalkan
          </div>
        );
      default:
        return "Pilih status task";
    }
  };

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
      return await apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}/audit-trail`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
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
      const result = await apiRequest('PATCH', `/api/tasks/${id}`, { status });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}/audit-trail`] });
      toast({
        title: "Status diperbarui",
        description: "Status task berhasil diperbarui",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status task",
        variant: "destructive",
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
    <div className="max-w-7xl mx-auto space-y-6">
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

          <div className="flex items-center gap-1 sm:gap-2">
            <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={statusPopoverOpen}
                  className="w-[140px] sm:w-[160px] lg:w-[180px] justify-between focus:ring-2 focus:ring-orange-500"
                >
                  {taskData?.status ? getStatusDisplay(taskData.status) : "Pilih status"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[140px] sm:w-[160px] lg:w-[180px] p-0">
                <Command>
                  <CommandInput placeholder="Cari status..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada status yang cocok.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateTaskStatusMutation.mutate({ status: "not_started" });
                          setStatusPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Belum Mulai
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 ${
                            taskData?.status === "not_started" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          updateTaskStatusMutation.mutate({ status: "in_progress" });
                          setStatusPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Sedang Berjalan
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 ${
                            taskData?.status === "in_progress" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          updateTaskStatusMutation.mutate({ status: "completed" });
                          setStatusPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Selesai
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 ${
                            taskData?.status === "completed" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          updateTaskStatusMutation.mutate({ status: "cancelled" });
                          setStatusPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Dibatalkan
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 ${
                            taskData?.status === "cancelled" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <TaskOverviewCard 
            task={taskData}
            assignedUser={assignedUser}
            initiative={initiative}
          />
          <CommentsCard taskId={id!} />
        </div>
        <div className="lg:col-span-1">
          <TaskHistoryCard taskId={id!} />
        </div>
      </div>

      {/* Edit Task Dialog */}
      <TaskModal
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          // Refresh task data after edit
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}/audit-trail`] });
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        }}
        task={taskData}
        initiativeId={taskData?.initiativeId}
        isAdding={false}
      />

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