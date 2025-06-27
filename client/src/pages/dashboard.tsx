import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsOverview from "@/components/stats-overview";
import OKRCard from "@/components/okr-card";
import CreateOKRModal from "@/components/create-okr-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import { KeyResultDetailModal } from "@/components/key-result-detail-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
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
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());

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

  const toggleObjective = (objectiveId: string) => {
    const newExpanded = new Set(expandedObjectives);
    if (newExpanded.has(objectiveId)) {
      newExpanded.delete(objectiveId);
    } else {
      newExpanded.add(objectiveId);
    }
    setExpandedObjectives(newExpanded);
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "";
    const now = new Date();
    const past = new Date(date);
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Greeting Section */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-medium text-gray-900">Hi widi, Amazing progress :)</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white px-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
            OKR
          </button>
          <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
            My Task
          </button>
          <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
            Update
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Objective & Key Result</h2>
          
          {/* Table Header */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-5">Objective</div>
              <div className="col-span-2 text-center">Progress</div>
              <div className="col-span-3 text-center">Last Checkin</div>
              <div className="col-span-2"></div>
            </div>

            {/* OKR List */}
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading OKRs...</p>
                </div>
              ) : okrs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No OKRs found</p>
                  <Button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First OKR
                  </Button>
                </div>
              ) : (
                okrs.map((okr) => {
                  const isExpanded = expandedObjectives.has(okr.id);
                  return (
                    <div key={okr.id}>
                      {/* Objective Row */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                        <div className="col-span-5">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleObjective(okr.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <span className="font-medium text-gray-900">{okr.title}</span>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-24">
                              <Progress value={okr.progress} className="h-2" />
                            </div>
                            <span className="text-sm font-medium text-green-600">
                              {Math.round(okr.progress)}%
                            </span>
                            <span className="text-sm text-green-600">
                              +20%
                            </span>
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(okr.updatedAt)}
                          </span>
                        </div>
                        <div className="col-span-2"></div>
                      </div>

                      {/* Key Results (Expanded) */}
                      {isExpanded && (
                        <div className="bg-gray-50">
                          {okr.keyResults.map((keyResult, index) => (
                            <div key={keyResult.id} className="grid grid-cols-12 gap-4 px-6 py-3 pl-14">
                              <div className="col-span-5">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm text-gray-700">
                                    Key Result {index + 1}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-2 flex items-center justify-center">
                                <div className="flex items-center space-x-2">
                                  <div className="w-24">
                                    <Progress value={60} className="h-2" />
                                  </div>
                                  <span className="text-sm font-medium text-green-600">20%</span>
                                  <span className="text-sm text-green-600">+20%</span>
                                </div>
                              </div>
                              <div className="col-span-3 text-center">
                                <span className="text-sm text-gray-500">
                                  {formatTimeAgo(keyResult.updatedAt)}
                                </span>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-3 py-1"
                                  onClick={() => handleEditProgress(keyResult)}
                                >
                                  CHECK-IN
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
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