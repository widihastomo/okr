import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { CheckCircle2, Clock, Flag, User, Calendar } from "lucide-react";

interface SimpleTaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  onSuccess?: () => void;
}

export default function SimpleTaskModal({ open, onClose, task, onSuccess }: SimpleTaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user && typeof user === 'object' && 'id' in user ? (user as any).id : null;
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "not_started",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
    initiativeId: ""
  });

  // Fetch all initiatives to allow task assignment
  const { data: initiatives = [] } = useQuery<any[]>({
    queryKey: ['/api/initiatives'],
  });

  // Fetch all users for assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "not_started",
        priority: task.priority || "medium",
        assignedTo: task.assignedTo || "unassigned",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        initiativeId: task.initiativeId || "no-initiative"
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "not_started",
        priority: "medium",
        assignedTo: userId || "unassigned",
        dueDate: "",
        initiativeId: "no-initiative"
      });
    }
  }, [task, userId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
      toast({
        title: "Task berhasil dibuat",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onClose();
      onSuccess?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Task berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onClose();
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    const dataToSubmit = {
      ...formData,
      assignedTo: formData.assignedTo === "unassigned" ? null : formData.assignedTo || null,
      dueDate: formData.dueDate || null,
      initiativeId: formData.initiativeId === "no-initiative" ? null : formData.initiativeId || null,
    };

    console.log("Submitting task data:", dataToSubmit);

    if (task) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Tambah Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">
              <CheckCircle2 className="h-4 w-4 inline mr-1" />
              Judul Task
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masukkan judul task"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">
                <Clock className="h-4 w-4 inline mr-1" />
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Belum Dimulai</SelectItem>
                  <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">
                <Flag className="h-4 w-4 inline mr-1" />
                Prioritas
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedTo">
                <User className="h-4 w-4 inline mr-1" />
                PIC
              </Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger id="assignedTo" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Tidak ada</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                Deadline
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="initiative">Initiative (Opsional)</Label>
            <Select
              value={formData.initiativeId}
              onValueChange={(value) => setFormData({ ...formData, initiativeId: value })}
            >
              <SelectTrigger id="initiative" className="mt-1">
                <SelectValue placeholder="Pilih initiative" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-initiative">Tidak ada</SelectItem>
                {initiatives.map((initiative: any) => (
                  <SelectItem key={initiative.id} value={initiative.id}>
                    {initiative.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Masukkan deskripsi task"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || isLoading}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            {isLoading ? "Menyimpan..." : (task ? "Update Task" : "Tambah Task")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}