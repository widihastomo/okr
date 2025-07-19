import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { HelpCircle, Plus, ChevronRight, ChevronLeft, Target, Trash2, CalendarIcon, Edit, TrendingUp, ListTodo } from "lucide-react";
import InitiativeTaskModal from "@/components/initiative-task-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  return user.email?.split('@')[0] || 'Unknown';
};

// Helper function to get user initials
const getUserInitials = (user: User): string => {
  if (user.name?.trim()) {
    return user.name
      .trim()
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  // Fallback to email username
  const username = user.email?.split('@')[0] || 'U';
  return username.substring(0, 2).toUpperCase();
};

// Helper function to get task status label
const getTaskStatusLabel = (status: string): string => {
  const statusLabels = {
    not_started: "Belum Dimulai",
    in_progress: "Sedang Dikerjakan", 
    completed: "Selesai",
    cancelled: "Dibatalkan"
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

// Helper function to get task priority label
const getTaskPriorityLabel = (priority: string): string => {
  const priorityLabels = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi", 
    critical: "Kritis"
  };
  return priorityLabels[priority as keyof typeof priorityLabels] || priority;
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
  status: z.enum(["not_started", "in_progress", "completed", "cancelled"]).default("not_started"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignedTo: z.string().optional(),
  dueDate: z.date({
    required_error: "Tanggal deadline wajib diisi",
  }),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Form schema for initiative
const initiativeFormSchema = z.object({
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
  successMetrics: z.array(successMetricSchema).optional().default([]),
  tasks: z.array(taskSchema).optional().default([]),
}).refine(
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
  onSuccess?: () => void;
}

export default function InitiativeFormModal({ initiative, open, onOpenChange, keyResultId, onSuccess }: InitiativeFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const isEditMode = !!initiative;
  
  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);

  
  // For creating initiative, we need a temporary ID
  const initiativeId = initiative?.id || "temp-initiative-id";

  // Fetch data yang diperlukan
  const { data: keyResults } = useQuery<KeyResult[]>({ queryKey: ["/api/key-results"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeFormSchema),
    defaultValues: isEditMode ? {
      initiative: {
        title: initiative.title,
        description: initiative.description || "",
        implementationPlan: initiative.implementationPlan || "",
        definitionOfDone: initiative.definitionOfDone || "",
        keyResultId: initiative.keyResultId,
        picId: initiative.picId,
        startDate: new Date(initiative.startDate),
        dueDate: new Date(initiative.dueDate),
        priority: initiative.priority,
        budget: initiative.budget || "",
      },
      successMetrics: [{ name: "", target: "" }],
      tasks: [],
    } : {
      initiative: {
        title: "",
        description: "",
        implementationPlan: "",
        definitionOfDone: [""],
        keyResultId: keyResultId || "",
        picId: user?.id || "",
        startDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        priority: "medium",
        budget: "",
      },
      successMetrics: [{ name: "", target: "" }],
      tasks: [],
    },
  });

  // Reset form when initiative prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1); // Reset to step 1 when dialog opens
      if (isEditMode && initiative) {
        form.reset({
          initiative: {
            title: initiative.title,
            description: initiative.description || "",
            implementationPlan: initiative.implementationPlan || "",
            definitionOfDone: Array.isArray(initiative.definitionOfDone) ? initiative.definitionOfDone : [initiative.definitionOfDone || ""],
            keyResultId: initiative.keyResultId,
            picId: initiative.picId,
            startDate: new Date(initiative.startDate),
            dueDate: new Date(initiative.dueDate),
            priority: initiative.priority,
            budget: initiative.budget || "",
          },
          successMetrics: [{ name: "", target: "" }],
          tasks: [],
        });
      } else {
        form.reset({
          initiative: {
            title: "",
            description: "",
            implementationPlan: "",
            definitionOfDone: [""],
            keyResultId: keyResultId || "",
            picId: user?.id || "",
            startDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            priority: "medium",
            budget: "",
          },
          successMetrics: [{ name: "", target: "" }],
          tasks: [],
        });
      }
    }
  }, [open, initiative, isEditMode, form, keyResultId, user?.id]);

  // Success Metrics management functions
  const addSuccessMetric = () => {
    const currentMetrics = form.getValues("successMetrics") || [];
    form.setValue("successMetrics", [...currentMetrics, {
      name: "",
      target: "",
    }]);
  };

  const removeSuccessMetric = (index: number) => {
    const currentMetrics = form.getValues("successMetrics") || [];
    if (currentMetrics.length > 1) {
      const updatedMetrics = currentMetrics.filter((_, i) => i !== index);
      form.setValue("successMetrics", updatedMetrics);
    }
  };

  const updateSuccessMetric = (index: number, field: keyof SuccessMetricFormData, value: string) => {
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
    setShowTaskModal(true);
  };

  const handleTaskAdd = (taskData: any) => {
    const currentTasks = form.getValues("tasks") || [];
    form.setValue("tasks", [...currentTasks, taskData]);
    setShowTaskModal(false);
    toast({
      title: "Task berhasil ditambahkan",
      description: "Task telah ditambahkan ke daftar inisiatif",
      variant: "default",
    });
  };

  const editTask = (index: number) => {
    // For now, tasks are edited inline - no modal needed
    // This function is kept for future modal implementation if needed
  };

  const removeTask = (index: number) => {
    const currentTasks = form.getValues("tasks") || [];
    const updatedTasks = currentTasks.filter((_, i) => i !== index);
    form.setValue("tasks", updatedTasks);
  };



  const mutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      // Calculate the PIC display name
      let picName = "";
      if (data.initiative.picId) {
        const picUser = users?.find(u => u.id === data.initiative.picId);
        picName = picUser ? getUserName(picUser) : "";
      }

      // Prepare the payload
      const payload = {
        ...data.initiative,
        pic: picName,
        // Format dates for API
        startDate: data.initiative.startDate.toISOString(),
        dueDate: data.initiative.dueDate.toISOString(),
      };

      if (isEditMode && initiative) {
        return apiRequest(`/api/initiatives/${initiative.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        return apiRequest("/api/initiatives", {
          method: "POST", 
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Inisiatif berhasil diperbarui" : "Inisiatif berhasil dibuat",
        description: isEditMode 
          ? "Perubahan inisiatif telah disimpan"
          : "Inisiatif baru telah ditambahkan ke sistem",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan inisiatif",
        description: error.message || "Terjadi kesalahan saat menyimpan inisiatif",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InitiativeFormData) => {
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
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 1 ? 'text-orange-600' : 'text-gray-500'
            }`}>
              Informasi Dasar
            </span>
          </div>
          
          {/* Connector */}
          <ChevronRight className="w-5 h-5 text-gray-400" />
          
          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 2 ? 'text-orange-600' : 'text-gray-500'
            }`}>
              Rencana & Metrik
            </span>
          </div>

          {/* Connector */}
          <ChevronRight className="w-5 h-5 text-gray-400" />
          
          {/* Step 3 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 3 ? 'text-orange-600' : 'text-gray-500'
            }`}>
              Timeline & PIC
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
            {isEditMode ? 'Edit Inisiatif' : 'Buat Inisiatif Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update inisiatif ini' 
              : currentStep === 1 
                ? 'Langkah 1: Tentukan informasi dasar inisiatif Anda'
                : currentStep === 2
                  ? 'Langkah 2: Tambahkan rencana implementasi dan metrik sukses'
                  : 'Langkah 3: Tentukan timeline dan penanggung jawab'
            }
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
                          Judul Inisiatif*
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
                                Nama inisiatif yang ingin dijalankan. Gunakan bahasa yang jelas dan spesifik.
                                <br /><br />
                                <strong>Contoh:</strong> "Implementasi Chatbot Customer Service", "Campaign Social Media Q3", "Optimasi Database Performance"
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Implementasi Chatbot Customer Service" {...field} />
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
                                Pilih angka target (Key Result) yang akan didukung oleh inisiatif ini.
                                <br /><br />
                                <strong>Tips:</strong> Inisiatif adalah aksi konkret untuk mencapai angka target tertentu.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <SearchableKeyResultSelect
                          keyResults={keyResults || []}
                          value={field.value}
                          onValueChange={field.onChange}
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
                          Deskripsi Inisiatif
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
                                Penjelasan detail tentang inisiatif ini, latar belakang, dan tujuan yang ingin dicapai.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Contoh: Inisiatif ini bertujuan untuk meningkatkan response time customer service melalui implementasi chatbot AI yang dapat menangani 70% pertanyaan umum..." 
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
                      <FormLabel>
                        Metrik Keberhasilan
                      </FormLabel>
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
                            Metrik yang akan digunakan untuk mengukur keberhasilan inisiatif ini. Buat metrik yang spesifik dan terukur.
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
                          <p className="text-sm">Klik tombol di bawah untuk menambahkan (opsional)</p>
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama Metrik</TableHead>
                                  <TableHead className="text-center">Target</TableHead>
                                  <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(form.watch("successMetrics") || []).map((metric, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Input
                                    placeholder="Contoh: Tingkat Kepuasan Customer"
                                    value={metric.name}
                                    onChange={(e) => updateSuccessMetric(index, "name", e.target.value)}
                                    className="border border-gray-300 p-2"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    placeholder="Contoh: 90%"
                                    value={metric.target}
                                    onChange={(e) => updateSuccessMetric(index, "target", e.target.value)}
                                    className="border border-gray-300 p-2 text-center"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSuccessMetric(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={(form.watch("successMetrics") || []).length <= 1}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-4">
                            {(form.watch("successMetrics") || []).map((metric, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-white shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Metrik {index + 1}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSuccessMetric(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 h-6 w-6 p-0"
                                disabled={(form.watch("successMetrics") || []).length <= 1}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-gray-600">Nama Metrik:</label>
                                <Input
                                  placeholder="Contoh: Tingkat Kepuasan Customer"
                                  value={metric.name}
                                  onChange={(e) => updateSuccessMetric(index, "name", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600">Target:</label>
                                <Input
                                  placeholder="Contoh: 90%"
                                  value={metric.target}
                                  onChange={(e) => updateSuccessMetric(index, "target", e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            </div>
                          ))}
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
                                Langkah-langkah detail bagaimana inisiatif ini akan dijalankan. Sertakan tahapan utama dan milestone penting.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Contoh: 1. Research & analisis kebutuhan (Week 1-2), 2. Design & prototyping (Week 3-4), 3. Development (Week 5-8), 4. Testing & deployment (Week 9-10)..." 
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
                      <FormLabel>Definition of Done</FormLabel>
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
                            Kriteria spesifik yang harus dipenuhi untuk menganggap inisiatif ini berhasil dan selesai. Buat daftar yang jelas dan terukur.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Definition of Done Dynamic List */}
                    <div>
                      {/* Desktop/Mobile Unified View */}
                      <div className="space-y-3">
                        {(form.watch("initiative.definitionOfDone") || [""]).map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <Input
                              placeholder="Contoh: User dapat login dengan chatbot"
                              value={item}
                              onChange={(e) => updateDefinitionItem(index, e.target.value)}
                              className="flex-1 border border-gray-300 p-2"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDefinitionItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              disabled={(form.watch("initiative.definitionOfDone") || []).length <= 1}
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
                      <FormLabel>Task Management</FormLabel>
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
                            Task-task yang perlu dikerjakan untuk menyelesaikan inisiatif ini. Klik tombol untuk menambah task baru.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {(form.watch("tasks") || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Belum ada Task</p>
                        <p className="text-sm">Klik tombol di bawah untuk menambahkan</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(form.watch("tasks") || []).map((task, index) => {
                          const assignedUser = task.assignedTo ? (users || []).find((u: User) => u.id === task.assignedTo) : null;
                          return (
                            <div key={index} className="border rounded-lg p-2 bg-gradient-to-r from-green-50 to-white shadow-sm">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium text-green-800 text-sm truncate flex-1 min-w-0">{task.title || "Task tanpa judul"}</h4>
                                <div className="flex items-center gap-2 shrink-0">
                                  {assignedUser && (
                                    <div className="flex items-center gap-1">
                                      <Avatar className="w-4 h-4">
                                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                          {getUserInitials(assignedUser)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-blue-600">{getUserName(assignedUser)}</span>
                                    </div>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-xs text-gray-500">{format(new Date(task.dueDate), "dd MMM yyyy", { locale: id })}</span>
                                  )}
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Timeline & Penanggung Jawab
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initiative.startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tanggal Mulai*</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                            <PopoverContent className="w-auto p-0" align="start">
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
                          <FormLabel>Tanggal Selesai*</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                            <PopoverContent className="w-auto p-0" align="start">
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

                  <FormField
                    control={form.control}
                    name="initiative.picId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penanggung Jawab*</FormLabel>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initiative.priority"
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

                    <FormField
                      control={form.control}
                      name="initiative.budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (Opsional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Rp 50.000.000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  {mutation.isPending ? "Menyimpan..." : 
                   currentStep === 3 || isEditMode ? 
                   (isEditMode ? "Update Inisiatif" : "Buat Inisiatif") : 
                   "Lanjutkan"}
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
      />

    </Dialog>
  );
}