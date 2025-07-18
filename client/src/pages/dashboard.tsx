import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatsOverview from "@/components/stats-overview";
import GoalCard from "@/components/goal-card";
import { CreateGoalButton } from "@/components/goal-form-modal";
import EditProgressModal from "@/components/edit-progress-modal";
import EditKeyResultModal from "@/components/edit-key-result-modal";
import { CascadeDeleteConfirmationModal } from "@/components/cascade-delete-confirmation-modal";
import EditObjectiveModal from "@/components/edit-objective-modal";
import { GoalGridSkeleton } from "@/components/skeletons/goal-card-skeleton";
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
import { MultiSelectCycle } from "@/components/ui/multi-select-cycle";
import {
  Plus,
  Target,
  Trophy,
  List,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Network,
  ArrowLeft,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import DashboardD3Tree from "@/components/dashboard-d3-tree";

import { useLocation } from "wouter";
import type { GoalWithKeyResults, KeyResult, Cycle, User } from "@shared/schema";

// Function to find the closest cycle to today's date
function findClosestCycle(cycles: Cycle[]): string {
  if (!cycles || cycles.length === 0) return "all";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison
  
  let closestCycle = cycles[0];
  let smallestDifference = Infinity;
  
  for (const cycle of cycles) {
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    
    // Check if today is within the cycle
    if (today >= startDate && today <= endDate) {
      return cycle.id; // Return immediately if today is within a cycle
    }
    
    // Calculate the minimum distance to the cycle (either to start or end)
    const distanceToStart = Math.abs(today.getTime() - startDate.getTime());
    const distanceToEnd = Math.abs(today.getTime() - endDate.getTime());
    const minDistance = Math.min(distanceToStart, distanceToEnd);
    
    if (minDistance < smallestDifference) {
      smallestDifference = minDistance;
      closestCycle = cycle;
    }
  }
  
  return closestCycle.id;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [location, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string>("all");
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
    goalId?: string;
    goalTitle?: string;
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
    objective?: GoalWithKeyResults;
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
      setCycleFilter(cycleParam.split(',').filter(Boolean));
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
  const handleCycleFilterChange = (selectedCycles: string[]) => {
    setCycleFilter(selectedCycles);
    setHasAutoSelected(true);
    updateURL({ cycle: selectedCycles.join(',') });
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
  // Find the closest cycle to today's date
  const closestCycleId = findClosestCycle(cycles);
  const defaultCycle = cycles.find(cycle => cycle.id === closestCycleId) || null;

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
    data: allGoals = [],
    isLoading,
    refetch,
  } = useQuery<GoalWithKeyResults[]>({
    queryKey: ["/api/okrs"],
  });

  // Initialize cycle filter with closest cycle on first load only if no URL param exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cycleParam = urlParams.get("cycle");

    // Only auto-select if no URL parameter exists and filter is empty
    if (
      cycleFilter.length === 0 &&
      cycles.length > 0 &&
      !hasAutoSelected &&
      !cycleParam &&
      allGoals.length > 0
    ) {
      // Check if there are goals with cycles, prioritize those cycles
      const goalsWithCycles = allGoals.filter(goal => goal.cycleId);
      
      if (goalsWithCycles.length > 0) {
        // Find the cycle used by the first goal
        const goalCycle = cycles.find(c => c.id === goalsWithCycles[0].cycleId);
        if (goalCycle) {
          setCycleFilter([goalCycle.id]);
          setHasAutoSelected(true);
          return;
        }
      }
      
      // Fallback to closest cycle if no goals have cycles
      if (defaultCycle) {
        setCycleFilter([defaultCycle.id]);
        setHasAutoSelected(true);
      }
    }
  }, [defaultCycle?.id, hasAutoSelected, allGoals.length, cycles.length, cycleFilter.length]); // Include allGoals in dependency

  // Helper function to check if a cycle is related to selected cycles
  const isRelatedCycle = (
    goalCycleId: string | null,
    selectedCycleIds: string[],
  ) => {
    // Always return true for empty filter (show all)
    if (selectedCycleIds.length === 0) return true;

    // Handle null cycleId (Goals without cycles)
    if (!goalCycleId) return false;

    // Check if goal cycle is in the selected cycles
    if (selectedCycleIds.includes(goalCycleId)) return true;

    // Check for hierarchical relationships
    for (const selectedCycleId of selectedCycleIds) {
      const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
      const goalCycle = cycles.find((c) => c.id === goalCycleId);

      if (!selectedCycle || !goalCycle) continue;

      // If selected cycle is quarterly, include monthly cycles within that quarter
      if (selectedCycle.type === "quarterly" && goalCycle.type === "monthly") {
        const selectedStart = new Date(selectedCycle.startDate);
        const selectedEnd = new Date(selectedCycle.endDate);
        const goalStart = new Date(goalCycle.startDate);
        const goalEnd = new Date(goalCycle.endDate);

        // Check if monthly cycle falls within quarterly cycle period
        if (goalStart >= selectedStart && goalEnd <= selectedEnd) {
          return true;
        }
      }
    }

    return false;
  };

  // Fetch teams data for user filtering
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  // Client-side filtering for status, cycle, and user
  const filteredGoals = allGoals.filter((goal) => {
    // Status filter
    const statusMatch = statusFilter === "all" || goal.status === statusFilter;

    // Cycle filter with related cycle logic
    const cycleMatch = isRelatedCycle(goal.cycleId, cycleFilter);



    // User filter - show Goals where:
    // 1. If userFilter is 'all' or empty, show all Goals
    // 2. The user is the owner of the objective
    // 3. The user is a member/owner of the team that owns the objective
    let userMatch = true;
    if (userFilter && userFilter !== "all" && userFilter !== "") {
      userMatch = false; // Start with false and set to true if conditions are met

      // Check if user is the direct owner
      if (goal.ownerId === userFilter) {
        userMatch = true;
      } else if (goal.teamId) {
        // Check if user is a member or owner of the team
        const team = teams.find((t: any) => t.id === goal.teamId);
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
      filteredGoals.length > 0 &&
      !hasAutoExpanded
    ) {
      const rootNodesWithChildren = filteredGoals
        .filter((goal: any) => !goal.parentId) // root nodes
        .filter((goal: any) =>
          filteredGoals.some((child: any) => child.parentId === goal.id),
        ) // that have children
        .map((goal: any) => goal.id);

      if (rootNodesWithChildren.length > 0) {
        setExpandedNodes(new Set(rootNodesWithChildren));
        setHasAutoExpanded(true);
      }
    }
  }, [activeTab, filteredGoals.length, hasAutoExpanded]);

  // Reset auto-expand when switching tabs or filters
  useEffect(() => {
    setHasAutoExpanded(false);
    setExpandedNodes(new Set());
  }, [activeTab, cycleFilter, statusFilter]);

  // Mutation for deleting Goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/objectives/${goalId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete Goal");
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
        title: "Gagal menghapus Goal",
        description: error.message || "Terjadi kesalahan saat menghapus Goal.",
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

  // Mutation for duplicating Goal
  const duplicateGoalMutation = useMutation({
    mutationFn: async (goal: GoalWithKeyResults) => {
      // Create new objective
      const response = await fetch("/api/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${goal.title} (Copy)`,
          description: goal.description,
          owner: goal.owner,
          ownerType: goal.ownerType,
          ownerId: goal.ownerId,
          status: "not_started",
          cycleId: goal.cycleId,
          teamId: goal.teamId,
          parentId: goal.parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create objective");
      }

      const newObjective = await response.json();

      // Create key results for the new objective
      for (const kr of goal.keyResults) {
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
        title: "Goal berhasil diduplikasi",
        description: "Goal baru telah dibuat dengan progress direset ke 0.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Gagal menduplikasi Goal",
        description:
          error.message || "Terjadi kesalahan saat menduplikasi Goal.",
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

  // Key result click now navigates to dedicated page via Link in GoalCard

  const handleDuplicateGoal = (goal: GoalWithKeyResults) => {
    duplicateGoalMutation.mutate(goal);
  };

  const handleEditObjective = (goal: GoalWithKeyResults) => {
    setEditObjectiveModal({ open: true, objective: goal });
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      // Get cascade deletion info
      const response = await fetch(`/api/objectives/${goalId}/cascade-info`);
      const data = await response.json();

      setDeleteConfirmModal({
        open: true,
        goalId: goalId,
        goalTitle: data.objective.title,
        keyResultsCount: data.counts.keyResults,
        initiativesCount: data.counts.initiatives,
        tasksCount: data.counts.tasks,
      });
    } catch (error) {
      // Fallback to basic deletion if cascade info fails
      const goalToDelete = filteredGoals.find((goal) => goal.id === goalId);
      setDeleteConfirmModal({
        open: true,
        goalId: goalId,
        goalTitle: goalToDelete?.title || "Goal ini",
        keyResultsCount: 0,
        initiativesCount: 0,
        tasksCount: 0,
      });
    }
  };

  const confirmDeleteGoal = () => {
    if (deleteConfirmModal.goalId) {
      deleteGoalMutation.mutate(deleteConfirmModal.goalId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 w-full">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900"
                  data-tour="dashboard-header"
                >
                  Goals
                </h1>
                <p className="text-gray-600 mt-1">
                  Kelola objective, angka target, dan inisiatif Anda
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex gap-2">
              <CreateGoalButton data-tour="add-goal" />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full" data-tour="goals-filter">
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

            <MultiSelectCycle
              cycles={cycles}
              selectedCycles={cycleFilter}
              onSelectionChange={handleCycleFilterChange}
              placeholder="Pilih Siklus"
              className="w-full sm:w-[150px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10"
            />

            <SearchableUserSelect
              users={users?.filter(user => user.isActive === true) || []}
              value={userFilter}
              onValueChange={handleUserFilterChange}
              placeholder="Pilih User"
              emptyMessage="Tidak ada user ditemukan"
              allowAll={true}
              defaultValue="all"
              className="w-full sm:w-[150px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div data-tour="goals-overview-card">
        <StatsOverview goals={filteredGoals} isLoading={isLoading} />
      </div>

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
              data-tour="goals-list-view"
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
              data-tour="goals-hierarchy-view"
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
          <GoalGridSkeleton count={6} />
        ) : filteredGoals.length === 0 ? (
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
            <CreateGoalButton />
          </div>
        ) : activeTab === "list" ? (
          // List View
          filteredGoals.map((goal, index) => {
            // Find the cycle for this Goal to get start and end date
            const cycle = cycles.find((c) => c.id === goal.cycleId);
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEditProgress={handleEditProgress}
                onEditKeyResult={handleEditKeyResult}
                onDeleteKeyResult={handleDeleteKeyResult}
                onRefresh={refetch}
                onDuplicate={handleDuplicateGoal}
                onDelete={handleDeleteGoal}
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
            goals={filteredGoals}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
            onNodeClick={(goal) => {
              // Navigate to objective detail or show edit modal
              // handleEditObjective(goal);
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
        onConfirm={confirmDeleteGoal}
        objectiveTitle={deleteConfirmModal.goalTitle || ""}
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


    </div>
  );
}
