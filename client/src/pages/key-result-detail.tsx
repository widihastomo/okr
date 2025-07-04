import React, { useState, Fragment } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Target, TrendingUp, Users, Clock, BarChart3, Edit, Trash2, ChevronRight, Home, ChevronDown, User, Check, CheckCircle2, MoreHorizontal, RefreshCw, MessageSquare, Paperclip, Send, AtSign, Plus } from "lucide-react";
import { CheckInModal } from "@/components/check-in-modal";
import InitiativeModal from "@/components/initiative-modal";
import InitiativeFormModal from "@/components/initiative-form-modal";
import { ProgressStatus } from "@/components/progress-status";
import { format } from "date-fns";
import type { KeyResultWithDetails } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { KeyResultDetailSkeleton } from "@/components/skeletons/detail-page-skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Task schema for editing
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "cancelled"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function KeyResultDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const keyResultId = params.id as string;
  const queryClient = useQueryClient();
  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());
  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [editingInitiative, setEditingInitiative] = useState<any>(null);
  
  // State for task editing
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [showUserMentions, setShowUserMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [addingTaskToInitiative, setAddingTaskToInitiative] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showInitiativeFormModal, setShowInitiativeFormModal] = useState(false);

  // Task form for editing/adding
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; taskData: Partial<TaskFormData> }) => {
      const response = await fetch(`/api/tasks/${data.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.taskData),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/key-results/${keyResultId}/initiatives`],
        refetchType: 'active'
      });
      toast({
        title: "Task berhasil diupdate",
        description: "Perubahan task telah disimpan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setEditTaskOpen(false);
      setEditingTask(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate task",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/key-results/${keyResultId}/initiatives`],
        refetchType: 'active'
      });
      toast({
        title: "Task berhasil dihapus",
        description: "Task telah dihapus dari initiative",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: { initiativeId: string; taskData: TaskFormData }) => {
      const response = await fetch(`/api/initiatives/${data.initiativeId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.taskData),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      return response.json();
    },
    onSuccess: async () => {
      // Force refetch of initiatives data to show new task immediately
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/key-results/${keyResultId}/initiatives`],
        refetchType: 'active'
      });
      
      // Also refresh the key result data
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/key-results/${keyResultId}`],
        refetchType: 'active'
      });
      
      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan ke initiative",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setAddTaskOpen(false);
      setAddingTaskToInitiative(null);
      taskForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat task",
        variant: "destructive",
      });
    },
  });

  // Delete key result mutation
  const deleteKeyResultMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/key-results/${keyResultId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete key result');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Angka Target berhasil dihapus",
        description: "Data telah dihapus secara permanen",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      // Navigate back to the objective detail page
      window.history.back();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus Angka Target",
        variant: "destructive",
      });
    },
  });

  // Handler functions for task edit/delete/add
  const handleAddTask = (initiativeId: string) => {
    setAddingTaskToInitiative(initiativeId);
    taskForm.reset({
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
    });
    setAddTaskOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    const assignedValue = task.assignedTo ? (typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo.id) : "unassigned";
    taskForm.reset({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "not_started",
      priority: task.priority || "medium",
      assignedTo: assignedValue,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
    });
    setEditTaskOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleTaskSubmit = (data: TaskFormData) => {
    const processedData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      assignedTo: data.assignedTo === "unassigned" ? undefined : data.assignedTo || undefined,
    };

    if (editingTask) {
      // Update existing task
      updateTaskMutation.mutate({
        taskId: editingTask.id,
        taskData: processedData
      });
    } else if (addingTaskToInitiative) {
      // Create new task
      createTaskMutation.mutate({
        initiativeId: addingTaskToInitiative,
        taskData: processedData
      });
    }
  };
  
  // Delete initiative mutation
  const deleteInitiativeMutation = useMutation({
    mutationFn: async (initiativeId: string) => {
      const response = await fetch(`/api/initiatives/${initiativeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete initiative');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
      toast({
        title: "Initiative berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus initiative",
        description: error.message || "Terjadi kesalahan saat menghapus initiative",
        variant: "destructive",
      });
    },
  });

  // Create initiative with success metrics mutation
  const createInitiativeWithMetricsMutation = useMutation({
    mutationFn: async (data: { initiative: any; successMetrics: any[] }) => {
      const response = await fetch(`/api/initiatives/with-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyResultId,
          initiative: data.initiative,
          successMetrics: data.successMetrics,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create initiative');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
      setShowInitiativeFormModal(false);
      toast({
        title: "Rencana berhasil dibuat",
        description: "Rencana dengan ukuran keberhasilan telah ditambahkan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat rencana",
        variant: "destructive",
      });
    },
  });

  // Handle delete initiative
  const handleDeleteInitiative = (initiativeId: string) => {
    deleteInitiativeMutation.mutate(initiativeId);
  };

  // Handle edit initiative
  const handleEditInitiative = (initiative: any) => {
    setEditingInitiative(initiative);
  };
  
  // Helper function to toggle initiative expansion
  const toggleInitiativeExpansion = (initiativeId: string) => {
    setExpandedInitiatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(initiativeId)) {
        newSet.delete(initiativeId);
      } else {
        newSet.add(initiativeId);
      }
      return newSet;
    });
  };

  // Helper function to toggle note expansion
  const toggleNoteExpansion = (checkInId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(checkInId)) {
        newSet.delete(checkInId);
      } else {
        newSet.add(checkInId);
      }
      return newSet;
    });
  };

  // Helper function to get confidence level display
  const getConfidenceDisplay = (confidence: number) => {
    const percentage = (confidence / 10) * 100;
    let color = "bg-red-500";
    let label = "Rendah";
    
    if (confidence >= 8) {
      color = "bg-green-500";
      label = "Tinggi";
    } else if (confidence >= 6) {
      color = "bg-yellow-500";
      label = "Sedang";
    }
    
    return { percentage, color, label };
  };

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/update-initiative-progress', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/key-results', keyResultId, 'initiatives'] });
      toast({
        title: "Progress berhasil diperbarui",
        description: `${data.updatedInitiativesCount} initiative telah diperbarui`,
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui progress",
        description: error.message || "Terjadi kesalahan saat memperbarui progress",
        variant: "destructive",
      });
    },
  });

  // Handle manual progress update
  const handleUpdateProgress = () => {
    updateProgressMutation.mutate();
  };

  // Function to update task status
  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // Update local state immediately for better UX
      setTaskStatuses(prev => ({
        ...prev,
        [taskId]: newStatus
      }));

      // Make API call to update task status
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      toast({
        title: "Status berhasil diperbarui",
        description: `Task status berhasil diubah ke ${newStatus}`,
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Invalidate queries to refresh data including nested tasks
      await queryClient.invalidateQueries({
        queryKey: [`/api/key-results/${keyResultId}/initiatives`]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status task",
        variant: "destructive",
      });
      
      // Revert local state on error
      setTaskStatuses(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    }
  };
  
  const { data: keyResult, isLoading } = useQuery<KeyResultWithDetails>({
    queryKey: [`/api/key-results/${keyResultId}`],
    enabled: !!keyResultId,
  });

  const { data: initiatives, isLoading: initiativesLoading } = useQuery<any[]>({
    queryKey: [`/api/key-results/${keyResultId}/initiatives`],
    enabled: !!keyResultId,
  });

  // Get objective data to access cycle information
  const { data: objective } = useQuery<any>({
    queryKey: [`/api/objectives/${keyResult?.objectiveId}`],
    enabled: !!keyResult?.objectiveId,
  });

  // Get cycle data for progress calculations
  const { data: cycle } = useQuery<any>({
    queryKey: [`/api/cycles/${objective?.cycleId}`],
    enabled: !!objective?.cycleId,
  });

  // Fetch users data for name lookup
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    if (!userId || !users) return 'Unknown User';
    const user = users.find((u: any) => u.id === userId);
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`;
  };

  // Helper function to get user initials safely
  const getUserInitials = (userId: string) => {
    if (!userId || !users) return 'U';
    const user = users.find((u: any) => u.id === userId);
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  // Helper function to get tasks for a specific initiative
  const getTasksForInitiative = (initiativeId: string) => {
    if (!expandedInitiatives.has(initiativeId)) return [];
    // Get real tasks from initiative data
    const initiative = initiatives?.find(init => init.id === initiativeId);
    return initiative?.tasks || [];
  };

  // Helper function to get status badge variant and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return {
          variant: "default" as const,
          label: "Selesai",
          icon: <CheckCircle2 className="h-3 w-3" />,
          color: "text-green-600"
        };
      case "in_progress":
        return {
          variant: "secondary" as const,
          label: "Sedang Dikerjakan",
          icon: <Clock className="h-3 w-3" />,
          color: "text-blue-600"
        };
      case "pending":
        return {
          variant: "outline" as const,
          label: "Pending",
          icon: <Calendar className="h-3 w-3" />,
          color: "text-yellow-600"
        };
      case "blocked":
        return {
          variant: "destructive" as const,
          label: "Blocked",
          icon: <Trash2 className="h-3 w-3" />,
          color: "text-red-600"
        };
      default:
        return {
          variant: "outline" as const,
          label: "Not Started",
          icon: <Calendar className="h-3 w-3" />,
          color: "text-gray-600"
        };
    }
  };

  const handleInitiativeSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/key-results/${keyResultId}/initiatives`]
    });
  };

  // Prepare chart data from check-ins with diagonal guideline
  const prepareChartData = () => {
    // Get dates from objective's cycle
    let startDate = new Date(2025, 0, 1); // Default fallback
    let endDate = new Date(2025, 2, 31);   // Default fallback
    
    if (objective && objective.cycle) {
      startDate = new Date(objective.cycle.startDate);
      endDate = new Date(objective.cycle.endDate);
    }
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (!keyResult?.checkIns || keyResult.checkIns.length === 0) {
      // Return empty array if no check-ins exist
      return [];
    }

    // Sort check-ins by date
    const sortedCheckIns = [...keyResult.checkIns].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    // Calculate progress for each check-in
    const chartData = [];
    
    // Add start point (0% at start date)
    chartData.push({
      date: format(startDate, "dd MMM"),
      actual: 0,
      ideal: 0,
      guideline: 0
    });

    sortedCheckIns.forEach((checkIn) => {
      // Calculate actual progress
      const current = parseFloat(checkIn.value);
      const target = parseFloat(keyResult.targetValue);
      const base = parseFloat(keyResult.baseValue || "0");
      
      let actualProgress = 0;
      
      switch (keyResult.keyResultType) {
        case "increase_to":
          // Formula: (Current - Base) / (Target - Base) * 100%
          if (target <= base) {
            actualProgress = 0; // Invalid configuration
          } else {
            actualProgress = ((current - base) / (target - base)) * 100;
            actualProgress = Math.min(100, Math.max(0, actualProgress));
          }
          break;
          
        case "decrease_to":
          // Formula: (Base - Current) / (Base - Target) * 100%
          if (base <= target) {
            actualProgress = 0; // Invalid configuration
          } else {
            actualProgress = ((base - current) / (base - target)) * 100;
            actualProgress = Math.min(100, Math.max(0, actualProgress));
          }
          break;
          
        case "should_stay_above":
          // Binary: 100% if current >= target, 0% otherwise
          actualProgress = current >= target ? 100 : 0;
          break;
          
        case "should_stay_below":
          // Binary: 100% if current <= target, 0% otherwise
          actualProgress = current <= target ? 100 : 0;
          break;
          
        case "achieve_or_not":
          // Binary: 100% if current >= target, 0% otherwise
          actualProgress = current >= target ? 100 : 0;
          break;
          
        default:
          actualProgress = 0;
          break;
      }

      // Calculate ideal progress based on time
      const checkInDate = new Date(checkIn.createdAt || Date.now());
      const daysPassed = Math.max(0, Math.ceil((checkInDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const idealProgress = Math.min((daysPassed / totalDays) * 100, 100);
      
      // Calculate guideline progress (diagonal from 0% to 100%)
      const guidelineProgress = Math.min((daysPassed / totalDays) * 100, 100);

      chartData.push({
        date: format(checkInDate, "dd MMM"),
        actual: Math.max(0, Math.min(100, actualProgress)),
        ideal: Math.max(0, Math.min(100, idealProgress)),
        guideline: guidelineProgress
      });
    });
    
    // Add end point (100% at end date) if we have any check-ins
    const lastCheckIn = sortedCheckIns[sortedCheckIns.length - 1];
    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn.createdAt || Date.now());
      
      // Only add end point if last check-in is before end date
      if (lastCheckInDate < endDate) {
        chartData.push({
          date: format(endDate, "dd MMM"),
          actual: null, // Don't extend actual progress line
          ideal: 100,
          guideline: 100
        });
      }
    }

    return chartData;
  };

  const chartData = keyResult ? prepareChartData() : [];

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "currency":
        return "Rp";
      case "number":
        return "";
      default:
        return unit;
    }
  };

  const formatValue = (value: string, unit: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (unit === "currency") {
      return `Rp ${numValue.toLocaleString('id-ID')}`;
    } else if (unit === "percentage") {
      return `${numValue.toFixed(1)}%`;
    } else {
      return numValue.toLocaleString('id-ID');
    }
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    const baseNum = baseValue ? parseFloat(baseValue) : 0;
    
    if (isNaN(currentNum) || isNaN(targetNum)) return 0;
    
    if (keyResultType === "achieve_or_not") {
      return currentNum >= targetNum ? 100 : 0;
    } else if (keyResultType === "decrease_to") {
      if (baseNum === 0) return 0;
      return Math.max(0, Math.min(100, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
    } else {
      return Math.max(0, Math.min(100, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
    }
    return 0;
  };

  if (isLoading) {
    return <KeyResultDetailSkeleton />;
  }

  if (!keyResult) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Angka Target tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Angka Target yang Anda cari tidak dapat ditemukan.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(
    keyResult.currentValue,
    keyResult.targetValue,
    keyResult.keyResultType,
    keyResult.baseValue
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      on_track: "bg-green-100 text-green-800 border-green-200",
      at_risk: "bg-yellow-100 text-yellow-800 border-yellow-200",
      behind: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      ahead: "bg-purple-100 text-purple-800 border-purple-200"
    };

    const statusLabels = {
      on_track: "On Track",
      at_risk: "At Risk", 
      behind: "Behind",
      completed: "Completed",
      ahead: "Ahead"
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  return (
    <>
    <div className="p-6">
      

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <CheckInModal 
            keyResultId={keyResult.id}
            keyResultTitle={keyResult.title}
            currentValue={keyResult.currentValue}
            targetValue={keyResult.targetValue}
            unit={keyResult.unit}
            keyResultType={keyResult.keyResultType}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit Angka Target
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 hover:text-red-700"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Angka Target
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="w-full">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Key Result Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Angka Target Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{keyResult.title}</h1>
                {keyResult.description && (
                  <p className="text-gray-600 mb-3">{keyResult.description}</p>
                )}
                
                {/* Key Result Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {keyResult.keyResultType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Unit:</span>
                    <Badge variant="outline" className="text-xs">
                      {keyResult.unit}
                    </Badge>
                  </div>
                  {keyResult.lastUpdated && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Last Updated:</span>
                      <span className="text-gray-500 text-xs">
                        {format(new Date(keyResult.lastUpdated), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="font-semibold text-blue-600">
                    {formatValue(keyResult.currentValue, keyResult.unit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Target</p>
                  <p className="font-semibold text-green-600">
                    {formatValue(keyResult.targetValue, keyResult.unit)}
                  </p>
                </div>
                {keyResult.baseValue && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Base</p>
                    <p className="font-semibold text-gray-600">
                      {formatValue(keyResult.baseValue, keyResult.unit)}
                    </p>
                  </div>
                )}
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="font-semibold text-purple-600">{progress.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  {/* Ideal Progress Threshold Indicator */}
                  {(() => {
                    if (!cycle) return null;
                    
                    const now = new Date();
                    const cycleStart = new Date(cycle.startDate);
                    const keyResultEnd = new Date(cycle.endDate);
                    
                    if (now < cycleStart) return null;
                    
                    const totalDuration = keyResultEnd.getTime() - cycleStart.getTime();
                    const elapsed = now.getTime() - cycleStart.getTime();
                    const idealProgress = Math.min((elapsed / totalDuration) * 100, 100);
                    
                    if (idealProgress <= 0 || idealProgress >= 100) return null;
                    
                    return (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10"
                        style={{ left: `${idealProgress}%` }}
                        title={`Ideal progress: ${idealProgress.toFixed(1)}%`}
                      />
                    );
                  })()}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Current Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-0.5 h-3 bg-gray-600"></div>
                    <span>Ideal Target</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                {keyResult.status && getStatusBadge(keyResult.status)}
              </div>
            </CardContent>
          </Card>

          {/* Achievement Chart and Progress History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Achievement Chart */}
            {chartData.length > 0 && (
              <Card className="lg:col-span-8">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Achievement
                  </CardTitle>
                  <CardDescription>
                    Progress tracking over time compared to ideal timeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const actualData = payload.find(p => p.dataKey === 'actual');
                              const idealData = payload.find(p => p.dataKey === 'ideal');
                              const guidelineData = payload.find(p => p.dataKey === 'guideline');
                              
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-medium text-gray-900 mb-2">{label}</p>
                                  <div className="space-y-1">
                                    {actualData && actualData.value && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600">Actual Progress:</span>
                                        <span className="text-sm font-medium">{Number(actualData.value).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {guidelineData && guidelineData.value && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-gray-600 border-dashed rounded-full"></div>
                                        <span className="text-sm text-gray-600">Target Guideline:</span>
                                        <span className="text-sm font-medium">{Number(guidelineData.value).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {idealData && idealData.value && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-gray-400 border-dashed rounded-full"></div>
                                        <span className="text-sm text-gray-600">Current Ideal:</span>
                                        <span className="text-sm font-medium">{Number(idealData.value).toFixed(1)}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#actualGradient)"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="guideline"
                          stroke="#6b7280"
                          strokeWidth={2}
                          strokeDasharray="8 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="ideal"
                          stroke="#9ca3af"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress History */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {keyResult.checkIns && keyResult.checkIns.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {keyResult.checkIns
                      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      .map((checkIn) => (
                      <div key={checkIn.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-blue-600">
                              {formatValue(checkIn.value, keyResult.unit)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {checkIn.createdAt ? format(new Date(checkIn.createdAt), "MMM dd") : "Unknown"}
                            </p>
                          </div>
                          {checkIn.notes && (
                            <div className="mt-1">
                              <p className={`text-sm text-gray-600 ${
                                expandedNotes.has(checkIn.id) ? '' : 'line-clamp-2'
                              }`}>
                                {checkIn.notes}
                              </p>
                              {checkIn.notes.length > 100 && (
                                <button
                                  onClick={() => toggleNoteExpansion(checkIn.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                                >
                                  {expandedNotes.has(checkIn.id) ? 'View Less' : 'View More'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {checkIn.confidence && (
                              <div className="flex items-center gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${getConfidenceDisplay(checkIn.confidence).color}`}
                                        style={{ width: `${getConfidenceDisplay(checkIn.confidence).percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">
                                      {checkIn.confidence}/10
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">{getConfidenceDisplay(checkIn.confidence).label}</span> - {' '}
                                    {checkIn.confidence >= 8 ? 'Sangat yakin target tercapai' :
                                     checkIn.confidence >= 6 ? 'Cukup optimis dengan progress' :
                                     'Butuh perhatian lebih untuk mencapai target'}
                                  </div>
                                </div>
                              </div>
                            )}
                            {checkIn.createdBy && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {getUserName(checkIn.createdBy).charAt(0).toUpperCase()}
                                </div>
                                <span>{getUserName(checkIn.createdBy)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No updates yet</p>
                    <p className="text-sm">Add your first update to track progress over time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Initiatives Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Initiatives
                  </CardTitle>
                  <CardDescription>
                    Strategic actions and projects to achieve this key result
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowInitiativeFormModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Rencana
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {initiativesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : initiatives && initiatives.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initiatives.map((initiative) => {
                      const isExpanded = expandedInitiatives.has(initiative.id);
                      const tasks = getTasksForInitiative(initiative.id);

                      return (
                        <Fragment key={initiative.id}>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleInitiativeExpansion(initiative.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <Link href={`/initiatives/${initiative.id}`}>
                                    <p className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">
                                      {initiative.title}
                                    </p>
                                  </Link>
                                  
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                initiative.status === "completed" ? "default" : 
                                initiative.status === "in_progress" ? "secondary" :
                                initiative.status === "on_hold" ? "destructive" :
                                "outline"
                              }>
                                {initiative.status?.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                initiative.priority === "critical" ? "destructive" :
                                initiative.priority === "high" ? "secondary" :
                                "outline"
                              }>
                                {initiative.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${initiative.progressPercentage || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {initiative.progressPercentage || 0}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {initiative.dueDate ? (
                                <span className={`text-sm ${
                                  new Date(initiative.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {format(new Date(initiative.dueDate), "MMM dd, yyyy")}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditInitiative(initiative)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Initiative</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus initiative "{initiative.title}"? 
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteInitiative(initiative.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expandable Tasks Section */}
                          {isExpanded && (
                            <TableRow key={`${initiative.id}-tasks`}>
                              <TableCell colSpan={6} className="p-0">
                                <div className="bg-gray-50 p-4 border-l-4 border-blue-500">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      Tasks ({tasks?.length || 0})
                                    </h4>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddTask(initiative.id)}
                                      className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-3"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Tambah Task
                                    </Button>
                                  </div>
                                  {tasks && tasks.length > 0 ? (
                                    <div className="space-y-2">
                                      {tasks.map((task: any) => {
                                        const statusDisplay = getStatusDisplay(task.status);
                                        return (
                                          <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <p 
                                                    className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                                    onClick={() => setSelectedTask(task)}
                                                  >
                                                    {task.title}
                                                  </p>
                                                  <div className="flex items-center gap-1">
                                                    {statusDisplay.icon}
                                                    <span className={`text-xs font-medium ${statusDisplay.color}`}>
                                                      {statusDisplay.label}
                                                    </span>
                                                  </div>
                                                </div>
                                                {task.description && (
                                                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                  {task.assignedTo && (
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                        {getUserName(task.assignedTo).charAt(0).toUpperCase()}
                                                      </div>
                                                      <span>{getUserName(task.assignedTo)}</span>
                                                    </div>
                                                  )}
                                                  {task.dueDate && (
                                                    <span className={
                                                      new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                                                    }>
                                                      {format(new Date(task.dueDate), "MMM dd")}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge variant={
                                                  task.priority === "critical" ? "destructive" :
                                                  task.priority === "high" ? "secondary" :
                                                  "outline"
                                                } className="text-xs">
                                                  {task.priority}
                                                </Badge>
                                                <Select
                                                  value={taskStatuses[task.id] || task.status}
                                                  onValueChange={(newStatus) => handleTaskStatusUpdate(task.id, newStatus)}
                                                >
                                                  <SelectTrigger className="w-32 h-8 text-xs">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="not_started">Belum Dimulai</SelectItem>
                                                    <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="blocked">Blocked</SelectItem>
                                                    <SelectItem value="completed">Selesai</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                      <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                                      <Edit className="h-4 w-4 mr-2" />
                                                      Edit Task
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                          <Trash2 className="h-4 w-4 mr-2" />
                                                          Delete Task
                                                        </DropdownMenuItem>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                          <AlertDialogTitle>Hapus Task</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                            Apakah Anda yakin ingin menghapus task "{task.title}"? Tindakan ini tidak dapat dibatalkan.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel>Batal</AlertDialogCancel>
                                                          <AlertDialogAction
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                          >
                                                            Hapus
                                                          </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                    </AlertDialog>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No tasks available</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No initiatives yet</p>
                  <p className="text-sm">Create your first initiative to start working towards this key result.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    
    {/* Edit Initiative Modal */}
    {editingInitiative && (
      <InitiativeModal 
        keyResultId={keyResultId}
        editingInitiative={editingInitiative}
        onClose={() => setEditingInitiative(null)}
      />
    )}

    {/* Initiative Form Modal with Success Metrics */}
    <InitiativeFormModal
      isOpen={showInitiativeFormModal}
      onClose={() => setShowInitiativeFormModal(false)}
      onSubmit={createInitiativeWithMetricsMutation.mutate}
      keyResultId={keyResultId}
      users={users || []}
      keyResults={keyResult ? [{
        id: keyResult.id,
        title: keyResult.title,
        currentValue: Number(keyResult.currentValue) || 0,
        targetValue: Number(keyResult.targetValue) || 0,
        unit: keyResult.unit || 'number'
      }] : []}
      isLoading={createInitiativeWithMetricsMutation.isPending}
    />

    {/* Edit Task Modal */}
    <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...taskForm}>
          <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-4">
            <FormField
              control={taskForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={taskForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={taskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Belum Dimulai</SelectItem>
                        <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={taskForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={taskForm.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={taskForm.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTaskOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Add Task Modal */}
    <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Task Baru</DialogTitle>
          <DialogDescription>
            Buat task baru untuk initiative ini.
          </DialogDescription>
        </DialogHeader>
        <Form {...taskForm}>
          <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-4">
            <FormField
              control={taskForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={taskForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={taskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Belum Dimulai</SelectItem>
                        <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={taskForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={taskForm.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={taskForm.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Creating..." : "Buat Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Comprehensive Task Detail Modal */}
    <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            {selectedTask?.title}
          </SheetTitle>
          <SheetDescription className="text-gray-600">
            Task Details & Discussion
          </SheetDescription>
        </SheetHeader>

        {selectedTask && (
          <div className="mt-6 space-y-6">
            {/* Task Information Card */}
            <div className="bg-white border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Task Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const statusDisplay = getStatusDisplay(selectedTask.status);
                      return (
                        <>
                          {statusDisplay.icon}
                          <span className={`text-sm font-medium ${statusDisplay.color}`}>
                            {statusDisplay.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority</p>
                  <Badge variant={
                    selectedTask.priority === "critical" ? "destructive" :
                    selectedTask.priority === "high" ? "secondary" :
                    "outline"
                  } className="mt-1">
                    {selectedTask.priority}
                  </Badge>
                </div>
                
                {selectedTask.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Assigned To</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {getUserInitials(selectedTask.assignedTo)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900">{getUserName(selectedTask.assignedTo)}</span>
                    </div>
                  </div>
                )}
                
                {selectedTask.dueDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Due Date</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${
                        new Date(selectedTask.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {format(new Date(selectedTask.dueDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedTask.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedTask.description}
                  </p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Comments & Discussion</h3>
              </div>

              {/* Sample Comments */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Admin User</span>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Great progress on this task! The implementation looks solid. Let me know if you need any help with the final testing phase.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">John Doe</span>
                        <span className="text-xs text-gray-500">1 hour ago</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Thanks <span className="text-blue-600 font-medium">@Admin User</span>! I've completed the core functionality. Just need to run the integration tests and we should be good to go.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <div className="border-t pt-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      YOU
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="relative">
                      <Textarea
                        placeholder="Add a comment... Use @ to mention team members"
                        value={commentText}
                        onChange={(e) => {
                          setCommentText(e.target.value);
                          // Check for @ mentions
                          const cursorPosition = e.target.selectionStart;
                          const text = e.target.value;
                          const lastAtIndex = text.lastIndexOf('@', cursorPosition);
                          if (lastAtIndex !== -1 && lastAtIndex === cursorPosition - 1) {
                            setShowUserMentions(true);
                            setMentionPosition(lastAtIndex);
                          } else {
                            setShowUserMentions(false);
                          }
                        }}
                        className="min-h-[80px] resize-none"
                      />
                      
                      {/* User Mentions Dropdown */}
                      {showUserMentions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                          <div className="p-2 text-xs text-gray-500 border-b">Mention team members:</div>
                          {users?.filter((user: any) => user.firstName && user.lastName).map((user: any) => (
                            <div
                              key={user.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                              onClick={() => {
                                const beforeMention = commentText.substring(0, mentionPosition);
                                const afterMention = commentText.substring(mentionPosition + 1);
                                const fullName = `${user.firstName} ${user.lastName}`;
                                setCommentText(`${beforeMention}@${fullName} ${afterMention}`);
                                setShowUserMentions(false);
                              }}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                  {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-900">{user.firstName} {user.lastName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <Paperclip className="h-4 w-4 mr-1" />
                          Attach File
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <AtSign className="h-4 w-4 mr-1" />
                          Mention
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={!commentText.trim()}
                        onClick={() => {
                          // Here you would handle comment submission
                          console.log('Comment:', commentText);
                          setCommentText("");
                          toast({
                            title: "Comment added",
                            description: "Your comment has been posted successfully.",
                            className: "border-green-200 bg-green-50 text-green-800",
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Attachments</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                  <div className="p-2 bg-blue-100 rounded">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">task-requirements.pdf</p>
                    <p className="text-xs text-gray-500">2.3 MB • Uploaded 2 hours ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                  <div className="p-2 bg-green-100 rounded">
                    <Paperclip className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">mockup-design.png</p>
                    <p className="text-xs text-gray-500">1.8 MB • Uploaded 1 day ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Input type="file" className="flex-1" />
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>

    {/* Delete Key Result Confirmation Dialog */}
    <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Angka Target</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus angka target "{keyResult?.title}"? 
            Semua data terkait termasuk rencana dan tugas akan ikut terhapus secara permanen. 
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteKeyResultMutation.mutate();
              setShowDeleteConfirmation(false);
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}