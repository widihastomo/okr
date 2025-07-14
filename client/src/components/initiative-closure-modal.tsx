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
  AlertCircle
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Tutup Inisiatif: {initiative?.title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Form Penutupan Inisiatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hasil Inisiatif */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Hasil Inisiatif
                  </h3>
                  <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilih hasil inisiatif</FormLabel>
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
                </div>

                {/* Alasan dan Catatan Pembelajaran */}
                {selectedResult && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      {getResultIcon(selectedResult)}
                      {getReasonLabel(selectedResult)}
                    </h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getReasonLabel(selectedResult)}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Jelaskan ${getReasonLabel(selectedResult).toLowerCase()}...`}
                                {...field}
                                rows={3}
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
                            <FormLabel>{getLearningPrompt(selectedResult)}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Bagikan pembelajaran yang bisa digunakan untuk inisiatif serupa..."
                                {...field}
                                rows={3}
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
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Update Pemakaian Budget
                  </h3>
                  <FormField
                    control={form.control}
                    name="budgetUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget yang digunakan (Rp)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Masukkan budget yang sudah digunakan"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-sm text-gray-500">
                          Budget awal: Rp {initiative?.budget ? Number(initiative.budget).toLocaleString('id-ID') : '0'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Update Success Metrics */}
                {Array.isArray(successMetrics) && successMetrics.length > 0 && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Update Metrik Keberhasilan
                    </h3>
                    <div className="space-y-4">
                      {successMetrics.map((metric) => (
                        <div key={metric.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{metric.name}</h4>
                            <span className="text-sm text-gray-500">
                              Target: {metric.targetValue} {metric.unit}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Nilai Saat Ini</Label>
                              <Input
                                type="number"
                                value={updatedMetrics.find(m => m.id === metric.id)?.currentValue || 0}
                                onChange={(e) => updateMetricValue(metric.id, parseFloat(e.target.value) || 0)}
                                placeholder="Masukkan nilai final"
                              />
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              Nilai sebelumnya: {metric.currentValue} {metric.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update Task Status */}
                {incompleteTasks.length > 0 && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-500" />
                      Update Status Task yang Belum Selesai
                    </h3>
                    <div className="space-y-4">
                      {incompleteTasks.map((task) => (
                        <div key={task.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <span className="text-sm text-gray-500">
                              Status saat ini: {task.status === 'not_started' ? 'Belum Dimulai' : 
                                             task.status === 'in_progress' ? 'Sedang Berjalan' : task.status}
                            </span>
                          </div>
                          <div>
                            <Label>Status Baru</Label>
                            <Select
                              value={taskUpdates.find(t => t.id === task.id)?.newStatus || task.status}
                              onValueChange={(value) => updateTaskStatus(task.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih status baru" />
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan Tambahan */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    Catatan Tambahan (Opsional)
                  </h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan tambahan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tambahkan catatan tambahan jika diperlukan..."
                            {...field}
                            rows={4}
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
            <div className="flex justify-end gap-4 pt-6 border-t">
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
                className="bg-green-600 hover:bg-green-700"
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