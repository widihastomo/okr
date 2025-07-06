import React from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Target, HelpCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { formatNumberWithSeparator, handleNumberInputChange, getNumberValueForSubmission } from "@/lib/number-utils";
import type { KeyResult, User, Initiative } from "@shared/schema";

// Form schema for initiative (matching database schema)
const initiativeSchema = z.object({
  title: z.string().min(1, "Judul rencana wajib diisi"),
  description: z.string().optional(),
  keyResultId: z.string().min(1, "Angka target wajib dipilih"),
  picId: z.string().optional(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "on_hold", "cancelled"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  budget: z.string().optional(),
});

type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface InitiativeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyResultId?: string;
  initiative?: Initiative;
}

export default function InitiativeFormModal({ isOpen, onClose, keyResultId, initiative }: InitiativeFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditMode = !!initiative;

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
    resolver: zodResolver(initiativeSchema),
    defaultValues: {
      title: initiative?.title || "",
      description: initiative?.description || "",
      keyResultId: keyResultId || initiative?.keyResultId || "",
      picId: initiative?.picId || "",
      startDate: initiative?.startDate ? new Date(initiative.startDate) : undefined,
      dueDate: initiative?.dueDate ? new Date(initiative.dueDate) : undefined,
      status: (initiative?.status as any) || "not_started",
      priority: (initiative?.priority as any) || "medium",
      budget: initiative?.budget?.toString() || "",
    },
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      const payload = {
        ...data,
        targetContribution: getNumberValueForSubmission(data.targetContribution),
        budget: data.budget ? getNumberValueForSubmission(data.budget) : undefined,
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
      };

      if (isEditMode) {
        return apiRequest(`/api/initiatives/${initiative.id}`, {
          method: "PUT",
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
        description: isEditMode ? "Rencana telah diperbarui." : "Rencana baru telah ditambahkan.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      if (keyResultId) {
        queryClient.invalidateQueries({ queryKey: ["/api/initiatives/objective"] });
      }
      
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Terjadi kesalahan",
        description: error.message || "Gagal menyimpan rencana",
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {isEditMode ? "Edit Rencana" : "Buat Rencana Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update informasi rencana inisiatif ini." 
              : "Buat rencana inisiatif baru untuk mendukung pencapaian angka target Anda."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Informasi Rencana
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
                        Judul Rencana*
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
                              Nama rencana yang akan dijalankan untuk mencapai angka target.
                              <br /><br />
                              <strong>Contoh:</strong> "Kampanye Digital Marketing", "Pelatihan Tim Sales", "Optimisasi Website"
                            </p>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Kampanye Digital Marketing" {...field} />
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
                        Deskripsi Rencana
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
                              Penjelasan detail tentang rencana yang akan dilakukan, termasuk langkah-langkah dan strategi.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Jelaskan rencana yang akan dilakukan..." 
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
                              Pilih angka target yang akan didukung oleh rencana ini.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih angka target" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {keyResults.map((kr) => (
                            <SelectItem key={kr.id} value={kr.id}>
                              {kr.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Contribution */}
                <FormField
                  control={form.control}
                  name="targetContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Target Kontribusi*
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
                              Berapa besar kontribusi yang diharapkan dari rencana ini terhadap pencapaian angka target.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          placeholder="Contoh: 25" 
                          {...field} 
                          value={formatNumberWithSeparator(field.value)}
                          onChange={(e) => handleNumberInputChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              Pilih orang yang bertanggung jawab untuk memimpin dan mengeksekusi rencana ini.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <FormControl>
                        <SearchableUserSelect
                          users={users}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pilih penanggung jawab"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Grid for dates, status, priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Mulai</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
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
                                date < new Date() || date < new Date("1900-01-01")
                              }
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
                        <FormLabel>Tanggal Selesai</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
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
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_started">Belum Dimulai</SelectItem>
                            <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="paused">Tertunda</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Priority and Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anggaran</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="Contoh: 5000000" 
                            {...field} 
                            value={formatNumberWithSeparator(field.value || "")}
                            onChange={(e) => handleNumberInputChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createInitiativeMutation.isPending 
                  ? "Menyimpan..." 
                  : isEditMode 
                    ? "Update Rencana" 
                    : "Buat Rencana"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}