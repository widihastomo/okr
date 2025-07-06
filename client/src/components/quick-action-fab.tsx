import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import OKRFormModal from "@/components/okr-form-modal";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  initiativeId: z.string().min(1, "Rencana is required"),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function QuickActionFAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showOKRModal, setShowOKRModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fabRef = useRef<HTMLDivElement>(null);

  // Fetch rencana for dropdown
  const { data: rencana = [] } = useQuery<any[]>({
    queryKey: ["/api/initiatives"],
    enabled: showTaskModal,
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: showTaskModal,
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      assignedTo: "unassigned",
      dueDate: "",
      initiativeId: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const payload = {
        ...data,
        assignedTo: data.assignedTo === "unassigned" ? null : data.assignedTo,
        dueDate: data.dueDate || null,
      };
      
      const response = await fetch(`/api/initiatives/${data.initiativeId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"], refetchType: 'active' });
      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan ke initiative.",
        variant: "success",
      });
      setShowTaskModal(false);
      setIsExpanded(false);
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

  const handleTaskSubmit = (data: TaskFormData) => {
    // Ensure no empty string values are sent
    const sanitizedData = {
      ...data,
      assignedTo: data.assignedTo === "unassigned" ? undefined : data.assignedTo,
      dueDate: data.dueDate || undefined,
      description: data.description || "",
    };
    createTaskMutation.mutate(sanitizedData);
  };

  const handleOKRModalChange = (open: boolean) => {
    setShowOKRModal(open);
    if (!open) {
      setIsExpanded(false);
      // Add a small delay to check if OKR was successfully created
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      }, 100);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleTaskClick = () => {
    setShowTaskModal(true);
    setIsExpanded(false);
  };

  const handleOKRClick = () => {
    setShowOKRModal(true);
    setIsExpanded(false);
  };

  // Close FAB when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <>
      <div ref={fabRef} className={`fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3 ${
        !isExpanded ? 'pointer-events-none' : ''
      }`}>
        {/* Action Options - appear when expanded */}
        <div className={`flex flex-col space-y-3 transition-all duration-300 ease-out ${
          isExpanded 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-4 pointer-events-none'
        }`}>
          {/* Buat Goal Button */}
          <Button
            onClick={handleOKRClick}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-3 rounded-full"
          >
            <Target className="h-5 w-5" />
            <span className="font-medium">Buat Goal</span>
          </Button>

          {/* Buat Tugas Button */}
          <Button
            onClick={handleTaskClick}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-3 rounded-full"
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Buat Tugas</span>
          </Button>
        </div>

        {/* Main FAB Button */}
        <Button
          onClick={toggleExpanded}
          className={`w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto ${
            isExpanded ? 'rotate-45' : 'rotate-0'
          }`}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Task Creation Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Buat Task Baru</span>
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleTaskSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Initiative Selection */}
                <FormField
                  control={form.control}
                  name="initiativeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>Rencana</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih rencana" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rencana && rencana.length > 0 ? (
                            rencana.filter((item: any) => item && item.id).map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title || "Untitled Rencana"}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                              Tidak ada rencana tersedia
                            </div>
                          )}
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
                      <FormLabel>Judul Task</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan judul task" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date, Priority, and Assigned User */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Flag className="h-4 w-4" />
                          <span>Prioritas</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Rendah</SelectItem>
                            <SelectItem value="medium">Sedang</SelectItem>
                            <SelectItem value="high">Tinggi</SelectItem>
                            <SelectItem value="critical">Kritis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>PIC</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "unassigned"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">Belum Ditugaskan</SelectItem>
                            {users.filter((user: any) => user && user.id).map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan deskripsi task (opsional)"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTaskModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createTaskMutation.isPending ? "Membuat..." : "Buat Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* OKR Creation Modal */}
      <OKRFormModal
        open={showOKRModal}
        onOpenChange={handleOKRModalChange}
      />
    </>
  );
}