import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Calendar, MoreHorizontal, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateCycleModal from "./create-cycle-modal";
import EditCycleModal from "./edit-cycle-modal";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import type { Cycle } from "@shared/schema";
// Utility functions for cycle status
const getCycleStatusText = (status: string): string => {
  switch (status) {
    case 'planning': return 'Perencanaan';
    case 'active': return 'Aktif';
    case 'completed': return 'Selesai';
    default: return status;
  }
};

const getCycleStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'planning': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'active': return 'default';
    case 'completed': return 'secondary';
    case 'planning': return 'outline';
    default: return 'secondary';
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function CyclesContent() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["/api/cycles"],
    queryFn: () => apiRequest("GET", "/api/cycles").then(res => res.json() as Promise<Cycle[]>),
    onSuccess: (data) => {
      console.log('Cycles data received:', data);
    }
  });

  // Pagination calculations
  const totalItems = cycles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const paginatedCycles = useMemo(() => {
    return cycles.slice(startIndex, endIndex);
  }, [cycles, startIndex, endIndex]);

  // Reset to first page when data changes
  const resetPagination = () => {
    setCurrentPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      
      // Reset to previous page if current page becomes empty
      const newTotalItems = totalItems - 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      toast({
        title: "Siklus dihapus",
        description: "Siklus berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800"
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
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cycles/update-status");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      const updatedCount = data.updates?.length || 0;
      toast({
        title: "Status Update",
        description: `${updatedCount} siklus diperbarui statusnya`,
        className: "border-blue-200 bg-blue-50 text-blue-800"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui status siklus",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setEditModalOpen(true);
  };

  const handleDelete = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',  
      year: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'planning': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Siklus</h1>
          <p className="text-gray-600 mt-1">Kelola periode waktu untuk objective dan target Anda</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => updateStatusMutation.mutate()}
            disabled={updateStatusMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updateStatusMutation.isPending ? 'animate-spin' : ''}`} />
            Update Status
          </Button>
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Siklus
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Siklus</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Memuat data...
                  </div>
                </TableCell>
              </TableRow>
            ) : cycles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Calendar className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Belum ada siklus</p>
                    <p className="text-sm mt-1">Mulai dengan membuat siklus pertama Anda</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCycles.map((cycle) => {
                return (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.name}</TableCell>
                    <TableCell>{formatDate(cycle.startDate)}</TableCell>
                    <TableCell>{formatDate(cycle.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(cycle.status)}>
                        {getCycleStatusText(cycle.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} item
              </span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">per halaman</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return (
                      <span key={page} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateCycleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          // Modal handles its own cache invalidation and closing
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
  );
}