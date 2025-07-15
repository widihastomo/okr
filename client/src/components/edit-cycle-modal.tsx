import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Cycle } from "@shared/schema";

interface EditCycleModalProps {
  cycle: Cycle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCycleModal({ cycle, open, onOpenChange }: EditCycleModalProps) {
  const [formData, setFormData] = useState({
    name: cycle?.name || "",
    type: cycle?.type || "quarterly",
    startDate: cycle?.startDate || "",
    endDate: cycle?.endDate || "",
    status: cycle?.status || "planning",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("PATCH", `/api/cycles/${cycle?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({
        title: "Siklus berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui siklus",
        description: error.message || "Terjadi kesalahan saat memperbarui siklus",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Update form data when cycle changes
  useEffect(() => {
    if (cycle) {
      setFormData({
        name: cycle.name,
        type: cycle.type,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
      });
    }
  }, [cycle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Siklus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Siklus</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama siklus"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe Siklus</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe siklus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="quarterly">Kuartalan</SelectItem>
                <SelectItem value="annual">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Perencanaan</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>



          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}