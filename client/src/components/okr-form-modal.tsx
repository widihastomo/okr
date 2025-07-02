import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { HelpCircle, Plus, Edit, ChevronRight, ChevronLeft, Target, Trash2, TrendingUp, TrendingDown, ChevronsUpDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { OKRWithKeyResults, Cycle, User, Objective, Team } from "@shared/schema";

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

const keyResultSchema = z.object({
  id: z.string().optional(), // untuk edit mode
  title: z.string().min(1, "Judul Ukuran Keberhasilan wajib diisi"),
  description: z.string().optional(),
  keyResultType: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]).default("increase_to"),
  baseValue: z.string().optional(),
  targetValue: z.string().min(1, "Target wajib diisi"),
  currentValue: z.string().default("0"),
  unit: z.string().min(1, "Unit wajib diisi"),
  status: z.string().default("in_progress"),
  dueDate: z.string().optional().nullable(),
});

const objectiveFormSchema = z.object({
  objective: z.object({
    title: z.string().min(1, "Judul Goal wajib diisi"),
    description: z.string().optional(),
    owner: z.string().optional(), // Made optional since it's calculated from ownerType and ownerId
    ownerType: z.enum(["user", "team"]).default("user"),
    ownerId: z.string().min(1, "Pemilik wajib dipilih"),
    status: z.string().default("in_progress"),
    cycleId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
  }),
  keyResults: z.array(keyResultSchema).default([]),
});

type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;
type KeyResultFormData = z.infer<typeof keyResultSchema>;



interface ObjectiveFormModalProps {
  okr?: OKRWithKeyResults; // undefined untuk create, object untuk edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OKRFormModal({ okr, open, onOpenChange }: ObjectiveFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [keyResultModalOpen, setKeyResultModalOpen] = useState(false);
  const isEditMode = !!okr;

  // Fetch data yang diperlukan
  const { data: cycles } = useQuery<Cycle[]>({ queryKey: ["/api/cycles"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: objectives } = useQuery<Objective[]>({ queryKey: ["/api/objectives"] });

  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: isEditMode ? {
      objective: {
        title: okr.title,
        description: okr.description || "",
        owner: okr.owner,
        ownerType: okr.ownerType as "user" | "team",
        ownerId: okr.ownerId,
        status: okr.status,
        cycleId: okr.cycleId === null ? undefined : okr.cycleId,
        teamId: okr.teamId === null ? undefined : okr.teamId,
        parentId: okr.parentId === null ? undefined : okr.parentId,
      },
      keyResults: okr.keyResults?.map(kr => ({
        id: kr.id,
        title: kr.title,
        description: kr.description || "",
        keyResultType: kr.keyResultType as "increase_to" | "decrease_to" | "achieve_or_not" | "should_stay_above" | "should_stay_below",
        baseValue: kr.baseValue || "",
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit,
        status: kr.status,
      })) || [],
    } : {
      objective: {
        title: "",
        description: "",
        owner: "",
        ownerType: "user",
        ownerId: "",
        status: "in_progress",
        cycleId: undefined,
        teamId: undefined,
        parentId: undefined,
      },
      keyResults: [],
    },
  });

  // Reset form when okr prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1); // Reset to step 1 when dialog opens
      if (isEditMode && okr) {
        form.reset({
          objective: {
            title: okr.title,
            description: okr.description || "",
            owner: okr.owner,
            ownerType: okr.ownerType as "user" | "team",
            ownerId: okr.ownerId,
            status: okr.status,
            cycleId: okr.cycleId === null ? undefined : okr.cycleId,
            teamId: okr.teamId === null ? undefined : okr.teamId,
            parentId: okr.parentId === null ? undefined : okr.parentId,
          },
          keyResults: okr.keyResults?.map(kr => ({
            id: kr.id,
            title: kr.title,
            description: kr.description || "",
            keyResultType: kr.keyResultType as "increase_to" | "decrease_to" | "achieve_or_not" | "should_stay_above" | "should_stay_below",
            baseValue: kr.baseValue || "",
            targetValue: kr.targetValue,
            currentValue: kr.currentValue,
            unit: kr.unit,
            status: kr.status,
          })) || [],
        });
      } else {
        form.reset({
          objective: {
            title: "",
            description: "",
            owner: "",
            ownerType: "user",
            ownerId: "",
            status: "in_progress",
            cycleId: undefined,
            teamId: undefined,
            parentId: undefined,
          },
          keyResults: [],
        });
      }
    }
  }, [open, okr, isEditMode, form]);



  const mutation = useMutation({
    mutationFn: async (data: ObjectiveFormData) => {
      // Calculate the owner display name based on owner type and ID
      let ownerName = "";
      if (data.objective.ownerType === "team" && data.objective.ownerId) {
        const team = teams?.find(t => t.id === data.objective.ownerId);
        ownerName = team?.name || "";
      } else if (data.objective.ownerType === "user" && data.objective.ownerId) {
        const user = users?.find(u => u.id === data.objective.ownerId);
        ownerName = user ? `${user.firstName} ${user.lastName}` : "";
      }



      // Prepare the payload with the calculated owner name
      const payload = {
        ...data,
        objective: {
          ...data.objective,
          owner: ownerName,
          // Convert "none" values back to null for the database
          cycleId: data.objective.cycleId === undefined ? null : data.objective.cycleId,
          teamId: data.objective.teamId === undefined ? null : data.objective.teamId,
          parentId: data.objective.parentId === undefined ? null : data.objective.parentId,
        },
        keyResults: data.keyResults || []
      };

      const response = isEditMode
        ? await fetch(`/api/okrs/${okr.id}`, {
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
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} OKR: ${errorData}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Goal ${isEditMode ? 'diperbarui' : 'berhasil dibuat'}`,
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
        description: `Failed to ${isEditMode ? 'update' : 'create'} OKR: ${error.message}`,
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
      
      if (titleValid && ownerTypeValid) {
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
    form.setValue("keyResults", [...currentKeyResults, keyResultData]);
    setKeyResultModalOpen(false);
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Informasi Goal
            </span>
          </div>
          
          {/* Connector */}
          <ChevronRight className="w-5 h-5 text-gray-400" />
          
          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Ukuran Keberhasilan
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
            {isEditMode ? 'Edit Goal' : 'Buat Goal Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update goal ini dan Ukuran Keberhasilan' 
              : currentStep === 1 
                ? 'Langkah 1: Tentukan informasi dasar goal Anda'
                : 'Langkah 2: Tambahkan Ukuran Keberhasilan untuk mengukur progress'
            }
          </DialogDescription>
        </DialogHeader>

        {getStepIndicator()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Nama goal yang ingin dicapai. Gunakan bahasa yang inspiratif dan mudah dipahami oleh tim.
                                <br /><br />
                                <strong>Contoh:</strong> "Meningkatkan Kepuasan Pelanggan", "Memperluas Jangkauan Pasar", "Mengoptimalkan Efisiensi Operasional"
                              </p>
                            </PopoverContent>
                          </Popover>
                        
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Meningkatkan Kepuasan Pelanggan" {...field} />
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
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Penjelasan detail tentang goal ini, mengapa penting, dan dampak yang diharapkan terhadap organisasi.
                                <br /><br />
                                <strong>Tips:</strong> Jelaskan konteks bisnis dan manfaat yang akan diperoleh ketika goal ini tercapai.
                              </p>
                            </PopoverContent>
                          </Popover>
                        
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Contoh: Goal ini akan meningkatkan loyalitas pelanggan melalui peningkatan kualitas layanan dan pengalaman pengguna yang lebih baik..." 
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
                          Siklus
                          <Popover>
                            <PopoverTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Periode waktu untuk menyelesaikan goal ini. Pilih siklus yang sesuai dengan target timeline Anda.
                                <br /><br />
                                <strong>Tips:</strong> Siklus bulanan untuk target jangka pendek, quarterly untuk target jangka menengah.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih siklus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Tanpa Siklus</SelectItem>
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
                                  Tentukan apakah goal ini dimiliki oleh individu atau tim.
                                  <br /><br />
                                  <strong>Individu:</strong> Goal personal atau tanggung jawab satu orang
                                  <br />
                                  <strong>Tim:</strong> Goal yang membutuhkan kolaborasi tim
                                </p>
                              </PopoverContent>
                            </Popover>
                          
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          {ownerType === "team" ? "Tim" : "Pemilik"}
                          
                            <Popover>
                              <PopoverTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  {ownerType === "team" 
                                    ? "Pilih tim yang bertanggung jawab mencapai goal ini. Tim yang dipilih akan menjadi pemilik dan penanggung jawab keberhasilan goal."
                                    : "Pilih individu yang bertanggung jawab mencapai goal ini. Pemilik akan menjadi penanggung jawab utama dalam pelaksanaan dan pelaporan progress."
                                  }
                                </p>
                              </PopoverContent>
                            </Popover>
                          
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={ownerType === "team" ? "Pilih tim" : "Pilih pemilik"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ownerType === "team" 
                              ? teams?.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))
                              : users?.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
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
                              <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Jika goal ini merupakan bagian dari goal yang lebih besar, pilih goal induk yang relevan.
                                <br /><br />
                                <strong>Contoh:</strong> Goal "Meningkatkan Penjualan" bisa menjadi induk dari "Meningkatkan Konversi Website"
                              </p>
                            </PopoverContent>
                          </Popover>
                        
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih goal induk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Goal Induk</SelectItem>
                          {objectives?.filter(obj => !isEditMode || obj.id !== okr?.id).map((objective) => (
                            <SelectItem key={objective.id} value={objective.id}>
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
                    Ukuran Keberhasilan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Tambahkan Ukuran Keberhasilan untuk mengukur progress goal ini
                    </p>
                    <Button type="button" onClick={addKeyResult} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Ukuran Keberhasilan
                    </Button>
                  </div>

                  {keyResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Belum ada Ukuran Keberhasilan</p>
                      <p className="text-sm">Klik tombol di atas untuk menambahkan</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ukuran Keberhasilan</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead className="text-center">Nilai Awal</TableHead>
                            <TableHead className="text-center">Target</TableHead>
                            <TableHead className="text-center">Unit</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keyResults.map((keyResult, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <p className="font-medium">
                                      {keyResult.title || `Ukuran Keberhasilan ${index + 1}`}
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
                                <Badge variant="outline" className="text-xs">
                                  {keyResult.keyResultType === 'increase_to' && 'Naik ke'}
                                  {keyResult.keyResultType === 'decrease_to' && 'Turun ke'}
                                  {keyResult.keyResultType === 'achieve_or_not' && 'Ya/Tidak'}
                                  {keyResult.keyResultType === 'should_stay_above' && 'Tetap di atas'}
                                  {keyResult.keyResultType === 'should_stay_below' && 'Tetap di bawah'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {keyResult.keyResultType === 'achieve_or_not' ? '-' : (keyResult.baseValue || '0')}
                              </TableCell>
                              <TableCell className="text-center">
                                {keyResult.keyResultType === 'achieve_or_not' ? '-' : (keyResult.targetValue || '0')}
                              </TableCell>
                              <TableCell className="text-center">
                                {keyResult.keyResultType === 'achieve_or_not' ? '-' : (keyResult.unit || '-')}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeKeyResult(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              {!isEditMode && currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                
                {!isEditMode && currentStep === 1 ? (
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Lanjut
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {mutation.isPending 
                      ? (isEditMode ? "Memperbarui..." : "Membuat...") 
                      : (isEditMode ? "Update Goal" : "Buat Goal")
                    }
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
      />
    </Dialog>
  );
}

// Component untuk KeyResult Modal
interface KeyResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (keyResult: KeyResultFormData) => void;
}

function KeyResultModal({ open, onOpenChange, onSubmit }: KeyResultModalProps) {
  const keyResultForm = useForm<KeyResultFormData>({
    resolver: zodResolver(z.object({
      title: z.string().min(1, "Judul harus diisi"),
      description: z.string().optional(),
      keyResultType: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]),
      baseValue: z.string().optional(),
      targetValue: z.string().min(1, "Target harus diisi"),
      currentValue: z.string().optional(),
      unit: z.string().min(1, "Unit harus diisi"),
      status: z.string().optional(),

    })),
    defaultValues: {
      title: "",
      description: "",
      keyResultType: "increase_to",
      baseValue: "",
      targetValue: "",
      currentValue: "0",
      unit: "",
      status: "in_progress",

    },
  });

  const handleSubmit = (data: KeyResultFormData) => {
    onSubmit(data);
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
          <DialogTitle>Tambah Ukuran Keberhasilan</DialogTitle>
        </DialogHeader>

        <Form {...keyResultForm}>
          <form onSubmit={keyResultForm.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Key Result Title */}
            <FormField
              control={keyResultForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Judul Ukuran Keberhasilan*
                    
                      <Popover>
                        <PopoverTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p>
                            <strong>Buat judul yang spesifik dan terukur</strong>
                            <br /><br />
                            Gunakan kata kerja yang jelas dan angka yang spesifik untuk hasil yang mudah diukur.
                            <br /><br />
                            <strong>Contoh baik:</strong> "Meningkatkan tingkat retensi pengguna menjadi 85%", "Mengurangi waktu respon dari 5 detik menjadi 2 detik"
                            <br /><br />
                            <strong>Hindari:</strong> "Meningkatkan kualitas", "Menjadi lebih baik"
                          </p>
                        </PopoverContent>
                      </Popover>
                    
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Meningkatkan rating kepuasan menjadi 4.5" {...field} />
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
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p>
                            <strong>Jelaskan konteks dan detail pengukuran</strong>
                            <br /><br />
                            Berikan informasi yang membantu pemahaman bagaimana mengukur dan mencapai target ini.
                            <br /><br />
                            <strong>Sertakan:</strong> Metode pengukuran, sumber data, frekuensi review, atau kriteria khusus
                            <br /><br />
                            <strong>Contoh:</strong> "Diukur melalui survey bulanan dengan minimal 100 responden"
                          </p>
                        </PopoverContent>
                      </Popover>
                    
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi detail tentang Ukuran Keberhasilan ini" {...field} />
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
                      Tipe Ukuran Keberhasilan
                      
                        <Popover>
                          <PopoverTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </PopoverTrigger>
                          <PopoverContent side="right" className="max-w-xs">
                            <p>
                              <strong>Pilih metode perhitungan yang sesuai:</strong>
                              <br /><br />
                              <strong>Naik ke:</strong> Progress = (Saat ini - Awal) / (Target - Awal) × 100%
                              <br />
                              <strong>Turun ke:</strong> Progress = (Awal - Saat ini) / (Awal - Target) × 100%
                              <br />
                              <strong>Tetap di atas:</strong> Threshold minimum yang harus dipertahankan
                              <br />
                              <strong>Tetap di bawah:</strong> Threshold maksimum yang tidak boleh dilampaui
                              <br />
                              <strong>Ya/Tidak:</strong> Pencapaian biner (tercapai = 100%, tidak = 0%)
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
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="max-w-xs">
                              <p>
                                <strong>Tentukan satuan pengukuran yang spesifik</strong>
                                <br /><br />
                                Pilih unit yang jelas dan mudah dipahami untuk memudahkan tracking progress.
                                <br /><br />
                                <strong>Contoh unit:</strong> Rp (rupiah), % (persen), orang (jumlah orang), hari (durasi), rating (1-5), skor (nilai), ton (berat), dll
                                <br /><br />
                                Anda bisa memilih dari daftar yang tersedia atau mengetik unit baru sesuai kebutuhan.
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
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Pilih atau ketik unit..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Cari atau ketik unit baru..." 
                              onValueChange={(value: string) => {
                                if (value && !unitOptions.includes(value)) {
                                  field.onChange(value);
                                }
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <Button
                                  variant="ghost"
                                  className="w-full text-left justify-start h-auto p-2"
                                  onClick={() => {
                                    const input = document.querySelector('[placeholder="Cari atau ketik unit baru..."]') as HTMLInputElement;
                                    if (input && input.value) {
                                      field.onChange(input.value);
                                    }
                                  }}
                                >
                                  Tambah unit baru
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                {unitOptions.map((unit: string) => (
                                  <CommandItem
                                    value={unit}
                                    key={unit}
                                    onSelect={() => {
                                      field.onChange(unit);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        unit === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
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
              
              if (keyResultType === "should_stay_above" || keyResultType === "should_stay_below") {
                return (
                  <div className="grid grid-cols-1 gap-4">
                    {/* Target Value Only */}
                    <FormField
                      control={keyResultForm.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Target*
                            
                              <Popover>
                                <PopoverTrigger>
                                  <HelpCircle className="w-4 h-4 text-gray-400" />
                                </PopoverTrigger>
                                <PopoverContent side="right" className="max-w-xs">
                                  <p>
                                    <strong>Threshold yang harus dipertahankan</strong>
                                    <br /><br />
                                    Untuk tipe "Tetap di atas": tentukan nilai minimum yang harus selalu dijaga atau dipertahankan.
                                    <br />
                                    Untuk tipe "Tetap di bawah": tentukan nilai maksimum yang tidak boleh dilampaui.
                                    <br /><br />
                                    <strong>Contoh:</strong> Rating tetap di atas 4.0, biaya tetap di bawah 50 juta, response time di bawah 3 detik
                                  </p>
                                </PopoverContent>
                              </Popover>
                            
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="100" type="number" step="0.1" {...field} />
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
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p>
                                  <strong>Nilai baseline sebagai titik awal pengukuran</strong>
                                  <br /><br />
                                  Masukkan kondisi saat ini atau kondisi awal sebelum dimulainya OKR ini.
                                  <br /><br />
                                  <strong>Tips:</strong> Gunakan data aktual yang valid dan dapat diverifikasi
                                  <br /><br />
                                  <strong>Contoh:</strong> Rating saat ini 3.2, pendapatan bulan lalu 50 juta, waktu respons 5 detik
                                </p>
                              </PopoverContent>
                            </Popover>
                          
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0" type="number" step="0.1" {...field} />
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
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p>
                                  <strong>Nilai target yang ingin dicapai di akhir periode</strong>
                                  <br /><br />
                                  Tentukan target yang ambisius namun realistis dan dapat dicapai dengan upaya yang optimal.
                                  <br /><br />
                                  <strong>Tips:</strong> Target harus menantang tapi tidak mustahil. Gunakan data historis atau benchmark industri sebagai acuan.
                                  <br /><br />
                                  <strong>Contoh:</strong> Rating 4.5, pendapatan 100 juta, waktu respons 2 detik
                                </p>
                              </PopoverContent>
                            </Popover>
                          
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="100" type="number" step="0.1" {...field} />
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
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                              </PopoverTrigger>
                              <PopoverContent side="right" className="max-w-xs">
                                <p>
                                  <strong>Kondisi terkini atau titik awal saat ini</strong>
                                  <br /><br />
                                  Masukkan nilai aktual saat ini yang akan menjadi starting point untuk tracking progress.
                                  <br /><br />
                                  <strong>Tips:</strong> Biasanya dimulai dari nilai yang sama dengan "Nilai Awal" dan akan diupdate melalui check-in berkala.
                                  <br /><br />
                                  <strong>Note:</strong> Nilai ini dapat diubah sewaktu-waktu melalui fitur update progress.
                                </p>
                              </PopoverContent>
                            </Popover>
                          
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0" type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })()}



            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Simpan Ukuran Keberhasilan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Component untuk tombol Create OKR
export function CreateOKRButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Buat Goal
      </Button>
      <OKRFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}

// Component untuk tombol Edit OKR
export function EditOKRButton({ okr }: { okr: OKRWithKeyResults }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-gray-600 hover:text-gray-800"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <OKRFormModal okr={okr} open={open} onOpenChange={setOpen} />
    </>
  );
}