import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Flag,
  Target,
  User,
  Users,
  Clock,
  FileText,
  Check,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TaskModal from "@/components/task-modal";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for task modals
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Fetch initiative details with all related data (PIC, members, key result)
  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: [`/api/initiatives/${id}`],
    enabled: !!id,
  });

  // Fetch tasks for this initiative
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: [`/api/initiatives/${id}/tasks`],
    enabled: !!id,
  });

  // Fetch related initiatives from the same key result
  const { data: relatedInitiatives } = useQuery({
    queryKey: ['/api/initiatives'],
    enabled: !!initiative,
    select: (data: any[]) => {
      const initiativeData = initiative as any;
      const keyResult = initiativeData?.keyResult;
      return data?.filter(init => 
        init.keyResultId === keyResult?.id && init.id !== id
      ) || [];
    },
  });

  // Task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}/tasks`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'], refetchType: 'active' });
      toast({
        title: "Task berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: () => {
      toast({
        title: "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update task status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}/tasks`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`], refetchType: 'active' });
      toast({
        description: "Status task berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Gagal mengupdate status task",
      });
    },
  });

  // Extract data from the comprehensive initiative object with proper typing
  const initiativeData = initiative as any;
  const members = initiativeData?.members || [];
  const pic = initiativeData?.pic;
  const keyResult = initiativeData?.keyResult;

  if (initiativeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!initiativeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Initiative not found</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "Rendah";
      case "medium": return "Sedang";
      case "high": return "Tinggi";
      case "critical": return "Kritis";
      default: return priority;
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "Tidak ada budget";
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tidak ditentukan";
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Tanggal tidak valid";
    }
  };

  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return initiativeData.progress || 0;
    const completedTasks = tasks.filter((task: any) => task.status === "completed");
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  // Task helper functions
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
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
        return "Berlangsung";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Tidak Diketahui";
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
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

  // Task handlers
  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus task ini?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard?tab=initiatives">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Edit Initiative
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Initiative Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Initiative Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">{initiativeData.title}</h1>
                {initiativeData.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{initiativeData.description}</p>
                )}
              </div>
              
              {/* Initiative Details Row */}
              <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5" title="Status Initiative">
                  <Flag className="h-3 w-3 text-gray-600" />
                  <Badge className={`${getStatusColor(initiativeData.status)} border-0 py-0 text-xs`}>
                    {getStatusLabel(initiativeData.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1.5" title="Priority Initiative">
                  <Target className="h-3 w-3 text-gray-600" />
                  <Badge className={`${getPriorityColor(initiativeData.priority)} border-0 py-0 text-xs`}>
                    {getPriorityLabel(initiativeData.priority)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1.5" title="Budget yang Dialokasikan">
                  <DollarSign className="h-3 w-3 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(initiativeData.budget)}</span>
                </div>
                
                <div className="flex items-center gap-1.5" title="Timeline Initiative">
                  <Calendar className="h-3 w-3 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(initiativeData.startDate)} - {formatDate(initiativeData.dueDate)}
                  </span>
                </div>
              </div>

              {/* Simple Progress */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className={`text-lg font-bold ${
                    calculateProgress() === 100 ? 'text-green-600' : 
                    calculateProgress() >= 75 ? 'text-blue-600' : 
                    calculateProgress() >= 50 ? 'text-yellow-600' : 
                    'text-orange-600'
                  }`}>{calculateProgress()}%</span>
                </div>
                <div className="relative">
                  <Progress value={calculateProgress()} className="h-3" />
                  <div className={`absolute inset-0 h-3 rounded-full ${
                    calculateProgress() === 100 ? 'bg-green-500' : 
                    calculateProgress() >= 75 ? 'bg-blue-500' : 
                    calculateProgress() >= 50 ? 'bg-yellow-500' : 
                    'bg-orange-500'
                  }`} style={{ width: `${calculateProgress()}%` }} />
                </div>
              </div>

              {/* Key Result Information - Simplified */}
              {keyResult && (
                <div className="border border-blue-200 bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Link href={`/key-result/${keyResult.id}`}>
                      <span className="text-sm font-semibold text-blue-900 hover:text-blue-700">
                        Key Result: {keyResult.title}
                      </span>
                    </Link>
                    <span className="text-xs font-bold text-blue-900">{(keyResult.progress || 0).toFixed(1)}%</span>
                  </div>
                </div>
              )}


            </CardContent>
          </Card>

          {/* Task Management Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Manajemen Task
                </CardTitle>
                <Button 
                  onClick={() => setIsAddTaskModalOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Tambah Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Belum ada task</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm cursor-pointer hover:text-blue-600">
                              {task.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Badge 
                                  className={`${getTaskStatusColor(task.status)} text-xs py-0 cursor-pointer hover:opacity-80`}
                                >
                                  {getTaskStatusLabel(task.status)}
                                </Badge>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
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
                            <Badge className={`${getTaskPriorityColor(task.priority)} text-xs py-0`}>
                              {getTaskPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {task.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{task.assignedUser?.firstName} {task.assignedUser?.lastName}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                            className="h-8 w-8 p-0"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Team and Recent Activity */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
          <CardHeader>
            <CardTitle>
              Tim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PIC */}
            {pic && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  PIC (Person in Charge)
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {pic.firstName?.charAt(0)}{pic.lastName?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {pic.firstName} {pic.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pic.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            {members.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Anggota Tim ({members.length})
                </div>
                <div className="space-y-2">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.user?.firstName?.charAt(0)}{member.user?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.user?.firstName} {member.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!pic && members.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Belum ada anggota tim</p>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Task Modal */}
      <TaskModal
        open={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        initiativeId={id!}
        isAdding={true}
      />

      {/* Edit Task Modal */}
      <TaskModal
        open={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        task={selectedTask}
        initiativeId={id!}
        isAdding={false}
      />
    </div>
  );
}