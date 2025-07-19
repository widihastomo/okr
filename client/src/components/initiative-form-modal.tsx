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
  const [successMetrics, setSuccessMetrics] = useState<
    Array<{ name: string; target: string }>
  >([]);

  // Get current user ID for default assignment
  const currentUserId =
    user && typeof user === "object" && "id" in user ? (user as any).id : null;

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

  // Reset form with initiative data when editing
  useEffect(() => {
    if (isEditMode && initiative) {
      form.reset({
        title: initiative.title || "",
        description: initiative.description || "",
        implementationPlan: (initiative as any)?.implementationPlan || "",
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Inisiatif" : "Buat Inisiatif Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update informasi inisiatif ini."
                : "Buat inisiatif baru untuk mendukung pencapaian angka target Anda."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardContent className="space-y-6 pt-6">
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
                            placeholder="Contoh: Aktivasi Reseller Baru Wilayah Timur"
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
                                Pilih angka target yang akan didukung oleh
                                inisiatif ini.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <SearchableKeyResultSelect
                            keyResults={keyResults}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Pilih angka target"
                            objectiveId={objectiveId}
                            disabled={!!keyResultId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Kenapa Inisiatif Ini Dibuat?
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
                                Penjelasan detail tentang inisiatif yang akan
                                dilakukan, alasan kenapa inisiatif perlu
                                dilakukan.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[120px] resize-y"
                            placeholder="Kenapa Inisiatif perlu dilakuan?
Contoh : Wilayah timur memiliki potensi pasar yang besar namun kontribusi penjualannya masih rendah. Maka dari itu, mengakselerasi akuisisi reseller aktif di wilayah tersebut dengan pendekatan sistematis berpotensi untuk meningkatakan omset."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Implementation Plan */}
                  <FormField
                    control={form.control}
                    name="implementationPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Rencana Pelaksanaan Inisiatif
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
                                Langkah-langkah konkret yang akan dilakukan untuk
                                melaksanakan inisiatif ini. Jelaskan tahapan,
                                aktivitas utama, dan pendekatan yang akan digunakan.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[120px] resize-y"
                            placeholder="Bagaimana rencana pelaksanaan inisiatif ini?
Contoh: 
Tim akan mulai dengan mengumpulkan database reseller wilayah timur, mengirim starter kit ke 10 reseller terpilih, dan menjadwalkan onboarding melalui Zoom supaya efisien."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grid for dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
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
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", {
                                      locale: id,
                                    })
                                  ) : (
                                    <span>Pilih tanggal mulai inisiatif</span>
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
                                disabled={(date) => {
                                  // Allow back dating for start date, only prevent very old dates
                                  return date < new Date("1900-01-01");
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Due Date */}
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
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", {
                                      locale: id,
                                    })
                                  ) : (
                                    <span>Pilih tanggal selesai inisiatif</span>
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
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0); // Reset time to start of day
                                  return (
                                    date < today ||
                                    date < new Date("1900-01-01")
                                  );
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Grid for PIC and Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PIC Selection */}
                    <FormField
                      control={form.control}
                      name="picId"
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
                                  Pilih orang yang bertanggung jawab untuk
                                  memimpin dan mengeksekusi inisiatif ini.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <SearchableUserSelect
                              users={
                                users?.filter(
                                  (user) => user.isActive === true,
                                ) || []
                              }
                              value={field.value || ""}
                              onValueChange={field.onChange}
                              placeholder="Pilih penanggung jawab"
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
                            Anggaran
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
                  </div>
                  {/* Success Metrics Section */}
                  <div className="pt-6 border-t">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        Apa tanda konkret bahwa inisiatif ini berhasil? Buat metrik
                        yang bisa mengukurnya secara obyektif.
                      </p>
                    </div>
                    
                    {/* Dynamic Table */}
                    <div className="border rounded-lg mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Metrik *</TableHead>
                            <TableHead>Target *</TableHead>
                            <TableHead className="w-16">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(successMetrics.length === 0 ? [{ name: "", target: "" }] : successMetrics).map((metric, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={metric.name}
                                  onChange={(e) => updateMetric(index, "name", e.target.value)}
                                  placeholder="Contoh: Tingkat konversi leads"
                                  className="w-full border-0 focus:ring-1 focus:ring-green-500"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={metric.target}
                                  onChange={(e) => updateMetric(index, "target", e.target.value)}
                                  placeholder="Contoh: 15% atau 100 leads"
                                  className="w-full border-0 focus:ring-1 focus:ring-green-500"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                {successMetrics.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMetric(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tombol Tambah Metrik */}
                    <Button
                      type="button"
                      onClick={addMetric}
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        Tambah Metrik Keberhasilan
                      </span>
                      <span className="sm:hidden">Tambah Metrik</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Calculation Card */}
              <Card>
                <CardHeader>
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
                                  <strong>1:</strong> Dampak sangat rendah
                                  <br />
                                  <strong>2:</strong> Dampak rendah
                                  <br />
                                  <strong>3:</strong> Dampak sedang
                                  <br />
                                  <strong>4:</strong> Dampak tinggi
                                  <br />
                                  <strong>5:</strong> Dampak sangat tinggi
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih dampak" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} - {getScoreLabel(num, "impact")}
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
                                  Seberapa sulit implementasi inisiatif ini dari
                                  segi waktu, sumber daya, dan kompleksitas.
                                  <br />
                                  <br />
                                  <strong>1:</strong> Sangat mudah
                                  <br />
                                  <strong>2:</strong> Mudah
                                  <br />
                                  <strong>3:</strong> Sedang
                                  <br />
                                  <strong>4:</strong> Sulit
                                  <br />
                                  <strong>5:</strong> Sangat sulit
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kesulitan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} - {getScoreLabel(num, "effort")}
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
                                  Seberapa yakin Anda bahwa inisiatif ini akan
                                  berhasil mencapai tujuannya.
                                  <br />
                                  <br />
                                  <strong>1:</strong> Keyakinan sangat rendah
                                  <br />
                                  <strong>2:</strong> Keyakinan rendah
                                  <br />
                                  <strong>3:</strong> Keyakinan sedang
                                  <br />
                                  <strong>4:</strong> Keyakinan tinggi
                                  <br />
                                  <strong>5:</strong> Keyakinan sangat tinggi
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih keyakinan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} - {getScoreLabel(num, "confidence")}
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

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


    </>
  );
}
