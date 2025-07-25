import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  HelpCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Target,
  Trash2,
  CalendarIcon,
  Edit,
  TrendingUp,
  ListTodo,
} from "lucide-react";
import InitiativeTaskModal from "@/components/initiative-task-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { SearchableKeyResultSelect } from "@/components/ui/searchable-key-result-select";
import { useAuth } from "@/hooks/useAuth";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Initiative, KeyResult, User } from "@shared/schema";

// Helper function to get user name with fallback
const getUserName = (user: User): string => {
  if (user.name?.trim()) {
    return user.name.trim();
  }
  // Fallback to email username
  return user.email?.split("@")[0] || "Unknown";
};

// Helper function to get user initials
const getUserInitials = (user: User): string => {
  if (user.name?.trim()) {
    return user.name
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }
  // Fallback to email username
  const username = user.email?.split("@")[0] || "U";
  return username.substring(0, 2).toUpperCase();
};

// Helper function to get task status label
const getTaskStatusLabel = (status: string): string => {
  const statusLabels = {
    not_started: "Belum Dimulai",
    in_progress: "Sedang Dikerjakan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

// Helper function to get task priority label
const getTaskPriorityLabel = (priority: string): string => {
  const priorityLabels = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
    critical: "Kritis",
  };
  return priorityLabels[priority as keyof typeof priorityLabels] || priority;
};

// Helper function to format number with thousand separators
const formatNumberWithSeparator = (value: string): string => {
  if (!value) return '';
  
  // Handle decimal values - remove .00 if it's a whole number
  let cleanValue = value;
  if (typeof cleanValue === 'string' && cleanValue.endsWith('.00')) {
    cleanValue = cleanValue.slice(0, -3);
  }
  
  // Remove all non-digits
  const numbers = cleanValue.replace(/\D/g, '');
  if (!numbers) return '';
  
  // Add thousand separators
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Helper function to parse formatted number back to plain number
const parseFormattedNumber = (value: string): string => {
  return value.replace(/\./g, '');
};

// Success Metrics Schema - fields are optional to allow empty metrics
const successMetricSchema = z.object({
  id: z.string().optional(), // untuk edit mode
  name: z.string().optional(),
  target: z.string().optional(),
});

type SuccessMetricFormData = z.infer<typeof successMetricSchema>;

// Task Schema for form
const taskSchema = z.object({
  id: z.string().optional(), // untuk edit mode
  title: z.string().min(1, "Judul task wajib diisi"),
  description: z.string().optional(),
  status: z
    .enum(["not_started", "in_progress", "completed", "cancelled"])
    .default("not_started"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignedTo: z.string().optional(),
  startDate: z.date().optional(),
  dueDate: z.date({
    required_error: "Tanggal deadline wajib diisi",
  }),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Form schema for initiative
const initiativeFormSchema = z
  .object({
    initiative: z.object({
      title: z.string().min(1, "Judul inisiatif wajib diisi"),
      description: z.string().optional(),
      implementationPlan: z.string().optional(),
      definitionOfDone: z.array(z.string()).optional().default([]),
      keyResultId: z.string().min(1, "Angka target wajib dipilih"),
      picId: z.string().min(1, "Penanggung jawab wajib dipilih"),
      startDate: z.date({
        required_error: "Tanggal mulai wajib diisi",
      }),
      dueDate: z.date({
        required_error: "Tanggal selesai wajib diisi",
      }),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      budget: z.string().optional(),
    }),
    businessImpact: z
      .number()
      .min(1, "Dampak bisnis wajib dipilih")
      .max(5)
      .optional(),
    difficultyLevel: z
      .number()
      .min(1, "Tingkat kesulitan wajib dipilih")
      .max(5)
      .optional(),
    beliefLevel: z
      .number()
      .min(1, "Tingkat keyakinan wajib dipilih")
      .max(5)
      .optional(),
    successMetrics: z.array(successMetricSchema).optional().default([]),
    tasks: z.array(taskSchema).optional().default([]),
  })
  .refine(
    (data) => {
      return data.initiative.startDate <= data.initiative.dueDate;
    },
    {
      message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
      path: ["initiative", "startDate"],
    },
  );

type InitiativeFormData = z.infer<typeof initiativeFormSchema>;

interface InitiativeFormModalProps {
  initiative?: Initiative;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResultId?: string;
  objectiveId?: string;
  onSuccess?: () => void;
}

export default function InitiativeFormModal({
  initiative,
  open,
  onOpenChange,
  keyResultId,
  objectiveId,
  onSuccess,
}: InitiativeFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const isEditMode = !!initiative;

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  // For creating initiative, we need a temporary ID
  const initiativeId = initiative?.id || "temp-initiative-id";

  // Fetch data yang diperlukan
  const { data: allKeyResults } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
  });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  // Filter key results based on objective context
  const keyResults = useMemo(() => {
    if (!allKeyResults) return [];
    
    // If objectiveId is provided, only show key results from that objective
    if (objectiveId) {
      return allKeyResults.filter(kr => kr.objectiveId === objectiveId);
    }
    
    // Otherwise, show all key results (for global initiative creation)
    return allKeyResults;
  }, [allKeyResults, objectiveId]);

  // Fetch existing success metrics, tasks, and DoD items for edit mode
  const { data: existingSuccessMetrics } = useQuery({
    queryKey: [`/api/initiatives/${initiative?.id}/success-metrics`],
    enabled: !!(isEditMode && initiative?.id),
  });

  const { data: existingTasks } = useQuery({
    queryKey: [`/api/initiatives/${initiative?.id}/tasks`],
    enabled: !!(isEditMode && initiative?.id),
  });

  const { data: existingDoDItems, isLoading: isDoDLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiative?.id}/definition-of-done`],
    enabled: !!(isEditMode && initiative?.id),
  });

  // Initialize form
  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeFormSchema),
    defaultValues: isEditMode
      ? {
          initiative: {
            title: initiative.title,
            description: initiative.description || "",
            implementationPlan: initiative.implementationPlan || "",
            definitionOfDone: existingDoDItems?.map((item) => item.title) || [
              "",
            ],
            keyResultId: initiative.keyResultId,
            picId: initiative.picId,
            startDate: initiative.startDate ? new Date(initiative.startDate) : new Date(),
            dueDate: new Date(initiative.dueDate),
            priority: initiative.priority,
            budget: initiative.budget || "",
          },
          businessImpact: initiative.impactScore,
          difficultyLevel: initiative.effortScore,
          beliefLevel: initiative.confidenceScore,
          successMetrics: existingSuccessMetrics || [{ name: "", target: "" }],
          tasks: existingTasks?.map(task => ({
            ...task,
            dueDate: new Date(task.dueDate),
            startDate: task.startDate ? new Date(task.startDate) : new Date(),
          })) || [],
        }
      : {
          initiative: {
            title: "",
            description: "",
            implementationPlan: "",
            definitionOfDone: [""],
            keyResultId: keyResultId || "",
            picId: user?.id || "",
            startDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            priority: "medium",
            budget: "",
          },
          businessImpact: undefined,
          difficultyLevel: undefined,
          beliefLevel: undefined,
          successMetrics: [{ name: "", target: "" }],
          tasks: [],
        },
  });

  // Reset form when initiative prop changes or dialog opens
  useEffect(() => {
    if (open && isEditMode && initiative) {
      setCurrentStep(1); // Reset to step 1 when dialog opens

      // Only reset when we have the data or when data is not needed
      const shouldReset =
        !isEditMode ||
        (existingSuccessMetrics !== undefined &&
          existingTasks !== undefined &&
          existingDoDItems !== undefined);

      if (shouldReset) {
        form.reset({
          initiative: {
            title: initiative.title,
            description: initiative.description || "",
            implementationPlan: initiative.implementationPlan || "",
            definitionOfDone: existingDoDItems?.map((item) => item.title) || [
              "",
            ],
            keyResultId: initiative.keyResultId,
            picId: initiative.picId,
            startDate: initiative.startDate ? new Date(initiative.startDate) : new Date(),
            dueDate: new Date(initiative.dueDate),
            priority: initiative.priority,
            budget: initiative.budget || "",
          },
          businessImpact: initiative.impactScore,
          difficultyLevel: initiative.effortScore,
          beliefLevel: initiative.confidenceScore,
          successMetrics: existingSuccessMetrics || [{ name: "", target: "" }],
          tasks: existingTasks?.map(task => ({
            ...task,
            dueDate: new Date(task.dueDate),
            startDate: task.startDate ? new Date(task.startDate) : new Date(),
          })) || [],
        });
      }
    } else if (open && !isEditMode) {
      setCurrentStep(1);
      form.reset({
        initiative: {
          title: "",
          description: "",
          implementationPlan: "",
          definitionOfDone: [""],
          keyResultId: keyResultId || "",
          picId: user?.id || "",
          startDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          priority: "medium",
          budget: "",
        },
        businessImpact: undefined,
        difficultyLevel: undefined,
        beliefLevel: undefined,
        successMetrics: [{ name: "", target: "" }],
        tasks: [],
      });
    }
  }, [
    open,
    initiative,
    isEditMode,
    form,
    keyResultId,
    user?.id,
    existingSuccessMetrics,
    existingTasks,
    existingDoDItems,
  ]);

  // Priority calculation functions
  const calculatePriorityScore = (): number => {
    const businessImpact = form.watch("businessImpact") || 0;
    const difficultyLevel = form.watch("difficultyLevel") || 0;
    const beliefLevel = form.watch("beliefLevel") || 0;

    if (!businessImpact || !difficultyLevel || !beliefLevel) return 0;

    // Convert difficulty to ease (higher difficulty = lower ease)
    const ease = 6 - difficultyLevel;

    // Calculate weighted score: Business Impact (40%) + Ease (30%) + Belief (30%)
    return businessImpact * 0.4 + ease * 0.3 + beliefLevel * 0.3;
  };

  const calculatePriority = () => {
    const score = calculatePriorityScore();
    let priority = "medium";

    if (score >= 4.5) priority = "critical";
    else if (score >= 3.5) priority = "high";
    else if (score >= 2.5) priority = "medium";
    else priority = "low";

    form.setValue(
      "initiative.priority",
      priority as "low" | "medium" | "high" | "critical",
    );
  };

  const getPriorityLabel = (priority: string): string => {
    const labels = {
      low: "Rendah",
      medium: "Sedang",
      high: "Tinggi",
      critical: "Kritis",
    };
    return labels[priority as keyof typeof labels] || "Sedang";
  };

  const getPriorityBadgeColor = (priority: string): string => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return (
      colors[priority as keyof typeof colors] || "bg-yellow-100 text-yellow-800"
    );
  };

  // Success Metrics management functions
  const addSuccessMetric = () => {
    const currentMetrics = form.getValues("successMetrics") || [];
    form.setValue("successMetrics", [
      ...currentMetrics,
      {
        name: "",
        target: "",
      },
    ]);
  };

  const removeSuccessMetric = (index: number) => {
    const currentMetrics = form.getValues("successMetrics") || [];
    if (currentMetrics.length > 1) {
      const updatedMetrics = currentMetrics.filter((_, i) => i !== index);
      form.setValue("successMetrics", updatedMetrics);
    }
  };

  const updateSuccessMetric = (
    index: number,
    field: keyof SuccessMetricFormData,
    value: string,
  ) => {
    const currentMetrics = form.getValues("successMetrics") || [];
    const updatedMetrics = [...currentMetrics];
    updatedMetrics[index] = { ...updatedMetrics[index], [field]: value };
    form.setValue("successMetrics", updatedMetrics);
  };

  // Definition of Done management functions
  const addDefinitionItem = () => {
    const items = form.watch("initiative.definitionOfDone") || [];
    form.setValue("initiative.definitionOfDone", [...items, ""]);
  };

  const updateDefinitionItem = (index: number, value: string) => {
    const items = form.watch("initiative.definitionOfDone") || [];
    const updatedItems = [...items];
    updatedItems[index] = value;
    form.setValue("initiative.definitionOfDone", updatedItems);
  };

  const removeDefinitionItem = (index: number) => {
    const items = form.watch("initiative.definitionOfDone") || [];
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      form.setValue("initiative.definitionOfDone", updatedItems);
    }
  };

  // Task management functions (simplified for form data)
  const addTask = () => {
    setEditingTaskIndex(null); // Reset editing mode
    setShowTaskModal(true);
  };

  const editTask = (index: number) => {
    setEditingTaskIndex(index);
    setShowTaskModal(true);
  };

  const handleTaskAdd = (taskData: any) => {
    const currentTasks = form.getValues("tasks") || [];

    if (editingTaskIndex !== null) {
      // Edit existing task
      const updatedTasks = [...currentTasks];
      updatedTasks[editingTaskIndex] = {
        ...taskData,
        id: updatedTasks[editingTaskIndex].id, // Preserve existing ID
      };
      form.setValue("tasks", updatedTasks);
    } else {
      // Add new task
      form.setValue("tasks", [...currentTasks, taskData]);
    }

    setShowTaskModal(false);
    setEditingTaskIndex(null);
  };

  const removeTask = (index: number) => {
    const currentTasks = form.getValues("tasks") || [];
    const updatedTasks = currentTasks.filter((_, i) => i !== index);
    form.setValue("tasks", updatedTasks);
  };

  const mutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      try {
        // Calculate the PIC display name
        let picName = "";
        if (data.initiative.picId) {
          const picUser = users?.find((u) => u.id === data.initiative.picId);
          picName = picUser ? getUserName(picUser) : "";
        }

        // Calculate priority if scores are provided
        let calculatedPriority = data.initiative.priority;
        let impactScore: number | undefined;
        let effortScore: number | undefined;
        let confidenceScore: number | undefined;

        if (data.businessImpact && data.difficultyLevel && data.beliefLevel) {
          impactScore = data.businessImpact;
          effortScore = data.difficultyLevel;
          confidenceScore = data.beliefLevel;

          // Calculate priority score using the same formula
          const ease = 6 - data.difficultyLevel;
          const score =
            data.businessImpact * 0.4 + ease * 0.3 + data.beliefLevel * 0.3;

          if (score >= 4.5) calculatedPriority = "critical";
          else if (score >= 3.5) calculatedPriority = "high";
          else if (score >= 2.5) calculatedPriority = "medium";
          else calculatedPriority = "low";
        }

        // Prepare the payload
        const payload = {
          ...data.initiative,
          pic: picName,
          organizationId: user?.organizationId, // Add missing organizationId
          priority: calculatedPriority, // Use calculated priority
          // Add priority calculation scores
          impactScore,
          effortScore,
          confidenceScore,
          // Send output items as array to backend
          definitionOfDone: data.initiative.definitionOfDone || [],
          // Format dates for API
          startDate: data.initiative.startDate.toISOString(),
          dueDate: data.initiative.dueDate.toISOString(),
          // Include success metrics
          successMetrics: data.successMetrics || [],
          // Include tasks
          tasks: data.tasks || [],
        };

        console.log("Initiative form payload:", payload);

        if (isEditMode && initiative) {
          const result = await apiRequest(
            "PUT",
            `/api/initiatives/${initiative.id}`,
            payload,
          );
          console.log("Edit initiative success");
          return result;
        } else {
          return apiRequest("POST", "/api/initiatives", payload);
        }
      } catch (error) {
        console.error("Initiative mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Closing edit initiative modal");
      toast({
        title: isEditMode
          ? "Inisiatif berhasil diperbarui"
          : "Inisiatif berhasil dibuat",
        description: isEditMode
          ? "Perubahan inisiatif telah disimpan"
          : "Inisiatif baru telah ditambahkan ke sistem",
        variant: "success",
      });
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      if (isEditMode && initiative) {
        // Invalidate specific initiative data with exact query keys used in initiative-detail.tsx
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/success-metrics`] });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/definition-of-done`] });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/tasks`] });
        console.log("Invalidated all related queries for initiative:", initiative.id);
      }
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan inisiatif",
        description:
          error.message || "Terjadi kesalahan saat menyimpan inisiatif",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InitiativeFormData) => {
    // Check if we're on step 3 and the mandatory priority fields are missing
    if (
      currentStep === 3 &&
      !isEditMode &&
      (!data.businessImpact || !data.difficultyLevel || !data.beliefLevel)
    ) {
      toast({
        title: "Form Tidak Lengkap",
        description:
          "Silakan isi semua kriteria prioritas (Dampak Bisnis, Tingkat Kesulitan, Tingkat Keyakinan) sebelum melanjutkan.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < 3 && !isEditMode) {
      // If not on final step and not in edit mode, proceed to next step
      nextStep();
    } else {
      // If on final step or in edit mode, submit the form
      mutation.mutate(data);
    }
  };

  // Wizard navigation functions
  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        // Step 1 validation: title, keyResultId required
        const titleValid = await form.trigger("initiative.title");
        const keyResultValid = await form.trigger("initiative.keyResultId");
        return titleValid && keyResultValid;
      case 2:
        // Step 2 validation: optional fields
        return true;
      case 3:
        // Step 3 validation: dates and PIC required
        const startDateValid = await form.trigger("initiative.startDate");
        const dueDateValid = await form.trigger("initiative.dueDate");
        const picValid = await form.trigger("initiative.picId");
        return startDateValid && dueDateValid && picValid;
      default:
        return true;
    }
  };

  // Helper function to get step indicator
  const getStepIndicator = () => {
    if (isEditMode) return null; // No step indicator for edit mode

    return (
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Step 1 */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep >= 1 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Informasi Dasar
            </span>
            <span
              className={`ml-2 text-xs font-medium sm:hidden ${
                currentStep >= 1 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Info
            </span>
          </div>

          {/* Connector */}
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />

          {/* Step 2 */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep >= 2 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Rencana Eksekusi
            </span>
            <span
              className={`ml-2 text-xs font-medium sm:hidden ${
                currentStep >= 2 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Rencana
            </span>
          </div>

          {/* Connector */}
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />

          {/* Step 3 */}
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep >= 3 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Timeline & PIC
            </span>
            <span
              className={`ml-2 text-xs font-medium sm:hidden ${
                currentStep >= 3 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Timeline
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Inisiatif" : "Buat Inisiatif Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update inisiatif ini"
              : currentStep === 1
                ? "Langkah 1: Tentukan informasi dasar inisiatif Anda"
                : currentStep === 2
                  ? "Langkah 2: Tambahkan rencana implementasi dan metrik sukses"
                  : "Langkah 3: Tentukan timeline dan penanggung jawab"}
          </DialogDescription>
        </DialogHeader>

        {getStepIndicator()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {(currentStep === 1 || isEditMode) && (
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="initiative.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Nama Inisiatif*
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center"
                              >
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Nama inisiatif yang ingin dijalankan. Gunakan
                                bahasa yang jelas dan spesifik.
                                <br />
                                <br />
                                <strong>Contoh:</strong> "Implementasi Chatbot
                                Customer Service", "Campaign Social Media Q3",
                                "Optimasi Database Performance"
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Aktivasi Reseller Baru di Wilayah Timur"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initiative.keyResultId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Angka Target Terkait*
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center"
                              >
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Pilih angka target (Key Result) yang akan
                                didukung oleh inisiatif ini.
                                <br />
                                <br />
                                <strong>Tips:</strong> Inisiatif adalah aksi
                                konkret untuk mencapai angka target tertentu.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <SearchableKeyResultSelect
                          keyResults={keyResults || []}
                          value={field.value}
                          onValueChange={field.onChange}
                          objectiveId={objectiveId}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initiative.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Tujuan Inisiatif
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center"
                              >
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Penjelasan detail tentang inisiatif ini, latar
                                belakang, dan tujuan yang ingin dicapai.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kenapa inisiatif ini diperlukan?
Contoh: Wilayah timur memiliki potensi pasar yang besar namun kontribusi penjualannya masih rendah dan masih berpotensi untuk diakselerasi"
                            className="min-h-[140px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Success Metrics Management - Dynamic Table Form */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FormLabel>Outcome / Hasil Yang Diharapkan</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Metrik / ukuran yang bisa digunakan untuk mengukur
                            apakan inisiatif ini berhasil, gagal, atau perlu
                            diulangi. Buat metrik yang spesifik dan terukur.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Success Metrics Dynamic Table */}
                    <div>
                      {(form.watch("successMetrics") || []).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Belum ada Metrik Keberhasilan</p>
                          <p className="text-sm">
                            Klik tombol di bawah untuk menambahkan (opsional)
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama Metrik / Ukuran</TableHead>
                                  <TableHead className="text-center">
                                    Target / Hasil Yang Diharapkan
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Aksi
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(form.watch("successMetrics") || []).map(
                                  (metric, index) => (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <Input
                                          placeholder="Contoh: Jumlah reseller bergabung"
                                          value={metric.name}
                                          onChange={(e) =>
                                            updateSuccessMetric(
                                              index,
                                              "name",
                                              e.target.value,
                                            )
                                          }
                                          className="border border-gray-300 p-2"
                                        />
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Input
                                          placeholder="Contoh: 30 Orang"
                                          value={metric.target}
                                          onChange={(e) =>
                                            updateSuccessMetric(
                                              index,
                                              "target",
                                              e.target.value,
                                            )
                                          }
                                          className="border border-gray-300 p-2 text-center"
                                        />
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeSuccessMetric(index)
                                          }
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          disabled={
                                            (form.watch("successMetrics") || [])
                                              .length <= 1
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-4">
                            {(form.watch("successMetrics") || []).map(
                              (metric, index) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-white shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-gray-700">
                                        Metrik {index + 1}
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSuccessMetric(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-100 h-6 w-6 p-0"
                                      disabled={
                                        (form.watch("successMetrics") || [])
                                          .length <= 1
                                      }
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <label className="text-xs font-medium text-gray-600">
                                        Nama Metrik:
                                      </label>
                                      <Input
                                        placeholder="Contoh: Tingkat Kepuasan Customer"
                                        value={metric.name}
                                        onChange={(e) =>
                                          updateSuccessMetric(
                                            index,
                                            "name",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-600">
                                        Target:
                                      </label>
                                      <Input
                                        placeholder="Contoh: 90%"
                                        value={metric.target}
                                        onChange={(e) =>
                                          updateSuccessMetric(
                                            index,
                                            "target",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      )}

                      {/* Add Button Below Table */}
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addSuccessMetric}
                          className="w-full flex items-center justify-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Metrik
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Implementation Plan */}
            {(currentStep === 2 || isEditMode) && (
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="initiative.implementationPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Rencana Implementasi
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center"
                              >
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Langkah-langkah detail bagaimana inisiatif ini
                                akan dijalankan. Sertakan tahapan utama dan
                                milestone penting.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Bagaimana inisiatif akan di eksekusi?
Contoh: Untuk mempercepat penetrasi pasar di wilayah timur, kami akan menghubungi 100 calon reseller potensial dan menawarkan paket reseller serta pendampingan khusus. Setelah itu, kami akan melakukan follow-up berkala untuk memastikan keberhasilan program."
                            className="min-h-[160px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Definition of Done - Dynamic List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FormLabel>Deliverables (Output Inisiatif)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Apa output / keluaran dari inisiatif untuk dapat
                            menyatakan bahwa inisiatif ini selesai dan
                            tereksekusi dengan baik terlepas dari hasilnya.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Definition of Done Dynamic List */}
                    <div>
                      {/* Desktop/Mobile Unified View */}
                      <div className="space-y-3">
                        {(Array.isArray(
                          form.watch("initiative.definitionOfDone"),
                        )
                          ? form.watch("initiative.definitionOfDone")
                          : [""]
                        ).map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <Input
                              placeholder="Contoh: 100 calon reseller sudah dihubungi"
                              value={item}
                              onChange={(e) =>
                                updateDefinitionItem(index, e.target.value)
                              }
                              className="flex-1 border border-gray-300 p-2"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDefinitionItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              disabled={
                                (Array.isArray(
                                  form.watch("initiative.definitionOfDone"),
                                )
                                  ? form.watch("initiative.definitionOfDone")
                                  : []
                                ).length <= 1
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Add Definition Item Button */}
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addDefinitionItem}
                          className="w-full flex items-center justify-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Kriteria
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Task Management */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FormLabel>Breakdown Tugas / Task</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Task / tugas apa saja yang perlu dikerjakan untuk
                            menyelesaikan inisiatif ini. Bagi tugas menjadi
                            bagian-bagian kecil dan siapa yang bertanggung jawab
                            terhadap tugas tersebut.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {(form.watch("tasks") || []).length === 0 ? (
                      <div className="text-center py-2 text-gray-500">
                        <ListTodo className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>Belum ada Tugas / Task</p>
                        <p className="text-sm">
                          Klik tombol di bawah untuk menambahkan
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(form.watch("tasks") || []).map((task, index) => {
                          const assignedUser = task.assignedTo
                            ? (users || []).find(
                                (u: User) => u.id === task.assignedTo,
                              )
                            : null;
                          return (
                            <div
                              key={index}
                              className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-white shadow-sm"
                            >
                              {/* Desktop Layout */}
                              <div className="hidden sm:flex items-center justify-between gap-2">
                                <h4 className="font-medium text-green-800 text-sm truncate flex-1 min-w-0">
                                  {task.title || "Task tanpa judul"}
                                </h4>
                                <div className="flex items-center gap-2 shrink-0">
                                  {assignedUser && (
                                    <span className="text-xs text-blue-600">
                                      {getUserName(assignedUser)}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-xs text-gray-500">
                                      {format(
                                        new Date(task.dueDate),
                                        "dd MMM yyyy",
                                        { locale: id },
                                      )}
                                    </span>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editTask(index)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-6 w-6 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTask(index)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-100 h-6 w-6 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Mobile Layout */}
                              <div className="sm:hidden space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-green-800 text-sm flex-1 min-w-0">
                                    {task.title || "Task tanpa judul"}
                                  </h4>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => editTask(index)}
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-6 w-6 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(index)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-100 h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  {assignedUser && (
                                    <span className="text-blue-600">
                                      {getUserName(assignedUser)}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-gray-500">
                                      {format(
                                        new Date(task.dueDate),
                                        "dd MMM yyyy",
                                        { locale: id },
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tombol Tambah Task */}
                    <div className="pt-3 border-t">
                      <Button
                        type="button"
                        onClick={addTask}
                        variant="outline"
                        size="sm"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Tambah Task</span>
                        <span className="sm:hidden">Tambah</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Timeline & PIC */}
            {(currentStep === 3 || isEditMode) && (
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initiative.startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2">
                            Tanggal Mulai*
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center"
                                >
                                  <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Pilih tanggal mulai pelaksanaan inisiatif ini.
                                  Tanggal ini akan menjadi acuan untuk timeline
                                  dan progress tracking.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: id })
                                  ) : (
                                    <span>Pilih tanggal</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initiative.dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2">
                            Tanggal Selesai*
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center"
                                >
                                  <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Tentukan target deadline untuk menyelesaikan
                                  inisiatif ini. Pastikan timeline yang
                                  realistis sesuai scope pekerjaan.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: id })
                                  ) : (
                                    <span>Pilih tanggal</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initiative.picId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Penanggung Jawab*
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center"
                                >
                                  <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Pilih anggota tim yang bertanggung jawab
                                  memimpin dan memastikan keberhasilan inisiatif
                                  ini.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <SearchableUserSelect
                            users={users || []}
                            value={field.value}
                            onValueChange={field.onChange}
                            currentUser={user || undefined}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initiative.budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Budget (Opsional)
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center"
                                >
                                  <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Masukkan estimasi budget yang dibutuhkan untuk
                                  menjalankan inisiatif ini, jika ada.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: 50.000.000"
                              value={field.value ? formatNumberWithSeparator(field.value) : ''}
                              onChange={(e) => {
                                const rawValue = parseFormattedNumber(e.target.value);
                                field.onChange(rawValue);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Priority Calculation System */}
                    <div className="col-span-full">
                      <FormLabel className="text-base font-semibold mb-4 block">
                        Perhitungan Prioritas Otomatis
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-6">
                        Prioritas akan dihitung otomatis berdasarkan dampak
                        bisnis, tingkat kesulitan, dan keyakinan (skala 1-5)
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Business Impact */}
                        <FormField
                          control={form.control}
                          name="businessImpact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                Dampak Bisnis{" "}
                                <span className="text-red-500">*</span>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center"
                                    >
                                      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">
                                      Seberapa besar dampak inisiatif ini
                                      terhadap bisnis? Pilih skala 1-5
                                      berdasarkan potensi pengaruhnya terhadap
                                      tujuan organisasi.
                                    </p>
                                  </PopoverContent>
                                </Popover>
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    calculatePriority();
                                  }}
                                  value={field.value?.toString() || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih dampak bisnis" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">
                                      1 - Sangat Rendah
                                    </SelectItem>
                                    <SelectItem value="2">
                                      2 - Rendah
                                    </SelectItem>
                                    <SelectItem value="3">
                                      3 - Sedang
                                    </SelectItem>
                                    <SelectItem value="4">
                                      4 - Tinggi
                                    </SelectItem>
                                    <SelectItem value="5">
                                      5 - Sangat Tinggi
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Difficulty Level */}
                        <FormField
                          control={form.control}
                          name="difficultyLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                Tingkat Kesulitan{" "}
                                <span className="text-red-500">*</span>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center"
                                    >
                                      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">
                                      Seberapa sulit implementasi inisiatif ini?
                                      Pertimbangkan kompleksitas, sumber daya
                                      yang dibutuhkan, dan kemampuan tim.
                                    </p>
                                  </PopoverContent>
                                </Popover>
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    calculatePriority();
                                  }}
                                  value={field.value?.toString() || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih tingkat kesulitan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">
                                      1 - Sangat Mudah
                                    </SelectItem>
                                    <SelectItem value="2">2 - Mudah</SelectItem>
                                    <SelectItem value="3">
                                      3 - Sedang
                                    </SelectItem>
                                    <SelectItem value="4">4 - Sulit</SelectItem>
                                    <SelectItem value="5">
                                      5 - Sangat Sulit
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Belief Level */}
                        <FormField
                          control={form.control}
                          name="beliefLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                Tingkat Keyakinan{" "}
                                <span className="text-red-500">*</span>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center"
                                    >
                                      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">
                                      Seberapa yakin tim dapat menyelesaikan
                                      inisiatif ini dengan sukses? Pertimbangkan
                                      pengalaman, komitmen, dan kondisi saat
                                      ini.
                                    </p>
                                  </PopoverContent>
                                </Popover>
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    calculatePriority();
                                  }}
                                  value={field.value?.toString() || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih tingkat keyakinan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">
                                      1 - Sangat Rendah
                                    </SelectItem>
                                    <SelectItem value="2">
                                      2 - Rendah
                                    </SelectItem>
                                    <SelectItem value="3">
                                      3 - Sedang
                                    </SelectItem>
                                    <SelectItem value="4">
                                      4 - Tinggi
                                    </SelectItem>
                                    <SelectItem value="5">
                                      5 - Sangat Tinggi
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Priority Result */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          <span className="font-medium text-blue-800">
                            Prioritas Otomatis
                          </span>
                        </div>

                        {form.watch("businessImpact") &&
                        form.watch("difficultyLevel") &&
                        form.watch("beliefLevel") ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeColor(form.watch("initiative.priority"))}`}
                              >
                                {getPriorityLabel(
                                  form.watch("initiative.priority"),
                                )}
                              </span>
                              <span className="text-sm text-gray-600">
                                Skor: {calculatePriorityScore().toFixed(2)}/5
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Formula: (Dampak×0.4) + (Kemudahan×0.3) +
                              (Keyakinan×0.3) = ({form.watch("businessImpact")}
                              ×0.4) + ({6 - form.watch("difficultyLevel")}×0.3)
                              + ({form.watch("beliefLevel")}×0.3) ={" "}
                              {calculatePriorityScore().toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-red-600 font-medium">
                            Semua kriteria prioritas di atas wajib dipilih untuk
                            melanjutkan
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && !isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  onClick={(e) => {
                    console.log("Button clicked");
                    console.log("Form errors:", form.formState.errors);
                    console.log("Form values:", form.getValues());
                  }}
                >
                  {mutation.isPending
                    ? "Menyimpan..."
                    : currentStep === 3 || isEditMode
                      ? isEditMode
                        ? "Update Inisiatif"
                        : "Buat Inisiatif"
                      : "Lanjutkan"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Initiative Task Modal */}
      <InitiativeTaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onTaskAdd={handleTaskAdd}
        editingTask={
          editingTaskIndex !== null
            ? (form.getValues("tasks") || [])[editingTaskIndex]
            : undefined
        }
        isEditing={editingTaskIndex !== null}
      />
    </Dialog>
  );
}
