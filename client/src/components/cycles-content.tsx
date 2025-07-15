import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Calendar, MoreHorizontal, RefreshCw, ChevronLeft, ChevronRight, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateCycleModal from "./create-cycle-modal";
import EditCycleModal from "./edit-cycle-modal";
import CycleDeletionModal from "./cycle-deletion-modal";
import type { Cycle } from "@shared/schema";


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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
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

  // Fetch objectives to count how many are connected to each cycle
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/objectives"],
    queryFn: () => apiRequest("GET", "/api/objectives").then(res => res.json()),
  });

  // Function to count objectives for a specific cycle
  const getObjectiveCount = (cycleId: string): number => {
    return objectives.filter((obj: any) => obj.cycleId === cycleId).length;
  };

  // Function to get objectives for a specific cycle for preview
  const getObjectivesForCycle = (cycleId: string): any[] => {
    return objectives.filter((obj: any) => obj.cycleId === cycleId);
  };

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

  const handleDeleteSuccess = () => {
    // Reset to previous page if current page becomes empty
    const newTotalItems = totalItems - 1;
    const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    
    setDeleteModalOpen(false);
    setSelectedCycle(null);
  };



  const handleEdit = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setEditModalOpen(true);
  };

  const handleDelete = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setDeleteModalOpen(true);
  };

  const handlePreview = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setPreviewModalOpen(true);
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
              <TableHead>Objectives</TableHead>
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
                const objectiveCount = getObjectiveCount(cycle.id);
                const cycleObjectives = getObjectivesForCycle(cycle.id);
                
                return (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.name}</TableCell>
                    <TableCell>{formatDate(cycle.startDate)}</TableCell>
                    <TableCell>{formatDate(cycle.endDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">
                          {objectiveCount} objectives
                        </span>
                        {objectiveCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => handlePreview(cycle)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Lihat
                          </Button>
                        )}
                      </div>
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

      <CycleDeletionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        cycle={selectedCycle}
        onSuccess={handleDeleteSuccess}
      />

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Objectives dalam Siklus "{selectedCycle?.name}"</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCycle && getObjectivesForCycle(selectedCycle.id).length > 0 ? (
              <div className="space-y-3">
                {getObjectivesForCycle(selectedCycle.id).map((objective: any) => (
                  <Card key={objective.id} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-900">
                        {objective.title}
                      </CardTitle>
                      {objective.description && (
                        <CardDescription className="text-xs text-gray-600">
                          {objective.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {objective.priority || 'Medium'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {objective.ownerId && `Owner: ${objective.ownerId.slice(0, 8)}...`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Belum ada objectives dalam siklus ini</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}