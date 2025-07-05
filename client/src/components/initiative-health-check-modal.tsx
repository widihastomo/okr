import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const healthStatuses = [
  { value: "excellent", label: "Sangat Baik", color: "text-green-600" },
  { value: "good", label: "Baik", color: "text-blue-600" },
  { value: "warning", label: "Perhatian", color: "text-yellow-600" },
  { value: "critical", label: "Kritis", color: "text-red-600" }
];

const riskLevels = [
  { value: "low", label: "Rendah" },
  { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" },
  { value: "critical", label: "Kritis" }
];

const healthCheckFormSchema = insertInitiativeHealthCheckSchema.omit({
  id: true,
  initiativeId: true,
  checkedBy: true,
  createdAt: true
});

export function InitiativeHealthCheckModal({ initiativeId, trigger }: InitiativeHealthCheckModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Omit<InsertInitiativeHealthCheck, 'id' | 'initiativeId' | 'checkedBy' | 'createdAt'>>({
    resolver: zodResolver(healthCheckFormSchema),
    defaultValues: {
      checkDate: new Date().toISOString().split('T')[0],
      overallHealth: "good",
      progressHealth: "good",
      budgetHealth: "good",
      teamHealth: "good",
      riskLevel: "low",
      blockers: "",
      achievements: "",
      recommendations: "",
      notes: ""
    }
  });

  const createHealthCheckMutation = useMutation({
    mutationFn: (data: Omit<InsertInitiativeHealthCheck, 'id' | 'checkedBy' | 'createdAt'>) =>
      apiRequest(`/api/initiatives/${initiativeId}/health-checks`, {
        method: "POST",
        body: data
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
                        {healthStatuses.map((status) => (
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
                name="progressHealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kesehatan Progress</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {healthStatuses.map((status) => (
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
                        {healthStatuses.map((status) => (
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
                        {healthStatuses.map((status) => (
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
              name="blockers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hambatan dan Blocker - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
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
              name="achievements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pencapaian Periode Ini - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Apa saja yang telah berhasil dicapai sejak health check terakhir?"
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
              name="notes"
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