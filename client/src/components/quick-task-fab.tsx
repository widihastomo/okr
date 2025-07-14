import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Flag, User, X, Target, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import GoalFormModal from "@/components/goal-form-modal";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  initiativeId: z.string().min(1, "Initiative is required"),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function QuickTaskFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
      initiativeId: "",
    },
  });

  // Fetch initiatives for dropdown
  const { data: initiatives = [] } = useQuery({
    queryKey: ["/api/initiatives"],
    enabled: isOpen,
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch(`/api/initiatives/${data.initiativeId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || "",
          status: data.status,
          priority: data.priority,
          assignedTo: data.assignedTo === "unassigned" || !data.assignedTo ? null : data.assignedTo,
          dueDate: data.dueDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "Rendah";
      case "medium": return "Sedang";
      case "high": return "Tinggi";
      case "critical": return "Kritis";
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Belum Dimulai";
      case "in_progress": return "Sedang Berjalan";
      case "completed": return "Selesai";
      default: return status;
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          size="icon"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Quick Task Creation Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Task
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Initiative Selection */}
              <FormField
                control={form.control}
                name="initiativeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Initiative *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih initiative" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(initiatives as any[]).map((initiative: any) => (
                          <SelectItem key={initiative.id} value={initiative.id}>
                            {initiative.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Judul Task *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Masukkan judul task" />
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
                    <FormLabel className="text-sm font-medium">
                      Deskripsi
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Deskripsi task (opsional)"
                        className="min-h-[60px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority and Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        Prioritas
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{getPriorityLabel("low")}</SelectItem>
                          <SelectItem value="medium">{getPriorityLabel("medium")}</SelectItem>
                          <SelectItem value="high">{getPriorityLabel("high")}</SelectItem>
                          <SelectItem value="critical">{getPriorityLabel("critical")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due Date
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Assigned To */}
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Assigned To
                    </FormLabel>
                    <FormControl>
                      <SearchableUserSelect
                        users={(users as any[])?.filter(user => user.isActive === true) || []}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Pilih user"
                        emptyMessage="Tidak ada user ditemukan"
                        allowUnassigned={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createTaskMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Buat Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}