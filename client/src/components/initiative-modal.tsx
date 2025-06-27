import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Flag, FileText, Users, User, Search, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
}

export default function InitiativeModal({ keyResultId, onSuccess }: InitiativeModalProps) {
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
    defaultValues: {
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

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      const payload = {
        ...data,
        keyResultId,
        createdBy: "550e8400-e29b-41d4-a716-446655440001", // This should come from auth context
        picId: data.picId === "none" ? null : data.picId,
        budget: data.budget ? parseFloat(data.budget) : null,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        progressPercentage: 0, // Start with 0% progress, will be calculated automatically
      };
      return await apiRequest("POST", `/api/key-results/${keyResultId}/initiatives`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Initiative berhasil dibuat",
        description: "Initiative baru telah ditambahkan ke Key Result",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results", keyResultId] });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat initiative",
        description: error.message || "Terjadi kesalahan saat membuat initiative",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InitiativeFormData) => {
    createInitiativeMutation.mutate(data);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Initiative
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Buat Initiative Baru
          </DialogTitle>
          <DialogDescription>
            Tambahkan initiative untuk membantu mencapai Key Result ini
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Initiative *</FormLabel>
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
                      placeholder="Jelaskan detail initiative ini"
                      className="resize-none"
                      rows={3}
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

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={createInitiativeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createInitiativeMutation.isPending ? "Menyimpan..." : "Buat Initiative"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}