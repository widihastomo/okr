import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const successMetricSchema = z.object({
  title: z.string().min(1, "Judul metrik wajib diisi"),
  description: z.string().optional(),
  type: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]),
  baseValue: z.string().optional(),
  targetValue: z.string().min(1, "Nilai target wajib diisi"),
  currentValue: z.string().optional(),
  unit: z.string().min(1, "Unit wajib diisi"),
});

type SuccessMetricFormData = z.infer<typeof successMetricSchema>;

interface SuccessMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  metric?: any;
}

export default function SuccessMetricsModal({
  open,
  onOpenChange,
  initiativeId,
  metric,
}: SuccessMetricsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!metric;

  const form = useForm<SuccessMetricFormData>({
    resolver: zodResolver(successMetricSchema),
    defaultValues: {
      title: metric?.title || "",
      description: metric?.description || "",
      type: metric?.type || "increase_to",
      baseValue: metric?.baseValue?.toString() || "",
      targetValue: metric?.targetValue?.toString() || "",
      currentValue: metric?.currentValue?.toString() || "",
      unit: metric?.unit || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SuccessMetricFormData) => {
      const payload = {
        ...data,
        initiativeId,
        baseValue: data.baseValue ? parseFloat(data.baseValue) : null,
        targetValue: parseFloat(data.targetValue),
        currentValue: data.currentValue ? parseFloat(data.currentValue) : null,
      };
      return apiRequest("POST", `/api/initiatives/${initiativeId}/success-metrics`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      toast({
        title: "Berhasil",
        description: "Metrik keberhasilan berhasil ditambahkan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan metrik keberhasilan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SuccessMetricFormData) => {
      const payload = {
        ...data,
        baseValue: data.baseValue ? parseFloat(data.baseValue) : null,
        targetValue: parseFloat(data.targetValue),
        currentValue: data.currentValue ? parseFloat(data.currentValue) : null,
      };
      return apiRequest("PATCH", `/api/success-metrics/${metric.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      toast({
        title: "Berhasil",
        description: "Metrik keberhasilan berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui metrik keberhasilan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SuccessMetricFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Metrik Keberhasilan" : "Tambah Metrik Keberhasilan"}
          </DialogTitle>
          <DialogDescription>
            Metrik keberhasilan membantu mengukur pencapaian inisiatif secara terukur.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Judul Metrik</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Peningkatan konversi penjualan"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan metrik ini secara detail"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Metrik</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe metrik" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="increase_to">Naik ke Target</SelectItem>
                        <SelectItem value="decrease_to">Turun ke Target</SelectItem>
                        <SelectItem value="achieve_or_not">Tercapai/Tidak</SelectItem>
                        <SelectItem value="should_stay_above">Tetap di Atas</SelectItem>
                        <SelectItem value="should_stay_below">Tetap di Bawah</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: %, Rp, orang, dll"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(selectedType === "increase_to" || selectedType === "decrease_to") && (
                <FormField
                  control={form.control}
                  name="baseValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Awal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Nilai baseline"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Target</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={selectedType === "achieve_or_not" ? "1 untuk tercapai" : "Target yang ingin dicapai"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Saat Ini</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Nilai pencapaian saat ini"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Menyimpan..."
                  : isEdit
                  ? "Perbarui Metrik"
                  : "Tambah Metrik"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}