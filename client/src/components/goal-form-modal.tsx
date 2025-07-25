import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
import {
  HelpCircle,
  Plus,
  Edit,
  ChevronRight,
  ChevronLeft,
  Target,
  Trash2,
  TrendingUp,
  TrendingDown,
  MoveUp,
  MoveDown,
  ChevronsUpDown,
  Check,
  User as UserIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import {
  formatNumberWithSeparator,
  handleNumberInputChange,
  getNumberValueForSubmission,
} from "@/lib/number-utils";
import { useAuth } from "@/hooks/useAuth";
import type {
  GoalWithKeyResults,
  Cycle,
  User,
  Objective,
  Team,
} from "@shared/schema";

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
    const names = user.name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  // Fallback to email username
  const email = user.email?.split("@")[0] || "U";
  return email[0].toUpperCase();
};

// Unit options for Key Results
const unitOptions = [
  "Rp", // Rupiah (currency)
  "%", // Percentage
  "orang", // People
  "hari", // Days
  "bulan", // Months
  "unit", // Generic units
  "buah", // Pieces
  "rating", // Rating
  "skor", // Score
  "ton", // Tons
  "kg", // Kilograms
  "meter", // Meters
  "jam", // Hours
  "minggu", // Weeks
  "tahun", // Years
];

const keyResultSchema = z
  .object({
    id: z.string().optional(), // untuk edit mode
    title: z.string().min(1, "Judul Angka Target wajib diisi"),
    description: z.string().optional(),
    keyResultType: z
      .enum([
        "increase_to",
        "decrease_to",
        "achieve_or_not",
        "should_stay_above",
        "should_stay_below",
      ])
      .default("increase_to"),
    baseValue: z.string().optional(),
    targetValue: z.string().optional(),
    currentValue: z.string().default("0"),
    unit: z.string().optional(),
    status: z.string().default("in_progress"),
    assignedTo: z.string().optional(), // Penanggung jawab
    dueDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Target wajib diisi untuk semua tipe kecuali achieve_or_not yang tidak memiliki target
      if (data.keyResultType !== "achieve_or_not" && !data.targetValue) {
        return false;
      }
      // Unit wajib diisi untuk semua tipe kecuali achieve_or_not
      if (data.keyResultType !== "achieve_or_not" && !data.unit) {
        return false;
      }
      return true;
    },
    {
      message: "Target dan Unit wajib diisi untuk tipe ini",
      path: ["targetValue"],
    },
  )
  .refine(
    (data) => {
      // Logical validation for different key result types
      if (data.keyResultType === "achieve_or_not") {
        return true; // No numerical validation needed for binary type
      }

      const current = parseFloat(data.currentValue || "0");
      const target = parseFloat(data.targetValue || "0");
      const base = parseFloat(data.baseValue || "0");

      if (data.keyResultType === "increase_to") {
        // For increase_to: base < target (we want to increase from base to target)
        if (data.baseValue && data.targetValue) {
          if (base >= target) {
            return false; // Base should be less than target for increase
          }
        }
        return true;
      }

      if (data.keyResultType === "decrease_to") {
        // For decrease_to: base > target (we want to decrease from base to target)
        if (data.baseValue && data.targetValue) {
          if (base <= target) {
            return false; // Base should be greater than target for decrease
          }
        }
        return true;
      }

      // For should_stay types, no specific logical validation needed
      return true;
    },
    {
      message:
        "Nilai tidak logis: untuk 'Naik ke Target' nilai awal harus lebih kecil dari target, untuk 'Turun ke Target' nilai awal harus lebih besar dari target",
      path: ["baseValue"],
    },
  );

const objectiveFormSchema = z.object({
  objective: z.object({
    title: z.string().min(1, "Judul Goal wajib diisi"),
    description: z.string().optional(),
    owner: z.string().optional(), // Made optional since it's calculated from ownerType and ownerId
    ownerType: z.enum(["user", "team"]).default("user"),
    ownerId: z.string().min(1, "Pemilik wajib dipilih"),
    status: z.string().default("in_progress"),
    cycleId: z.string().min(1, "Siklus wajib dipilih"),
    teamId: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
  }),
  keyResults: z.array(keyResultSchema).default([]),
});

type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;
export type KeyResultFormData = z.infer<typeof keyResultSchema>;

// Function to find the closest cycle to today's date
function findClosestCycle(cycles: Cycle[]): string {
  if (!cycles || cycles.length === 0) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  let closestCycle = cycles[0];
  let smallestDifference = Infinity;

  for (const cycle of cycles) {
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);

    // Check if today is within the cycle
    if (today >= startDate && today <= endDate) {
      return cycle.id; // Return immediately if today is within a cycle
    }

    // Calculate the minimum distance to the cycle (either to start or end)
    const distanceToStart = Math.abs(today.getTime() - startDate.getTime());
    const distanceToEnd = Math.abs(today.getTime() - endDate.getTime());
    const minDistance = Math.min(distanceToStart, distanceToEnd);

    if (minDistance < smallestDifference) {
      smallestDifference = minDistance;
      closestCycle = cycle;
    }
  }

  return closestCycle.id;
}

interface ObjectiveFormModalProps {
  goal?: GoalWithKeyResults; // undefined untuk create, object untuk edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GoalFormModal({
  goal,
  open,
  onOpenChange,
}: ObjectiveFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [keyResultModalOpen, setKeyResultModalOpen] = useState(false);
  const [editingKeyResultIndex, setEditingKeyResultIndex] = useState<
    number | null
  >(null);
  const { user } = useAuth();
  const isEditMode = !!goal;

  // Fetch data yang diperlukan
  const { data: cycles } = useQuery<Cycle[]>({ queryKey: ["/api/cycles"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: objectives } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
  });

  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: isEditMode
      ? {
          objective: {
            title: goal.title,
            description: goal.description || "",
            owner: goal.owner,
            ownerType: goal.ownerType as "user" | "team",
            ownerId: goal.ownerId,
            status: goal.status,
            cycleId: goal.cycleId === null ? "" : goal.cycleId,
            teamId: goal.teamId === null ? undefined : goal.teamId,
            parentId: goal.parentId === null ? undefined : goal.parentId,
          },
          keyResults:
            goal.keyResults?.map((kr) => ({
              id: kr.id,
              title: kr.title,
              description: kr.description || "",
              keyResultType: kr.keyResultType as
                | "increase_to"
                | "decrease_to"
                | "achieve_or_not"
                | "should_stay_above"
                | "should_stay_below",
              baseValue: kr.baseValue || "",
              targetValue: kr.targetValue,
              currentValue: kr.currentValue,
              unit: kr.unit,
              status: kr.status,
            })) || [],
        }
      : {
          objective: {
            title: "",
            description: "",
            owner: user?.email || "",
            ownerType: "user",
            ownerId: user?.id || "",
            status: "in_progress",
            cycleId: findClosestCycle(cycles || []),
            teamId: undefined,
            parentId: undefined,
          },
          keyResults: [],
        },
  });

  // Reset form when goal prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1); // Reset to step 1 when dialog opens
      if (isEditMode && goal) {
        form.reset({
          objective: {
            title: goal.title,
            description: goal.description || "",
            owner: goal.owner,
            ownerType: goal.ownerType as "user" | "team",
            ownerId: goal.ownerId,
            status: goal.status,
            cycleId: goal.cycleId === null ? "" : goal.cycleId,
            teamId: goal.teamId === null ? undefined : goal.teamId,
            parentId: goal.parentId === null ? undefined : goal.parentId,
          },
          keyResults:
            goal.keyResults?.map((kr) => ({
              id: kr.id,
              title: kr.title,
              description: kr.description || "",
              keyResultType: kr.keyResultType as
                | "increase_to"
                | "decrease_to"
                | "achieve_or_not"
                | "should_stay_above"
                | "should_stay_below",
              baseValue: kr.baseValue || "",
              targetValue: kr.targetValue,
              currentValue: kr.currentValue,
              unit: kr.unit,
              status: kr.status,
            })) || [],
        });
      } else {
        // For new goals, auto-select the closest cycle to today
        const closestCycleId = findClosestCycle(cycles || []);
        form.reset({
          objective: {
            title: "",
            description: "",
            owner: user?.email || "",
            ownerType: "user",
            ownerId: user?.id || "",
            status: "not_started",
            cycleId: closestCycleId,
            teamId: undefined,
            parentId: undefined,
          },
          keyResults: [],
        });
      }
    }
  }, [open, goal, isEditMode, form, cycles, user?.id]);

  const mutation = useMutation({
    mutationFn: async (data: ObjectiveFormData) => {
      // Calculate the owner display name based on owner type and ID
      let ownerName = "";
      if (data.objective.ownerType === "team" && data.objective.ownerId) {
        const team = teams?.find((t) => t.id === data.objective.ownerId);
        ownerName = team?.name || "";
      } else if (
        data.objective.ownerType === "user" &&
        data.objective.ownerId
      ) {
        const user = users?.find((u) => u.id === data.objective.ownerId);
        ownerName = user
          ? user.name && user.name.trim() !== ""
            ? user.name.trim()
            : user.email?.split("@")[0] || ""
          : "";
      }

      // Prepare the payload with the calculated owner name
      const payload = {
        ...data,
        objective: {
          ...data.objective,
          owner: ownerName,
          // cycleId is now required, so no conversion to null
          teamId:
            data.objective.teamId === undefined ? null : data.objective.teamId,
          parentId:
            data.objective.parentId === undefined
              ? null
              : data.objective.parentId,
        },
        keyResults:
          data.keyResults?.map((kr) => ({
            ...kr,
            baseValue: kr.baseValue
              ? kr.baseValue.toString().replace(/[.,]/g, "")
              : null,
            targetValue: kr.targetValue
              ? kr.targetValue.toString().replace(/[.,]/g, "")
              : kr.targetValue,
            currentValue: kr.currentValue
              ? kr.currentValue.toString().replace(/[.,]/g, "")
              : kr.currentValue,
          })) || [],
      };

      const response = isEditMode
        ? await fetch(`/api/okrs/${goal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/okrs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to ${isEditMode ? "update" : "create"} Goal: ${errorData}`,
        );
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Goal ${isEditMode ? "diperbarui" : "berhasil dibuat"}`,
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onOpenChange(false);
      form.reset();

      // Redirect to objective detail page
      if (!isEditMode && data?.id) {
        setLocation(`/objectives/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} Goal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Navigation functions
  const nextStep = async () => {
    if (currentStep === 1) {
      // Validate required step 1 fields before proceeding
      const titleValid = await form.trigger("objective.title");
      const ownerTypeValid = await form.trigger("objective.ownerType");
      const ownerIdValid = await form.trigger("objective.ownerId");
      const cycleIdValid = await form.trigger("objective.cycleId");

      if (titleValid && ownerTypeValid && ownerIdValid && cycleIdValid) {
        setCurrentStep(2);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Key Result management functions
  const addKeyResult = () => {
    setKeyResultModalOpen(true);
  };

  const handleAddKeyResult = (keyResultData: KeyResultFormData) => {
    const currentKeyResults = form.getValues("keyResults") || [];
    if (editingKeyResultIndex !== null) {
      // Update existing key result
      const updatedKeyResults = [...currentKeyResults];
      updatedKeyResults[editingKeyResultIndex] = keyResultData;
      form.setValue("keyResults", updatedKeyResults);
    } else {
      // Add new key result
      form.setValue("keyResults", [...currentKeyResults, keyResultData]);
    }
    setKeyResultModalOpen(false);
    setEditingKeyResultIndex(null);
  };

  const editKeyResult = (index: number) => {
    setEditingKeyResultIndex(index);
    setKeyResultModalOpen(true);
  };

  const removeKeyResult = (index: number) => {
    const currentKeyResults = form.getValues("keyResults") || [];
    const updatedKeyResults = currentKeyResults.filter((_, i) => i !== index);
    form.setValue("keyResults", updatedKeyResults);
  };

  const onSubmit = (data: ObjectiveFormData) => {
    // Only submit if we're in edit mode or on step 2 (final step)
    if (isEditMode || currentStep === 2) {
      mutation.mutate(data);
    } else {
      // If on step 1, proceed to step 2
      nextStep();
    }
  };

  const ownerType = form.watch("objective.ownerType");
  const keyResults = form.watch("keyResults") || [];

  // Helper function to get step indicator
  const getStepIndicator = () => {
    if (isEditMode) return null; // No step indicator for edit mode

    return (
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
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
              className={`ml-2 text-sm font-medium ${
                currentStep >= 1 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Informasi Goal
            </span>
          </div>

          {/* Connector */}
          <ChevronRight className="w-5 h-5 text-gray-400" />

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
              className={`ml-2 text-sm font-medium ${
                currentStep >= 2 ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Angka Target
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
            {isEditMode ? "Edit Goal" : "Buat Goal Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update goal ini dan Angka Target"
              : currentStep === 1
                ? "Langkah 1: Tentukan informasi dasar goal Anda"
                : "Langkah 2: Tambahkan Angka Target untuk mengukur progress"}
          </DialogDescription>
        </DialogHeader>

        {getStepIndicator()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Step 1: Goal Information */}
            {(currentStep === 1 || isEditMode) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Informasi Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="objective.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Judul Goal*
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
                                Nama goal yang ingin dicapai. Gunakan bahasa
                                yang inspiratif dan mudah dipahami oleh tim.
                                <br />
                                <br />
                                <strong>Contoh:</strong> "Meningkatkan Kepuasan
                                Pelanggan", "Memperluas Jangkauan Pasar",
                                "Mengoptimalkan Efisiensi Operasional"
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh : Mendorong pertumbuhan pendapatan penjualan secara berkelanjutan"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objective.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Deskripsi Goal
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
                                Penjelasan detail tentang goal ini, mengapa
                                penting, dan dampak yang diharapkan terhadap
                                organisasi.
                                <br />
                                <br />
                                <strong>Tips:</strong> Jelaskan konteks bisnis
                                dan manfaat yang akan diperoleh ketika goal ini
                                tercapai.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kanapa goal ini penting?
Contoh: Goal ini bertujuan memastikan bahwa peningkatan pendapatan tidak bersifat musiman atau sesaat, tetapi hasil dari strategi yang terukur dan bisa diulangi keberhasilannya."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="objective.cycleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Siklus*
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
                                  Periode waktu untuk menyelesaikan goal ini.
                                  Pilih siklus yang sesuai dengan target
                                  timeline Anda.
                                  <br />
                                  <br />
                                  <strong>Tips:</strong> Siklus bulanan untuk
                                  target jangka pendek, quarterly untuk target
                                  jangka menengah.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih siklus" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cycles?.map((cycle) => (
                                <SelectItem key={cycle.id} value={cycle.id}>
                                  {cycle.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objective.ownerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Tipe Pemilik
                            <Popover>
                              <PopoverTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Tentukan apakah goal ini dimiliki oleh
                                  individu atau tim.
                                  <br />
                                  <br />
                                  <strong>Individu:</strong> Goal personal atau
                                  tanggung jawab satu orang
                                  <br />
                                  <strong>Tim:</strong> Goal yang membutuhkan
                                  kolaborasi tim
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe pemilik" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Individu</SelectItem>
                              <SelectItem value="team">Tim</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objective.ownerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            {ownerType === "team" ? "Tim*" : "Pemilik*"}

                            <Popover>
                              <PopoverTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  {ownerType === "team"
                                    ? "Pilih tim yang bertanggung jawab mencapai goal ini. Tim yang dipilih akan menjadi pemilik dan penanggung jawab keberhasilan goal."
                                    : "Pilih individu yang bertanggung jawab mencapai goal ini. Pemilik akan menjadi penanggung jawab utama dalam pelaksanaan dan pelaporan progress."}
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          {ownerType === "team" ? (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih tim" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {teams?.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <SearchableUserSelect
                                users={
                                  users?.filter(
                                    (user) => user.isActive === true,
                                  ) || []
                                }
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Pilih pemilik"
                                emptyMessage="Tidak ada user ditemukan"
                                currentUser={user}
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="objective.parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Goal Induk (Opsional)
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
                                Jika goal ini merupakan bagian dari goal yang
                                lebih besar, pilih goal induk yang relevan.
                                <br />
                                <br />
                                <strong>Contoh:</strong> Goal "Meningkatkan
                                Penjualan" bisa menjadi induk dari "Meningkatkan
                                Konversi Website"
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? undefined : value)
                          }
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih goal induk" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              Tanpa Goal Induk
                            </SelectItem>
                            {objectives
                              ?.filter(
                                (obj) => !isEditMode || obj.id !== goal?.id,
                              )
                              .map((objective) => (
                                <SelectItem
                                  key={objective.id}
                                  value={objective.id}
                                >
                                  {objective.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Key Results */}
            {(currentStep === 2 || isEditMode) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Angka Target
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {keyResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Belum ada Angka Target</p>
                      <p className="text-sm">
                        Klik tombol di atas untuk menambahkan
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Desktop Table View */}
                      <div className="hidden md:block border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Angka Target</TableHead>
                              <TableHead>Tipe</TableHead>
                              <TableHead className="text-center">
                                Nilai Awal
                              </TableHead>
                              <TableHead className="text-center">
                                Target
                              </TableHead>
                              <TableHead className="text-center">
                                Unit
                              </TableHead>
                              <TableHead className="text-center">
                                Penanggung Jawab
                              </TableHead>
                              <TableHead className="text-center">
                                Aksi
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {keyResults.map((keyResult, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-orange-600" />
                                    <div>
                                      <p className="font-medium">
                                        {keyResult.title ||
                                          `Angka Target ${index + 1}`}
                                      </p>
                                      {keyResult.description && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          {keyResult.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center">
                                    <Popover>
                                      <PopoverTrigger>
                                        <div className="cursor-pointer">
                                          {keyResult.keyResultType ===
                                            "increase_to" && (
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                          )}
                                          {keyResult.keyResultType ===
                                            "decrease_to" && (
                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                          )}
                                          {keyResult.keyResultType ===
                                            "achieve_or_not" && (
                                            <Target className="w-4 h-4 text-blue-600" />
                                          )}
                                          {keyResult.keyResultType ===
                                            "should_stay_above" && (
                                            <MoveUp className="w-4 h-4 text-orange-600" />
                                          )}
                                          {keyResult.keyResultType ===
                                            "should_stay_below" && (
                                            <MoveDown className="w-4 h-4 text-purple-600" />
                                          )}
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        side="top"
                                        className="max-w-xs z-50"
                                      >
                                        <div className="text-sm">
                                          {keyResult.keyResultType ===
                                            "increase_to" && (
                                            <div>
                                              <strong>Naik ke Target</strong>
                                              <p>
                                                Nilai harus ditingkatkan dari
                                                baseline menuju target yang
                                                lebih tinggi
                                              </p>
                                            </div>
                                          )}
                                          {keyResult.keyResultType ===
                                            "decrease_to" && (
                                            <div>
                                              <strong>Turun ke Target</strong>
                                              <p>
                                                Nilai harus diturunkan dari
                                                baseline menuju target yang
                                                lebih rendah
                                              </p>
                                            </div>
                                          )}
                                          {keyResult.keyResultType ===
                                            "achieve_or_not" && (
                                            <div>
                                              <strong>Ya/Tidak</strong>
                                              <p>
                                                Target bersifat binary -
                                                tercapai atau tidak tercapai
                                              </p>
                                            </div>
                                          )}
                                          {keyResult.keyResultType ===
                                            "should_stay_above" && (
                                            <div>
                                              <strong>Tetap Di Atas</strong>
                                              <p>
                                                Nilai harus tetap berada di atas
                                                ambang batas target
                                              </p>
                                            </div>
                                          )}
                                          {keyResult.keyResultType ===
                                            "should_stay_below" && (
                                            <div>
                                              <strong>Tetap Di Bawah</strong>
                                              <p>
                                                Nilai harus tetap berada di
                                                bawah ambang batas target
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {keyResult.keyResultType === "achieve_or_not"
                                    ? "-"
                                    : formatNumberWithSeparator(
                                        keyResult.baseValue || "0",
                                      )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {keyResult.keyResultType === "achieve_or_not"
                                    ? "-"
                                    : formatNumberWithSeparator(
                                        keyResult.targetValue || "0",
                                      )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {keyResult.keyResultType === "achieve_or_not"
                                    ? "-"
                                    : keyResult.unit || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  {keyResult.assignedTo ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                        <span className="text-xs font-medium text-orange-600">
                                          {users?.find(
                                            (u) =>
                                              u.id === keyResult.assignedTo,
                                          )
                                            ? getUserInitials(
                                                users.find(
                                                  (u) =>
                                                    u.id ===
                                                    keyResult.assignedTo,
                                                )!,
                                              )
                                            : "?"}
                                        </span>
                                      </div>
                                      <span className="text-sm text-gray-600 truncate max-w-20">
                                        {users?.find(
                                          (u) => u.id === keyResult.assignedTo,
                                        )
                                          ? getUserName(
                                              users.find(
                                                (u) =>
                                                  u.id === keyResult.assignedTo,
                                              )!,
                                            )
                                          : "Unknown"}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => editKeyResult(index)}
                                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeKeyResult(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {keyResults.map((keyResult, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-white shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-2 flex-1">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Target className="w-3 h-3 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-0.5">
                                    {keyResult.title ||
                                      `Angka Target ${index + 1}`}
                                  </h4>
                                  {keyResult.description && (
                                    <p className="text-xs text-gray-600 leading-snug">
                                      {keyResult.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 ml-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editKeyResult(index)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeKeyResult(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-100 h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                                <span className="text-xs font-medium text-gray-600">
                                  Tipe:
                                </span>
                                <Popover>
                                  <PopoverTrigger>
                                    <div className="cursor-pointer flex items-center gap-1">
                                      {keyResult.keyResultType ===
                                        "increase_to" && (
                                        <>
                                          <TrendingUp className="w-4 h-4 text-green-600" />
                                          <span className="text-xs font-medium text-green-600">
                                            Naik ke
                                          </span>
                                        </>
                                      )}
                                      {keyResult.keyResultType ===
                                        "decrease_to" && (
                                        <>
                                          <TrendingDown className="w-4 h-4 text-red-600" />
                                          <span className="text-xs font-medium text-red-600">
                                            Turun ke
                                          </span>
                                        </>
                                      )}
                                      {keyResult.keyResultType ===
                                        "achieve_or_not" && (
                                        <>
                                          <Target className="w-4 h-4 text-blue-600" />
                                          <span className="text-xs font-medium text-blue-600">
                                            Ya/Tidak
                                          </span>
                                        </>
                                      )}
                                      {keyResult.keyResultType ===
                                        "should_stay_above" && (
                                        <>
                                          <MoveUp className="w-4 h-4 text-orange-600" />
                                          <span className="text-xs font-medium text-orange-600">
                                            Tetap di atas
                                          </span>
                                        </>
                                      )}
                                      {keyResult.keyResultType ===
                                        "should_stay_below" && (
                                        <>
                                          <MoveDown className="w-4 h-4 text-purple-600" />
                                          <span className="text-xs font-medium text-purple-600">
                                            Tetap di bawah
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="top"
                                    className="max-w-xs z-50"
                                  >
                                    <div className="text-sm">
                                      {keyResult.keyResultType ===
                                        "increase_to" && (
                                        <div>
                                          <strong>Naik ke Target</strong>
                                          <p>
                                            Nilai harus ditingkatkan dari
                                            baseline menuju target yang lebih
                                            tinggi
                                          </p>
                                        </div>
                                      )}
                                      {keyResult.keyResultType ===
                                        "decrease_to" && (
                                        <div>
                                          <strong>Turun ke Target</strong>
                                          <p>
                                            Nilai harus diturunkan dari baseline
                                            menuju target yang lebih rendah
                                          </p>
                                        </div>
                                      )}
                                      {keyResult.keyResultType ===
                                        "achieve_or_not" && (
                                        <div>
                                          <strong>Ya/Tidak</strong>
                                          <p>
                                            Target bersifat binary - tercapai
                                            atau tidak tercapai
                                          </p>
                                        </div>
                                      )}
                                      {keyResult.keyResultType ===
                                        "should_stay_above" && (
                                        <div>
                                          <strong>Tetap Di Atas</strong>
                                          <p>
                                            Nilai harus tetap berada di atas
                                            ambang batas target
                                          </p>
                                        </div>
                                      )}
                                      {keyResult.keyResultType ===
                                        "should_stay_below" && (
                                        <div>
                                          <strong>Tetap Di Bawah</strong>
                                          <p>
                                            Nilai harus tetap berada di bawah
                                            ambang batas target
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {keyResult.keyResultType !== "achieve_or_not" && (
                                <div className="bg-white rounded-md p-2 border border-gray-100">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                      <div className="text-xs font-medium text-gray-500 mb-0.5">
                                        Awal
                                      </div>
                                      <div className="text-xs font-semibold text-gray-900 bg-gray-50 rounded px-1 py-0.5">
                                        {formatNumberWithSeparator(
                                          keyResult.baseValue || "0",
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs font-medium text-gray-500 mb-0.5">
                                        Target
                                      </div>
                                      <div className="text-xs font-semibold text-blue-600 bg-blue-50 rounded px-1 py-0.5">
                                        {formatNumberWithSeparator(
                                          keyResult.targetValue || "0",
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs font-medium text-gray-500 mb-0.5">
                                        Unit
                                      </div>
                                      <div className="text-xs font-semibold text-gray-700 bg-gray-50 rounded px-1 py-0.5">
                                        {keyResult.unit || "-"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Penanggung Jawab */}
                              <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                                <span className="text-xs font-medium text-gray-600">
                                  Penanggung Jawab:
                                </span>
                                {keyResult.assignedTo ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-xs font-medium text-blue-600">
                                        {users?.find(
                                          (u) => u.id === keyResult.assignedTo,
                                        )
                                          ? getUserInitials(
                                              users.find(
                                                (u) =>
                                                  u.id === keyResult.assignedTo,
                                              )!,
                                            )
                                          : "?"}
                                      </span>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">
                                      {users?.find(
                                        (u) => u.id === keyResult.assignedTo,
                                      )
                                        ? getUserName(
                                            users.find(
                                              (u) =>
                                                u.id === keyResult.assignedTo,
                                            )!,
                                          )
                                        : "Unknown"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Belum ditentukan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tombol Tambah Angka Target */}
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      onClick={addKeyResult}
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">
                        Tambah Angka Target
                      </span>
                      <span className="sm:hidden">Tambah</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              {!isEditMode && currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Batal
                </Button>

                {!isEditMode && currentStep === 1 ? (
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white w-full sm:w-auto order-1 sm:order-2"
                  >
                    Lanjut
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white w-full sm:w-auto order-1 sm:order-2"
                  >
                    {mutation.isPending
                      ? isEditMode
                        ? "Memperbarui..."
                        : "Membuat..."
                      : isEditMode
                        ? "Update Goal"
                        : "Buat Goal"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Key Result Modal */}
      <KeyResultModal
        open={keyResultModalOpen}
        onOpenChange={setKeyResultModalOpen}
        onSubmit={handleAddKeyResult}
        editingKeyResult={
          editingKeyResultIndex !== null
            ? keyResults[editingKeyResultIndex]
            : undefined
        }
        isEditing={editingKeyResultIndex !== null}
        users={users}
      />
    </Dialog>
  );
}

// Component untuk KeyResult Modal
export interface KeyResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (keyResult: KeyResultFormData) => void;
  editingKeyResult?: KeyResultFormData;
  isEditing?: boolean;
  users?: User[];
  goalOwner?: User;
}

export function KeyResultModal({
  open,
  onOpenChange,
  onSubmit,
  editingKeyResult,
  isEditing,
  users,
  goalOwner,
}: KeyResultModalProps) {
  const { user } = useAuth();
  const keyResultForm = useForm<KeyResultFormData>({
    resolver: zodResolver(
      z
        .object({
          title: z.string().min(1, "Judul harus diisi"),
          description: z.string().optional(),
          keyResultType: z.enum([
            "increase_to",
            "decrease_to",
            "achieve_or_not",
            "should_stay_above",
            "should_stay_below",
          ]),
          baseValue: z.string().optional(),
          targetValue: z.string().optional(),
          currentValue: z.string().optional(),
          unit: z.string().optional(),
          status: z.string().optional(),
          assignedTo: z.string().optional(),
        })
        .refine(
          (data) => {
            // Target wajib diisi untuk semua tipe kecuali achieve_or_not
            if (data.keyResultType !== "achieve_or_not" && !data.targetValue) {
              return false;
            }
            return true;
          },
          {
            message: "Target harus diisi",
            path: ["targetValue"],
          },
        )
        .refine(
          (data) => {
            // Unit wajib diisi kecuali untuk tipe achieve_or_not
            if (data.keyResultType !== "achieve_or_not" && !data.unit) {
              return false;
            }
            return true;
          },
          {
            message: "Unit harus diisi",
            path: ["unit"],
          },
        )
        .refine(
          (data) => {
            // Logical validation based on key result type
            if (
              data.keyResultType === "increase_to" &&
              data.baseValue &&
              data.targetValue
            ) {
              const baseVal = parseFloat(data.baseValue.replace(/[.,]/g, ""));
              const targetVal = parseFloat(
                data.targetValue.replace(/[.,]/g, ""),
              );
              if (
                !isNaN(baseVal) &&
                !isNaN(targetVal) &&
                baseVal >= targetVal
              ) {
                return false;
              }
            }

            if (
              data.keyResultType === "decrease_to" &&
              data.baseValue &&
              data.targetValue
            ) {
              const baseVal = parseFloat(data.baseValue.replace(/[.,]/g, ""));
              const targetVal = parseFloat(
                data.targetValue.replace(/[.,]/g, ""),
              );
              if (
                !isNaN(baseVal) &&
                !isNaN(targetVal) &&
                baseVal <= targetVal
              ) {
                return false;
              }
            }

            // For should_stay types, no specific logical validation needed
            return true;
          },
          {
            message:
              "Nilai tidak logis: untuk 'Naik ke Target' nilai awal harus lebih kecil dari target, untuk 'Turun ke Target' nilai awal harus lebih besar dari target",
            path: ["baseValue"],
          },
        ),
    ),
    defaultValues: {
      title: "",
      description: "",
      keyResultType: "increase_to",
      baseValue: "0",
      targetValue: "0",
      currentValue: "0",
      unit: "",
      status: "in_progress",
      assignedTo: "unassigned",
    },
  });

  // Use imported number formatting functions

  // Reset form when modal opens or when switching between create/edit modes
  useEffect(() => {
    if (open) {
      if (isEditing && editingKeyResult) {
        keyResultForm.reset(editingKeyResult);
      } else {
        keyResultForm.reset({
          title: "",
          description: "",
          keyResultType: "increase_to",
          baseValue: "0",
          targetValue: "0",
          currentValue: "0",
          unit: "",
          status: "in_progress",
          assignedTo: "unassigned",
        });
      }
    }
  }, [open, isEditing, editingKeyResult, keyResultForm, user?.id]);

  // Watch for keyResultType changes and clear inappropriate fields
  const currentKeyResultType = keyResultForm.watch("keyResultType");
  const currentTargetValue = keyResultForm.watch("targetValue");
  const currentBaseValue = keyResultForm.watch("baseValue");

  useEffect(() => {
    // Clear validation errors when type changes
    keyResultForm.clearErrors("baseValue");
    keyResultForm.clearErrors("targetValue");
    keyResultForm.clearErrors("currentValue");

    if (currentKeyResultType === "achieve_or_not") {
      // Clear target, base, and unit values for achieve_or_not type
      // Set currentValue to "0" as default for "not achieved"
      keyResultForm.setValue("targetValue", "");
      keyResultForm.setValue("baseValue", "");
      keyResultForm.setValue("currentValue", "0");
      keyResultForm.setValue("unit", "");
    } else if (
      currentKeyResultType === "should_stay_above" ||
      currentKeyResultType === "should_stay_below"
    ) {
      // For stay above/below types, we only need target value
      keyResultForm.setValue("baseValue", "");

      // For should_stay_below, currentValue should default to targetValue
      // For should_stay_above, currentValue should default to "0"
      if (currentKeyResultType === "should_stay_below") {
        const targetValue = keyResultForm.getValues("targetValue") || "0";
        keyResultForm.setValue("currentValue", targetValue);
      } else {
        keyResultForm.setValue("currentValue", "0");
      }

      // Reset target value to empty string to allow fresh input
      if (!isEditing) {
        keyResultForm.setValue("targetValue", "");
      }
    } else {
      // For increase_to and decrease_to, ensure all values are set
      if (!keyResultForm.getValues("baseValue")) {
        keyResultForm.setValue("baseValue", "0");
      }
      if (!keyResultForm.getValues("targetValue")) {
        keyResultForm.setValue("targetValue", "0");
      }
      if (!keyResultForm.getValues("currentValue")) {
        // For decrease_to, set currentValue to baseValue to prevent instant 100% progress
        if (currentKeyResultType === "decrease_to") {
          const baseValue = keyResultForm.getValues("baseValue") || "0";
          keyResultForm.setValue("currentValue", baseValue);
        } else {
          keyResultForm.setValue("currentValue", "0");
        }
      }
    }
  }, [currentKeyResultType, keyResultForm, isEditing]);

  // Watch for targetValue changes to update currentValue for should_stay_below
  useEffect(() => {
    if (currentKeyResultType === "should_stay_below" && currentTargetValue) {
      keyResultForm.setValue("currentValue", currentTargetValue);
    }
  }, [currentTargetValue, currentKeyResultType, keyResultForm]);

  const handleSubmit = (data: KeyResultFormData) => {
    // Convert formatted values to numeric before submitting
    let processedCurrentValue = data.currentValue
      ? getNumberValueForSubmission(data.currentValue)
      : "";

    // For decrease_to type, if currentValue is empty or "0", use baseValue as default
    if (data.keyResultType === "decrease_to") {
      if (!processedCurrentValue || processedCurrentValue === "0") {
        processedCurrentValue = data.baseValue
          ? getNumberValueForSubmission(data.baseValue)
          : "0";
      }
    }

    const processedData = {
      ...data,
      baseValue: data.baseValue
        ? getNumberValueForSubmission(data.baseValue)
        : "",
      targetValue: data.targetValue
        ? getNumberValueForSubmission(data.targetValue)
        : "",
      currentValue: processedCurrentValue,
    };

    onSubmit(processedData);
    keyResultForm.reset();
  };

  const handleCancel = () => {
    onOpenChange(false);
    keyResultForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Angka Target" : "Tambah Angka Target"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi angka target untuk mengukur pencapaian goal."
              : "Buat angka target baru dengan metrik yang spesifik dan terukur."}
          </DialogDescription>
        </DialogHeader>

        <Form {...keyResultForm}>
          <form
            onSubmit={keyResultForm.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Key Result Title */}
            <FormField
              control={keyResultForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Judul Angka Target*
                    <Popover>
                      <PopoverTrigger>
                        <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                      </PopoverTrigger>
                      <PopoverContent side="right" className="max-w-xs">
                        <p>
                          <strong>Buat judul yang spesifik dan terukur</strong>
                          <br />
                          <br />
                          Gunakan kata kerja yang jelas dan angka yang spesifik
                          untuk hasil yang mudah diukur.
                          <br />
                          <br />
                          <strong>Contoh baik:</strong> "Meningkatkan tingkat
                          retensi pengguna menjadi 85%", "Mengurangi waktu
                          respon dari 5 detik menjadi 2 detik"
                          <br />
                          <br />
                          <strong>Hindari:</strong> "Meningkatkan kualitas",
                          "Menjadi lebih baik"
                        </p>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Meningkatkan jumlah reseller aktif dari 500 ke 1.000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key Result Description */}
            <FormField
              control={keyResultForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Deskripsi
                    <Popover>
                      <PopoverTrigger>
                        <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                      </PopoverTrigger>
                      <PopoverContent side="right" className="max-w-xs">
                        <p>
                          <strong>
                            Jelaskan konteks dan detail pengukuran
                          </strong>
                          <br />
                          <br />
                          Berikan informasi yang membantu pemahaman bagaimana
                          mengukur dan mencapai target ini.
                          <br />
                          <br />
                          <strong>Sertakan:</strong> Metode pengukuran, sumber
                          data, frekuensi review, atau kriteria khusus
                          <br />
                          <br />
                          <strong>Contoh:</strong> "Diukur melalui survey
                          bulanan dengan minimal 100 responden"
                        </p>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh : Dengan pertumbuhan jumlah reseller aktif, diharapkan penjualan meningkat secara signifikan, terutama di wilayah yang belum tergarap optimal."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Result Type */}
              <FormField
                control={keyResultForm.control}
                name="keyResultType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Tipe Angka Target
                      <Popover>
                        <PopoverTrigger>
                          <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p>
                            <strong>
                              Pilih metode perhitungan yang sesuai:
                            </strong>
                            <br />
                            <br />
                            <strong>Naik ke:</strong> Progress = (Saat ini -
                            Awal) / (Target - Awal) × 100%
                            <br />
                            <strong>Turun ke:</strong> Progress = (Awal - Saat
                            ini) / (Awal - Target) × 100%
                            <br />
                            <strong>Tetap di atas:</strong> Threshold minimum
                            yang harus dipertahankan
                            <br />
                            <strong>Tetap di bawah:</strong> Threshold maksimum
                            yang tidak boleh dilampaui
                            <br />
                            <strong>Ya/Tidak:</strong> Pencapaian biner
                            (tercapai = 100%, tidak = 0%)
                          </p>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="increase_to">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Naik ke (Increase To)
                          </div>
                        </SelectItem>
                        <SelectItem value="decrease_to">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Turun ke (Decrease To)
                          </div>
                        </SelectItem>
                        <SelectItem value="should_stay_above">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Harus tetap di atas (Stay Above)
                          </div>
                        </SelectItem>
                        <SelectItem value="should_stay_below">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Harus tetap di bawah (Stay Below)
                          </div>
                        </SelectItem>
                        <SelectItem value="achieve_or_not">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Ya/Tidak (Achieve or Not)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit - Hide for achieve_or_not type */}
              {keyResultForm.watch("keyResultType") !== "achieve_or_not" && (
                <FormField
                  control={keyResultForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Unit*
                        <Popover>
                          <PopoverTrigger>
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </PopoverTrigger>
                          <PopoverContent side="right" className="max-w-xs">
                            <p>
                              <strong>
                                Tentukan satuan pengukuran yang spesifik
                              </strong>
                              <br />
                              <br />
                              Pilih unit yang jelas dan mudah dipahami untuk
                              memudahkan tracking progress.
                              <br />
                              <br />
                              <strong>Contoh unit:</strong> Rp (rupiah), %
                              (persen), orang (jumlah orang), hari (durasi),
                              rating (1-5), skor (nilai), ton (berat), dll
                              <br />
                              <br />
                              Anda bisa memilih dari daftar yang tersedia atau
                              mengetik unit baru sesuai kebutuhan.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value || "Pilih atau ketik unit..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari unit..." />
                            <CommandList>
                              <CommandEmpty>
                                Tidak ada unit ditemukan.
                              </CommandEmpty>
                              <CommandGroup>
                                {unitOptions.map((unit: string) => (
                                  <CommandItem
                                    key={unit}
                                    value={unit}
                                    onSelect={(value) => {
                                      field.onChange(value);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === unit
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {unit}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Conditional Value Fields */}
            {(() => {
              const keyResultType = keyResultForm.watch("keyResultType");

              if (keyResultType === "achieve_or_not") {
                return null; // Don't show any value fields
              }

              if (
                keyResultType === "should_stay_above" ||
                keyResultType === "should_stay_below"
              ) {
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Base Value - Disabled */}
                    <FormField
                      control={keyResultForm.control}
                      name="baseValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Nilai Awal
                            <Popover>
                              <PopoverTrigger>
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p>
                                  <strong>
                                    Tidak diperlukan untuk tipe threshold
                                  </strong>
                                  <br />
                                  <br />
                                  Untuk Key Result tipe "tetap di atas/bawah",
                                  nilai awal tidak diperlukan karena fokusnya
                                  adalah mempertahankan nilai di atas atau di
                                  bawah threshold tertentu.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tidak diperlukan"
                              disabled
                              value="-"
                              className="bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Target Value */}
                    <FormField
                      control={keyResultForm.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Target*
                            <Popover>
                              <PopoverTrigger>
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p>
                                  <strong>
                                    Threshold yang harus dipertahankan
                                  </strong>
                                  <br />
                                  <br />
                                  Untuk tipe "Tetap di atas": tentukan nilai
                                  minimum yang harus selalu dijaga atau
                                  dipertahankan.
                                  <br />
                                  Untuk tipe "Tetap di bawah": tentukan nilai
                                  maksimum yang tidak boleh dilampaui.
                                  <br />
                                  <br />
                                  <strong>Contoh:</strong> Rating tetap di atas
                                  4.0, biaya tetap di bawah 50 juta, response
                                  time di bawah 3 detik
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="100"
                              type="text"
                              value={formatNumberWithSeparator(
                                field.value || "",
                              )}
                              onChange={(e) =>
                                handleNumberInputChange(
                                  e.target.value,
                                  field.onChange,
                                )
                              }
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Current Value */}
                    <FormField
                      control={keyResultForm.control}
                      name="currentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Nilai Saat Ini*
                            <Popover>
                              <PopoverTrigger>
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p>
                                  <strong>Kondisi actual saat ini</strong>
                                  <br />
                                  <br />
                                  Isikan nilai kondisi saat ini untuk
                                  dibandingkan dengan threshold target. Nilai
                                  ini akan diupdate melalui proses update
                                  progress regular.
                                  <br />
                                  <br />
                                  <strong>Contoh:</strong> Rating saat ini 4.2,
                                  biaya saat ini 45 juta, response time saat ini
                                  2.8 detik
                                </p>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="50"
                              type="text"
                              value={formatNumberWithSeparator(
                                field.value || "",
                              )}
                              onChange={(e) =>
                                handleNumberInputChange(
                                  e.target.value,
                                  field.onChange,
                                )
                              }
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              }

              // For increase_to and decrease_to types
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Base Value */}
                  <FormField
                    control={keyResultForm.control}
                    name="baseValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Nilai Awal
                          <Popover>
                            <PopoverTrigger>
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p>
                                <strong>
                                  Nilai baseline sebagai titik awal pengukuran
                                </strong>
                                <br />
                                <br />
                                Masukkan kondisi saat ini atau kondisi awal
                                sebelum dimulainya Goal ini.
                                <br />
                                <br />
                                <strong>Tips:</strong> Gunakan data aktual yang
                                valid dan dapat diverifikasi
                                <br />
                                <br />
                                <strong>Contoh:</strong> Rating saat ini 3.2,
                                pendapatan bulan lalu 50 juta, waktu respons 5
                                detik
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0"
                            type="text"
                            value={field.value || ""}
                            onChange={(e) => {
                              handleNumberInputChange(
                                e.target.value,
                                (formattedValue) => {
                                  field.onChange(formattedValue); // Store formatted value directly
                                },
                              );
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Value */}
                  <FormField
                    control={keyResultForm.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Target*
                          <Popover>
                            <PopoverTrigger>
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p>
                                <strong>
                                  Nilai target yang ingin dicapai di akhir
                                  periode
                                </strong>
                                <br />
                                <br />
                                Tentukan target yang ambisius namun realistis
                                dan dapat dicapai dengan upaya yang optimal.
                                <br />
                                <br />
                                <strong>Tips:</strong> Target harus menantang
                                tapi tidak mustahil. Gunakan data historis atau
                                benchmark industri sebagai acuan.
                                <br />
                                <br />
                                <strong>Contoh:</strong> Rating 4.5, pendapatan
                                100 juta, waktu respons 2 detik
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="100"
                            type="text"
                            value={field.value || ""}
                            onChange={(e) => {
                              handleNumberInputChange(
                                e.target.value,
                                (formattedValue) => {
                                  field.onChange(formattedValue); // Store formatted value directly
                                },
                              );
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Current Value */}
                  <FormField
                    control={keyResultForm.control}
                    name="currentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Nilai Saat Ini
                          <Popover>
                            <PopoverTrigger>
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p>
                                <strong>
                                  Kondisi terkini atau titik awal saat ini
                                </strong>
                                <br />
                                <br />
                                Masukkan nilai aktual saat ini yang akan menjadi
                                starting point untuk tracking progress.
                                <br />
                                <br />
                                <strong>Tips:</strong> Biasanya dimulai dari
                                nilai yang sama dengan "Nilai Awal" dan akan
                                diupdate melalui update progress berkala.
                                <br />
                                <br />
                                <strong>Note:</strong> Nilai ini dapat diubah
                                sewaktu-waktu melalui fitur update progress.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0"
                            type="text"
                            value={field.value || ""}
                            onChange={(e) => {
                              handleNumberInputChange(
                                e.target.value,
                                (formattedValue) => {
                                  field.onChange(formattedValue); // Store formatted value directly
                                },
                              );
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
              );
            })()}

            {/* PIC/Assigned To Field */}
            <FormField
              control={keyResultForm.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Penanggung Jawab (PIC)
                    <Popover>
                      <PopoverTrigger>
                        <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                      </PopoverTrigger>
                      <PopoverContent side="right" className="max-w-xs">
                        <p>
                          <strong>Pilih penanggung jawab untuk angka target ini</strong>
                          <br />
                          <br />
                          Penanggung jawab akan bertanggung jawab untuk memantau, melaporkan progress, dan memastikan pencapaian angka target ini.
                          <br />
                          <br />
                          <strong>Opsional:</strong> Jika tidak dipilih, goal owner akan menjadi penanggung jawab default.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <SearchableUserSelect
                      users={users || []}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Pilih penanggung jawab..."
                      emptyMessage="Tidak ada user ditemukan"
                      allowUnassigned={true}
                      goalOwner={goalOwner}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
              >
                Simpan Angka Target
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Component untuk tombol Create Goal
export function CreateGoalButton(props: any) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white w-full sm:w-auto"
        data-tour="add-goal"
        {...props}
      >
        <Plus className="w-4 h-4 mr-2" />
        Buat Goal
      </Button>
      <GoalFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}
