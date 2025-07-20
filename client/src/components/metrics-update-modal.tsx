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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, CheckSquare } from "lucide-react";

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
  const { user } = useAuth();
  const [metricUpdates, setMetricUpdates] = useState<Record<string, string>>({});
  const [deliverableUpdates, setDeliverableUpdates] = useState<Record<string, boolean>>({});

  // Fetch existing success metrics for this initiative
  const { data: successMetrics = [], isLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/success-metrics`],
    enabled: open && !!initiativeId,
  });

  // Fetch existing deliverables for this initiative
  const { data: deliverables = [], isLoading: deliverablesLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/definition-of-done`],
    enabled: open && !!initiativeId,
  });

  // Reset updates when modal opens
  useEffect(() => {
    if (open) {
      setMetricUpdates({});
      setDeliverableUpdates({});
    }
  }, [open]);

  const updateMetricsMutation = useMutation({
    mutationFn: async () => {
      const metricUpdatesList = Object.entries(metricUpdates)
        .filter(([_, value]) => value && value.trim() !== "")
        .map(([metricId, newValue]) => ({ metricId, newValue }));

      const deliverableUpdatesList = Object.entries(deliverableUpdates)
        .map(([deliverableId, isCompleted]) => ({ deliverableId, isCompleted }));

      if (metricUpdatesList.length === 0 && deliverableUpdatesList.length === 0) {
        throw new Error("Tidak ada perubahan untuk disimpan");
      }

      const promises = [];

      // Process metric updates
      metricUpdatesList.forEach(({ metricId, newValue }) => {
        promises.push(
          apiRequest("POST", `/api/success-metrics/${metricId}/updates`, {
            achievement: newValue,
            notes: `Updated via Daily Focus on ${new Date().toLocaleDateString('id-ID')}`,
            organizationId: user?.organizationId,
            createdBy: user?.id,
          })
        );
      });

      // Process deliverable updates
      deliverableUpdatesList.forEach(({ deliverableId, isCompleted }) => {
        promises.push(
          apiRequest("PATCH", `/api/definition-of-done/${deliverableId}/toggle`, {
            isCompleted: isCompleted
          })
        );
      });

      return Promise.all(promises);
    },
    onSuccess: async () => {
      toast({
        title: "Update berhasil",
        description: "Progress metrik dan deliverable telah diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Clear input state first
      setMetricUpdates({});
      setDeliverableUpdates({});
      
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/definition-of-done`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      
      // Force refetch to update current values
      await queryClient.refetchQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      await queryClient.refetchQueries({ queryKey: [`/api/initiatives/${initiativeId}/definition-of-done`] });
      
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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Progress Inisiatif</DialogTitle>
          <DialogDescription>
            Perbarui capaian metrik keberhasilan dan status deliverable untuk inisiatif ini
          </DialogDescription>
        </DialogHeader>

        {(isLoading || deliverablesLoading) ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : successMetrics.length === 0 && deliverables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada metrik keberhasilan atau deliverable untuk inisiatif ini.</p>
            <p className="text-sm mt-2">Silakan buat metrik keberhasilan dan deliverable terlebih dahulu di halaman detail inisiatif.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {successMetrics.map((metric: any) => (
                <div
                  key={metric.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  {/* Metric Header */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{metric.name}</h3>
                    {metric.description && (
                      <p className="text-sm text-gray-500">{metric.description}</p>
                    )}
                  </div>

                  {/* Metric Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium text-gray-900">{metric.target}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capaian Saat Ini:</span>
                      <span className="font-medium text-gray-900">{metric.achievement || "0"}</span>
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Capaian Baru:
                    </label>
                    <Input
                      placeholder="Masukkan nilai baru"
                      className="w-full"
                      value={metricUpdates[metric.id] || ""}
                      onChange={(e) => {
                        setMetricUpdates(prev => ({
                          ...prev,
                          [metric.id]: e.target.value
                        }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Deliverables Section */}
            {deliverables.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-t pt-4">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Deliverables (Output Inisiatif)
                  </h3>
                </div>

                {/* Desktop Table View for Deliverables */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deliverable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deliverables.map((deliverable: any) => (
                        <tr key={deliverable.id}>
                          <td className="px-4 py-4">
                            <Checkbox
                              checked={deliverableUpdates[deliverable.id] !== undefined 
                                ? deliverableUpdates[deliverable.id] 
                                : deliverable.isCompleted || false}
                              onCheckedChange={(checked) => {
                                setDeliverableUpdates(prev => ({
                                  ...prev,
                                  [deliverable.id]: !!checked
                                }));
                              }}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className={`${
                              (deliverableUpdates[deliverable.id] !== undefined 
                                ? deliverableUpdates[deliverable.id] 
                                : deliverable.isCompleted)
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900'
                            }`}>
                              {deliverable.title}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View for Deliverables */}
                <div className="md:hidden space-y-3">
                  {deliverables.map((deliverable: any) => (
                    <div
                      key={deliverable.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3"
                    >
                      <Checkbox
                        checked={deliverableUpdates[deliverable.id] !== undefined 
                          ? deliverableUpdates[deliverable.id] 
                          : deliverable.isCompleted || false}
                        onCheckedChange={(checked) => {
                          setDeliverableUpdates(prev => ({
                            ...prev,
                            [deliverable.id]: !!checked
                          }));
                        }}
                      />
                      <div className={`flex-1 ${
                        (deliverableUpdates[deliverable.id] !== undefined 
                          ? deliverableUpdates[deliverable.id] 
                          : deliverable.isCompleted)
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {deliverable.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={updateMetricsMutation.isPending || (
                  !Object.values(metricUpdates).some(value => value && value.trim() !== "") &&
                  Object.keys(deliverableUpdates).length === 0
                )}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
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