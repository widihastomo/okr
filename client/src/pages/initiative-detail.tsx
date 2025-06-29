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
  MoreVertical,
  Edit,
  Trash2,
  Info,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TaskModal from "@/components/task-modal";
import InitiativeModal from "@/components/initiative-modal";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for task modals
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // State for initiative editing
  const [isEditInitiativeModalOpen, setIsEditInitiativeModalOpen] = useState(false);

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
  }

  const calculateTaskHealthScore = (task: any) => {
    let score = 100;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Status impact
    if (task.status === 'completed') {
      return 100;
    } else if (task.status === 'cancelled') {
      return 0;
    } else if (task.status === 'not_started' && daysUntilDue < 3) {
      score -= 40; // Heavy penalty for not started tasks close to due date
    } else if (task.status === 'in_progress' && daysUntilDue < 0) {
      score -= 30; // Overdue in progress
    }
    
    // Due date impact
    if (daysUntilDue < 0) {
      score -= 30; // Overdue
    } else if (daysUntilDue < 3) {
      score -= 20; // Due soon
    } else if (daysUntilDue < 7) {
      score -= 10; // Due this week
    }
    
    // Priority impact
    if (task.priority === 'high' && task.status === 'not_started') {
      score -= 20; // High priority not started
    } else if (task.priority === 'critical' && task.status !== 'completed') {
      score -= 30; // Critical tasks not completed
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const getTaskHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 40) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTaskHealthLabel = (score: number) => {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "At Risk";
    if (score >= 40) return "Warning";
    return "Critical";
  };;

  // Task helper functions
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_started":
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
      case "not_started":
        return "Belum Dimulai";
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditInitiativeModalOpen(true)}
          >
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

              {/* Progress and Health Summary */}
              <div className="space-y-3">
                {/* Overall Progress */}
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

                {/* Task Health Summary */}
                {tasks && tasks.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-blue-900">Task Health Overview</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-blue-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-2 text-xs">
                              <div className="font-medium">Health Score Calculation:</div>
                              <div className="space-y-1">
                                <div className="text-gray-600">• <span className="font-medium">Status Impact:</span> Completed (100%), Cancelled (0%), Not Started near due date (-40%), Overdue in progress (-30%)</div>
                                <div className="text-gray-600">• <span className="font-medium">Due Date Impact:</span> Overdue (-30%), Due in 3 days (-20%), Due this week (-10%)</div>
                                <div className="text-gray-600">• <span className="font-medium">Priority Impact:</span> High priority not started (-20%), Critical not completed (-30%)</div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {tasks.filter((t: any) => calculateTaskHealthScore(t) >= 80).length}
                        </div>
                        <div className="text-gray-600">Healthy</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-yellow-600">
                          {tasks.filter((t: any) => calculateTaskHealthScore(t) >= 60 && calculateTaskHealthScore(t) < 80).length}
                        </div>
                        <div className="text-gray-600">At Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">
                          {tasks.filter((t: any) => calculateTaskHealthScore(t) >= 40 && calculateTaskHealthScore(t) < 60).length}
                        </div>
                        <div className="text-gray-600">Warning</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">
                          {tasks.filter((t: any) => calculateTaskHealthScore(t) < 40).length}
                        </div>
                        <div className="text-gray-600">Critical</div>
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="space-y-2">
                  {tasks.map((task: any) => (
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
                            {task.assignedTo && task.assignedUser && (
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
                            <Badge 
                              className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80`}
                            >
                              {getTaskStatusLabel(task.status)}
                            </Badge>
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

                        {/* Assigned User Avatars */}
                        {task.assignedTo && task.assignedUser && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex -space-x-2">
                                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white cursor-help">
                                    {task.assignedUser.firstName?.charAt(0)}{task.assignedUser.lastName?.charAt(0)}
                                  </div>
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
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditTask(task)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.id)}
                              className="cursor-pointer text-red-600"
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

      {/* Edit Initiative Modal */}
      {initiative && (
        <InitiativeModal
          keyResultId={(initiative as any).keyResult?.id || ""}
          initiative={initiative}
          open={isEditInitiativeModalOpen}
          onClose={() => setIsEditInitiativeModalOpen(false)}
          onSuccess={() => {
            setIsEditInitiativeModalOpen(false);
            // Refresh initiative data
            queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
          }}
        />
      )}
    </div>
  );
}