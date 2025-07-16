import React, { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Simplified schema with only 3 fields
const successMetricSchema = z.object({
  name: z.string().min(1, "Nama metrik wajib diisi"),
  target: z.string().min(1, "Target wajib diisi"),
  achievement: z.string().min(1, "Capaian wajib diisi"),
});

type SuccessMetricFormData = z.infer<typeof successMetricSchema>;

interface SuccessMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  metric?: any; // For editing existing metric
}

export default function SuccessMetricsModal({
  open,
  onOpenChange,
  initiativeId,
  metric
}: SuccessMetricsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<SuccessMetricFormData>({
    resolver: zodResolver(successMetricSchema),
    defaultValues: {
      name: metric?.name || "",
      target: metric?.target || "",
      achievement: metric?.achievement || "0",
    },
  });

  // Reset form when metric prop changes
  useEffect(() => {
    if (metric) {
      form.reset({
        name: metric.name || "",
        target: metric.target || "",
        achievement: metric.achievement || "0",
      });
    } else {
      form.reset({
        name: "",
        target: "",
        achievement: "0",
      });
    }
  }, [metric, form]);

  const createMutation = useMutation({
    mutationFn: async (data: SuccessMetricFormData) => {
      const payload = {
        ...data,
        organizationId: user?.organizationId,
      };
      return apiRequest("POST", `/api/initiatives/${initiativeId}/success-metrics`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      toast({
        title: "Berhasil",
        description: "Metrik keberhasilan berhasil ditambahkan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error creating success metric:", error);
      let errorMessage = "Gagal menambahkan metrik keberhasilan";
      
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((err: any) => `${err.field}: ${err.message}`).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SuccessMetricFormData) => {
      return apiRequest("PATCH", `/api/success-metrics/${metric.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/success-metrics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/audit-trail`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      toast({
        title: "Berhasil",
        description: "Metrik keberhasilan berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error updating success metric:", error);
      let errorMessage = "Gagal mengupdate metrik keberhasilan";
      
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((err: any) => `${err.field}: ${err.message}`).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SuccessMetricFormData) => {
    if (metric) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {metric ? "Edit Metrik Keberhasilan" : "Tambah Metrik Keberhasilan"}
          </DialogTitle>
          <DialogDescription>
            {metric 
              ? "Ubah informasi metrik keberhasilan ini"
              : "Tambahkan metrik untuk mengukur keberhasilan inisiatif ini"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Nama Metrik */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Metrik</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Tingkat Kepuasan Pelanggan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target */}
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 90% atau 1000 pengguna"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capaian */}
            <FormField
              control={form.control}
              name="achievement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capaian Saat Ini</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 75% atau 750 pengguna"
                      {...field}
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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Loading..."
                  : metric
                  ? "Update Metrik"
                  : "Tambah Metrik"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}