import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  DollarSign, 
  Target, 
  FileText,
  AlertCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const closureSchema = z.object({
  result: z.enum(['berhasil', 'gagal', 'perlu_diulang'], {
    required_error: "Pilih hasil inisiatif",
  }),
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
  learningNote: z.string().min(10, "Catatan pembelajaran minimal 10 karakter"),
  budgetUsed: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const numericValue = val.replace(/\D/g, ''); // Remove non-digits
      return numericValue === '' || !isNaN(Number(numericValue));
    }, "Budget harus berupa angka yang valid"),
  notes: z.string().optional(),
});

type ClosureFormData = z.infer<typeof closureSchema>;

interface InitiativeClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: any;
  successMetrics?: any[];
  tasks?: any[];
  dodItems?: any[];
  onSuccess?: () => void;
}

export default function InitiativeClosureModal({
  isOpen,
  onClose,
  initiative,
  successMetrics = [],
  tasks = [],
  dodItems = [],
  onSuccess
}: InitiativeClosureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatedMetrics, setUpdatedMetrics] = useState<any[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<any[]>([]);
  const [dodUpdates, setDodUpdates] = useState<any[]>([]);
  const [showIncompleteTasksConfirmation, setShowIncompleteTasksConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ClosureFormData | null>(null);

  // Helper functions for number formatting
  const formatNumber = (value: string): string => {
    if (!value) return '';
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    // Add thousand separators
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumber = (value: string): string => {
    // Remove thousand separators to get raw number
    return value.replace(/\./g, '');
  };

  const handleBudgetChange = (value: string, onChange: (value: string) => void) => {
    // Remove all non-digits first
    const cleanValue = value.replace(/\D/g, '');
    // Store the clean numeric value
    onChange(cleanValue);
  };

  const form = useForm<ClosureFormData>({
    resolver: zodResolver(closureSchema),
    defaultValues: {
      result: undefined,
      reason: "",
      learningNote: "",
      budgetUsed: "",
      notes: "",
    },
  });

  const selectedResult = form.watch("result");

  // Initialize metrics, tasks, and DOD when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form to ensure clean state
      form.reset({
        result: undefined,
        reason: "",
        learningNote: "",
        budgetUsed: "",
        notes: "",
      });

      const metricsArray = Array.isArray(successMetrics) ? successMetrics : [];
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      const dodArray = Array.isArray(dodItems) ? dodItems : [];

      setUpdatedMetrics(metricsArray.map(metric => ({
        id: metric.id,
        currentValue: (metric.achievement || 0).toString(),
        isCompleted: metric.isCompleted || false
      })));
      
      setTaskUpdates(tasksArray
        .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
        .map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          newStatus: task.status
        }))
      );

      setDodUpdates(dodArray
        .filter(dod => !dod.isCompleted)
        .map(dod => ({
          id: dod.id,
          title: dod.title,
          isCompleted: dod.isCompleted,
          newStatus: dod.isCompleted
        }))
      );
    }
  }, [isOpen, successMetrics, tasks, dodItems, form]);

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'berhasil':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'gagal':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'perlu_diulang':
        return <RotateCcw className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'berhasil':
        return 'Berhasil';
      case 'gagal':
        return 'Gagal';
      case 'perlu_diulang':
        return 'Perlu Diulang';
      default:
        return '';
    }
  };

  const getLearningPrompt = (result: string) => {
    switch (result) {
      case 'berhasil':
        return 'Apa hal yang bisa digunakan lagi untuk inisiatif serupa?';
      case 'gagal':
        return 'Apa hal yang sebaiknya dihindari untuk inisiatif serupa?';
      case 'perlu_diulang':
        return 'Apa hal yang bisa dilakukan secara berbeda untuk pengulangan?';
      default:
        return 'Catatan pembelajaran';
    }
  };

  const getReasonLabel = (result: string) => {
    switch (result) {
      case 'berhasil':
        return 'Alasan keberhasilan';
      case 'gagal':
        return 'Alasan kegagalan';
      case 'perlu_diulang':
        return 'Alasan perlu pengulangan';
      default:
        return 'Alasan';
    }
  };

  const getReasonPlaceholder = (result: string) => {
    switch (result) {
      case 'berhasil':
        return 'Contoh: Tim berhasil berkolaborasi dengan baik, strategi pemasaran terbukti efektif, dan dukungan manajemen sangat membantu';
      case 'gagal':
        return 'Contoh: Anggaran terbatas, timeline terlalu ketat, kurangnya sumber daya manusia yang kompeten';
      case 'perlu_diulang':
        return 'Contoh: Perlu penyesuaian strategi, membutuhkan waktu lebih lama untuk implementasi, ada faktor eksternal yang belum diperhitungkan';
      default:
        return 'Jelaskan alasan secara detail...';
    }
  };

  const getLearningPlaceholder = (result: string) => {
    switch (result) {
      case 'berhasil':
        return 'Contoh: Komunikasi rutin dengan stakeholder kunci sangat penting, investasi pada training tim memberikan hasil yang signifikan';
      case 'gagal':
        return 'Contoh: Perlu analisis risiko yang lebih mendalam, pentingnya backup plan, koordinasi antar departemen harus diperbaiki';
      case 'perlu_diulang':
        return 'Contoh: Perlu fase pilot test terlebih dahulu, timeline harus lebih realistis, perlu melibatkan expert eksternal';
      default:
        return 'Bagikan pembelajaran yang bisa digunakan untuk inisiatif serupa...';
    }
  };

  const updateMetricValue = (metricId: string, value: string) => {
    setUpdatedMetrics(prev => 
      prev.map(metric => 
        metric.id === metricId 
          ? { ...metric, currentValue: value }
          : metric
      )
    );
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setTaskUpdates(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, newStatus }
          : task
      )
    );
  };

  const updateDodStatus = (dodId: string, isCompleted: boolean) => {
    setDodUpdates(prev => 
      prev.map(dod => 
        dod.id === dodId 
          ? { ...dod, newStatus: isCompleted }
          : dod
      )
    );
  };

  const closeInitiativeMutation = useMutation({
    mutationFn: async (data: ClosureFormData) => {
      // Update initiative with closure data
      await apiRequest("PATCH", `/api/initiatives/${initiative.id}`, {
        status: "selesai",
        closureData: {
          result: data.result,
          reason: data.reason,
          learningNote: data.learningNote,
          budgetUsed: data.budgetUsed ? parseFloat(data.budgetUsed) : null,
          notes: data.notes,
          closedAt: new Date().toISOString(),
        }
      });

      // Update success metrics
      for (const metric of updatedMetrics || []) {
        await apiRequest("PATCH", `/api/success-metrics/${metric.id}`, {
          achievement: metric.currentValue
        });
      }

      // Update task statuses
      for (const task of taskUpdates || []) {
        if (task.newStatus !== task.status) {
          await apiRequest("PATCH", `/api/tasks/${task.id}`, {
            status: task.newStatus
          });
        }
      }

      // Update DOD item statuses
      for (const dod of dodUpdates || []) {
        if (dod.newStatus !== dod.isCompleted) {
          await apiRequest("PATCH", `/api/definition-of-done/${dod.id}/toggle`, {
            isCompleted: dod.newStatus
          });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/success-metrics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/definition-of-done`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/history`] });
      
      toast({
        title: "Inisiatif berhasil ditutup",
        description: "Inisiatif telah ditutup dengan semua data terupdate",
        variant: "success",
      });
      
      form.reset();
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menutup inisiatif",
        description: error.message || "Terjadi kesalahan saat menutup inisiatif",
        variant: "destructive",
      });
    },
  });

  // Check if there are incomplete tasks
  const hasIncompleteTasks = () => {
    return taskUpdates.some(task => 
      task.newStatus === 'not_started' || task.newStatus === 'in_progress'
    );
  };

  // Get count of incomplete tasks
  const getIncompleteTasksCount = () => {
    return taskUpdates.filter(task => 
      task.newStatus === 'not_started' || task.newStatus === 'in_progress'
    ).length;
  };

  // Handle form submission with incomplete tasks check
  const onSubmit = (data: ClosureFormData) => {
    if (hasIncompleteTasks()) {
      setPendingFormData(data);
      setShowIncompleteTasksConfirmation(true);
    } else {
      closeInitiativeMutation.mutate(data);
    }
  };

  // Handle confirmation to proceed with incomplete tasks
  const handleConfirmProceed = () => {
    if (pendingFormData) {
      closeInitiativeMutation.mutate(pendingFormData);
    }
    setShowIncompleteTasksConfirmation(false);
    setPendingFormData(null);
  };

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowIncompleteTasksConfirmation(false);
    setPendingFormData(null);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const incompleteTasks = Array.isArray(tasks) ? tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled') : [];
  const incompleteDodItems = Array.isArray(dodItems) ? dodItems.filter(dod => !dod.isCompleted) : [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Tutup Inisiatif: {initiative?.title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Hasil Inisiatif */}
                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Hasil Inisiatif</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="inline-flex items-center justify-center">
                              <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Panduan Hasil Inisiatif</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Berhasil</p>
                                    <p className="text-gray-600">Inisiatif mencapai tujuan yang ditetapkan dengan baik</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Gagal</p>
                                    <p className="text-gray-600">Inisiatif tidak mencapai target yang diharapkan</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <RotateCcw className="h-4 w-4 text-yellow-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Perlu Diulang</p>
                                    <p className="text-gray-600">Inisiatif perlu dijalankan kembali dengan penyesuaian</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih hasil inisiatif" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="berhasil">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Berhasil
                            </div>
                          </SelectItem>
                          <SelectItem value="gagal">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Gagal
                            </div>
                          </SelectItem>
                          <SelectItem value="perlu_diulang">
                            <div className="flex items-center gap-2">
                              <RotateCcw className="h-4 w-4 text-yellow-500" />
                              Perlu Diulang
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alasan dan Catatan Pembelajaran */}
                {selectedResult && (
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 h-8 flex items-center">{getReasonLabel(selectedResult)}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={getReasonPlaceholder(selectedResult)}
                                {...field}
                                rows={2}
                                className="border-gray-300 text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="learningNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 h-8 flex items-center">{getLearningPrompt(selectedResult)}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={getLearningPlaceholder(selectedResult)}
                                {...field}
                                rows={2}
                                className="border-gray-300 text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Update Budget */}
                {selectedResult && (
                  <div className="border-t border-gray-200 pt-4">
                    <FormField
                      control={form.control}
                      name="budgetUsed"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel className="text-sm font-medium text-gray-700">Budget yang digunakan (Rp)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button type="button" className="inline-flex items-center justify-center">
                                  <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Panduan Update Budget</h4>
                                  <div className="space-y-2 text-sm">
                                    <p>• Masukkan total budget yang sudah digunakan selama inisiatif berjalan</p>
                                    <p>• Budget ini akan digunakan untuk evaluasi efisiensi biaya</p>
                                    <p>• Kosongkan jika tidak ada perubahan budget</p>
                                    <p>• Format: angka tanpa titik atau koma (contoh: 1000000)</p>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Contoh: 80.000.000 (untuk Rp 80.000.000)"
                              value={field.value ? formatNumber(field.value) : ''}
                              onChange={(e) => handleBudgetChange(e.target.value, field.onChange)}
                              className="border-gray-300"
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            Budget awal: Rp {initiative?.budget ? Number(initiative.budget).toLocaleString('id-ID') : '0'}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Update Success Metrics */}
                {selectedResult && Array.isArray(successMetrics) && successMetrics.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-700">Update Metrik Keberhasilan</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex items-center justify-center">
                            <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Panduan Update Metrik Keberhasilan</h4>
                            <div className="space-y-2 text-sm">
                              <p>• Masukkan nilai final yang dicapai untuk setiap metrik</p>
                              <p>• Nilai ini akan dibandingkan dengan target yang ditetapkan</p>
                              <p>• Digunakan untuk menghitung tingkat keberhasilan inisiatif</p>
                              <p>• Jika tidak ada perubahan, biarkan nilai saat ini</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      {successMetrics.map((metric) => (
                        <div key={metric.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{metric.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  Target: {metric.target || 0}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  Sekarang: {metric.achievement || 0}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-24">
                              <Input
                                type="text"
                                value={updatedMetrics.find(m => m.id === metric.id)?.currentValue || (metric.achievement || 0).toString()}
                                onChange={(e) => updateMetricValue(metric.id, e.target.value)}
                                placeholder="Final"
                                className="text-xs h-8 border-blue-300"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update DOD Status */}
                {selectedResult && incompleteDodItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-700">Update Status Deliverable (Output)</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex items-center justify-center">
                            <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Panduan Update Status Deliverable</h4>
                            <div className="space-y-2 text-sm">
                              <p>• <strong>Selesai:</strong> Deliverable telah diselesaikan sepenuhnya</p>
                              <p>• <strong>Belum Selesai:</strong> Deliverable belum diselesaikan</p>
                              <p>• Update status ini untuk mencerminkan kondisi akhir deliverable</p>
                              <p>• Deliverable yang sudah selesai akan membantu menentukan tingkat pencapaian inisiatif</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      {incompleteDodItems.map((dod) => (
                        <div key={dod.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{dod.title}</h4>
                              <span className="text-xs text-gray-500 mt-1 block">
                                Saat ini: {dod.isCompleted ? 'Selesai' : 'Belum Selesai'}
                              </span>
                            </div>
                            <div className="flex-shrink-0 w-32">
                              <Select
                                value={dodUpdates.find(d => d.id === dod.id)?.newStatus ? 'completed' : 'not_completed'}
                                onValueChange={(value) => updateDodStatus(dod.id, value === 'completed')}
                              >
                                <SelectTrigger className="text-xs h-8 border-orange-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_completed">Belum Selesai</SelectItem>
                                  <SelectItem value="completed">Selesai</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update Task Status */}
                {selectedResult && incompleteTasks.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-700">Update Status Task</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex items-center justify-center">
                            <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Panduan Update Status Task</h4>
                            <div className="space-y-2 text-sm">
                              <p>• <strong>Selesai:</strong> Task telah diselesaikan sepenuhnya</p>
                              <p>• <strong>Dibatalkan:</strong> Task tidak dilanjutkan karena alasan tertentu</p>
                              <p>• <strong>Sedang Berjalan:</strong> Task masih dalam proses pengerjaan</p>
                              <p>• <strong>Belum Dimulai:</strong> Task belum dikerjakan</p>
                              <p>• Update status ini untuk mencerminkan kondisi akhir task</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      {incompleteTasks.map((task) => (
                        <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                              <span className="text-xs text-gray-500 mt-1 block">
                                Saat ini: {task.status === 'not_started' ? 'Belum Dimulai' : 
                                         task.status === 'in_progress' ? 'Sedang Berjalan' : task.status}
                              </span>
                            </div>
                            <div className="flex-shrink-0 w-32">
                              <Select
                                value={taskUpdates.find(t => t.id === task.id)?.newStatus || task.status}
                                onValueChange={(value) => updateTaskStatus(task.id, value)}
                              >
                                <SelectTrigger className="text-xs h-8 border-gray-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">Belum Dimulai</SelectItem>
                                  <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                                  <SelectItem value="completed">Selesai</SelectItem>
                                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan Tambahan */}
                {selectedResult && (
                  <div className="border-t border-gray-200 pt-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel className="text-sm font-medium text-gray-700">Catatan Tambahan (Opsional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button type="button" className="inline-flex items-center justify-center">
                                  <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Panduan Catatan Tambahan</h4>
                                  <div className="space-y-2 text-sm">
                                    <p>• Tambahkan informasi penting yang belum tercakup di bagian lain</p>
                                    <p>• Catat kendala atau tantangan yang dihadapi</p>
                                    <p>• Dokumentasikan hal-hal yang perlu diingat untuk inisiatif serupa</p>
                                    <p>• Berikan rekomendasi untuk perbaikan di masa depan</p>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Contoh: Proses implementasi berjalan lancar, namun diperlukan pelatihan tambahan untuk tim. Rekomendasi untuk inisiatif serupa: libatkan stakeholder sejak awal perencanaan."
                              {...field}
                              rows={3}
                              className="border-gray-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={closeInitiativeMutation.isPending}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={closeInitiativeMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {closeInitiativeMutation.isPending ? "Menutup..." : "Tutup Inisiatif"}
              </Button>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>

      {/* Incomplete Tasks Confirmation Dialog */}
      <AlertDialog open={showIncompleteTasksConfirmation} onOpenChange={setShowIncompleteTasksConfirmation}>
        <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Masih Ada Task yang Belum Selesai
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Terdapat <strong>{getIncompleteTasksCount()} task</strong> yang masih berstatus 
              <strong> "Belum Dimulai"</strong> atau <strong>"Sedang Berjalan"</strong>.
            </p>
            <p>
              Apakah Anda yakin ingin menutup inisiatif ini? Task yang belum selesai akan tetap memiliki status saat ini.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancelConfirmation}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmProceed}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            Ya, Tutup Inisiatif
          </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}