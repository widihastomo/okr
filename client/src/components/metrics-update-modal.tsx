import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

const metricUpdateSchema = z.object({
  currentAchievement: z.string().min(1, "Capaian saat ini wajib diisi"),
  confidence: z.number().min(1).max(5),
  notes: z.string().optional(),
});

type MetricUpdateFormData = z.infer<typeof metricUpdateSchema>;

interface MetricsUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

export default function MetricsUpdateModal({
  open,
  onOpenChange,
  initiativeId,
}: MetricsUpdateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  // Fetch existing success metrics for this initiative
  const { data: successMetrics = [], isLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/success-metrics`],
    enabled: open && !!initiativeId,
  });

  const form = useForm<MetricUpdateFormData>({
    resolver: zodResolver(metricUpdateSchema),
    defaultValues: {
      currentAchievement: "",
      confidence: 3,
      notes: "",
    },
  });

  // Reset form when modal opens or metric changes
  useEffect(() => {
    if (open) {
      form.reset({
        currentAchievement: "",
        confidence: 3,
        notes: "",
      });
      setSelectedMetricId(null);
    }
  }, [open, form]);

  // Update form when metric is selected
  useEffect(() => {
    if (selectedMetricId && successMetrics.length > 0) {
      const metric = successMetrics.find((m: any) => m.id === selectedMetricId);
      if (metric) {
        form.setValue("currentAchievement", metric.currentAchievement || "");
        form.setValue("confidence", metric.confidence || 3);
        form.setValue("notes", "");
      }
    }
  }, [selectedMetricId, successMetrics, form]);

  const updateMetricMutation = useMutation({
    mutationFn: async (data: MetricUpdateFormData) => {
      if (!selectedMetricId) {
        throw new Error("Pilih metrik terlebih dahulu");
      }

      const response = await apiRequest("POST", `/api/initiatives/${initiativeId}/success-metrics/${selectedMetricId}/updates`, {
        currentAchievement: data.currentAchievement,
        confidence: data.confidence,
        notes: data.notes,
        updatedAt: new Date().toISOString(),
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Metrik berhasil diperbarui",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui metrik",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MetricUpdateFormData) => {
    updateMetricMutation.mutate(data);
  };

  const selectedMetric = successMetrics.find((m: any) => m.id === selectedMetricId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Metrik Keberhasilan</DialogTitle>
          <DialogDescription>
            Perbarui capaian metrik keberhasilan untuk inisiatif ini
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : successMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada metrik keberhasilan untuk inisiatif ini.</p>
            <p className="text-sm mt-2">Silakan buat metrik keberhasilan terlebih dahulu di halaman detail inisiatif.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metric Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Pilih Metrik untuk Diperbarui:</label>
              <div className="space-y-2">
                {successMetrics.map((metric: any) => (
                  <Card 
                    key={metric.id} 
                    className={`cursor-pointer transition-all ${
                      selectedMetricId === metric.id 
                        ? 'ring-2 ring-orange-500 bg-orange-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMetricId(metric.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{metric.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">
                              <span className="font-medium">Target:</span> {metric.targetValue} {metric.unit}
                            </span>
                            <span className="text-sm">
                              <span className="font-medium">Saat ini:</span> {metric.currentAchievement || "0"} {metric.unit}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {metric.metricType}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            Progress: {Math.round((parseFloat(metric.currentAchievement || "0") / parseFloat(metric.targetValue || "1")) * 100)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Update Form */}
            {selectedMetricId && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Update: {selectedMetric?.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      Target: {selectedMetric?.targetValue} {selectedMetric?.unit}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="currentAchievement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capaian Saat Ini ({selectedMetric?.unit})</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={`Masukkan capaian dalam ${selectedMetric?.unit}`}
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tingkat Keyakinan (1-5)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tingkat keyakinan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 - Sangat Rendah</SelectItem>
                            <SelectItem value="2">2 - Rendah</SelectItem>
                            <SelectItem value="3">3 - Sedang</SelectItem>
                            <SelectItem value="4">4 - Tinggi</SelectItem>
                            <SelectItem value="5">5 - Sangat Tinggi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tambahkan catatan atau konteks terkait update ini..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMetricMutation.isPending}
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                    >
                      {updateMetricMutation.isPending ? "Menyimpan..." : "Update Metrik"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}