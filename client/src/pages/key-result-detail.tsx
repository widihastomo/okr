import React, { useState, Fragment } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Target, TrendingUp, Users, Clock, BarChart3, Edit, Trash2, ChevronRight, Home, ChevronDown, User, Check, CheckCircle2, MoreHorizontal, RefreshCw, MessageSquare, Paperclip, Send, AtSign, Plus, Eye } from "lucide-react";
import { CheckInModal } from "@/components/check-in-modal";
import InitiativeFormModal from "@/components/initiative-form-modal";
import { ProgressStatus } from "@/components/progress-status";
import EditKeyResultModal from "@/components/edit-key-result-modal";
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
  const [showEditKeyResultModal, setShowEditKeyResultModal] = useState(false);

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
        description: error.message || "Gagal membuat inisiatif",
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
    if (!user) {
      return 'Unknown User';
    }
    
    // Use consolidated name field
    if (user.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'Unknown User';
  };

  // Helper function to get user initials safely
  const getUserInitials = (userId: string) => {
    if (!userId || !users) return 'U';
    const user = users.find((u: any) => u.id === userId);
    if (!user) return 'U';
    const name = user.name || "";
    if (name && name.trim() !== '') {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  // Helper function to get user profile image URL
  const getUserProfileImage = (userId: string): string | undefined => {
    if (!userId || !users) return undefined;
    const user = users.find((u: any) => u.id === userId);
    return user?.profileImageUrl || undefined;
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

  // Handler for edit key result
  const handleEditKeyResult = () => {
    setShowEditKeyResultModal(true);
  };

  // Handler for edit key result success
  const handleEditKeyResultSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/key-results/${keyResultId}`]
    });
    queryClient.invalidateQueries({
      queryKey: [`/api/objectives/${keyResult?.objectiveId}`]
    });
    setShowEditKeyResultModal(false);
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
    // Pre-computed status configurations for better performance
    const statusConfig = {
      on_track: { label: "Sesuai Target", className: "bg-green-100 text-green-800 border-green-200" },
      at_risk: { label: "Berisiko", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      behind: { label: "Tertinggal", className: "bg-red-100 text-red-800 border-red-200" },
      completed: { label: "Selesai", className: "bg-blue-100 text-blue-800 border-blue-200" },
      ahead: { label: "Lebih Cepat", className: "bg-purple-100 text-purple-800 border-purple-200" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-gray-100 text-gray-800 border-gray-200" 
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
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
              <DropdownMenuItem onClick={handleEditKeyResult}>
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
                {keyResult.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="mb-6">
                {keyResult.description && (
                  <p className="text-gray-600 mb-3">{keyResult.description}</p>
                )}
                
                {/* Key Result Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Tipe:</span>
                    <Badge variant="outline" className="text-xs">
                      {(() => {
                        const typeLabels = {
                          increase_to: 'Peningkatan',
                          decrease_to: 'Penurunan',
                          achieve_or_not: 'Ya/Tidak'
                        };
                        return typeLabels[keyResult.keyResultType as keyof typeof typeLabels] || keyResult.keyResultType.replace('_', ' ');
                      })()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Unit:</span>
                    <Badge variant="outline" className="text-xs">
                      {keyResult.unit}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">PIC:</span>
                    {keyResult.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage 
                            src={getUserProfileImage(keyResult.assignedTo)} 
                            alt={getUserName(keyResult.assignedTo)}
                          />
                          <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                            {getUserInitials(keyResult.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-700 font-medium">
                          {getUserName(keyResult.assignedTo)}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        Belum ditugaskan
                      </Badge>
                    )}
                  </div>
                  {keyResult.lastUpdated && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Terakhir Diperbarui:</span>
                      <span className="text-gray-500 text-xs">
                        {format(new Date(keyResult.lastUpdated), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Saat Ini</p>
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
                    <span>Progress Saat Ini</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-0.5 h-3 bg-gray-600"></div>
                    <span>Target Ideal</span>
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
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pencapaian
                </CardTitle>
                <CardDescription>
                  Pelacakan progress dari waktu ke waktu dibandingkan dengan timeline ideal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
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
                                        <span className="text-sm text-gray-600">Progress Aktual:</span>
                                        <span className="text-sm font-medium">{Number(actualData.value).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {guidelineData && guidelineData.value && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-gray-600 border-dashed rounded-full"></div>
                                        <span className="text-sm text-gray-600">Panduan Target:</span>
                                        <span className="text-sm font-medium">{Number(guidelineData.value).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {idealData && idealData.value && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-gray-400 border-dashed rounded-full"></div>
                                        <span className="text-sm text-gray-600">Ideal Saat Ini:</span>
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
                ) : (
                  <div className="h-80 w-full flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 font-medium mb-2">Belum ada data pencapaian</p>
                      <p className="text-sm text-gray-500">
                        Mulai melacak progress dengan menambahkan check-in pertama
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress History */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Riwayat Progress
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
                                  {expandedNotes.has(checkIn.id) ? 'Lihat Lebih Sedikit' : 'Lihat Lebih Banyak'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            
                            {checkIn.createdBy && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage 
                                    src={getUserProfileImage(checkIn.createdBy)} 
                                    alt={getUserName(checkIn.createdBy)}
                                  />
                                  <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                    {getUserInitials(checkIn.createdBy)}
                                  </AvatarFallback>
                                </Avatar>
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
                    <p>Belum ada update</p>
                    <p className="text-sm">Tambahkan update pertama untuk melacak progress dari waktu ke waktu.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Initiatives Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Inisiatif
                  </CardTitle>
                  <CardDescription>
                    Tindakan strategis dan proyek untuk mencapai hasil kunci ini
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowInitiativeFormModal(true)}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white w-full md:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Inisiatif
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
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Inisiatif
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Prioritas
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Progress
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PIC
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Deadline
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {initiatives
                            .sort((a, b) => {
                              const scoreA = parseFloat(a.priorityScore || "0");
                              const scoreB = parseFloat(b.priorityScore || "0");
                              return scoreB - scoreA;
                            })
                            .map((initiative) => {
                              const rawScore = initiative.priorityScore;
                              const score = parseFloat(rawScore || "0");
                              
                              let color: string;
                              let label: string;
                              
                              if (score >= 4.0) {
                                color = "bg-red-100 text-red-800";
                                label = "Kritis";
                              } else if (score >= 3.0) {
                                color = "bg-orange-100 text-orange-800";
                                label = "Tinggi";
                              } else if (score >= 2.0) {
                                color = "bg-yellow-100 text-yellow-800";
                                label = "Sedang";
                              } else {
                                color = "bg-green-100 text-green-800";
                                label = "Rendah";
                              }

                              return (
                                <tr key={initiative.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="ml-4">
                                        <Link href={`/initiatives/${initiative.id}`}>
                                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                            {initiative.title}
                                          </div>
                                        </Link>
                                        {initiative.description && (
                                          <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {initiative.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Badge variant={
                                      initiative.status === "completed" ? "default" : 
                                      initiative.status === "in_progress" ? "secondary" :
                                      initiative.status === "on_hold" ? "destructive" :
                                      "outline"
                                    }>
                                      {(() => {
                                        const statusLabels = {
                                          draft: 'Draft',
                                          sedang_berjalan: 'Sedang Berjalan',
                                          selesai: 'Selesai',
                                          dibatalkan: 'Dibatalkan',
                                          completed: 'Selesai',
                                          in_progress: 'Sedang Berjalan',
                                          on_hold: 'Ditunda'
                                        };
                                        return statusLabels[initiative.status as keyof typeof statusLabels] || initiative.status || 'Belum Dimulai';
                                      })()}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${color} text-xs px-2 py-0.5`}>
                                        {label}
                                      </Badge>
                                      <span className="text-xs text-gray-400">
                                        {score.toFixed(1)}/5.0
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${(() => {
                                            const progress = initiative.progressPercentage || 0;
                                            if (progress >= 100) return "bg-green-600";
                                            if (progress >= 80) return "bg-green-500";
                                            if (progress >= 60) return "bg-orange-500";
                                            return "bg-red-500";
                                          })()}`}
                                          style={{ width: `${initiative.progressPercentage || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        {initiative.progressPercentage || 0}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {initiative.picId ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage 
                                            src={getUserProfileImage(initiative.picId)} 
                                            alt={getUserName(initiative.picId)}
                                          />
                                          <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                            {getUserInitials(initiative.picId)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-gray-900">
                                          {getUserName(initiative.picId)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">
                                        Tidak ditugaskan
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {initiative.dueDate ? (
                                      <span className={
                                        new Date(initiative.dueDate) < new Date()
                                          ? "text-red-600 font-medium"
                                          : "text-gray-600"
                                      }>
                                        {new Date(initiative.dueDate).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setLocation(`/initiatives/${initiative.id}`)}>
                                          <Eye className="mr-2 h-4 w-4" />
                                          Lihat Detail
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditInitiative(initiative)}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Ubah
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => handleDeleteInitiative(initiative.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Hapus
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="space-y-3 md:hidden">
                    {initiatives
                      .sort((a, b) => {
                        const scoreA = parseFloat(a.priorityScore || "0");
                        const scoreB = parseFloat(b.priorityScore || "0");
                        return scoreB - scoreA;
                      })
                      .map((initiative) => {
                        const rawScore = initiative.priorityScore;
                        const score = parseFloat(rawScore || "0");
                        
                        let color: string;
                        let label: string;
                        
                        if (score >= 4.0) {
                          color = "bg-red-100 text-red-800";
                          label = "Kritis";
                        } else if (score >= 3.0) {
                          color = "bg-orange-100 text-orange-800";
                          label = "Tinggi";
                        } else if (score >= 2.0) {
                          color = "bg-yellow-100 text-yellow-800";
                          label = "Sedang";
                        } else {
                          color = "bg-green-100 text-green-800";
                          label = "Rendah";
                        }

                        return (
                          <Card key={initiative.id} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <Link href={`/initiatives/${initiative.id}`}>
                                  <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 text-sm">
                                    {initiative.title}
                                  </h3>
                                </Link>
                                {initiative.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {initiative.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setLocation(`/initiatives/${initiative.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Lihat Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditInitiative(initiative)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Ubah
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleDeleteInitiative(initiative.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={`${color} text-xs px-2 py-0.5`}>
                                    {label}
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    {score.toFixed(1)}/5.0
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-gray-900">
                                  {initiative.progressPercentage || 0}%
                                </span>
                              </div>

                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${(() => {
                                    const progress = initiative.progressPercentage || 0;
                                    if (progress >= 100) return "bg-green-600";
                                    if (progress >= 80) return "bg-green-500";
                                    if (progress >= 60) return "bg-orange-500";
                                    return "bg-red-500";
                                  })()}`}
                                  style={{
                                    width: `${initiative.progressPercentage || 0}%`,
                                  }}
                                ></div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  {initiative.picId ? (
                                    <>
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage 
                                          src={getUserProfileImage(initiative.picId)} 
                                          alt={getUserName(initiative.picId)}
                                        />
                                        <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                          {getUserInitials(initiative.picId)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-gray-600 truncate">
                                        {getUserName(initiative.picId)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">
                                      Tidak ditugaskan
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  {initiative.startDate && (
                                    <div className="text-xs text-gray-500">
                                      Mulai: {new Date(initiative.startDate).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </div>
                                  )}
                                  {initiative.dueDate ? (
                                    <div
                                      className={
                                        new Date(initiative.dueDate) < new Date()
                                          ? "text-red-600 font-medium"
                                          : "text-gray-600"
                                      }
                                    >
                                      Selesai: {new Date(initiative.dueDate).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400">Selesai: -</div>
                                  )}
                                </div>
                              </div>

                              {initiative.budget && (
                                <div className="pt-2 border-t border-gray-100">
                                  <span className="text-xs text-gray-500">
                                    Budget: Rp {parseFloat(initiative.budget).toLocaleString("id-ID")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada inisiatif</p>
                  <p className="text-sm">Buat inisiatif pertama untuk mulai bekerja menuju hasil kunci ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    
    {/* Edit Initiative Modal */}
    {editingInitiative && (
      <InitiativeFormModal 
        initiative={editingInitiative}
        open={true}
        onOpenChange={(open) => {
          if (!open) setEditingInitiative(null);
        }}
        keyResultId={keyResultId}
        onSuccess={() => {
          setEditingInitiative(null);
          queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
        }}
      />
    )}

    {/* Initiative Form Modal with Success Metrics */}
    <InitiativeFormModal
      open={showInitiativeFormModal}
      onOpenChange={(open) => setShowInitiativeFormModal(open)}
      keyResultId={keyResultId}
      onSuccess={() => {
        setShowInitiativeFormModal(false);
        queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
      }}
    />

    {/* Edit Task Modal */}
    <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Perbarui detail task di bawah ini.
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
                    <FormLabel>Prioritas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Rendah</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="critical">Kritis</SelectItem>
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
                  <FormLabel>Ditugaskan Kepada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pengguna" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Tidak Ditugaskan</SelectItem>
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
                Batal
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                Perbarui Task
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
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
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
                        <AvatarImage src={getUserProfileImage(selectedTask.assignedTo)} alt={getUserName(selectedTask.assignedTo)} />
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
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
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

    {/* Edit Key Result Modal */}
    {keyResult && (
      <EditKeyResultModal
        open={showEditKeyResultModal}
        onOpenChange={setShowEditKeyResultModal}
        keyResult={keyResult}
        onSuccess={handleEditKeyResultSuccess}
      />
    )}

    {/* Delete Key Result Confirmation Dialog */}
    <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Angka Target</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus angka target "{keyResult?.title}"? 
            Semua data terkait termasuk inisiatif dan tugas akan ikut terhapus secara permanen. 
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
    
    </div>
  );
}