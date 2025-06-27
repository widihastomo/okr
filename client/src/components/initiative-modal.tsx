import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Flag, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const initiativeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).default("not_started"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface InitiativeModalProps {
  keyResultId: string;
  onSuccess?: () => void;
}

export default function InitiativeModal({ keyResultId, onSuccess }: InitiativeModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      dueDate: "",
    },
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      const payload = {
        ...data,
        keyResultId,
        createdBy: "dev-user-1", // This should come from auth context
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      return await apiRequest("POST", `/api/key-results/${keyResultId}/initiatives`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Initiative berhasil dibuat",
        description: "Initiative baru telah ditambahkan ke Key Result",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results", keyResultId] });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat initiative",
        description: error.message || "Terjadi kesalahan saat membuat initiative",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InitiativeFormData) => {
    createInitiativeMutation.mutate(data);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Belum Dimulai";
      case "in_progress": return "Sedang Berjalan";
      case "completed": return "Selesai";
      case "on_hold": return "Ditahan";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "Rendah";
      case "medium": return "Sedang";
      case "high": return "Tinggi";
      default: return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Initiative
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Buat Initiative Baru
          </DialogTitle>
          <DialogDescription>
            Tambahkan initiative untuk membantu mencapai Key Result ini
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Initiative *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Masukkan judul initiative"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Jelaskan detail initiative ini"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">{getStatusLabel("not_started")}</SelectItem>
                        <SelectItem value="in_progress">{getStatusLabel("in_progress")}</SelectItem>
                        <SelectItem value="completed">{getStatusLabel("completed")}</SelectItem>
                        <SelectItem value="on_hold">{getStatusLabel("on_hold")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-gray-500" />
                            {getPriorityLabel("low")}
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-yellow-500" />
                            {getPriorityLabel("medium")}
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-red-500" />
                            {getPriorityLabel("high")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tenggat Waktu
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={createInitiativeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createInitiativeMutation.isPending ? "Menyimpan..." : "Buat Initiative"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}