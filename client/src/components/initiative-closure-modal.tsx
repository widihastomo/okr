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
  HelpCircle
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  budgetUsed: z.string().optional(),
  notes: z.string().optional(),
});

type ClosureFormData = z.infer<typeof closureSchema>;

interface InitiativeClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: any;
  successMetrics?: any[];
  tasks?: any[];
  onSuccess?: () => void;
}

export default function InitiativeClosureModal({
  isOpen,
  onClose,
  initiative,
  successMetrics = [],
  tasks = [],
  onSuccess
}: InitiativeClosureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatedMetrics, setUpdatedMetrics] = useState<any[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<any[]>([]);

  const form = useForm<ClosureFormData>({
    resolver: zodResolver(closureSchema),
    defaultValues: {
      result: undefined,
      reason: "",
      learningNote: "",
      budgetUsed: initiative?.budget?.toString() || "",
      notes: "",
    },
  });

  const selectedResult = form.watch("result");

  // Initialize metrics and tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      const metricsArray = Array.isArray(successMetrics) ? successMetrics : [];
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      
      setUpdatedMetrics(metricsArray.map(metric => ({
        id: metric.id,
        currentValue: metric.currentValue,
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
    }
  }, [isOpen, successMetrics, tasks]);

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

  const updateMetricValue = (metricId: string, value: number) => {
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
          currentValue: metric.currentValue
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

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/success-metrics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/tasks`] });
      
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

  const onSubmit = (data: ClosureFormData) => {
    closeInitiativeMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const incompleteTasks = Array.isArray(tasks) ? tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled') : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                            <button type="button">
                              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">{getReasonLabel(selectedResult)}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Jelaskan ${getReasonLabel(selectedResult).toLowerCase()}...`}
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
                            <FormLabel className="text-sm font-medium text-gray-700">{getLearningPrompt(selectedResult)}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Bagikan pembelajaran yang bisa digunakan untuk inisiatif serupa..."
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
                              <button type="button">
                                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
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
                            type="number"
                            placeholder="Masukkan budget yang sudah digunakan"
                            {...field}
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

                {/* Update Success Metrics */}
                {Array.isArray(successMetrics) && successMetrics.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-700">Update Metrik Keberhasilan</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button">
                            <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
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
                                  Target: {metric.targetValue} {metric.unit}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  Sekarang: {metric.currentValue} {metric.unit}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-24">
                              <Input
                                type="number"
                                value={updatedMetrics.find(m => m.id === metric.id)?.currentValue || 0}
                                onChange={(e) => updateMetricValue(metric.id, parseFloat(e.target.value) || 0)}
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

                {/* Update Task Status */}
                {incompleteTasks.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-700">Update Status Task</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button">
                            <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
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
                              <button type="button">
                                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
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
                            placeholder="Tambahkan catatan tambahan jika diperlukan..."
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
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-lg">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={closeInitiativeMutation.isPending}
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={closeInitiativeMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                size="sm"
              >
                {closeInitiativeMutation.isPending ? "Menutup..." : "Tutup Inisiatif"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}