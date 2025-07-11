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
// Button will be replaced with Button
import { 
  CheckCircle2, 
  Clock, 
  Flag, 
  User, 
  HelpCircle, 
  CalendarIcon, 
  ChevronsUpDown, 
  Check,
  Target 
} from "lucide-react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  initiativeId?: string;
  isAdding?: boolean;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "not_started": return "Belum Dimulai";
    case "in_progress": return "Sedang Dikerjakan";
    case "completed": return "Selesai";
    case "cancelled": return "Dibatalkan";
    default: return status;
  }
};

export default function TaskModal({ open, onClose, task, initiativeId, isAdding }: TaskModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "not_started",
    priority: "medium",
    assignedTo: "",
    dueDate: null as Date | null,
    initiativeId: "",
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch all initiatives for assignment
  const { data: initiatives = [] } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  // Fetch initiative details to get PIC and members
  const { data: initiative } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}`],
    enabled: !!initiativeId,
  });

  // Cast types for proper access and add debugging
  const usersData = (users as any) || [];
  const initiativesData = (initiatives as any) || [];
  const initiativeData = (initiative as any) || {};
  const picId = initiativeData.picId;
  const initiativeMembers = initiativeData.members || [];

  // Show all users for task assignment
  const availableUsers = Array.isArray(usersData) ? usersData : [];

  useEffect(() => {
    if (task && !isAdding) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "not_started",
        priority: task.priority || "medium",
        assignedTo: task.assignedTo?.id || task.assignedTo || "",
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        initiativeId: task.initiativeId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "not_started",
        priority: "medium",
        assignedTo: "",
        dueDate: null,
        initiativeId: initiativeId || "",
      });
    }
  }, [task, isAdding, initiativeId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // If task has an initiative ID, use the initiative-specific endpoint
      if (data.initiativeId) {
        const response = await fetch(`/api/initiatives/${data.initiativeId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create task");
        return response.json();
      } else {
        // Otherwise use the general tasks endpoint
        const response = await fetch(`/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create task");
        return response.json();
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries based on context
      if (data.initiativeId) {
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${data.initiativeId}/tasks`], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${data.initiativeId}`], refetchType: 'active' });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'], refetchType: 'active' });

      // Show success toast for task creation
      toast({
        title: "Task berhasil dibuat",
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Show additional toast if user was automatically added as member
      if (data.addedAsMember) {
        const assignedUser = availableUsers.find(u => u.id === formData.assignedTo);
        const userName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "User";

        setTimeout(() => {
          toast({
            title: "Member baru ditambahkan",
            description: `${userName} otomatis ditambahkan sebagai member initiative`,
            className: "border-blue-200 bg-blue-50 text-blue-800",
          });
        }, 500);
      }

      onClose();
    },
    onError: () => {
      toast({
        title: "Gagal membuat task",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries for both old and new initiatives if they changed
      if (task?.initiativeId) {
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${task.initiativeId}/tasks`], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${task.initiativeId}`], refetchType: 'active' });
      }
      if (data.initiativeId && data.initiativeId !== task?.initiativeId) {
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${data.initiativeId}/tasks`], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${data.initiativeId}`], refetchType: 'active' });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'], refetchType: 'active' });

      // Show success toast for task update
      toast({
        title: "Task berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Show additional toast if user was automatically added as member
      if (data.addedAsMember) {
        const assignedUser = availableUsers.find(u => u.id === formData.assignedTo);
        const userName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "User";

        setTimeout(() => {
          toast({
            title: "Member baru ditambahkan",
            description: `${userName} otomatis ditambahkan sebagai member initiative`,
            className: "border-blue-200 bg-blue-50 text-blue-800",
          });
        }, 500);
      }

      // Show toast if user was automatically removed as member
      if (data.removedAsMember) {
        setTimeout(() => {
          toast({
            title: "Member dihapus",
            description: "User dihapus dari initiative karena tidak memiliki task lagi",
            className: "border-orange-200 bg-orange-50 text-orange-800",
          });
        }, 1000);
      }

      onClose();
    },
    onError: () => {
      toast({
        title: "Gagal mengupdate task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const submitData = {
      ...formData,
      assignedTo: formData.assignedTo === "unassigned" ? null : formData.assignedTo || null,
      dueDate: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : null,
      initiativeId: formData.initiativeId === "unassigned" ? null : formData.initiativeId || initiativeId,
    };

    if (isAdding) {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate(submitData);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "in_progress": return "Sedang Dikerjakan";
      case "completed": return "Selesai";
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-orange-500" />
            {isAdding ? "Tambah Task Baru" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {isAdding ? "Buat task baru untuk initiative ini" : "Modifikasi detail task dan penugasan"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                Judul Task *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul task yang jelas"
                required
                className="focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                Deskripsi
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsikan tujuan dan langkah-langkah yang perlu dilakukan"
                rows={3}
                className="focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Initiative Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Initiative Terkait
            </Label>
            <Select
              value={formData.initiativeId}
              onValueChange={(value) => setFormData({ ...formData, initiativeId: value })}
            >
              <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                <SelectValue placeholder="Pilih initiative" />
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

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="text-sm font-medium mb-2 block">
                Prioritas
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority" className="focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue />
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
              <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Belum Mulai</SelectItem>
                  <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                PIC (Person In Charge)
              </Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="Pilih PIC" />
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
              <Label className="text-sm font-medium mb-2 block">
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
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => {
                      if (date) {
                        // Adjust for GMT+7 timezone to prevent date shifting
                        const adjustedDate = new Date(date);
                        adjustedDate.setHours(adjustedDate.getHours() + 7);
                        setFormData({ ...formData, dueDate: adjustedDate });
                      } else {
                        setFormData({ ...formData, dueDate: date });
                      }
                    }}
                    disabled={(date) => {
                      // Use GMT+7 timezone for date comparison
                      const now = new Date();
                      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                      const gmt7Date = new Date(utc + (7 * 3600000));
                      const today = new Date(gmt7Date.getFullYear(), gmt7Date.getMonth(), gmt7Date.getDate());
                      
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            {isAdding ? "Tambah Task" : "Update Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}