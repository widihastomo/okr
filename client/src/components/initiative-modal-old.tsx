import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Flag, FileText, Users, User, Search, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
      members: actualEditingInitiative.members?.map((m: any) => m.userId || m.user?.id || m.id) || [],
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

  // Handle modal state for editing
  useEffect(() => {
    if (externalOpen !== undefined) {
      // If external open prop is provided, use it
      setOpen(externalOpen);
    } else if (actualEditingInitiative) {
      setOpen(true);
    } else if (onClose) {
      // If we have onClose prop, we're being controlled externally
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [actualEditingInitiative, onClose, externalOpen]);

  // Reset form when editing initiative changes
  useEffect(() => {
    if (editingInitiative && form) {
      // Extract member IDs from the members array
      const memberIds = editingInitiative.members?.map((m: any) => {
        // Handle different member data structures
        if (typeof m === 'string') return m;
        if (m.userId) return m.userId;
        if (m.user?.id) return m.user.id;
        if (m.id && !m.initiativeId) return m.id; // Only use m.id if it's not the member record ID
        return null;
      }).filter(Boolean) || [];

      form.reset({
        title: editingInitiative.title || "",
        description: editingInitiative.description || "",
        status: editingInitiative.status || "not_started",
        priority: editingInitiative.priority || "medium",
        picId: editingInitiative.picId || "",
        budget: editingInitiative.budget || "",
        startDate: editingInitiative.startDate ? new Date(editingInitiative.startDate).toISOString().split('T')[0] : "",
        dueDate: editingInitiative.dueDate ? new Date(editingInitiative.dueDate).toISOString().split('T')[0] : "",
        members: memberIds,
      });
    }
  }, [editingInitiative, form]);

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
        title: "Inisiatif berhasil dibuat",
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
        title: "Initiative berhasil diperbarui",
        description: "Perubahan initiative telah disimpan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/key-results/${keyResultId}/initiatives`] });
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
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editingInitiative ? 'Edit Initiative' : 'Buat Initiative Baru'}
          </SheetTitle>
        </SheetHeader>

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
                      <FormLabel>Judul Initiative</FormLabel>
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
                          placeholder="Deskripsi initiative"
                          className="min-h-[80px]"
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
                            <SelectItem value="cancelled">{getStatusLabel("cancelled")}</SelectItem>
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
                            <SelectItem value="critical">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4 text-red-600" />
                                {getPriorityLabel("critical")}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* PIC and Budget Row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="picId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          PIC (Penanggung Jawab)
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih PIC" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Tidak ada</SelectItem>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {`${user.firstName} ${user.lastName}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (Rp)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="10000000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Mulai</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenggat Waktu</FormLabel>
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
                </div>

                {/* Members Selection */}
                <FormField
                  control={form.control}
                  name="members"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Anggota Tim
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          {/* Dropdown Trigger */}
                          <button
                            type="button"
                            onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                            className="w-full border rounded-md px-3 py-2 text-left bg-white flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <span className="text-sm">
                              {field.value && field.value.length > 0
                                ? `${field.value.length} anggota terpilih`
                                : "Pilih anggota tim"
                              }
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>

                          {/* Dropdown Content */}
                          {memberDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                              {/* Search Box */}
                              <div className="p-3 border-b">
                                <div className="relative">
                                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search"
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* Options List */}
                              <div className="max-h-48 overflow-y-auto">
                                {/* Select All Option */}
                                <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50">
                                  <Checkbox
                                    id="select-all"
                                    checked={field.value?.length === filteredUsers.length && filteredUsers.length > 0}
                                    onCheckedChange={(checked: boolean) => {
                                      if (checked) {
                                        field.onChange(filteredUsers.map(user => user.id));
                                      } else {
                                        field.onChange([]);
                                      }
                                    }}
                                  />
                                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                    All
                                  </label>
                                </div>

                                {/* User Options */}
                                {filteredUsers.map((user) => (
                                  <div key={user.id} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50">
                                    <Checkbox
                                      id={`member-${user.id}`}
                                      checked={field.value?.includes(user.id) || false}
                                      onCheckedChange={(checked: boolean) => {
                                        if (checked) {
                                          field.onChange([...(field.value || []), user.id]);
                                        } else {
                                          field.onChange(
                                            field.value?.filter((id: string) => id !== user.id) || []
                                          );
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={`member-${user.id}`}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {`${user.firstName} ${user.lastName}`}
                                    </label>
                                  </div>
                                ))}

                                {filteredUsers.length === 0 && (
                                  <div className="px-3 py-2 text-sm text-gray-500">
                                    Tidak ada hasil ditemukan
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Click outside to close */}
                          {memberDropdownOpen && (
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setMemberDropdownOpen(false)}
                            />
                          )}
                        </div>
                      </FormControl>
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {(createInitiativeMutation.isPending || updateInitiativeMutation.isPending) 
                    ? "Menyimpan..." 
                    : editingInitiative 
                      ? "Update Initiative" 
                      : "Buat Initiative"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}