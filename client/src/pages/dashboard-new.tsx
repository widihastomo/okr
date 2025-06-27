import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsOverview from "@/components/stats-overview";
import OKRCard from "@/components/okr-card";
import CreateOKRModal from "@/components/create-okr-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import { KeyResultDetailModal } from "@/components/key-result-detail-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { OKRWithKeyResults, KeyResult, Cycle } from "@shared/schema";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProgressModal, setEditProgressModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });
  const [keyResultDetailModal, setKeyResultDetailModal] = useState<{ open: boolean; keyResultId?: string }>({
    open: false
  });

  const { data: okrs = [], isLoading, refetch } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs", { status: statusFilter, timeframe: timeframeFilter }],
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ['/api/cycles'],
  });

  const handleEditProgress = (keyResult: KeyResult) => {
    setEditProgressModal({ open: true, keyResult });
  };

  const handleKeyResultClick = (keyResultId: string) => {
    setKeyResultDetailModal({ open: true, keyResultId });
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

              <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.name}>
                      {cycle.name} ({cycle.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New OKR
            </Button>
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
              {statusFilter !== "all" || timeframeFilter !== "all" 
                ? "No OKRs match your current filters. Try adjusting your search criteria."
                : "Get started by creating your first objective and key results."
              }
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Create First OKR
            </Button>
          </div>
        ) : (
          okrs.map((okr) => (
            <OKRCard
              key={okr.id}
              okr={okr}
              onEditProgress={handleEditProgress}
              onKeyResultClick={handleKeyResultClick}
              onRefresh={refetch}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <CreateOKRModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refetch}
      />

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
    </div>
  );
}