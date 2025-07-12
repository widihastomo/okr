import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Flag,
  User,
  HelpCircle,
  CalendarIcon,
  ChevronsUpDown,
  Check,
  Target,
} from "lucide-react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  initiativeId?: string;
  isAdding?: boolean;
}

export default function TaskModal({
  open,
  onClose,
  task,
  initiativeId,
  isAdding = false,
}: TaskModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assignedTo: task?.assignedTo || "",
    dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    priority: task?.priority || "medium",
    status: task?.status || "not_started",
    initiativeId:
      initiativeId || task?.initiativeId || task?.initiative?.id || "",
  });

  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [picPopoverOpen, setPicPopoverOpen] = useState(false);
  const [initiativePopoverOpen, setInitiativePopoverOpen] = useState(false);

  const { data: initiativesData, isLoading: initiativesLoading } = useQuery({
    queryKey: ["/api/initiatives"],
    enabled: open,
  });

  const { data: availableUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan ke sistem",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat task",
        description: error.message || "Terjadi kesalahan saat membuat task",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task berhasil diperbarui",
        description: "Perubahan task telah disimpan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui task",
        description: error.message || "Terjadi kesalahan saat memperbarui task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Judul task diperlukan",
        description: "Silakan masukkan judul task",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      ...formData,
      initiativeId:
        formData.initiativeId === "unassigned" ? null : formData.initiativeId,
      assignedTo: formData.assignedTo === "unassigned" ? null : formData.assignedTo,
      dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
    };

    if (isAdding) {
      createMutation.mutate(taskData);
    } else {
      updateMutation.mutate(taskData);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "not_started":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Belum Mulai
          </div>
        );
      case "in_progress":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Sedang Berjalan
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Selesai
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Dibatalkan
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Belum Mulai
          </div>
        );
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low":
        return "Rendah";
      case "medium":
        return "Sedang";
      case "high":
        return "Tinggi";
      default:
        return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAdding ? "Tambah Task Baru" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {isAdding
              ? "Buat task baru untuk initiative ini"
              : "Modifikasi detail task dan penugasan"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                  Judul Task *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: Buat laporan analisis penjualan bulanan"
                  required
                  className="focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Contoh: Analisis data penjualan Q3, buat visualisasi dengan chart, dan susun rekomendasi untuk meningkatkan performa"
                  rows={3}
                  className="focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Initiative Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Inisiatif Terkait
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  Inisiatif Terkait (opsional)
                </Label>
                <Select
                  value={formData.initiativeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, initiativeId: value })
                  }
                >
                  <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                    <SelectValue placeholder="Pilih initiative..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Tanpa Initiative</SelectItem>
                    {initiativesData?.map((initiative: any) => (
                      <SelectItem key={initiative.id} value={initiative.id}>
                        {initiative.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Status & Priority Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-500" />
                Status & Prioritas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority" className="flex items-center gap-2 mb-2">
                    Prioritas
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger
                      id="priority"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    >
                      <SelectValue placeholder="Pilih tingkat prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Rendah
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Sedang
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Tinggi
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="flex items-center gap-2 mb-2">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger
                      id="status"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    >
                      <SelectValue placeholder="Pilih status task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Belum Mulai
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Sedang Berjalan
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Selesai
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Dibatalkan
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Due Date Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Penugasan & Deadline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    PIC (Person In Charge)
                  </Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedTo: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                      <SelectValue placeholder="Pilih anggota tim..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Belum ditentukan</SelectItem>
                      {availableUsers?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Tenggat Waktu
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal focus:ring-orange-500 focus:border-orange-500"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate
                          ? formData.dueDate.toLocaleDateString("id-ID")
                          : "Pilih tanggal deadline task"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => {
                          if (date) {
                            const adjustedDate = new Date(date);
                            adjustedDate.setHours(adjustedDate.getHours() + 7);
                            setFormData({ ...formData, dueDate: adjustedDate });
                          } else {
                            setFormData({ ...formData, dueDate: date });
                          }
                        }}
                        disabled={(date) => {
                          const now = new Date();
                          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
                          const gmt7Date = new Date(utc + 7 * 3600000);
                          const today = new Date(
                            gmt7Date.getFullYear(),
                            gmt7Date.getMonth(),
                            gmt7Date.getDate(),
                          );
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            {isAdding ? "Tambah Task" : "Update Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}