import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import StatsOverview from "@/components/stats-overview";
import OKRCard from "@/components/okr-card";
import CreateOKRModal from "@/components/create-okr-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { OKRWithKeyResults, KeyResult } from "@shared/schema";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProgressModal, setEditProgressModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });

  const { data: okrs = [], isLoading, refetch } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs", { status: statusFilter, timeframe: timeframeFilter }],
  });

  const handleEditProgress = (keyResult: KeyResult) => {
    setEditProgressModal({ open: true, keyResult });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">OKR Dashboard</h1>
              <p className="text-gray-600 mt-1">Q4 2024 • Track your objectives and key results</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Periods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    <SelectItem value="Q4 2024">Q4 2024</SelectItem>
                    <SelectItem value="Q3 2024">Q3 2024</SelectItem>
                    <SelectItem value="Q2 2024">Q2 2024</SelectItem>
                    <SelectItem value="Q1 2025">Q1 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New OKR
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <StatsOverview />
          
          {/* OKR List */}
          <div className="space-y-6">
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
                <Button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-blue-700">
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
                  onRefresh={refetch}
                />
              ))
            )}
          </div>
        </main>
      </div>

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
    </div>
  );
}
