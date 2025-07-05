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
import { insertInitiativeExperimentSchema, type InsertInitiativeExperiment } from "@shared/schema";
import { Beaker } from "lucide-react";

interface InitiativeExperimentModalProps {
  initiativeId: string;
  trigger?: React.ReactNode;
}

const experimentStatuses = [
  { value: "planned", label: "Direncanakan" },
  { value: "running", label: "Sedang Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" }
];

const experimentOutcomes = [
  { value: "success", label: "Berhasil" },
  { value: "partial", label: "Sebagian Berhasil" },
  { value: "failed", label: "Gagal" },
  { value: "inconclusive", label: "Tidak Konklusif" }
];

const experimentFormSchema = insertInitiativeExperimentSchema.omit({
  id: true,
  initiativeId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true
});

export function InitiativeExperimentModal({ initiativeId, trigger }: InitiativeExperimentModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Omit<InsertInitiativeExperiment, 'id' | 'initiativeId' | 'createdBy' | 'createdAt' | 'updatedAt'>>({
    resolver: zodResolver(experimentFormSchema),
    defaultValues: {
      title: "",
      hypothesis: "",
      methodology: "",
      status: "planned",
      outcome: undefined,
      keyFindings: "",
      metrics: "",
      nextSteps: ""
    }
  });

  const createExperimentMutation = useMutation({
    mutationFn: (data: Omit<InsertInitiativeExperiment, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
      apiRequest(`/api/initiatives/${initiativeId}/experiments`, {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Eksperimen berhasil didokumentasikan",
        className: "border-green-200 bg-green-50 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "experiments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "analysis"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error creating experiment:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan eksperimen",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: Omit<InsertInitiativeExperiment, 'id' | 'initiativeId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    createExperimentMutation.mutate({
      ...data,
      initiativeId
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
          <Beaker className="w-4 h-4 mr-2" />
          Tambah Eksperimen
        </Button>
      )}

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dokumentasi Eksperimen</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Eksperimen</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nama singkat untuk eksperimen ini"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hypothesis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hipotesis</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Apa yang ingin dibuktikan atau diuji dalam eksperimen ini?"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="methodology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodologi</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Bagaimana eksperimen ini akan dilakukan? Langkah-langkah dan pendekatan yang digunakan..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Eksperimen</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {experimentStatuses.map((status) => (
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
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasil (Opsional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih hasil eksperimen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Belum Ada Hasil</SelectItem>
                        {experimentOutcomes.map((outcome) => (
                          <SelectItem key={outcome.value} value={outcome.value}>
                            {outcome.label}
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
              name="metrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metrik dan Indikator - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Bagaimana kesuksesan eksperimen ini akan diukur? Metrik apa yang akan digunakan?"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyFindings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temuan Utama - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Apa saja temuan utama dari eksperimen ini? Hasil yang didapat, insight yang diperoleh..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextSteps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Langkah Selanjutnya - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Berdasarkan hasil eksperimen, apa yang harus dilakukan selanjutnya?"
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
                onClick={() => setOpen(false)}
                disabled={createExperimentMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createExperimentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createExperimentMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}