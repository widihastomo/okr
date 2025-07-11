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
import { LoadingButton } from "@/components/ui/playful-loading";
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
      const response = await fetch(`/api/initiatives/${initiativeId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/tasks`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'], refetchType: 'active' });

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
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/tasks`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'], refetchType: 'active' });

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {isAdding ? "Tambah Task Baru" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {isAdding ? "Buat task baru untuk initiative ini" : "Modifikasi detail task dan penugasan"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="flex items-center gap-2 mb-2">
              Judul Task *
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    <strong>Nama task yang jelas dan deskriptif</strong>
                    <br /><br />
                    Gunakan judul yang spesifik dan mudah dipahami sehingga anggota tim dapat dengan cepat memahami apa yang harus dikerjakan.
                  </p>
                </PopoverContent>
              </Popover>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masukkan judul task"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="flex items-center gap-2 mb-2">
              Deskripsi
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    <strong>Penjelasan detail tentang task</strong>
                    <br /><br />
                    Deskripsikan tujuan yang ingin dicapai, langkah-langkah yang perlu dilakukan, dan hasil yang diharapkan untuk memberikan konteks yang jelas.
                  </p>
                </PopoverContent>
              </Popover>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Masukkan deskripsi task"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="flex items-center gap-2 mb-2">
                Prioritas
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button" 
                      className="inline-flex items-center justify-center"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="max-w-xs">
                    <p className="text-sm">
                      <strong>Tingkat kepentingan task</strong>
                      <br /><br />
                      Rendah: task yang bisa ditunda, Sedang: task penting namun tidak mendesak, Tinggi: task yang perlu segera dikerjakan.
                    </p>
                  </PopoverContent>
                </Popover>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status" className="flex items-center gap-2 mb-2">
                Status
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button" 
                      className="inline-flex items-center justify-center"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="max-w-xs">
                    <p className="text-sm">
                      <strong>Status perkembangan task</strong>
                      <br /><br />
                      Belum Mulai: task belum dikerjakan, Sedang Berjalan: task sedang dalam proses, Selesai: task telah selesai, Dibatalkan: task tidak akan dikerjakan.
                    </p>
                  </PopoverContent>
                </Popover>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
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

          <div>
            <Label htmlFor="assignedTo" className="flex items-center gap-2 mb-2">
              PIC
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    <strong>Person In Charge (PIC)</strong>
                    <br /><br />
                    Orang yang bertanggung jawab untuk menyelesaikan task ini. Pilih anggota tim yang tepat berdasarkan keahlian dan beban kerja mereka.
                  </p>
                </PopoverContent>
              </Popover>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {formData.assignedTo && formData.assignedTo !== "unassigned" 
                    ? availableUsers?.find((user: any) => user.id === formData.assignedTo)?.firstName + " " + availableUsers?.find((user: any) => user.id === formData.assignedTo)?.lastName
                    : formData.assignedTo === "unassigned" 
                      ? "Belum ditentukan"
                      : "Pilih PIC"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Cari anggota tim..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada anggota tim ditemukan.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="unassigned"
                        onSelect={() => {
                          setFormData({ ...formData, assignedTo: "unassigned" });
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            formData.assignedTo === "unassigned" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        Belum ditentukan
                      </CommandItem>
                      {availableUsers?.map((user: any) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.firstName} ${user.lastName}`}
                          onSelect={() => {
                            setFormData({ ...formData, assignedTo: user.id });
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.assignedTo === user.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {user.firstName} {user.lastName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="dueDate" className="flex items-center gap-2 mb-2">
              Tenggat Waktu
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    <strong>Batas waktu penyelesaian task</strong>
                    <br /><br />
                    Tentukan tanggal realistis yang memberikan cukup waktu untuk menyelesaikan task dengan kualitas yang baik. Pastikan tanggal tidak terlalu ketat atau terlalu longgar.
                  </p>
                </PopoverContent>
              </Popover>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <LoadingButton 
            onClick={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            loadingType="saving"
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            {isAdding ? "Tambah Task" : "Update Task"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}