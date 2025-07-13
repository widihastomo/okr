import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatsOverview from "@/components/stats-overview";
import OKRCard from "@/components/okr-card";
import { CreateOKRButton } from "@/components/okr-form-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import EditKeyResultModal from "@/components/edit-key-result-modal";
import { CascadeDeleteConfirmationModal } from "@/components/cascade-delete-confirmation-modal";
import EditObjectiveModal from "@/components/edit-objective-modal";
import { OKRGridSkeleton } from "@/components/skeletons/okr-card-skeleton";
import {
  StatsOverviewSkeleton,
  FiltersSkeleton,
} from "@/components/skeletons/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import {
  Plus,
  Target,
  Trophy,
  List,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Network,
} from "lucide-react";
import TourLauncher from "@/components/onboarding/tour-launcher";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHelpBubble } from "@/components/help-bubble";
import AIHelpBubble from "@/components/ai-help-bubble";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import DashboardD3Tree from "@/components/dashboard-d3-tree";

import { useLocation } from "wouter";
import type { OKRWithKeyResults, KeyResult, Cycle, User } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [location, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("");
  const [hasAutoSelected, setHasAutoSelected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  const [editProgressModal, setEditProgressModal] = useState<{
    open: boolean;
    keyResult?: KeyResult;
  }>({
    open: false,
  });

  const [editKeyResultModal, setEditKeyResultModal] = useState<{
    open: boolean;
    keyResult?: KeyResult;
  }>({
    open: false,
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    okrId?: string;
    okrTitle?: string;
    keyResultsCount?: number;
    initiativesCount?: number;
    tasksCount?: number;
  }>({
    open: false,
  });

  const [deleteKeyResultModal, setDeleteKeyResultModal] = useState<{
    open: boolean;
    keyResult?: KeyResult;
  }>({
    open: false,
  });

  const [editObjectiveModal, setEditObjectiveModal] = useState<{
    open: boolean;
    objective?: OKRWithKeyResults;
  }>({
    open: false,
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Initialize filters from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Initialize filters
    const statusParam = urlParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }

    const cycleParam = urlParams.get("cycle");
    if (cycleParam) {
      setCycleFilter(cycleParam);
      setHasAutoSelected(true); // Prevent auto-selection when loading from URL
    }

    const userParam = urlParams.get("user");
    if (userParam) {
      // Keep the actual parameter value including "all"
      setUserFilter(userParam);
    }
  }, []);

  // Update URL when filters change
  const updateURL = (updates: {
    status?: string;
    cycle?: string;
    user?: string;
  }) => {
    const url = new URL(window.location.href);

    if (updates.status !== undefined) {
      // Always set status parameter, including "all" for "Semua Status"
      url.searchParams.set("status", updates.status);
    }
    if (updates.cycle !== undefined) {
      // Always set cycle parameter, including "all" for "Semua Cycle"
      url.searchParams.set("cycle", updates.cycle);
    }
    if (updates.user !== undefined) {
      if (updates.user === "" || updates.user === "all") {
        // Set "all" explicitly for "Semua User"
        url.searchParams.set("user", "all");
      } else {
        url.searchParams.set("user", updates.user);
      }
    }

    window.history.replaceState({}, "", url.toString());
  };

  // Update URL when tab changes

  // Update URL when status filter changes
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    updateURL({ status: newStatus });
  };

  // Update URL when cycle filter changes
  const handleCycleFilterChange = (newCycle: string) => {
    setCycleFilter(newCycle);
    setHasAutoSelected(true);
    updateURL({ cycle: newCycle });
  };

  // Update URL when user filter changes
  const handleUserFilterChange = (newUser: string) => {
    // Convert empty string to "all" for consistency
    const userValue = newUser === "" ? "all" : newUser;
    setUserFilter(userValue);
    updateURL({ user: userValue });
  };

  // Toggle expand/collapse for hierarchy nodes
  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Set default cycle to active cycle with shortest duration when cycles are loaded
  const activeCycles = cycles.filter((cycle) => cycle.status === "active");
  const defaultCycle =
    activeCycles.length > 0
      ? activeCycles.reduce((shortest, current) => {
          const shortestDuration =
            new Date(shortest.endDate).getTime() -
            new Date(shortest.startDate).getTime();
          const currentDuration =
            new Date(current.endDate).getTime() -
            new Date(current.startDate).getTime();
          return currentDuration < shortestDuration ? current : shortest;
        })
      : null;

  // Initialize cycle filter with longest active cycle on first load only if no URL param exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cycleParam = urlParams.get("cycle");

    // Only auto-select if no URL parameter exists and filter is 'all'
    if (
      defaultCycle &&
      cycleFilter === "all" &&
      cycles.length > 0 &&
      !hasAutoSelected &&
      !cycleParam
    ) {
      setCycleFilter(defaultCycle.id);
      setHasAutoSelected(true);
    }
  }, [defaultCycle?.id, hasAutoSelected]); // Only auto-select once

  // Set default user filter to current user on first load only if no URL param exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user");

    // Only set to current user if no URL parameter exists and filter is empty
    if (
      currentUser &&
      userFilter === "" &&
      !userParam &&
      typeof currentUser === "object" &&
      "id" in currentUser
    ) {
      setUserFilter((currentUser as any).id);
    }
  }, [currentUser]);

  const {
    data: allOkrs = [],
    isLoading,
    refetch,
  } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs"],
  });

  // Helper function to check if a cycle is related to selected cycle
  const isRelatedCycle = (
    okrCycleId: string | null,
    selectedCycleId: string,
  ) => {
    // Always return true for "all cycles" filter
    if (selectedCycleId === "all") return true;

    // Handle null cycleId (OKRs without cycles)
    if (!okrCycleId) return selectedCycleId === "all";

    // Direct match
    if (okrCycleId === selectedCycleId) return true;

    // Find the selected cycle and OKR cycle
    const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
    const okrCycle = cycles.find((c) => c.id === okrCycleId);

    if (!selectedCycle || !okrCycle) return false;

    // If selected cycle is quarterly, include monthly cycles within that quarter
    if (selectedCycle.type === "quarterly" && okrCycle.type === "monthly") {
      const selectedStart = new Date(selectedCycle.startDate);
      const selectedEnd = new Date(selectedCycle.endDate);
      const okrStart = new Date(okrCycle.startDate);
      const okrEnd = new Date(okrCycle.endDate);

      // Check if monthly cycle falls within quarterly cycle period
      return okrStart >= selectedStart && okrEnd <= selectedEnd;
    }

    return false;
  };

  // Fetch teams data for user filtering
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  // Client-side filtering for status, cycle, and user
  const filteredOKRs = allOkrs.filter((okr) => {
    // Status filter
    const statusMatch = statusFilter === "all" || okr.status === statusFilter;

    // Cycle filter with related cycle logic
    const cycleMatch = isRelatedCycle(okr.cycleId, cycleFilter);

    // User filter - show OKRs where:
    // 1. If userFilter is 'all' or empty, show all OKRs
    // 2. The user is the owner of the objective
    // 3. The user is a member/owner of the team that owns the objective
    let userMatch = true;
    if (userFilter && userFilter !== "all" && userFilter !== "") {
      userMatch = false; // Start with false and set to true if conditions are met

      // Check if user is the direct owner
      if (okr.ownerId === userFilter) {
        userMatch = true;
      } else if (okr.teamId) {
        // Check if user is a member or owner of the team
        const team = teams.find((t: any) => t.id === okr.teamId);
        if (team) {
          userMatch =
            team.ownerId === userFilter ||
            (team.members &&
              team.members.some((m: any) => m.userId === userFilter));
        }
      }
    }

    return statusMatch && cycleMatch && userMatch;
  });

  // Auto-expand root nodes that have children in hierarchy view
  useEffect(() => {
    if (
      activeTab === "hierarchy" &&
      filteredOKRs.length > 0 &&
      !hasAutoExpanded
    ) {
      const rootNodesWithChildren = filteredOKRs
        .filter((okr: any) => !okr.parentId) // root nodes
        .filter((okr: any) =>
          filteredOKRs.some((child: any) => child.parentId === okr.id),
        ) // that have children
        .map((okr: any) => okr.id);

      if (rootNodesWithChildren.length > 0) {
        setExpandedNodes(new Set(rootNodesWithChildren));
        setHasAutoExpanded(true);
      }
    }
  }, [activeTab, filteredOKRs.length, hasAutoExpanded]);

  // Reset auto-expand when switching tabs or filters
  useEffect(() => {
    setHasAutoExpanded(false);
    setExpandedNodes(new Set());
  }, [activeTab, cycleFilter, statusFilter]);

  // Mutation for deleting OKR
  const deleteOKRMutation = useMutation({
    mutationFn: async (okrId: string) => {
      const response = await fetch(`/api/objectives/${okrId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete OKR");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Goal berhasil dihapus",
        description:
          "Goal beserta semua ukuran keberhasilan, inisiatif, dan tugas terkait telah dihapus secara permanen.",
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

  // Mutation for deleting Key Result
  const deleteKeyResultMutation = useMutation({
    mutationFn: async (keyResultId: string) => {
      const response = await fetch(`/api/key-results/${keyResultId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete key result");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Angka Target berhasil dihapus",
        description: "Data telah dihapus secara permanen",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDeleteKeyResultModal({ open: false });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus Angka Target",
        variant: "destructive",
      });
    },
  });

  // Mutation for duplicating OKR
  const duplicateOKRMutation = useMutation({
    mutationFn: async (okr: OKRWithKeyResults) => {
      // Create new objective
      const response = await fetch("/api/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${okr.title} (Copy)`,
          description: okr.description,
          owner: okr.owner,
          ownerType: okr.ownerType,
          ownerId: okr.ownerId,
          status: "not_started",
          cycleId: okr.cycleId,
          teamId: okr.teamId,
          parentId: okr.parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create objective");
      }

      const newObjective = await response.json();

      // Create key results for the new objective
      for (const kr of okr.keyResults) {
        const krResponse = await fetch("/api/key-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: kr.title,
            description: kr.description,
            currentValue: "0", // Reset progress
            targetValue: kr.targetValue,
            baseValue: kr.baseValue,
            unit: kr.unit,
            keyResultType: kr.keyResultType,
            status: "not_started",
            objectiveId: newObjective.id,
          }),
        });

        if (!krResponse.ok) {
          throw new Error("Failed to create key result");
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
        description:
          error.message || "Terjadi kesalahan saat menduplikasi OKR.",
        variant: "destructive",
      });
    },
  });

  const handleEditProgress = (keyResult: KeyResult) => {
    setEditProgressModal({ open: true, keyResult });
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditKeyResultModal({ open: true, keyResult });
  };

  const handleDeleteKeyResult = (keyResult: KeyResult) => {
    setDeleteKeyResultModal({ open: true, keyResult });
  };

  // Key result click now navigates to dedicated page via Link in OKRCard

  const handleDuplicateOKR = (okr: OKRWithKeyResults) => {
    duplicateOKRMutation.mutate(okr);
  };

  const handleEditObjective = (okr: OKRWithKeyResults) => {
    setEditObjectiveModal({ open: true, objective: okr });
  };

  const handleDeleteOKR = async (okrId: string) => {
    try {
      // Get cascade deletion info
      const response = await fetch(`/api/objectives/${okrId}/cascade-info`);
      const data = await response.json();

      setDeleteConfirmModal({
        open: true,
        okrId,
        okrTitle: data.objective.title,
        keyResultsCount: data.counts.keyResults,
        initiativesCount: data.counts.initiatives,
        tasksCount: data.counts.tasks,
      });
    } catch (error) {
      // Fallback to basic deletion if cascade info fails
      const okrToDelete = filteredOKRs.find((okr) => okr.id === okrId);
      setDeleteConfirmModal({
        open: true,
        okrId,
        okrTitle: okrToDelete?.title || "OKR ini",
        keyResultsCount: 0,
        initiativesCount: 0,
        tasksCount: 0,
      });
    }
  };

  const confirmDeleteOKR = () => {
    if (deleteConfirmModal.okrId) {
      deleteOKRMutation.mutate(deleteConfirmModal.okrId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 w-full">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center">
              <div>
                <h1
                  className="text-lg sm:text-2xl font-semibold text-gray-900"
                  data-tour="dashboard-header"
                >
                  Goals
                </h1>
                <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-base">
                  Kelola objective, angka target, dan inisiatif Anda
                </p>
              </div>
              {currentUser && (currentUser as any).id ? (
                <DashboardHelpBubble
                  userId={(currentUser as any).id as string}
                />
              ) : null}
            </div>
            <div className="flex-shrink-0 flex gap-2">
              <TourLauncher />
              <CreateOKRButton data-tour="create-okr-button" />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full">
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm h-8 sm:h-10">
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
                <SelectItem value="partially_achieved">
                  Partially Achieved
                </SelectItem>
                <SelectItem value="not_achieved">Not Achieved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cycleFilter} onValueChange={handleCycleFilterChange}>
              <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Pilih Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cycle</SelectItem>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SearchableUserSelect
              users={users}
              value={userFilter}
              onValueChange={handleUserFilterChange}
              placeholder="Pilih User"
              emptyMessage="Tidak ada user ditemukan"
              allowAll={true}
              className="w-full sm:w-[150px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview okrs={filteredOKRs} isLoading={isLoading} />

      {/* View Tabs */}
      <div className="mt-4 sm:mt-6 w-full">
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("list")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "list"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                <span>List View</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("hierarchy")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "hierarchy"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4" />
                <span>Hierarchy View</span>
              </div>
            </button>
          </div>

          {/* Hierarchy Controls */}
        </div>
      </div>

      {/* Goals Content */}
      <div className="mt-4 sm:mt-6 w-full space-y-6">
        {isLoading ? (
          <OKRGridSkeleton count={6} />
        ) : filteredOKRs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada Goal ditemukan
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== "all"
                ? "Tidak ada Goal yang sesuai dengan filter Anda. Coba sesuaikan kriteria pencarian."
                : "Mulai dengan membuat tujuan dan ukuran keberhasilan pertama Anda."}
            </p>
            <CreateOKRButton />
          </div>
        ) : activeTab === "list" ? (
          // List View
          filteredOKRs.map((okr, index) => {
            // Find the cycle for this OKR to get start and end date
            const cycle = cycles.find((c) => c.id === okr.cycleId);
            return (
              <OKRCard
                key={okr.id}
                okr={okr}
                onEditProgress={handleEditProgress}
                onEditKeyResult={handleEditKeyResult}
                onDeleteKeyResult={handleDeleteKeyResult}
                onRefresh={refetch}
                onDuplicate={handleDuplicateOKR}
                onDelete={handleDeleteOKR}
                onEdit={handleEditObjective}
                cycleStartDate={cycle?.startDate}
                cycleEndDate={cycle?.endDate}
                cycle={cycle}
                index={index}
                users={users}
              />
            );
          })
        ) : (
          // Hierarchy View with D3 Tree
          <DashboardD3Tree
            okrs={filteredOKRs}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
            onNodeClick={(okr) => {
              // Navigate to objective detail or show edit modal
              // handleEditObjective(okr);
            }}
          />
        )}
      </div>

      {/* Modals */}

      <EditProgressModal
        open={editProgressModal.open}
        onOpenChange={(open) =>
          setEditProgressModal({
            open,
            keyResult: open ? editProgressModal.keyResult : undefined,
          })
        }
        keyResult={editProgressModal.keyResult}
        onSuccess={refetch}
      />

      <EditKeyResultModal
        open={editKeyResultModal.open}
        onOpenChange={(open) =>
          setEditKeyResultModal({
            open,
            keyResult: open ? editKeyResultModal.keyResult : undefined,
          })
        }
        keyResult={editKeyResultModal.keyResult}
        objectiveId={editKeyResultModal.keyResult?.objectiveId}
      />

      <EditObjectiveModal
        open={editObjectiveModal.open}
        onOpenChange={(open) =>
          setEditObjectiveModal({
            open,
            objective: open ? editObjectiveModal.objective : undefined,
          })
        }
        objective={editObjectiveModal.objective}
      />

      {/* Cascade Delete Confirmation Modal */}
      <CascadeDeleteConfirmationModal
        open={deleteConfirmModal.open}
        onOpenChange={(open: boolean) => setDeleteConfirmModal({ open })}
        onConfirm={confirmDeleteOKR}
        objectiveTitle={deleteConfirmModal.okrTitle || ""}
        keyResultsCount={deleteConfirmModal.keyResultsCount || 0}
        initiativesCount={deleteConfirmModal.initiativesCount || 0}
        tasksCount={deleteConfirmModal.tasksCount || 0}
      />

      {/* Delete Key Result Confirmation Modal */}
      <AlertDialog
        open={deleteKeyResultModal.open}
        onOpenChange={(open) => setDeleteKeyResultModal({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Angka Target</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus angka target "
              {deleteKeyResultModal.keyResult?.title}"? Semua data terkait
              termasuk rencana dan tugas akan ikut terhapus secara permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteKeyResultModal.keyResult) {
                  deleteKeyResultMutation.mutate(
                    deleteKeyResultModal.keyResult.id,
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Help Bubble */}
      <AIHelpBubble
        context="dashboard"
        data={{
          totalOkrs: filteredOKRs.length,
          statusFilter,
          cycleFilter,
        }}
        position="bottom-right"
      />
    </div>
  );
}
