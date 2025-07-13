import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Building, UserIcon, Target, HelpCircle } from "lucide-react";
import { Cycle, User, Team, Objective } from "@shared/schema";


// Schema untuk edit objective (tanpa key results)
const editObjectiveSchema = z.object({
  title: z.string().min(1, "Judul goal wajib diisi"),
  description: z.string().optional(),
  ownerType: z.enum(["user", "team"]),
  ownerId: z.string().min(1, "Pemilik wajib dipilih"),
  owner: z.string().min(1, "Nama pemilik wajib diisi"),
  cycleId: z.string().optional(),
  teamId: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "on_track", "at_risk", "behind", "paused", "canceled", "completed", "partially_achieved", "not_achieved"]),
});

type EditObjectiveFormData = z.infer<typeof editObjectiveSchema>;

interface EditObjectiveModalProps {
  objective?: Objective;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditObjectiveModal({ objective, open, onOpenChange }: EditObjectiveModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data yang diperlukan
  const { data: cycles } = useQuery<Cycle[]>({ queryKey: ["/api/cycles"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: objectives } = useQuery<Objective[]>({ queryKey: ["/api/objectives"] });

  const form = useForm<EditObjectiveFormData>({
    resolver: zodResolver(editObjectiveSchema),
    defaultValues: {
      title: objective?.title || "",
      description: objective?.description || "",
      owner: objective?.owner || "",
      ownerType: objective ? (objective.ownerType === "individual" ? "user" : objective.ownerType) as "user" | "team" : "user",
      ownerId: objective?.ownerId || "",
      status: objective?.status as any || "not_started",
      cycleId: objective?.cycleId || undefined,
      teamId: objective?.teamId || undefined,
      parentId: objective?.parentId || undefined,
    },
  });

  // Reset form when objective changes or dialog opens
  useEffect(() => {
    if (open && objective) {
      form.reset({
        title: objective.title,
        description: objective.description || "",
        owner: objective.owner,
        ownerType: (objective.ownerType === "individual" ? "user" : objective.ownerType) as "user" | "team",
        ownerId: objective.ownerId,
        status: objective.status as any,
        cycleId: objective.cycleId || undefined,
        teamId: objective.teamId || undefined,
        parentId: objective.parentId || undefined,
      });
    }
  }, [open, objective, form]);

  const updateObjectiveMutation = useMutation({
    mutationFn: async (data: EditObjectiveFormData) => {
      const payload = {
        objective: data,
        keyResults: [], // Empty array since we're only editing objective
      };

      if (!objective?.id) throw new Error("Objective not found");
      const response = await fetch(`/api/goals/${objective?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update objective: ${errorData}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal berhasil diperbarui",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      // Invalidate specific objective data
      if (objective?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${objective.id}`] });
      }
      // Invalidate cycle data if cycleId exists
      if (objective?.cycleId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cycles/${objective.cycleId}`] });
      }
      // Invalidate owner data if ownerId exists
      if (objective?.ownerId && objective?.ownerType) {
        const ownerEndpoint = objective.ownerType === "user" || objective.ownerType === "individual" 
          ? `/api/users/${objective.ownerId}` 
          : `/api/teams/${objective.ownerId}`;
        queryClient.invalidateQueries({ queryKey: [ownerEndpoint] });
      }
      // Invalidate parent objective if parentId exists
      if (objective?.parentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${objective.parentId}`] });
      }
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update objective: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditObjectiveFormData) => {
    updateObjectiveMutation.mutate(data);
  };

  const ownerType = form.watch("ownerType");

  // Filter parent objectives (tidak boleh pilih diri sendiri)
  const availableParentObjectives = objectives?.filter(obj => obj.id !== objective?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Ubah Goal
          </DialogTitle>
          <DialogDescription>
            Ubah informasi goal termasuk judul, deskripsi, pemilik, dan pengaturan lainnya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informasi Goal */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Judul Goal */}
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                    Judul Goal
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
                          Nama goal yang ingin dicapai. Gunakan bahasa yang inspiratif dan mudah dipahami oleh tim.
                          <br /><br />
                          <strong>Contoh:</strong> "Meningkatkan Kepuasan Pelanggan", "Memperluas Jangkauan Pasar", "Mengoptimalkan Efisiensi Operasional"
                        </p>
                      </PopoverContent>
                    </Popover>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul goal yang jelas dan spesifik"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Deskripsi Goal */}
                <div>
                  <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                    Deskripsi Goal
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
                          Penjelasan detail tentang goal ini. Cantumkan konteks, alasan pentingnya, dan dampak yang diharapkan.
                          <br /><br />
                          <strong>Tips:</strong> Jelaskan "mengapa" goal ini penting dan "bagaimana" goal ini akan berdampak pada organisasi atau tim.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan detail goal dan konteks yang ingin dicapai"
                    rows={3}
                    {...form.register("description")}
                  />
                </div>

                {/* Row untuk Cycle, Owner Type, dan Owner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Cycle */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      Siklus
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
                            Periode waktu untuk mencapai goal ini. Pilih siklus yang sesuai dengan timeline dan prioritas bisnis.
                            <br /><br />
                            <strong>Contoh:</strong> Kuartal Q1 2024, Bulanan Januari, atau Tahunan 2024
                          </p>
                        </PopoverContent>
                      </Popover>
                    </Label>
                    <Select
                      value={form.watch("cycleId") || "none"}
                      onValueChange={(value) => form.setValue("cycleId", value === "none" ? undefined : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih siklus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada siklus</SelectItem>
                        {cycles?.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id}>
                            {cycle.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipe Pemilik */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      Tipe Pemilik
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
                            Pilih siapa yang bertanggung jawab atas goal ini.
                            <br /><br />
                            <strong>Individual:</strong> Goal dipimpin oleh satu orang spesifik
                            <br />
                            <strong>Tim:</strong> Goal dipimpin oleh seluruh tim atau departemen
                          </p>
                        </PopoverContent>
                      </Popover>
                    </Label>
                    <Select
                      value={form.watch("ownerType")}
                      onValueChange={(value: "user" | "team") => {
                        form.setValue("ownerType", value);
                        form.setValue("ownerId", "");
                        form.setValue("owner", "");
                        if (value === "user") {
                          form.setValue("teamId", undefined);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Individual</SelectItem>
                        <SelectItem value="team">Tim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pemilik */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      Pemilik
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
                            Pilih siapa yang bertanggung jawab penuh atas pencapaian goal ini.
                            <br /><br />
                            <strong>Tips:</strong> Pastikan pemilik memiliki otoritas dan resources yang cukup untuk menggerakkan goal ini hingga selesai.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </Label>
                    {ownerType === "user" ? (
                      <SearchableUserSelect
                        users={users || []}
                        value={form.watch("ownerId")}
                        onValueChange={(value) => {
                          form.setValue("ownerId", value);
                          const selectedUser = users?.find(u => u.id === value);
                          if (selectedUser) {
                            form.setValue("owner", `${selectedUser.firstName} ${selectedUser.lastName}`);
                          }
                        }}
                        placeholder="Pilih pemilik"
                        emptyMessage="Tidak ada user ditemukan"
                      />
                    ) : (
                      <Select
                        value={form.watch("ownerId")}
                        onValueChange={(value) => {
                          form.setValue("ownerId", value);
                          const selectedTeam = teams?.find(t => t.id === value);
                          if (selectedTeam) {
                            form.setValue("owner", selectedTeam.name);
                            form.setValue("teamId", selectedTeam.id);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tim" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {form.formState.errors.ownerId && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.ownerId.message}</p>
                    )}
                  </div>
                </div>

                {/* Goal Induk */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    Goal Induk (Opsional)
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
                          Pilih goal induk jika goal ini adalah bagian dari goal yang lebih besar.
                          <br /><br />
                          <strong>Contoh:</strong> Goal "Meningkatkan Konversi Website" bisa menjadi bagian dari goal induk "Meningkatkan Revenue Online"
                        </p>
                      </PopoverContent>
                    </Popover>
                  </Label>
                  <Select
                    value={form.watch("parentId") || "none"}
                    onValueChange={(value) => form.setValue("parentId", value === "none" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih goal induk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada goal induk</SelectItem>
                      {availableParentObjectives.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
              disabled={updateObjectiveMutation.isPending}
            >
              {updateObjectiveMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}