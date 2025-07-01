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
import { Plus, Target, CheckSquare, Building2, Trophy } from "lucide-react";
import MyTasks from "@/components/my-tasks";
import Initiatives from "@/components/initiatives";
import { useAuth } from "@/hooks/useAuth";

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
  const [activeTab, setActiveTab] = useState<string>("objectives");

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

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch filtered tasks based on current user filter
  const showAllUsers = userFilter === 'all' || userFilter === '' || !userFilter;
  const targetUserId = showAllUsers ? null : userFilter;
  
  const { data: filteredTasks = [] } = useQuery<any[]>({
    queryKey: showAllUsers ? ['/api/tasks'] : [`/api/users/${targetUserId}/tasks`],
    enabled: showAllUsers || !!targetUserId,
  });

  // Calculate filtered task notifications that respect current filters
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueAndDueTodayCount = filteredTasks.filter((task: any) => {
    if (task.status === 'completed') return false;
    
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Include overdue tasks (due before today) and tasks due today
    const isUrgent = dueDate <= today;
    
    return isUrgent;
  }).length;

  const hasNotifications = overdueAndDueTodayCount > 0;

  // Initialize tab and filters from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Initialize tab
    const tabParam = urlParams.get('tab');
    if (tabParam && ['objectives', 'initiatives', 'my-tasks'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Initialize filters
    const statusParam = urlParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    
    const cycleParam = urlParams.get('cycle');
    if (cycleParam) {
      setCycleFilter(cycleParam);
      setHasAutoSelected(true); // Prevent auto-selection when loading from URL
    }
    
    const userParam = urlParams.get('user');
    if (userParam) {
      setUserFilter(userParam);
    }
  }, []);

  // Update URL when tab or filters change
  const updateURL = (updates: { tab?: string; status?: string; cycle?: string; user?: string }) => {
    const url = new URL(window.location.href);
    
    if (updates.tab !== undefined) url.searchParams.set('tab', updates.tab);
    if (updates.status !== undefined) {
      if (updates.status === 'all') {
        url.searchParams.delete('status');
      } else {
        url.searchParams.set('status', updates.status);
      }
    }
    if (updates.cycle !== undefined) {
      if (updates.cycle === 'all') {
        url.searchParams.delete('cycle');
      } else {
        url.searchParams.set('cycle', updates.cycle);
      }
    }
    if (updates.user !== undefined) {
      if (updates.user === 'all' || updates.user === '') {
        url.searchParams.delete('user');
      } else {
        url.searchParams.set('user', updates.user);
      }
    }
    
    window.history.replaceState({}, '', url.toString());
  };

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    updateURL({ tab: newTab });
  };

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
    setUserFilter(newUser);
    updateURL({ user: newUser });
  };

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

  // Set default user filter to current user on first load
  useEffect(() => {
    if (currentUser && userFilter === '' && typeof currentUser === 'object' && 'id' in currentUser) {
      setUserFilter((currentUser as any).id);
    }
  }, [currentUser]);

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

  // Fetch teams data for user filtering
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['/api/teams'],
  });

  // Client-side filtering for status, cycle, and user
  const okrs = allOkrs.filter(okr => {
    // Status filter
    const statusMatch = statusFilter === 'all' || okr.status === statusFilter;
    
    // Cycle filter with related cycle logic
    const cycleMatch = isRelatedCycle(okr.cycleId, cycleFilter);
    
    // User filter - show OKRs where:
    // 1. The user is the owner of the objective
    // 2. The user is a member/owner of the team that owns the objective
    let userMatch = true;
    if (userFilter && userFilter !== 'all' && userFilter !== '') {
      userMatch = false; // Start with false and set to true if conditions are met
      
      // Check if user is the direct owner
      if (okr.ownerId === userFilter) {
        userMatch = true;
      } else if (okr.teamId) {
        // Check if user is a member or owner of the team
        const team = teams.find((t: any) => t.id === okr.teamId);
        if (team) {
          userMatch = team.ownerId === userFilter || 
                     (team.members && team.members.some((m: any) => m.userId === userFilter));
        }
      }
    }
    
    return statusMatch && cycleMatch && userMatch;
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
    <div className="p-3 sm:p-6 overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 w-full">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">OKR Dashboard</h1>
              <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-base">Track your objectives and key results</p>
            </div>
            <div className="flex-shrink-0">
              <CreateOKRButton />
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
                <SelectItem value="partially_achieved">Partially Achieved</SelectItem>
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
                {cycles.map(cycle => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={handleUserFilterChange}>
              <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Pilih User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua User</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview okrs={okrs} isLoading={isLoading} />
      
      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4 sm:mt-6 w-full">
        <TabsList className="grid w-full grid-cols-3 h-9 sm:h-12">
          <TabsTrigger value="objectives" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Objectives</span>
            <span className="sm:hidden">OKRs</span>
          </TabsTrigger>
          <TabsTrigger value="initiatives" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Initiatives</span>
            <span className="sm:hidden">Init</span>
          </TabsTrigger>
          <TabsTrigger value="my-tasks" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">My Tasks</span>
            <span className="sm:hidden">Tasks</span>
            {hasNotifications && (
              <span className="ml-0.5 sm:ml-1 bg-red-500 text-white text-xs rounded-full px-1 sm:px-1.5 py-0.5 min-w-[16px] sm:min-w-[18px] h-3.5 sm:h-4 flex items-center justify-center">
                {overdueAndDueTodayCount}
              </span>
            )}
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
        
        <TabsContent value="initiatives" className="mt-6">
          <Initiatives 
            userFilter={userFilter} 
            filteredKeyResultIds={okrs.flatMap(okr => okr.keyResults.map(kr => kr.id))}
          />
        </TabsContent>
        
        <TabsContent value="my-tasks" className="mt-6">
          <MyTasks 
            filteredKeyResultIds={okrs.flatMap(okr => okr.keyResults.map(kr => kr.id))}
            userFilter={userFilter}
          />
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