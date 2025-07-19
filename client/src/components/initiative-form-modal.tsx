import React, { useEffect, useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  Target,
  HelpCircle,
  Plus,
  Trash2,
  BarChart3,
  Edit,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { SearchableKeyResultSelect } from "@/components/ui/searchable-key-result-select";
import {
  formatNumberWithSeparator,
  handleNumberInputChange,
  getNumberValueForSubmission,
} from "@/lib/number-utils";
import { useAuth } from "@/hooks/useAuth";
import type { KeyResult, User, Initiative } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



// Form schema matching the actual Initiative database schema
const initiativeFormSchema = z
  .object({
    title: z.string().min(1, "Judul inisiatif wajib diisi"),
    description: z.string().optional(),
    implementationPlan: z.string().optional(),
    definitionOfDone: z.string().optional(),
    keyResultId: z.string().min(1, "Angka target wajib dipilih"),
    picId: z.string().min(1, "Penanggung jawab wajib dipilih"),
    startDate: z.date({
      required_error: "Tanggal mulai wajib diisi",
      invalid_type_error: "Tanggal mulai harus berupa tanggal yang valid",
    }),
    dueDate: z.date({
      required_error: "Tanggal selesai wajib diisi",
      invalid_type_error: "Tanggal selesai harus berupa tanggal yang valid",
    }),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    budget: z.string().optional(),
    // Priority calculation inputs
    impactScore: z.number().min(1).max(5).default(3),
    effortScore: z.number().min(1).max(5).default(3),
    confidenceScore: z.number().min(1).max(5).default(3),
  })
  .refine(
    (data) => {
      // Validate that start date is not greater than end date
      return data.startDate <= data.dueDate;
    },
    {
      message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
      path: ["startDate"], // Show error on startDate field
    },
  );

type InitiativeFormData = z.infer<typeof initiativeFormSchema>;

interface InitiativeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  keyResultId?: string;
  initiative?: Initiative;
  objectiveId?: string; // Filter key results by objective
}

export default function InitiativeFormModal({
  isOpen,
  onClose,
  onSuccess,
  keyResultId,
  initiative,
  objectiveId,
}: InitiativeFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isEditMode = !!initiative;
  const [currentStep, setCurrentStep] = useState(1);
  const [successMetrics, setSuccessMetrics] = useState<
    Array<{ name: string; target: string }>
  >([]);

  // Get current user ID for default assignment
  const currentUserId =
    user && typeof user === "object" && "id" in user ? (user as any).id : null;

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
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        // Step 1 validation: title, keyResultId required
        const titleValid = await form.trigger("title");
        const keyResultValid = await form.trigger("keyResultId");
        return titleValid && keyResultValid;
      case 2:
        // Step 2 validation: implementation plan should be provided
        return true; // Optional fields, no strict validation
      case 3:
        // Step 3 validation: dates and PIC required
        const startDateValid = await form.trigger("startDate");
        const dueDateValid = await form.trigger("dueDate");
        const picValid = await form.trigger("picId");
        return startDateValid && dueDateValid && picValid;
      default:
        return true;
    }
  };

  // Success metrics handlers
  const addMetric = () => {
    setSuccessMetrics([...successMetrics, { name: "", target: "" }]);
  };

  const removeMetric = (index: number) => {
    if (successMetrics.length > 1) {
      const newMetrics = successMetrics.filter((_, i) => i !== index);
      setSuccessMetrics(newMetrics);
    }
  };

  const updateMetric = (index: number, field: "name" | "target", value: string) => {
    // Ensure we have at least one metric to update
    if (successMetrics.length === 0) {
      setSuccessMetrics([{ name: field === "name" ? value : "", target: field === "target" ? value : "" }]);
    } else {
      const newMetrics = [...successMetrics];
      newMetrics[index][field] = value;
      setSuccessMetrics(newMetrics);
    }
  };

  // Helper function to get score labels
  const getScoreLabel = (
    score: number,
    type: "impact" | "effort" | "confidence",
  ): string => {
    switch (type) {
      case "impact":
        switch (score) {
          case 1:
            return "Sangat Rendah";
          case 2:
            return "Rendah";
          case 3:
            return "Sedang";
          case 4:
            return "Tinggi";
          case 5:
            return "Sangat Tinggi";
          default:
            return "Sedang";
        }
      case "effort":
        switch (score) {
          case 1:
            return "Sangat Mudah";
          case 2:
            return "Mudah";
          case 3:
            return "Sedang";
          case 4:
            return "Sulit";
          case 5:
            return "Sangat Sulit";
          default:
            return "Sedang";
        }
      case "confidence":
        switch (score) {
          case 1:
            return "Sangat Rendah";
          case 2:
            return "Rendah";
          case 3:
            return "Sedang";
          case 4:
            return "Tinggi";
          case 5:
            return "Sangat Tinggi";
          default:
            return "Sedang";
        }
    }
  };

  // Component to display calculated priority
  const CalculatedPriorityDisplay = ({
    impactScore,
    effortScore,
    confidenceScore,
  }: {
    impactScore: number;
    effortScore: number;
    confidenceScore: number;
  }) => {
    // Calculate priority score using the same formula as backend but adjusted for 5-point scale
    const priorityScore =
      impactScore * 0.4 + (6 - effortScore) * 0.3 + confidenceScore * 0.3;

    // Determine priority level adjusted for 1.0-5.0 score range
    const priorityLevel =
      priorityScore >= 4.0
        ? "critical"
        : priorityScore >= 3.0
          ? "high"
          : priorityScore >= 2.0
            ? "medium"
            : "low";

    const priorityColors = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    };

    const priorityLabels = {
      critical: "Kritis",
      high: "Tinggi",
      medium: "Sedang",
      low: "Rendah",
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-md border text-xs font-medium ${priorityColors[priorityLevel]}`}
          >
            {priorityLabels[priorityLevel]}
          </span>
          <span className="text-sm text-gray-600">
            Skor: {priorityScore.toFixed(2)}/5
          </span>
        </div>
        <p className="text-xs text-gray-600">
          Formula: (Dampak×0.4) + (Kemudahan×0.3) + (Keyakinan×0.3)
          <br />= ({impactScore}×0.4) + ({6 - effortScore}×0.3) + (
          {confidenceScore}×0.3) = {priorityScore.toFixed(2)}
        </p>
      </div>
    );
  };

  // Fetch users for PIC selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  // Fetch key results for selection
  const { data: keyResults = [] } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
    enabled: isOpen,
  });

  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      implementationPlan: "",
      definitionOfDone: "",
      keyResultId: keyResultId || "",
      picId: currentUserId || "",
      startDate: new Date(),
      dueDate: new Date(), // Today
      priority: "medium",
      budget: "",
      impactScore: 5,
      effortScore: 5,
      confidenceScore: 5,
    },
  });

  // Reset currentStep when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Reset form with initiative data when editing
  useEffect(() => {
    if (isEditMode && initiative) {
      form.reset({
        title: initiative.title || "",
        description: initiative.description || "",
        implementationPlan: (initiative as any)?.implementationPlan || "",
        definitionOfDone: (initiative as any)?.definitionOfDone || "",
        keyResultId: initiative.keyResultId || keyResultId || "",
        picId: initiative.picId || "",
        startDate: initiative.startDate
          ? new Date(initiative.startDate)
          : undefined,
        dueDate: initiative.dueDate ? new Date(initiative.dueDate) : undefined,
        priority: (initiative.priority as any) || "medium",
        budget: initiative.budget
          ? formatNumberWithSeparator(initiative.budget.toString())
          : "",
        impactScore: (initiative as any)?.impactScore || 5,
        effortScore: (initiative as any)?.effortScore || 5,
        confidenceScore: (initiative as any)?.confidenceScore || 5,
      });
      // Set successMetrics state from initiative data
      setSuccessMetrics((initiative as any)?.successMetrics || [{ name: "", target: "" }]);
    } else if (!isEditMode) {
      // Reset form for new initiative
      form.reset({
        title: "",
        description: "",
        implementationPlan: "",
        definitionOfDone: "",
        keyResultId: keyResultId || "",
        picId: currentUserId || "",
        startDate: new Date(),
        dueDate: new Date(), // Today
        priority: "medium",
        budget: "",
        impactScore: 5,
        effortScore: 5,
        confidenceScore: 5,
      });
      // Reset successMetrics state with default 1 row
      setSuccessMetrics([{ name: "", target: "" }]);
    }
  }, [isEditMode, initiative, keyResultId, currentUserId, form]);

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      // Calculate priority automatically based on scores (5-point scale)
      const priorityScore =
        data.impactScore * 0.4 +
        (6 - data.effortScore) * 0.3 +
        data.confidenceScore * 0.3;
      const calculatedPriority =
        priorityScore >= 4.0
          ? "critical"
          : priorityScore >= 3.0
            ? "high"
            : priorityScore >= 2.0
              ? "medium"
              : "low";

      const basePayload = {
        ...data,
        budget: data.budget ? getNumberValueForSubmission(data.budget) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: calculatedPriority, // Use calculated priority instead of manual selection
        priorityScore: priorityScore.toString(), // Store the calculated score as string
        successMetrics: successMetrics, // Use successMetrics state instead of form value
      };

      if (isEditMode) {
        // For updates, don't send createdBy or status
        console.log("Updating initiative with payload:", basePayload);
        console.log("Initiative ID:", initiative.id);
        return await apiRequest(
          "PUT",
          `/api/initiatives/${initiative.id}`,
          basePayload,
        );
      } else {
        // For new initiatives, include createdBy, status, and organizationId
        const createPayload = {
          ...basePayload,
          organizationId: user?.organizationId,
          status: "draft", // Auto-set status to draft for new initiatives
          createdBy: currentUserId, // Current user ID
        };
        console.log("Creating initiative with payload:", createPayload);
        return await apiRequest("POST", "/api/initiatives", createPayload);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode
          ? "Inisiatif berhasil diupdate"
          : "Inisiatif berhasil dibuat",
        description: isEditMode
          ? "Inisiatif telah diperbarui."
          : "Inisiatif baru telah ditambahkan.",
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Invalidate all initiative-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiative-members"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/initiatives/objective"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });

      // Invalidate specific initiative if updating
      if (isEditMode && initiative?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${initiative.id}`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${initiative.id}/tasks`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${initiative.id}/success-metrics`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${initiative.id}/notes`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${initiative.id}/history`],
        });
      }

      // Also invalidate specific objective queries using objectiveId
      if (objectiveId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/objective/${objectiveId}`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/objectives/${objectiveId}`],
        });
      }

      // Force a small delay to ensure queries are fully invalidated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/initiatives"] });
      }, 100);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("Initiative mutation error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        response: error.response,
        isEditMode,
        initiativeId: initiative?.id,
        currentUserId,
      });
      toast({
        title: isEditMode
          ? "Gagal mengupdate inisiatif"
          : "Gagal membuat inisiatif",
        description:
          error.message || "Terjadi kesalahan saat memproses inisiatif",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InitiativeFormData) => {
    createInitiativeMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? "Edit Inisiatif" : "Buat Inisiatif Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              {currentStep === 1 && "Langkah 1: Informasi Dasar - Tentukan judul, angka target terkait, tujuan, dan metrik inisiatif"}
              {currentStep === 2 && "Langkah 2: Rencana Pelaksanaan - Atur strategi implementasi dan definisi selesai"}
              {currentStep === 3 && "Langkah 3: Detail Akhir - Tentukan tanggal, penanggung jawab, anggaran, dan prioritas"}
            </DialogDescription>
            
            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                      currentStep === step
                        ? "bg-orange-600 text-white"
                        : currentStep > step
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600",
                    )}
                  >
                    {currentStep > step ? (
                      <span className="text-xs">✓</span>
                    ) : (
                      step
                    )}
                  </div>
                  <div className="ml-2 text-sm">
                    {step === 1 && (
                      <span className={currentStep === 1 ? "font-medium text-orange-600" : currentStep > 1 ? "text-green-600" : "text-gray-500"}>
                        Info Dasar
                      </span>
                    )}
                    {step === 2 && (
                      <span className={currentStep === 2 ? "font-medium text-orange-600" : currentStep > 2 ? "text-green-600" : "text-gray-500"}>
                        Rencana
                      </span>
                    )}
                    {step === 3 && (
                      <span className={currentStep === 3 ? "font-medium text-orange-600" : "text-gray-500"}>
                        Detail Akhir
                      </span>
                    )}
                  </div>
                  {step < 3 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-4" />
                  )}
                </div>
              ))}
            </div>
            <DialogDescription>
              {isEditMode
                ? "Update informasi inisiatif ini."
                : "Buat inisiatif baru untuk mendukung pencapaian angka target Anda."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto max-h-[60vh]">
              
              {/* Step 1: Info Dasar - judul inisiatif, angka target terkait, tujuan inisiatif, Metrik */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
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
                                  Nama inisiatif yang akan dijalankan untuk
                                  mencapai angka target.
                                  <br />
                                  <br />
                                  <strong>Contoh:</strong> "Kampanye Digital
                                  Marketing", "Pelatihan Tim Sales", "Optimisasi
                                  Website"
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan judul inisiatif..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Key Result Selection */}
                    <FormField
                      control={form.control}
                      name="keyResultId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Angka Target Terkait*</FormLabel>
                          <FormControl>
                            <SearchableKeyResultSelect
                              keyResults={keyResults || []}
                              value={field.value || ""}
                              onValueChange={field.onChange}
                              placeholder="Pilih angka target..."
                              objectiveId={objectiveId}
                              disabled={!!keyResultId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description (Tujuan Inisiatif) */}
                    <FormField
                      control={form.control}
                      name="description"
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
                                  Jelaskan tujuan dan alasan mengapa inisiatif ini penting
                                  untuk mencapai angka target.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Jelaskan tujuan dan manfaat inisiatif ini..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Success Metrics */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">Metrik Kesuksesan</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addMetric}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Metrik
                        </Button>
                      </div>
                      
                      {successMetrics.length > 0 && (
                        <div className="space-y-3">
                          {successMetrics.map((metric, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Input
                                  placeholder="Nama metrik (contoh: Jumlah lead baru)"
                                  value={metric.name}
                                  onChange={(e) => updateMetric(index, "name", e.target.value)}
                                  className="mb-2"
                                />
                                <Input
                                  placeholder="Target (contoh: 100 lead per bulan)"
                                  value={metric.target}
                                  onChange={(e) => updateMetric(index, "target", e.target.value)}
                                />
                              </div>
                              {successMetrics.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMetric(index)}
                                  className="text-red-600 hover:text-red-700 mt-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Rencana Pelaksanaan - Rencana pelaksanaan, definition of done, input task */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-orange-600" />
                      Rencana Pelaksanaan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Implementation Plan */}
                    <FormField
                      control={form.control}
                      name="implementationPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Rencana Pelaksanaan
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
                                  Langkah-langkah detail yang akan dilakukan untuk 
                                  menjalankan inisiatif ini.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Jelaskan langkah-langkah pelaksanaan inisiatif..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Definition of Done */}
                    <FormField
                      control={form.control}
                      name="definitionOfDone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Definition of Done
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
                                  Kriteria spesifik yang harus dipenuhi untuk menganggap
                                  inisiatif ini selesai.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tentukan kriteria selesai yang jelas dan terukur..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Task Input Placeholder */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Input Task</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Fitur untuk menambahkan task akan tersedia setelah inisiatif dibuat.
                        Anda dapat menambahkan dan mengelola task dari halaman detail inisiatif.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Detail Akhir - tanggal mulai, tanggal selesai, penanggung jawab, anggaran, prioritas */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-orange-600" />
                      Detail Akhir
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tanggal Mulai*</FormLabel>
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
                                      <span>Pilih tanggal mulai</span>
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
                                  disabled={(date) => date < new Date()}
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
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tanggal Selesai*</FormLabel>
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
                                      <span>Pilih tanggal selesai</span>
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
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* PIC */}
                    <FormField
                      control={form.control}
                      name="picId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penanggung Jawab*</FormLabel>
                          <FormControl>
                            <SearchableUserSelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Pilih penanggung jawab..."
                              currentUser={user}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Budget */}
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Anggaran (Rp)
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
                                  Estimasi anggaran yang dibutuhkan untuk
                                  melaksanakan inisiatif ini dalam Rupiah.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Contoh: 5.000.000"
                              value={formatNumberWithSeparator(
                                field.value || "",
                              )}
                              onChange={(e) =>
                                handleNumberInputChange(
                                  e.target.value,
                                  field.onChange,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Priority Calculation */}
                    <Card className="border-2 border-orange-100">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-orange-600" />
                          Perhitungan Prioritas
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Prioritas akan dihitung otomatis berdasarkan dampak, tingkat
                          kesulitan, dan keyakinan (skala 1-5)
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Impact Score */}
                          <FormField
                            control={form.control}
                            name="impactScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Dampak Bisnis
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
                                        Seberapa besar dampak inisiatif ini terhadap
                                        pencapaian angka target dan tujuan bisnis.
                                        <br />
                                        <br />
                                        1 = Sangat Rendah, 5 = Sangat Tinggi
                                      </p>
                                    </PopoverContent>
                                  </Popover>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih dampak..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <SelectItem key={score} value={score.toString()}>
                                        {score} - {getScoreLabel(score, "impact")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Effort Score */}
                          <FormField
                            control={form.control}
                            name="effortScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Tingkat Kesulitan
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
                                        Seberapa sulit implementasi inisiatif ini dalam hal
                                        resource, waktu, dan kompleksitas.
                                        <br />
                                        <br />
                                        1 = Sangat Mudah, 5 = Sangat Sulit
                                      </p>
                                    </PopoverContent>
                                  </Popover>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih kesulitan..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <SelectItem key={score} value={score.toString()}>
                                        {score} - {getScoreLabel(score, "effort")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Confidence Score */}
                          <FormField
                            control={form.control}
                            name="confidenceScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Tingkat Keyakinan
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
                                        Seberapa yakin Anda bahwa inisiatif ini akan berhasil
                                        mencapai target yang ditetapkan.
                                        <br />
                                        <br />
                                        1 = Sangat Rendah, 5 = Sangat Tinggi
                                      </p>
                                    </PopoverContent>
                                  </Popover>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih keyakinan..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <SelectItem key={score} value={score.toString()}>
                                        {score} - {getScoreLabel(score, "confidence")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Calculated Priority Display */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              Prioritas Otomatis
                            </span>
                          </div>
                          <CalculatedPriorityDisplay
                            impactScore={form.watch("impactScore")}
                            effortScore={form.watch("effortScore")}
                            confidenceScore={form.watch("confidenceScore")}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  {currentStep > 1 && (
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
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Batal
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 flex items-center gap-2"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createInitiativeMutation.isPending}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                    >
                      {createInitiativeMutation.isPending
                        ? "Menyimpan..."
                        : isEditMode
                          ? "Update Inisiatif"
                          : "Buat Inisiatif"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
