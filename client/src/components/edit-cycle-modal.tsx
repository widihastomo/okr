import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Cycle } from "@shared/schema";

const editCycleSchema = z.object({
  name: z.string().min(1, "Nama siklus wajib diisi"),
  description: z.string().optional(),
  type: z.enum(["monthly", "quarterly", "annual"]),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  status: z.enum(["planning", "active", "completed"])
});

type EditCycleFormData = z.infer<typeof editCycleSchema>;

interface EditCycleModalProps {
  cycle: Cycle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCycleModal({ cycle, open, onOpenChange }: EditCycleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditCycleFormData>({
    resolver: zodResolver(editCycleSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "quarterly",
      startDate: "",
      endDate: "",
      status: "planning"
    }
  });

  const editMutation = useMutation({
    mutationFn: async (data: EditCycleFormData) => {
      if (!cycle) throw new Error("No cycle selected");
      const response = await apiRequest("PATCH", `/api/cycles/${cycle.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({
        title: "Siklus diperbarui",
        description: "Siklus berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800"
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Gagal memperbarui siklus",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: EditCycleFormData) => {
    editMutation.mutate(data);
  };

  // Reset form when cycle changes
  useEffect(() => {
    if (cycle && open) {
      form.reset({
        name: cycle.name,
        description: cycle.description || "",
        type: cycle.type as "monthly" | "quarterly" | "annual",
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status as "planning" | "active" | "completed"
      });
    }
  }, [cycle, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Siklus</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Siklus</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama siklus" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan deskripsi siklus" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Siklus</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Bulanan</SelectItem>
                        <SelectItem value="quarterly">Kuartalan</SelectItem>
                        <SelectItem value="annual">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">Perencanaan</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={editMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}