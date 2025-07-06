import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Calendar, MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateCycleModal from "./create-cycle-modal";
import EditCycleModal from "./edit-cycle-modal";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import Sidebar from "./sidebar";
import type { Cycle } from "@shared/schema";

export default function CyclesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["/api/cycles"],
    queryFn: () => apiRequest("GET", "/api/cycles").then(res => res.json() as Promise<Cycle[]>)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({
        title: "Siklus dihapus",
        description: "Siklus berhasil dihapus",
        variant: "success"
      });
      setDeleteModalOpen(false);
      setSelectedCycle(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus siklus",
        variant: "destructive"
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/update-cycle-status"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({
        title: "Status siklus diperbarui",
        description: data.message,
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui status",
        description: error.message || "Terjadi kesalahan saat memperbarui status siklus",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "planning": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Aktif";
      case "completed": return "Selesai";
      case "planning": return "Perencanaan";
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "monthly": return "Bulanan";
      case "quarterly": return "Kuartalan";
      case "annual": return "Tahunan";
      default: return type;
    }
  };

  const handleEdit = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setEditModalOpen(true);
  };

  const handleDelete = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={false} />
        <div className="flex-1 overflow-auto pt-16 lg:pt-0">
          <div className="p-4 lg:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={false} />
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Siklus OKR</h1>
              <p className="text-gray-600 mt-2 text-sm lg:text-base">Kelola siklus OKR bulanan, kuartalan, dan tahunan</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${updateStatusMutation.isPending ? 'animate-spin' : ''}`} />
                Update Status
              </Button>
              <Button onClick={() => setCreateModalOpen(true)} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Siklus
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siklus</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada siklus</h3>
                      <p className="text-gray-500 mb-4">Buat siklus OKR pertama Anda untuk memulai</p>
                      <Button onClick={() => setCreateModalOpen(true)} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Siklus
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((cycle) => {
                    const startDate = new Date(cycle.startDate).toLocaleDateString('id-ID');
                    const endDate = new Date(cycle.endDate).toLocaleDateString('id-ID');
                    
                    return (
                      <TableRow key={cycle.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{cycle.name}</TableCell>
                        <TableCell>{getTypeText(cycle.type)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(cycle.status)}>
                            {getStatusText(cycle.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{startDate}</TableCell>
                        <TableCell>{endDate}</TableCell>
                        <TableCell className="max-w-xs truncate" title={cycle.description || ""}>
                          {cycle.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(cycle)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(cycle)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <CreateCycleModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSuccess={() => {
              setCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
            }}
          />

          <EditCycleModal
            cycle={selectedCycle}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
          />

          <DeleteConfirmationModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            onConfirm={() => {
              if (selectedCycle) {
                deleteMutation.mutate(selectedCycle.id);
              }
            }}
            title="Hapus Siklus"
            description={`Apakah Anda yakin ingin menghapus siklus "${selectedCycle?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            itemName={selectedCycle?.name}
          />
        </div>
      </div>
    </div>
  );
}