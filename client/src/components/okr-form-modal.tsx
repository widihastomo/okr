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

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OKRWithKeyResults, Cycle, User, Objective, Team } from "@shared/schema";

const objectiveFormSchema = z.object({
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
});

type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;



interface ObjectiveFormModalProps {
  okr?: OKRWithKeyResults; // undefined untuk create, object untuk edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OKRFormModal({ okr, open, onOpenChange }: ObjectiveFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        keyResults: [] // Send empty array for Goals-only creation
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

  const onSubmit = (data: ObjectiveFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    mutation.mutate(data);
  };



  const ownerType = form.watch("objective.ownerType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Buat Goal Baru'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update goal ini' : 'Tentukan goal Anda - Key Results dapat ditambahkan nanti di halaman detail'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Goal Information */}
            <div className="space-y-6">
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
            </div>

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