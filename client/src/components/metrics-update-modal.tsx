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
  const [metricUpdates, setMetricUpdates] = useState<Record<string, string>>({});

  // Fetch existing success metrics for this initiative
  const { data: successMetrics = [], isLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/success-metrics`],
    enabled: open && !!initiativeId,
  });

  // Reset updates when modal opens
  useEffect(() => {
    if (open) {
      setMetricUpdates({});
    }
  }, [open]);

  const updateMetricsMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(metricUpdates)
        .filter(([_, value]) => value && value.trim() !== "")
        .map(([metricId, newValue]) => ({ metricId, newValue }));

      if (updates.length === 0) {
        throw new Error("Tidak ada perubahan untuk disimpan");
      }

      const promises = updates.map(({ metricId, newValue }) =>
        apiRequest("POST", `/api/success-metrics/${metricId}/updates`, {
          achievement: newValue,
          notes: `Updated via Daily Focus on ${new Date().toLocaleDateString('id-ID')}`,
          createdBy: "550e8400-e29b-41d4-a716-446655440001", // Current user ID - should be dynamic
        })
      );

      return Promise.all(promises);
    },
    onSuccess: async () => {
      toast({
        title: "Metrik berhasil diperbarui",
        description: "Progress metrik kesuksesan telah diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Clear input state first
      setMetricUpdates({});
      
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      
      // Force refetch the success metrics to update current achievement values
      await queryClient.refetchQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      
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

  const handleSaveAll = () => {
    updateMetricsMutation.mutate();
  };

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
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metrik
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capaian Saat Ini
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capaian Baru
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {successMetrics.map((metric: any) => (
                    <tr key={metric.id}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{metric.name}</div>
                          <div className="text-sm text-gray-500">{metric.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {metric.target}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {metric.achievement || "0"}
                      </td>
                      <td className="px-4 py-4">
                        <Input
                          placeholder="Masukkan nilai"
                          className="w-32"
                          value={metricUpdates[metric.id] || ""}
                          onChange={(e) => {
                            setMetricUpdates(prev => ({
                              ...prev,
                              [metric.id]: e.target.value
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={updateMetricsMutation.isPending || !Object.values(metricUpdates).some(value => value && value.trim() !== "")}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
              >
                {updateMetricsMutation.isPending ? "Menyimpan..." : "Simpan Semua"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}