import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Flag, FileText, Users, User, Search, ChevronDown, X } from "lucide-react";
import { formatNumberWithSeparator, handleNumberInputChange, getNumberValueForSubmission } from "@/lib/number-utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const initiativeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "on_hold", "cancelled"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  picId: z.string().optional(),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  members: z.array(z.string()).optional(),
}).refine((data) => {
  // Validate that start date is not greater than end date
  if (data.startDate && data.dueDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.dueDate);
    return startDate <= endDate;
  }
  return true;
}, {
  message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
  path: ["startDate"], // Show error on startDate field
});

type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface InitiativeModalProps {
  keyResultId: string;
  onSuccess?: () => void;
  editingInitiative?: any;
  initiative?: any;
  onClose?: () => void;
  open?: boolean;
}

export default function InitiativeModal({ keyResultId, onSuccess, editingInitiative, initiative, onClose, open: externalOpen }: InitiativeModalProps) {
  const actualEditingInitiative = initiative || editingInitiative;
  const [open, setOpen] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for PIC and member selection
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: actualEditingInitiative ? {
      title: actualEditingInitiative.title || "",
      description: actualEditingInitiative.description || "",
      status: actualEditingInitiative.status || "not_started",
      priority: actualEditingInitiative.priority || "medium",
      picId: actualEditingInitiative.picId || "",
      budget: actualEditingInitiative.budget || "",
      startDate: actualEditingInitiative.startDate ? new Date(actualEditingInitiative.startDate).toISOString().split('T')[0] : "",
      dueDate: actualEditingInitiative.dueDate ? new Date(actualEditingInitiative.dueDate).toISOString().split('T')[0] : "",
      members: actualEditingInitiative.members?.map((m: any) => {
        if (typeof m === 'string') return m;
        if (m.userId) return m.userId;
        if (m.user?.id) return m.user.id;
        if (m.id && !m.initiativeId) return m.id;
        return null;
      }).filter(Boolean) || [],
    } : {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      picId: "",
      budget: "",
      startDate: "",
      dueDate: "",
      members: [],
    },
  });

  // Watch the members field to ensure UI synchronization
  const watchedMembers = useWatch({
    control: form.control,
    name: "members",
    defaultValue: []
  });

  // Handle modal state for editing
  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    } else if (actualEditingInitiative) {
      setOpen(true);
    } else if (onClose) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [actualEditingInitiative, onClose, externalOpen]);

  // Reset form when editing initiative changes
  useEffect(() => {
    if (actualEditingInitiative && form) {
      // Extract member IDs properly from the members array
      const memberIds = actualEditingInitiative.members?.map((m: any) => {
        if (typeof m === 'string') return m;
        // Handle different member data structures
        if (m.userId) return m.userId;
        if (m.user?.id) return m.user.id;
        if (m.id && !m.initiativeId) return m.id; // User ID, not member record ID
        return null;
      }).filter(Boolean) || [];

      // Use setValue for each field to ensure proper form updates
      form.setValue('title', actualEditingInitiative.title || "");
      form.setValue('description', actualEditingInitiative.description || "");
      form.setValue('status', actualEditingInitiative.status || "not_started");
      form.setValue('priority', actualEditingInitiative.priority || "medium");
      form.setValue('picId', actualEditingInitiative.picId || "");
      form.setValue('budget', actualEditingInitiative.budget || "");
      form.setValue('startDate', actualEditingInitiative.startDate ? new Date(actualEditingInitiative.startDate).toISOString().split('T')[0] : "");
      form.setValue('dueDate', actualEditingInitiative.dueDate ? new Date(actualEditingInitiative.dueDate).toISOString().split('T')[0] : "");
      form.setValue('members', memberIds);
    }
  }, [actualEditingInitiative, form]);

  // Handle modal close
  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      const response = await fetch(`/api/key-results/${keyResultId}/initiatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          picId: data.picId === "none" || !data.picId ? null : data.picId,
          startDate: data.startDate || null,
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
        title: "Initiative berhasil dibuat",
        description: "Initiative baru telah ditambahkan ke key result",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat initiative",
        variant: "destructive",
      });
    },
  });

  const updateInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      const response = await fetch(`/api/initiatives/${actualEditingInitiative.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          picId: data.picId === "none" || !data.picId ? null : data.picId,
          startDate: data.startDate || null,
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
        title: "Initiative berhasil diupdate",
        description: "Perubahan initiative telah disimpan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiative-members'] });
      if (actualEditingInitiative) {
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${actualEditingInitiative.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${actualEditingInitiative.id}/tasks`] });
      }
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate initiative",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InitiativeFormData) => {
    if (actualEditingInitiative) {
      updateInitiativeMutation.mutate(data);
    } else {
      createInitiativeMutation.mutate(data);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Belum Dimulai";
      case "in_progress": return "Sedang Berjalan";
      case "completed": return "Selesai";
      case "on_hold": return "Ditahan";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {actualEditingInitiative ? 'Edit Initiative' : 'Buat Initiative Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Initiative Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">Informasi Initiative</h3>
                
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Judul Initiative *
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan judul initiative" />
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Deskripsi
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Jelaskan tujuan dan ruang lingkup initiative"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Status
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_started">Belum Dimulai</SelectItem>
                            <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="on_hold">Ditahan</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Prioritas
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih prioritas" />
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
                </div>

                {/* Dates and Budget */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Tanggal Mulai
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Tenggat Waktu
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Budget (Rp)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="0" 
                            value={formatNumberWithSeparator(field.value || "")} 
                            onChange={(e) => {
                              handleNumberInputChange(e.target.value, (formattedValue) => {
                                field.onChange(getNumberValueForSubmission(formattedValue));
                              });
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Team Assignment Section */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tim & Penanggung Jawab
                </h3>

                {/* PIC Selection */}
                <FormField
                  control={form.control}
                  name="picId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        PIC (Person in Charge)
                      </FormLabel>
                      <FormControl>
                        <SearchableUserSelect
                          users={users}
                          value={field.value === "none" ? "unassigned" : field.value}
                          onValueChange={(value) => field.onChange(value === "unassigned" ? "none" : value)}
                          placeholder="Pilih PIC"
                          emptyMessage="Tidak ada user ditemukan"
                          allowUnassigned={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Members Selection */}
                <FormField
                  control={form.control}
                  name="members"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-2">
                        Anggota Tim
                      </FormLabel>
                      <div className="space-y-2">
                        <div className="relative">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                            className="w-full justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {field.value && field.value.length > 0 
                                ? `${field.value.length} anggota dipilih`
                                : "Pilih anggota tim"
                              }
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>

                          {memberDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="Cari anggota..."
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                              <div className="p-2 space-y-1">
                                {filteredUsers.map((user) => {
                                  const isChecked = watchedMembers?.includes(user.id) || false;
                                  return (
                                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                      <Checkbox
                                        id={user.id}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const currentMembers = watchedMembers || [];
                                          if (checked) {
                                            field.onChange([...currentMembers, user.id]);
                                          } else {
                                            field.onChange(currentMembers.filter(id => id !== user.id));
                                          }
                                        }}
                                      />
                                      <label htmlFor={user.id} className="text-sm font-medium cursor-pointer">
                                        {`${user.firstName} ${user.lastName}`}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Selected Members Display */}
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.map((memberId: string) => {
                              const user = users.find(u => u.id === memberId);
                              return user ? (
                                <div key={memberId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  <User className="h-3 w-3" />
                                  {`${user.firstName} ${user.lastName}`}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newMembers = field.value?.filter(id => id !== memberId) || [];
                                      field.onChange(newMembers);
                                    }}
                                    className="ml-1 hover:text-blue-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createInitiativeMutation.isPending || updateInitiativeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {(createInitiativeMutation.isPending || updateInitiativeMutation.isPending) 
                    ? "Menyimpan..." 
                    : actualEditingInitiative 
                      ? "Update Initiative" 
                      : "Buat Initiative"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}