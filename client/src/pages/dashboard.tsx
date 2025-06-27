import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatsOverview from "@/components/stats-overview";
import OKRCard from "@/components/okr-card";
import { CreateOKRButton } from "@/components/okr-form-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import { KeyResultDetailModal } from "@/components/key-result-detail-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { OKRWithKeyResults, KeyResult, Cycle } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [editProgressModal, setEditProgressModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });
  const [keyResultDetailModal, setKeyResultDetailModal] = useState<{ open: boolean; keyResultId?: string }>({
    open: false
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ 
    open: boolean; 
    okrId?: string; 
    okrTitle?: string; 
  }>({
    open: false
  });

  const { data: okrs = [], isLoading, refetch } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs", { status: statusFilter }],
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ['/api/cycles'],
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

  const handleKeyResultClick = (keyResultId: string) => {
    setKeyResultDetailModal({ open: true, keyResultId });
  };

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
            <p className="text-gray-600 mt-1 text-sm lg:text-base">Q4 2024 • Track your objectives and key results</p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on_track">On Track</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="behind">Behind</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              

            </div>
            
            <CreateOKRButton />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview />
      
      {/* OKR List */}
      <div className="space-y-6 mt-6">
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
          okrs.map((okr) => {
            // Find the cycle for this OKR to get start and end date
            const cycle = cycles.find(c => c.id === okr.cycleId);
            return (
              <OKRCard
                key={okr.id}
                okr={okr}
                onEditProgress={handleEditProgress}
                onKeyResultClick={handleKeyResultClick}
                onRefresh={refetch}
                onDuplicate={handleDuplicateOKR}
                onDelete={handleDeleteOKR}
                cycleStartDate={cycle?.startDate}
                cycleEndDate={cycle?.endDate}
              />
            );
          })
        )}
      </div>

      {/* Modals */}

      <EditProgressModal
        open={editProgressModal.open}
        onOpenChange={(open) => setEditProgressModal({ open, keyResult: open ? editProgressModal.keyResult : undefined })}
        keyResult={editProgressModal.keyResult}
        onSuccess={refetch}
      />

      {keyResultDetailModal.keyResultId && (
        <KeyResultDetailModal
          keyResultId={keyResultDetailModal.keyResultId}
          isOpen={keyResultDetailModal.open}
          onClose={() => setKeyResultDetailModal({ open: false })}
        />
      )}

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