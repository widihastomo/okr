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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { HelpCircle, Plus, ChevronRight, ChevronLeft, Target, Trash2, CalendarIcon } from "lucide-react";
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

// Form schema for initiative
const initiativeFormSchema = z.object({
  initiative: z.object({
    title: z.string().min(1, "Judul inisiatif wajib diisi"),
    description: z.string().optional(),
    implementationPlan: z.string().optional(),
    definitionOfDone: z.string().optional(),
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
    } : {
      initiative: {
        title: "",
        description: "",
        implementationPlan: "",
        definitionOfDone: "",
        keyResultId: keyResultId || "",
        picId: user?.id || "",
        startDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        priority: "medium",
        budget: "",
      },
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
            definitionOfDone: initiative.definitionOfDone || "",
            keyResultId: initiative.keyResultId,
            picId: initiative.picId,
            startDate: new Date(initiative.startDate),
            dueDate: new Date(initiative.dueDate),
            priority: initiative.priority,
            budget: initiative.budget || "",
          },
        });
      } else {
        form.reset({
          initiative: {
            title: "",
            description: "",
            implementationPlan: "",
            definitionOfDone: "",
            keyResultId: keyResultId || "",
            picId: user?.id || "",
            startDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            priority: "medium",
            budget: "",
          },
        });
      }
    }
  }, [open, initiative, isEditMode, form, keyResultId, user?.id]);

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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Informasi Dasar & Metrik Keberhasilan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    name="initiative.definitionOfDone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Metrik Keberhasilan
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
                                Kriteria yang harus dipenuhi agar inisiatif ini dianggap berhasil. Buat kriteria yang spesifik dan terukur.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Contoh: 1. Chatbot dapat menjawab minimal 70% pertanyaan FAQ, 2. Response time rata-rata <30 detik, 3. User satisfaction score >4.0, 4. Dokumentasi lengkap tersedia..." 
                            {...field} 
                          />
                        </FormControl>
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
                </CardContent>
              </Card>
            )}

            {/* Step 2: Implementation Plan & Success Metrics */}
            {(currentStep === 2 || isEditMode) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Rencana & Metrik Sukses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  <FormField
                    control={form.control}
                    name="initiative.definitionOfDone"
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
                                Kriteria yang harus dipenuhi agar inisiatif ini dianggap selesai. Buat criteria yang spesifik dan terukur.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Contoh: 1. Chatbot dapat menjawab minimal 70% pertanyaan FAQ, 2. Response time rata-rata <30 detik, 3. User satisfaction score >4.0, 4. Dokumentasi lengkap tersedia..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
    </Dialog>
  );
}