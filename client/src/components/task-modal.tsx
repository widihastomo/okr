import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { CheckCircle2, Clock, Flag, User } from "lucide-react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  initiativeId?: string;
  isAdding?: boolean;
}

export default function TaskModal({ open, onClose, task, initiativeId, isAdding }: TaskModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch initiative details to get PIC and members
  const { data: initiative } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}`],
    enabled: !!initiativeId,
  });

  // Cast types for proper access and add debugging
  const usersData = (users as any) || [];
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
        status: task.status || "pending",
        priority: task.priority || "medium",
        assignedTo: task.assignedTo?.id || task.assignedTo || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignedTo: "",
        dueDate: "",
      });
    }
  }, [task, isAdding]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/initiatives/${initiativeId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      
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
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      assignedTo: formData.assignedTo || null,
      dueDate: formData.dueDate || null,
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {isAdding ? "Tambah Task Baru" : "Edit Task"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="title">Judul Task</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masukkan judul task"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi task (opsional)"
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{getStatusLabel("pending")}</SelectItem>
                  <SelectItem value="in_progress">{getStatusLabel("in_progress")}</SelectItem>
                  <SelectItem value="completed">{getStatusLabel("completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedTo" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                PIC (Penanggung Jawab)
              </Label>
              <Select
                value={formData.assignedTo || "none"}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {availableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.firstName} ${user.lastName}`}
                      {picId === user.id && " (PIC Initiative)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate" className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Tenggat Waktu
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={initiativeData?.startDate ? new Date(initiativeData.startDate).toISOString().split('T')[0] : undefined}
                max={initiativeData?.dueDate ? new Date(initiativeData.dueDate).toISOString().split('T')[0] : undefined}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Menyimpan..."
                : isAdding
                ? "Tambah Task"
                : "Update Task"
              }
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}