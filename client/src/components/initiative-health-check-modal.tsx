import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertInitiativeHealthCheckSchema, type InsertInitiativeHealthCheck } from "@shared/schema";
import { Activity } from "lucide-react";

interface InitiativeHealthCheckModalProps {
  initiativeId: string;
  trigger?: React.ReactNode;
}

const overallHealthStatuses = [
  { value: "excellent", label: "Sangat Baik", color: "text-green-600" },
  { value: "good", label: "Baik", color: "text-blue-600" },
  { value: "warning", label: "Perhatian", color: "text-yellow-600" },
  { value: "critical", label: "Kritis", color: "text-red-600" }
];

const scheduleHealthStatuses = [
  { value: "on_track", label: "Sesuai Jadwal" },
  { value: "slight_delay", label: "Sedikit Terlambat" },
  { value: "significant_delay", label: "Terlambat Signifikan" },
  { value: "critical_delay", label: "Terlambat Kritis" }
];

const budgetHealthStatuses = [
  { value: "under_budget", label: "Di Bawah Anggaran" },
  { value: "on_budget", label: "Sesuai Anggaran" },
  { value: "over_budget", label: "Melebihi Anggaran" },
  { value: "critical_overspend", label: "Overspend Kritis" }
];

const teamHealthStatuses = [
  { value: "high_morale", label: "Moral Tinggi" },
  { value: "good", label: "Baik" },
  { value: "concerns", label: "Ada Kekhawatiran" },
  { value: "critical_issues", label: "Masalah Kritis" }
];

const qualityHealthStatuses = [
  { value: "exceeds_expectations", label: "Melebihi Ekspektasi" },
  { value: "meets_standards", label: "Memenuhi Standar" },
  { value: "below_standards", label: "Di Bawah Standar" },
  { value: "critical_issues", label: "Masalah Kritis" }
];

const healthCheckFormSchema = insertInitiativeHealthCheckSchema.omit({
  id: true,
  initiativeId: true,
  checkedBy: true
});

export function InitiativeHealthCheckModal({ initiativeId, trigger }: InitiativeHealthCheckModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Omit<InsertInitiativeHealthCheck, 'id' | 'initiativeId' | 'checkedBy'>>({
    resolver: zodResolver(healthCheckFormSchema),
    defaultValues: {
      overallHealth: "good",
      scheduleHealth: "on_track",
      budgetHealth: "on_budget", 
      teamHealth: "good",
      qualityHealth: "meets_standards",
      scheduleNotes: "",
      budgetNotes: "",
      teamNotes: "",
      qualityNotes: "",
      immediateActions: "",
      risks: "",
      recommendations: "",
    }
  });

  const createHealthCheckMutation = useMutation({
    mutationFn: (data: Omit<InsertInitiativeHealthCheck, 'id' | 'checkedBy'>) =>
      apiRequest(`/api/initiatives/${initiativeId}/health-checks`, {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Health check berhasil disimpan",
        className: "border-green-200 bg-green-50 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "health-checks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "analysis"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error creating health check:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan health check",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: Omit<InsertInitiativeHealthCheck, 'id' | 'initiativeId' | 'checkedBy' | 'createdAt'>) => {
    createHealthCheckMutation.mutate({
      ...data,
      initiativeId,
      checkDate: new Date(data.checkDate)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Activity className="w-4 h-4 mr-2" />
          Health Check
        </Button>
      )}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pemeriksaan Kesehatan Inisiatif</DialogTitle>
          <DialogDescription>
            Lakukan evaluasi kesehatan inisiatif secara berkala untuk memantau progress dan mengidentifikasi risiko
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="checkDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Pemeriksaan</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="overallHealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesehatan Keseluruhan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status kesehatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {overallHealthStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <span className={status.color}>
                              {status.label}
                            </span>
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
                name="riskLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tingkat Risiko</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tingkat risiko" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {riskLevels.map((risk) => (
                          <SelectItem key={risk.value} value={risk.value}>
                            {risk.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="scheduleHealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesehatan Jadwal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scheduleHealthStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="budgetHealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesehatan Anggaran</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetHealthStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="teamHealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesehatan Tim</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamHealthStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="immediateActions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hambatan dan Blocker - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Apa saja yang menghalangi progress inisiatif saat ini?"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pencapaian Periode Ini - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Risiko apa saja yang dapat mempengaruhi kesuksesan inisiatif?"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rekomendasi Perbaikan - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Apa yang perlu dilakukan untuk meningkatkan kesehatan inisiatif?"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduleNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Tambahan - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Catatan atau observasi lainnya..."
                      rows={2}
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
                onClick={() => setOpen(false)}
                disabled={createHealthCheckMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createHealthCheckMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createHealthCheckMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}