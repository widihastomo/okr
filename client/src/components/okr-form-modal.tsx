import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Edit, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OKRWithKeyResults, Cycle, User, Objective, Team, KeyResult } from "@shared/schema";

const okrFormSchema = z.object({
  objective: z.object({
    title: z.string().min(1, "Objective title is required"),
    description: z.string().optional(),
    owner: z.string().optional(), // Made optional since it's calculated from ownerType and ownerId
    ownerType: z.enum(["user", "team"]).default("user"),
    ownerId: z.string().min(1, "Owner is required"),
    status: z.string().default("in_progress"),
    cycleId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
  }),
  keyResults: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Key result title is required"),
    description: z.string().optional(),
    currentValue: z.string().default("0"),
    targetValue: z.string().min(1, "Target value is required"),
    baseValue: z.string().optional(),
    unit: z.string().default("number"),
    keyResultType: z.string().default("increase_to"),
    status: z.string().default("in_progress"),
  })).min(1, "At least one key result is required"),
});

type OKRFormData = z.infer<typeof okrFormSchema>;

// Utility functions for number formatting
const formatNumberWithCommas = (value: string | number): string => {
  if (!value) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const parseNumberFromFormatted = (value: string): string => {
  if (!value) return '';
  // Remove thousand separators (dots) but keep decimal separator (comma)
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? '' : num.toString();
};

interface OKRFormModalProps {
  okr?: OKRWithKeyResults; // undefined untuk create, object untuk edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OKRFormModal({ okr, open, onOpenChange }: OKRFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!okr;

  // Fetch data yang diperlukan
  const { data: cycles } = useQuery<Cycle[]>({ queryKey: ["/api/cycles"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: objectives } = useQuery<Objective[]>({ queryKey: ["/api/objectives"] });

  const form = useForm<OKRFormData>({
    resolver: zodResolver(okrFormSchema),
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
      keyResults: okr.keyResults.map(kr => ({
        id: kr.id,
        title: kr.title,
        description: kr.description || "",
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        baseValue: kr.baseValue || "",
        unit: kr.unit,
        keyResultType: kr.keyResultType,
        status: kr.status,
      })),
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
      keyResults: [{
        title: "",
        description: "",
        currentValue: "0",
        targetValue: "",
        baseValue: "",
        unit: "number",
        keyResultType: "increase_to",
        status: "in_progress",
      }],
    },
  });

  // Reset form when okr prop changes or dialog opens
  useEffect(() => {
    if (open) {
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
          keyResults: okr.keyResults.map(kr => ({
            id: kr.id,
            title: kr.title,
            description: kr.description || "",
            currentValue: kr.currentValue,
            targetValue: kr.targetValue,
            baseValue: kr.baseValue || "",
            unit: kr.unit,
            keyResultType: kr.keyResultType,
            status: kr.status,
          })),
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
          keyResults: [{
            title: "",
            description: "",
            currentValue: "0",
            targetValue: "",
            baseValue: "",
            unit: "number",
            keyResultType: "increase_to",
            status: "in_progress",
          }],
        });
      }
    }
  }, [open, okr, isEditMode, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  const mutation = useMutation({
    mutationFn: async (data: OKRFormData) => {
      // Calculate the owner display name based on owner type and ID
      let ownerName = "";
      if (data.objective.ownerType === "team" && data.objective.ownerId) {
        const team = teams?.find(t => t.id === data.objective.ownerId);
        ownerName = team?.name || "";
      } else if (data.objective.ownerType === "user" && data.objective.ownerId) {
        const user = users?.find(u => u.id === data.objective.ownerId);
        ownerName = user ? `${user.firstName} ${user.lastName}` : "";
      }

      // If editing, identify key results that need to be deleted
      let keyResultsToDelete: string[] = [];
      if (isEditMode && okr) {
        const originalKeyResultIds = okr.keyResults.map(kr => kr.id);
        const currentKeyResultIds = data.keyResults
          .filter(kr => kr.id) // Only existing key results have IDs
          .map(kr => kr.id!);
        
        keyResultsToDelete = originalKeyResultIds.filter(
          id => !currentKeyResultIds.includes(id)
        );
      }

      // Delete removed key results first
      if (keyResultsToDelete.length > 0) {
        for (const keyResultId of keyResultsToDelete) {
          const deleteResponse = await fetch(`/api/key-results/${keyResultId}`, {
            method: "DELETE",
          });
          
          if (!deleteResponse.ok) {
            throw new Error(`Failed to delete key result ${keyResultId}`);
          }
        }
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
        keyResults: data.keyResults.map(kr => ({
          ...kr,
        })),
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
    onSuccess: () => {
      toast({
        title: "Success",
        description: `OKR ${isEditMode ? 'updated' : 'created'} successfully`,
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} OKR: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OKRFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    mutation.mutate(data);
  };

  const addKeyResult = () => {
    append({
      title: "",
      description: "",
      currentValue: "0",
      targetValue: "",
      baseValue: "",
      unit: "number",
      keyResultType: "increase_to",
      status: "in_progress",
    });
  };

  const ownerType = form.watch("objective.ownerType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit OKR' : 'Create New OKR'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the objective and key results' : 'Define your objective and key results'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Objective Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Objective Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="objective.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Judul Goal*
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Nama goal yang ingin dicapai. Gunakan bahasa yang inspiratif dan mudah dipahami oleh tim.
                                <br /><br />
                                <strong>Contoh:</strong> "Meningkatkan Kepuasan Pelanggan", "Memperluas Jangkauan Pasar", "Mengoptimalkan Efisiensi Operasional"
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Penjelasan detail tentang goal ini, mengapa penting, dan dampak yang diharapkan terhadap organisasi.
                                <br /><br />
                                <strong>Tips:</strong> Jelaskan konteks bisnis dan manfaat yang akan diperoleh ketika goal ini tercapai.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Periode waktu untuk menyelesaikan goal ini. Pilih siklus yang sesuai dengan target timeline Anda.
                                  <br /><br />
                                  <strong>Tips:</strong> Siklus bulanan untuk target jangka pendek, quarterly untuk target jangka menengah.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  Tentukan apakah goal ini dimiliki oleh individu atau tim.
                                  <br /><br />
                                  <strong>Individu:</strong> Goal personal atau tanggung jawab satu orang
                                  <br />
                                  <strong>Tim:</strong> Goal yang membutuhkan kolaborasi tim
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm">
                                  {ownerType === "team" 
                                    ? "Pilih tim yang bertanggung jawab mencapai goal ini. Tim yang dipilih akan menjadi pemilik dan penanggung jawab keberhasilan goal."
                                    : "Pilih individu yang bertanggung jawab mencapai goal ini. Pemilik akan menjadi penanggung jawab utama dalam pelaksanaan dan pelaporan progress."
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                Jika goal ini merupakan bagian dari goal yang lebih besar, pilih goal induk yang relevan.
                                <br /><br />
                                <strong>Contoh:</strong> Goal "Meningkatkan Penjualan" bisa menjadi induk dari "Meningkatkan Konversi Website"
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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

            {/* Key Results Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Key Results</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyResult}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Key Result
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Key Result {index + 1}</h4>
                      {fields.length > 1 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Key Result</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus Key Result ini? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove(index)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Judul Key Result*
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="text-sm">
                                      Judul akan menjadi bagian yang paling terlihat dari Key Result Anda dan harus jelas serta dapat diukur. 
                                      Tidak boleh ada keraguan tentang apa yang ingin Anda capai.
                                      <br /><br />
                                      <strong>Contoh:</strong> 'Meningkatkan pendapatan dari Rp20.000.000 ke Rp30.000.000'.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Masukkan nama Key Result" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.keyResultType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Tipe Key Result
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="text-sm">
                                      Pilih metode perhitungan yang sesuai:
                                      <br /><br />
                                      <strong>Peningkatan:</strong> Untuk target yang ingin ditingkatkan (pendapatan, penjualan)
                                      <br />
                                      <strong>Penurunan:</strong> Untuk target yang ingin dikurangi (biaya, waktu)
                                      <br />
                                      <strong>Ya/Tidak:</strong> Untuk pencapaian yang bersifat biner (fitur selesai/belum)
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="increase_to">Peningkatan</SelectItem>
                                <SelectItem value="decrease_to">Penurunan</SelectItem>
                                <SelectItem value="achieve_or_not">Ya/Tidak</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Deskripsi
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p className="text-sm">
                                    Jelaskan secara spesifik apa yang akan diukur dan mengapa ini penting untuk goal Anda.
                                    <br /><br />
                                    <strong>Tips:</strong> Buat deskripsi yang jelas sehingga setiap orang memahami cara mengukur keberhasilan Key Result ini.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Contoh: Meningkatkan jumlah pelanggan aktif melalui strategi pemasaran digital dan program referral" 
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
                        name={`keyResults.${index}.baseValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Nilai Awal*
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="text-sm">
                                      Titik awal dari pengukuran Anda saat ini. Ini adalah kondisi awal sebelum upaya perbaikan dimulai.
                                      <br /><br />
                                      <strong>Contoh:</strong> Pendapatan saat ini Rp20.000.000, jumlah pengguna 1.000, atau tingkat kepuasan 70%.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="0" 
                                required
                                {...field}
                                value={formatNumberWithCommas(field.value || '0')}
                                onChange={(e) => {
                                  const rawValue = parseNumberFromFormatted(e.target.value);
                                  field.onChange(rawValue);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.targetValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Target*
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="text-sm">
                                      Nilai yang ingin Anda capai di akhir periode. Target harus ambisius namun realistis.
                                      <br /><br />
                                      <strong>Contoh:</strong> Meningkatkan pendapatan ke Rp30.000.000, mencapai 5.000 pengguna, atau tingkat kepuasan 90%.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="100" 
                                required
                                {...field}
                                value={formatNumberWithCommas(field.value || '')}
                                onChange={(e) => {
                                  const rawValue = parseNumberFromFormatted(e.target.value);
                                  field.onChange(rawValue);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Unit
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="text-sm">
                                      Satuan pengukuran untuk Key Result Anda:
                                      <br /><br />
                                      <strong>Angka:</strong> Jumlah pengguna, produk terjual
                                      <br />
                                      <strong>Persentase:</strong> Tingkat kepuasan, konversi
                                      <br />
                                      <strong>Mata Uang:</strong> Pendapatan, biaya
                                      <br />
                                      <strong>Waktu:</strong> Hari atau jam untuk durasi
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="number">Angka</SelectItem>
                                <SelectItem value="percentage">Persentase</SelectItem>
                                <SelectItem value="currency">Mata Uang</SelectItem>
                                <SelectItem value="days">Hari</SelectItem>
                                <SelectItem value="hours">Jam</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
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