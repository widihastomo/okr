import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "not_started":
      return "Belum Dimulai";
    case "in_progress":
      return "Sedang Dikerjakan";
    case "completed":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    default:
      return status;
  }
};

export default function TaskModal({
  open,
  onClose,
  task,
  initiativeId,
  isAdding,
}: TaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [initiativePopoverOpen, setInitiativePopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "not_started",
    priority: "medium",
    assignedTo: user?.id || "",
    dueDate: null as Date | null,
    initiativeId: "",
  });

  // Custom close handler to reset form when modal is closed
  const handleClose = () => {
    // Reset form data to ensure clean state for next use
    setFormData({
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      assignedTo: user?.id || "",
      dueDate: null,
      initiativeId: initiativeId || "",
    });
    
    // Close popovers
    setInitiativePopoverOpen(false);
    setStatusPopoverOpen(false);
    
    // Call parent close handler
    onClose();
  };

  // Helper function to get status display with visual indicator
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
        return "Pilih status task";
    }
  };

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

  // Show only active users for task assignment
  const availableUsers = Array.isArray(usersData) 
    ? usersData.filter((user: any) => user.isActive === true) 
    : [];

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
        assignedTo: user?.id || "",
        dueDate: null,
        initiativeId: initiativeId || "",
      });
    }
  }, [task, isAdding, initiativeId, user]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // If task has an initiative ID, use the initiative-specific endpoint
      if (data.initiativeId) {
        const response = await fetch(
          `/api/initiatives/${data.initiativeId}/tasks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );
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
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${data.initiativeId}/tasks`],
          refetchType: "active",
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${data.initiativeId}`],
          refetchType: "active",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/initiatives"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/tasks"],
        refetchType: "active",
      });

      // Show success toast for task creation
      toast({
        title: "Task berhasil dibuat",
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Show additional toast if user was automatically added as member
      if (data.addedAsMember) {
        const assignedUser = availableUsers.find(
          (u) => u.id === formData.assignedTo,
        );
        const userName = assignedUser
          ? `${assignedUser.firstName} ${assignedUser.lastName}`
          : "User";

        setTimeout(() => {
          toast({
            title: "Member baru ditambahkan",
            description: `${userName} otomatis ditambahkan sebagai member initiative`,
            className: "border-blue-200 bg-blue-50 text-blue-800",
          });
        }, 500);
      }

      handleClose();
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
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${task.initiativeId}/tasks`],
          refetchType: "active",
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${task.initiativeId}`],
          refetchType: "active",
        });
      }
      if (data.initiativeId && data.initiativeId !== task?.initiativeId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${data.initiativeId}/tasks`],
          refetchType: "active",
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/initiatives/${data.initiativeId}`],
          refetchType: "active",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/initiatives"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/tasks"],
        refetchType: "active",
      });

      // Show success toast for task update
      toast({
        title: "Task berhasil diupdate",
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Show additional toast if user was automatically added as member
      if (data.addedAsMember) {
        const assignedUser = availableUsers.find(
          (u) => u.id === formData.assignedTo,
        );
        const userName = assignedUser
          ? `${assignedUser.firstName} ${assignedUser.lastName}`
          : "User";

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
            description:
              "User dihapus dari initiative karena tidak memiliki task lagi",
            className: "border-orange-200 bg-orange-50 text-orange-800",
          });
        }, 1000);
      }

      handleClose();
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
    
    // Validate that PIC is assigned
    if (!formData.assignedTo || formData.assignedTo === "unassigned") {
      toast({
        title: "PIC harus diisi",
        description: "Silakan pilih anggota tim yang akan bertanggung jawab atas task ini",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      assignedTo:
        formData.assignedTo === "unassigned"
          ? null
          : formData.assignedTo || null,
      dueDate: formData.dueDate
        ? formData.dueDate.toISOString().split("T")[0]
        : null,
      initiativeId:
        formData.initiativeId === "unassigned"
          ? null
          : formData.initiativeId || initiativeId,
    };

    if (isAdding) {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate(submitData);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "in_progress":
        return "Sedang Dikerjakan";
      case "completed":
        return "Selesai";
      default:
        return status;
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-orange-500" />
            {isAdding ? "Tambah Task Baru" : "Edit Task"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isAdding
              ? "Buat task baru untuk initiative ini"
              : "Modifikasi detail task dan penugasan"}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Informasi Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
            <div>
              <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                Judul Task *
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-blue-500 hover:text-blue-600"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" side="top" sideOffset={5}>
                    <div className="space-y-2">
                      <h4 className="font-medium">Tips Membuat Judul Task</h4>
                      <p className="text-sm text-muted-foreground">
                        Gunakan kata kerja aktif dan spesifik. Contoh: "Buat
                        laporan analisis penjualan Q3" lebih baik dari "Laporan
                        penjualan".
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
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
              <Label
                htmlFor="description"
                className="flex items-center gap-2 mb-2"
              >
                Deskripsi
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-blue-500 hover:text-blue-600"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" side="top" sideOffset={5}>
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        Deskripsi Task yang Efektif
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Jelaskan apa yang harus dilakukan, bagaimana
                        melakukannya, dan hasil yang diharapkan. Sertakan
                        context yang diperlukan untuk menyelesaikan task.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
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

            <div>
              <Label className="flex items-center gap-2 mb-2">
                Inisiatif Terkait {!initiativeId && "(opsional)"}
                {initiativeId && <span className="text-xs text-gray-500">(otomatis dipilih)</span>}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-blue-500 hover:text-blue-600"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" side="top" sideOffset={5}>
                    <div className="space-y-2">
                      <h4 className="font-medium">Mengelompokkan Task</h4>
                      <p className="text-sm text-muted-foreground">
                        {initiativeId 
                          ? "Task ini akan otomatis terkait dengan inisiatif yang sedang dipilih."
                          : "Pilih initiative yang relevan untuk mengelompokkan task ini. Ini membantu dalam pelaporan progress dan koordinasi tim."
                        }
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </Label>
            <Popover
              open={initiativePopoverOpen}
              onOpenChange={setInitiativePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={initiativePopoverOpen}
                  disabled={!!initiativeId} // Disable when initiativeId is provided
                  className="w-full justify-between focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formData.initiativeId
                    ? formData.initiativeId === "unassigned"
                      ? "Tanpa Initiative"
                      : initiativesData?.find(
                            (initiative: any) =>
                              initiative.id === formData.initiativeId,
                          )
                        ? initiativesData?.find(
                            (initiative: any) =>
                              initiative.id === formData.initiativeId,
                          )?.title
                        : "Pilih initiative..."
                    : "Pilih initiative..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Cari initiative..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada initiative ditemukan.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="unassigned"
                        onSelect={() => {
                          setFormData({
                            ...formData,
                            initiativeId: "unassigned",
                          });
                          setInitiativePopoverOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            formData.initiativeId === "unassigned"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        Tanpa Initiative
                      </CommandItem>
                      {initiativesData?.map((initiative: any) => (
                        <CommandItem
                          key={initiative.id}
                          value={initiative.title}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              initiativeId: initiative.id,
                            });
                            setInitiativePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.initiativeId === initiative.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {initiative.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label
                  htmlFor="priority"
                  className="flex items-center gap-2 mb-2"
                >
                  Prioritas
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-500 hover:text-blue-600"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top" sideOffset={5}>
                      <div className="space-y-2">
                        <h4 className="font-medium">Menentukan Prioritas</h4>
                        <p className="text-sm text-muted-foreground">
                          Tinggi: Urgent dan penting (deadline ketat). Sedang:
                          Penting tapi tidak urgent. Rendah: Nice to have, bisa
                          ditunda.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
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
              <Label
                htmlFor="status"
                className="text-sm font-medium mb-2 block"
              >
                Status
              </Label>
              <Popover
                open={statusPopoverOpen}
                onOpenChange={setStatusPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusPopoverOpen}
                    className="w-full justify-between focus:ring-orange-500 focus:border-orange-500"
                  >
                    {getStatusDisplay(formData.status)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Cari status..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada status ditemukan.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="not_started"
                          onSelect={() => {
                            setFormData({ ...formData, status: "not_started" });
                            setStatusPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.status === "not_started"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            Belum Mulai
                          </div>
                        </CommandItem>
                        <CommandItem
                          value="in_progress"
                          onSelect={() => {
                            setFormData({ ...formData, status: "in_progress" });
                            setStatusPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.status === "in_progress"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Sedang Berjalan
                          </div>
                        </CommandItem>
                        <CommandItem
                          value="completed"
                          onSelect={() => {
                            setFormData({ ...formData, status: "completed" });
                            setStatusPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.status === "completed"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Selesai
                          </div>
                        </CommandItem>
                        <CommandItem
                          value="cancelled"
                          onSelect={() => {
                            setFormData({ ...formData, status: "cancelled" });
                            setStatusPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.status === "cancelled"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Dibatalkan
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  PIC <span className="text-red-500">*</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-500 hover:text-blue-600"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top" sideOffset={5}>
                      <div className="space-y-2">
                        <h4 className="font-medium">Menentukan PIC (Wajib)</h4>
                        <p className="text-sm text-muted-foreground">
                          Pilih anggota tim yang akan bertanggung jawab
                          menyelesaikan task ini. PIC akan menerima notifikasi dan
                          bertanggung jawab atas progress task. Field ini wajib diisi.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Label>
              <SearchableUserSelect
                users={availableUsers?.filter(user => user.isActive === true) || []}
                value={formData.assignedTo === "unassigned" ? "" : formData.assignedTo}
                onValueChange={(value) => {
                  setFormData({ ...formData, assignedTo: value || "" });
                }}
                placeholder="Pilih anggota tim... (wajib)"
                emptyMessage="Tidak ada anggota tim ditemukan"
                allowUnassigned={false}
              />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  Tenggat Waktu
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-500 hover:text-blue-600"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top" sideOffset={5}>
                      <div className="space-y-2">
                        <h4 className="font-medium">Menentukan Deadline</h4>
                        <p className="text-sm text-muted-foreground">
                          Pilih tanggal yang realistis untuk menyelesaikan task
                          ini. Pertimbangkan kompleksitas task, workload PIC, dan
                          dependencies lainnya.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                        const utc =
                          now.getTime() + now.getTimezoneOffset() * 60000;
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || !formData.assignedTo || formData.assignedTo === "unassigned"}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white order-1 sm:order-2"
          >
            {isAdding ? "Tambah Task" : "Update Task"}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
