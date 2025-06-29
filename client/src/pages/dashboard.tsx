import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatsOverview from "@/components/stats-overview";
import OKRCard from "@/components/okr-card";
import { CreateOKRButton } from "@/components/okr-form-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, CheckSquare } from "lucide-react";
import MyTasks from "@/components/my-tasks";
import type { OKRWithKeyResults, KeyResult, Cycle } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [hasAutoSelected, setHasAutoSelected] = useState<boolean>(false);

  const [editProgressModal, setEditProgressModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ 
    open: boolean; 
    okrId?: string; 
    okrTitle?: string; 
  }>({
    open: false
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ['/api/cycles'],
  });

  // Set default cycle to active cycle with shortest duration when cycles are loaded
  const activeCycles = cycles.filter(cycle => cycle.status === 'active');
  const defaultCycle = activeCycles.length > 0 
    ? activeCycles.reduce((shortest, current) => {
        const shortestDuration = new Date(shortest.endDate).getTime() - new Date(shortest.startDate).getTime();
        const currentDuration = new Date(current.endDate).getTime() - new Date(current.startDate).getTime();
        return currentDuration < shortestDuration ? current : shortest;
      })
    : null;
  
  // Initialize cycle filter with longest active cycle on first load only
  useEffect(() => {
    if (defaultCycle && cycleFilter === 'all' && cycles.length > 0 && !hasAutoSelected) {
      setCycleFilter(defaultCycle.id);
      setHasAutoSelected(true);
    }
  }, [defaultCycle?.id, hasAutoSelected]); // Only auto-select once

  const { data: allOkrs = [], isLoading, refetch } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs"],
  });

  // Helper function to check if a cycle is related to selected cycle
  const isRelatedCycle = (okrCycleId: string | null, selectedCycleId: string) => {
    // Always return true for "all cycles" filter
    if (selectedCycleId === 'all') return true;
    
    // Handle null cycleId (OKRs without cycles)
    if (!okrCycleId) return selectedCycleId === 'all';
    
    // Direct match
    if (okrCycleId === selectedCycleId) return true;
    
    // Find the selected cycle and OKR cycle
    const selectedCycle = cycles.find(c => c.id === selectedCycleId);
    const okrCycle = cycles.find(c => c.id === okrCycleId);
    
    if (!selectedCycle || !okrCycle) return false;
    
    // If selected cycle is quarterly, include monthly cycles within that quarter
    if (selectedCycle.type === 'quarterly' && okrCycle.type === 'monthly') {
      const selectedStart = new Date(selectedCycle.startDate);
      const selectedEnd = new Date(selectedCycle.endDate);
      const okrStart = new Date(okrCycle.startDate);
      const okrEnd = new Date(okrCycle.endDate);
      
      // Check if monthly cycle falls within quarterly cycle period
      return okrStart >= selectedStart && okrEnd <= selectedEnd;
    }
    
    return false;
  };

  // Client-side filtering for status and cycle
  const okrs = allOkrs.filter(okr => {
    // Status filter
    const statusMatch = statusFilter === 'all' || okr.status === statusFilter;
    
    // Cycle filter with related cycle logic
    const cycleMatch = isRelatedCycle(okr.cycleId, cycleFilter);
    
    return statusMatch && cycleMatch;
  });

  // Mutation for deleting OKR
  const deleteOKRMutation = useMutation({
    mutationFn: async (okrId: string) => {
      const response = await fetch(`/api/objectives/${okrId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete OKR');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OKR berhasil dihapus",
        description: "Objective dan key results telah dihapus dari sistem.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus OKR",
        description: error.message || "Terjadi kesalahan saat menghapus OKR.",
        variant: "destructive",
      });
    },
  });

  // Mutation for duplicating OKR
  const duplicateOKRMutation = useMutation({
    mutationFn: async (okr: OKRWithKeyResults) => {
      // Create new objective
      const response = await fetch('/api/objectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${okr.title} (Copy)`,
          description: okr.description,
          owner: okr.owner,
          ownerType: okr.ownerType,
          ownerId: okr.ownerId,
          status: "in_progress",
          cycleId: okr.cycleId,
          teamId: okr.teamId,
          parentId: okr.parentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create objective');
      }

      const newObjective = await response.json();

      // Create key results for the new objective
      for (const kr of okr.keyResults) {
        const krResponse = await fetch('/api/key-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: kr.title,
            description: kr.description,
            currentValue: "0", // Reset progress
            targetValue: kr.targetValue,
            baseValue: kr.baseValue,
            unit: kr.unit,
            keyResultType: kr.keyResultType,
            status: "in_progress",
            objectiveId: newObjective.id,
            dueDate: kr.dueDate,
          }),
        });

        if (!krResponse.ok) {
          throw new Error('Failed to create key result');
        }
      }

      return newObjective;
    },
    onSuccess: () => {
      toast({
        title: "OKR berhasil diduplikasi",
        description: "OKR baru telah dibuat dengan progress direset ke 0.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Gagal menduplikasi OKR",
        description: error.message || "Terjadi kesalahan saat menduplikasi OKR.",
        variant: "destructive",
      });
    },
  });

  const handleEditProgress = (keyResult: KeyResult) => {
    setEditProgressModal({ open: true, keyResult });
  };

  // Key result click now navigates to dedicated page via Link in OKRCard

  const handleDuplicateOKR = (okr: OKRWithKeyResults) => {
    duplicateOKRMutation.mutate(okr);
  };

  const handleDeleteOKR = (okrId: string) => {
    // Find the OKR to get its title for the confirmation modal
    const okrToDelete = okrs.find(okr => okr.id === okrId);
    setDeleteConfirmModal({ 
      open: true, 
      okrId, 
      okrTitle: okrToDelete?.title || "OKR ini" 
    });
  };

  const confirmDeleteOKR = () => {
    if (deleteConfirmModal.okrId) {
      deleteOKRMutation.mutate(deleteConfirmModal.okrId);
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">OKR Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">Track your objectives and key results</p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="on_track">On Track</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="behind">Behind</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="partially_achieved">Partially Achieved</SelectItem>
                  <SelectItem value="not_achieved">Not Achieved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={cycleFilter} onValueChange={(value) => {
                setCycleFilter(value);
                setHasAutoSelected(true); // Prevent auto-selection after manual selection
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cycle</SelectItem>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
            
            <CreateOKRButton />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview okrs={okrs} isLoading={isLoading} />
      
      {/* Tabbed Content */}
      <Tabs defaultValue="objectives" className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Objectives
          </TabsTrigger>
          <TabsTrigger value="my-tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            My Tasks
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="objectives" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading OKRs...</p>
            </div>
          ) : okrs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No OKRs found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== "all" 
                  ? "No OKRs match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first objective and key results."
                }
              </p>
              <CreateOKRButton />
            </div>
          ) : (
            okrs.map((okr, index) => {
              // Find the cycle for this OKR to get start and end date
              const cycle = cycles.find(c => c.id === okr.cycleId);
              return (
                <OKRCard
                  key={okr.id}
                  okr={okr}
                  onEditProgress={handleEditProgress}
                  onRefresh={refetch}
                  onDuplicate={handleDuplicateOKR}
                  onDelete={handleDeleteOKR}
                  cycleStartDate={cycle?.startDate}
                  cycleEndDate={cycle?.endDate}
                  cycle={cycle}
                  index={index}
                />
              );
            })
          )}
        </TabsContent>
        
        <TabsContent value="my-tasks" className="mt-6">
          <MyTasks />
        </TabsContent>
      </Tabs>

      {/* Modals */}

      <EditProgressModal
        open={editProgressModal.open}
        onOpenChange={(open) => setEditProgressModal({ open, keyResult: open ? editProgressModal.keyResult : undefined })}
        keyResult={editProgressModal.keyResult}
        onSuccess={refetch}
      />



      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteConfirmModal.open}
        onOpenChange={(open) => setDeleteConfirmModal({ open })}
        onConfirm={confirmDeleteOKR}
        title="Hapus OKR"
        itemName={deleteConfirmModal.okrTitle}
        description={`Apakah Anda yakin ingin menghapus OKR "${deleteConfirmModal.okrTitle}"? Semua Key Results dan data terkait akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}