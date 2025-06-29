import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Flag, DollarSign, User, Users, CheckCircle2, Clock, FileText, MessageSquare, Paperclip, Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import TaskModal from "@/components/task-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<any>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Fetch initiative details with all related data (PIC, members, tasks, documents)
  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: [`/api/initiatives/${id}`],
    enabled: !!id,
  });

  // Extract data from the comprehensive initiative object with proper typing
  const initiativeData = initiative as any;
  const tasks = initiativeData?.tasks || [];
  const members = initiativeData?.members || [];
  const pic = initiativeData?.pic;

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      toast({
        title: "Task berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setDeletingTask(null);
    },
    onError: () => {
      toast({
        title: "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      toast({
        title: "Status task berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
  });

  if (initiativeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Initiative not found</div>
      </div>
    );
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Belum Dimulai";
      case "in_progress": return "Sedang Berjalan";
      case "completed": return "Selesai";
      case "on_hold": return "Ditahan";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600";
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-gray-500";
      default: return "text-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "Rendah";
      case "medium": return "Sedang";
      case "high": return "Tinggi";
      case "critical": return "Kritis";
      default: return priority;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "in_progress": return "Sedang Dikerjakan";
      case "completed": return "Selesai";
      default: return status;
    }
  };

  const completedTasks = tasks.filter((task: any) => task.status === "completed");
  const progressPercentage = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard?tab=initiatives" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Initiatives
        </Link>
        
        <div className="flex justify-end">
          <Badge className={getStatusColor(initiativeData.status)}>
            {getStatusLabel(initiativeData.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{initiativeData.title}</h2>
                {initiativeData.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">{initiativeData.description}</p>
                )}
              </div>

              <Separator />

              {/* Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {completedTasks.length} dari {tasks.length} task selesai
                </p>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    Tanggal Mulai
                  </div>
                  <p className="font-medium">
                    {initiativeData.startDate 
                      ? new Date(initiativeData.startDate).toLocaleDateString('id-ID')
                      : '-'
                    }
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    Tenggat Waktu
                  </div>
                  <p className="font-medium">
                    {initiativeData.dueDate 
                      ? new Date(initiativeData.dueDate).toLocaleDateString('id-ID')
                      : '-'
                    }
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Flag className={`h-4 w-4 ${getPriorityColor(initiativeData.priority)}`} />
                    Prioritas
                  </div>
                  <p className="font-medium">{getPriorityLabel(initiativeData.priority)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </div>
                  <p className="font-medium">
                    {initiativeData.budget 
                      ? `Rp ${parseInt(initiativeData.budget).toLocaleString('id-ID')}`
                      : '-'
                    }
                  </p>
                </div>
              </div>

              <Separator />

              {/* Key Result Link */}
              {initiativeData.keyResult && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Key Result</p>
                  <Link 
                    href={`/key-result/${initiativeData.keyResultId}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {initiativeData.keyResult.title}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Tasks ({tasks.length})
                </CardTitle>
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setIsAddingTask(true);
                    setSelectedTask(null);
                    setIsTaskModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Belum ada task</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskModalOpen(true);
                                setIsAddingTask(false);
                              }}
                              className="font-medium hover:text-blue-600 text-left"
                            >
                              {task.title}
                            </button>
                            <Badge className={getTaskStatusColor(task.status)}>
                              {getTaskStatusLabel(task.status)}
                            </Badge>
                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} border-current`}>
                              <Flag className="h-3 w-3 mr-1" />
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {task.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(task.dueDate).toLocaleDateString('id-ID')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskModalOpen(true);
                                setIsAddingTask(false);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {task.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => updateTaskStatusMutation.mutate({ 
                                  taskId: task.id, 
                                  status: "completed" 
                                })}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeletingTask(task)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tim & PIC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* PIC Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">PIC (Penanggung Jawab)</span>
                </div>
                {pic ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {pic.firstName?.charAt(0)}{pic.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{`${pic.firstName} ${pic.lastName}`}</p>
                      <p className="text-sm text-gray-600">{pic.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Tidak ada PIC</p>
                )}
              </div>

              <Separator />

              {/* Members Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Anggota Tim</span>
                  </div>
                  <span className="text-xs text-gray-500">({members.length})</span>
                </div>
                {members.length === 0 ? (
                  <p className="text-gray-500 text-sm">Tidak ada anggota tim</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member: any) => (
                      <div key={member.userId} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {`${member.user.firstName} ${member.user.lastName}`}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{member.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          open={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
            setIsAddingTask(false);
          }}
          task={selectedTask}
          initiativeId={id}
          isAdding={isAddingTask}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <DeleteConfirmationModal
          open={true}
          onOpenChange={() => setDeletingTask(null)}
          onConfirm={() => deleteTaskMutation.mutate(deletingTask.id)}
          title="Hapus Task"
          description={`Apakah Anda yakin ingin menghapus task "${deletingTask.title}"? Tindakan ini tidak dapat dibatalkan.`}
        />
      )}
    </div>
  );
}