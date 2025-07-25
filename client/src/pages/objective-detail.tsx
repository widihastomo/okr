import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  ArrowLeft,
  Edit,
  Calendar,
  User as UserIcon,
  Clock,
  Plus,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  MoreVertical,
  MoreHorizontal,
  Building,
  Building2,
  ClipboardList,
  CheckSquare,
  Trash2,
  FileText,
  Eye,
  MoveUp,
  MoveDown,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Rocket,
  Trophy,
  Zap,
  Star,
  Flag,
  Sparkles,
  HelpCircle,
  Check,
  Minus,
} from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import EditKeyResultModal from "@/components/edit-key-result-modal";
import EditObjectiveModal from "@/components/edit-objective-modal";
import InitiativeModal from "@/components/initiative-modal";
import InitiativeFormModal from "@/components/initiative-form-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import { ObjectiveDetailSkeleton } from "@/components/skeletons/detail-page-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";
import { KeyResultModal } from "@/components/goal-form-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import TaskModal from "@/components/task-modal";

import ObjectiveOverviewCard from "@/components/objective-overview-card";
import ObjectiveTimeline from "@/components/objective-timeline";
import ActivityLogCard from "@/components/activity-log-card";
import type {
  OKRWithKeyResults,
  KeyResult,
  Initiative,
  Task,
  Cycle,
  Team,
  User,
} from "@shared/schema";
import {
  calculateIdealProgress,
  getProgressStatus,
  getStatusColor,
} from "@shared/status-helper";

// Type for tasks with initiative info
type TaskWithInitiative = Task & {
  initiative?: {
    id: string;
    title: string;
  };
};

// Helper functions from daily-focus for task status and priority
const getTaskStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTaskStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Selesai";
    case "in_progress":
      return "Sedang Berjalan";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "Belum Dimulai";
  }
};

const getTaskPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTaskPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Tinggi";
    case "medium":
      return "Sedang";
    case "low":
      return "Rendah";
    default:
      return "Sedang";
  }
};

// Key Result Form Schema
const keyResultSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  keyResultType: z.enum([
    "increase_to",
    "decrease_to",
    "should_stay_above",
    "should_stay_below",
    "achieve_or_not",
  ]),
  baseValue: z.string().optional(),
  targetValue: z.string().optional(),
  currentValue: z.string().optional(),
  unit: z.enum(["number", "percentage", "currency"]),
  assignedTo: z.string().optional(),
});

type KeyResultFormData = z.infer<typeof keyResultSchema>;

// Mission Card Component for Gamification
interface MissionCardProps {
  missions: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    isCompleted: boolean;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  className?: string;
}

function MissionCard({ missions, className }: MissionCardProps) {
  const completedMissions = missions.filter(m => m.isCompleted).length;
  const totalMissions = missions.length;
  
  // Auto-expand when missions are not completed
  const shouldAutoExpand = completedMissions < totalMissions;
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Keep collapsed by default - no auto-expansion
  
  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
        <CardHeader 
          className="pb-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Rocket className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-bold text-orange-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Misi Aktivasi Goal
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                  {completedMissions}/{totalMissions}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <Progress 
                  value={(completedMissions / totalMissions) * 100} 
                  className="h-1.5 bg-orange-100 flex-1"
                />
                <span className="text-xs text-orange-600 font-medium">
                  {Math.round((completedMissions / totalMissions) * 100)}%
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-orange-600 hover:bg-orange-100 p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-3 pt-0">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  mission.isCompleted 
                    ? "bg-green-50 border-green-200 opacity-75" 
                    : "bg-white border-orange-200 hover:border-orange-300 cursor-pointer"
                }`}
                onClick={() => !mission.isCompleted && mission.action()}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full flex-shrink-0 ${
                    mission.isCompleted 
                      ? "bg-green-100 text-green-600" 
                      : "bg-orange-100 text-orange-600"
                  }`}>
                    {mission.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      mission.icon
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${
                        mission.isCompleted ? "text-green-700 line-through" : "text-gray-800"
                      }`}>
                        {mission.title}
                      </h4>
                      <Badge 
                        variant={mission.difficulty === 'easy' ? 'secondary' : mission.difficulty === 'medium' ? 'default' : 'destructive'}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {mission.points} poin
                      </Badge>
                    </div>
                    <p className={`text-xs ${
                      mission.isCompleted ? "text-green-600" : "text-gray-600"
                    }`}>
                      {mission.description}
                    </p>
                  </div>
                  
                  {!mission.isCompleted && (
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        mission.action();
                      }}
                    >
                      Mulai
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Completion Celebration */}
            {completedMissions === totalMissions && (
              <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300 text-center">
                <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                <h3 className="font-semibold text-yellow-800 text-sm mb-1">Selamat!</h3>
                <p className="text-xs text-yellow-700">
                  Semua misi selesai! Goal siap dipantau.
                </p>
              </div>
            )}
          </CardContent>
        )}
        
        {/* Compact Summary when collapsed */}
        {!isExpanded && (
          <CardContent className="pt-0 pb-3">
            <div className="flex justify-between items-center text-xs text-orange-600">
              <span>
                {totalMissions - completedMissions} misi tersisa
              </span>
              <span className="text-orange-500">
                Klik untuk melihat detail
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function GoalDetail() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [checkInModal, setCheckInModal] = useState<{
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
  const [addKeyResultModal, setAddKeyResultModal] = useState<{ open: boolean }>(
    {
      open: false,
    },
  );
  const [deleteKeyResultModal, setDeleteKeyResultModal] = useState<{
    open: boolean;
    keyResult?: KeyResult;
  }>({
    open: false,
  });
  const [addInitiativeModal, setAddInitiativeModal] = useState<{
    open: boolean;
  }>({
    open: false,
  });
  const [editObjectiveModal, setEditObjectiveModal] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);

  const [showInitiativeFormModal, setShowInitiativeFormModal] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [deletingInitiative, setDeletingInitiative] = useState<Initiative | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteObjectiveModal, setDeleteObjectiveModal] = useState(false);
  const queryClient = useQueryClient();
  const [tourStep, setTourStep] = useState<number>(0);
  const [showTour, setShowTour] = useState(false);
  const [tourForceUpdate, setTourForceUpdate] = useState(0);



  // Check for highlight parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split("?")[1] || "");
    if (urlParams.get("highlight") === "keyresults") {
      setShouldHighlight(true);
      // Remove highlight after animation
      setTimeout(() => setShouldHighlight(false), 3000);
    }
    
    // Prevent auto-scroll on page load by resetting scroll position
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, [location]);

  // Fetch goal data
  const { data: goal, isLoading } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/objectives/${id}`],
    enabled: !!id,
  });

  // Fetch cycle data
  const { data: cycle, error: cycleError } = useQuery<Cycle>({
    queryKey: [`/api/cycles/${goal?.cycleId}`],
    enabled: !!goal?.cycleId,
  });

  // Debug logging for cycle data (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (goal?.cycleId) {
        console.log("🔍 Fetching cycle data for ID:", goal.cycleId);
      }
      if (cycle) {
        console.log("✅ Cycle data loaded successfully:", cycle);
      }
      if (cycleError) {
        console.error("❌ Error loading cycle data:", cycleError);
      }
    }
  }, [goal?.cycleId, cycle, cycleError]);

  // Fetch owner data
  const { data: owner } = useQuery<User | Team>({
    queryKey:
      goal?.ownerType === "user" || goal?.ownerType === "individual"
        ? [`/api/users/${goal?.ownerId}`]
        : [`/api/teams/${goal?.ownerId}`],
    enabled: !!goal?.ownerId && !!goal?.ownerType,
  });

  // Fetch parent objective data
  const { data: parentObjective } = useQuery<GoalWithKeyResults>({
    queryKey: [`/api/objectives/${goal?.parentId}`],
    enabled: !!goal?.parentId,
  });

  // Separate owner data by type
  const userOwner =
    goal?.ownerType === "user" || goal?.ownerType === "individual"
      ? (owner as User)
      : undefined;
  const teamOwner = goal?.ownerType === "team" ? (owner as Team) : undefined;

  // Fetch inisiatif for this goal
  const { data: inisiatif = [] } = useQuery<Initiative[]>({
    queryKey: [`/api/initiatives/objective/${id}`],
    enabled: !!id,
  });

  // Fetch tugas for inisiatif
  const { data: rawTugas = [] } = useQuery<TaskWithInitiative[]>({
    queryKey: [`/api/tasks/objective/${id}`],
    enabled: !!id,
  });

  // Sort tasks by due date and priority
  const tugas = useMemo(() => {
    return [...rawTugas].sort((a, b) => {
      // First, sort by due date (earliest first, null dates last)
      if (a.dueDate && b.dueDate) {
        const dueDateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dueDateComparison !== 0) return dueDateComparison;
      } else if (a.dueDate && !b.dueDate) {
        return -1; // a has date, b doesn't - a comes first
      } else if (!a.dueDate && b.dueDate) {
        return 1; // b has date, a doesn't - b comes first
      }
      
      // If due dates are same or both null, sort by priority
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
      
      return aPriority - bPriority;
    });
  }, [rawTugas]);

  // Fetch users for name display
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Helper function to get user name
  const getUserName = (userId: string): string => {
    if (!users) return "Pengguna";
    const user = users.find((u: any) => u.id === userId);
    
    // Use consolidated name field
    if (user?.name && user.name.trim() !== "") {
      return user.name.trim();
    }
    
    // Fallback to email username
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return "Pengguna";
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (userId: string): string => {
    if (!users || !userId) return "?";
    const user = users.find((u: any) => u.id === userId);

    // Use the consolidated name field
    if (user?.name && user.name.trim() !== "") {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        // Get first letter of first name and first letter of last name
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
      } else {
        // Just use first letter of single name
        return nameParts[0].charAt(0).toUpperCase();
      }
    }

    // Fallback to email first letter
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  // Helper function to get user profile image URL
  const getUserProfileImage = (userId: string): string | undefined => {
    if (!userId || !users) return undefined;
    const user = users.find((u: any) => u.id === userId);
    return user?.profileImageUrl || undefined;
  };

  // Calculate days remaining based on cycle end date
  const calculateDaysRemaining = () => {
    const today = new Date();

    if (cycle?.endDate) {
      const endDate = new Date(cycle.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    return undefined;
  };

  const daysRemaining = calculateDaysRemaining();

  // Mutation for creating new Key Result
  const createKeyResultMutation = useMutation({
    mutationFn: async (keyResultData: KeyResultFormData) => {
      const response = await apiRequest("POST", "/api/key-results", {
        ...keyResultData,
        objectiveId: id,
        currentValue: keyResultData.currentValue || keyResultData.baseValue,
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Angka Target berhasil dibuat",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/objectives/${id}`] });
      setAddKeyResultModal({ open: false });
      
      // Switch to key-results tab after successful creation

      
      // Reset form handled by KeyResultModal
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat Angka Target",
        variant: "destructive",
      });
    },
  });

  const handleCreateKeyResult = (data: any) => {
    // Ensure unit has a valid default value and proper type conversion
    // Handle assignedTo field: if "unassigned", use goal owner ID or null
    let assignedToValue = data.assignedTo;
    if (assignedToValue === "unassigned") {
      assignedToValue = userOwner?.id || null;
    }
    
    const processedData = {
      title: data.title,
      description: data.description,
      keyResultType: data.keyResultType,
      baseValue: data.baseValue,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      unit: data.unit || "number",
      assignedTo: assignedToValue,
      objectiveId: goal?.id || ""
    };
    createKeyResultMutation.mutate(processedData);
  };



  // Mutation for deleting key result
  const deleteKeyResultMutation = useMutation({
    mutationFn: async (keyResultId: string) => {
      const response = await apiRequest("DELETE", `/api/key-results/${keyResultId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Angka Target berhasil dihapus",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/objectives/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus Angka Target",
        variant: "destructive",
      });
    },
  });

  // Delete initiative mutation
  const deleteInitiativeMutation = useMutation({
    mutationFn: async (initiativeId: string) => {
      return await apiRequest("DELETE", `/api/initiatives/${initiativeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Inisiatif berhasil dihapus",
        description: "Inisiatif telah dihapus secara permanen.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Invalidate all initiative-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiative-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives/objective"] });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/objective/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/objectives/${id}`] });
      }
      
      setDeletingInitiative(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus inisiatif",
        variant: "destructive",
      });
    },
  });

  const handleDeleteKeyResult = (keyResult: KeyResult) => {
    setDeleteKeyResultModal({ open: true, keyResult });
  };

  const confirmDeleteKeyResult = () => {
    if (deleteKeyResultModal.keyResult) {
      deleteKeyResultMutation.mutate(deleteKeyResultModal.keyResult.id);
      setDeleteKeyResultModal({ open: false });
    }
  };

  const confirmDeleteInitiative = () => {
    if (deletingInitiative) {
      deleteInitiativeMutation.mutate(deletingInitiative.id);
    }
  };

  const handleDeleteObjective = () => {
    setDeleteObjectiveModal(true);
  };

  // Handle duplicate objective
  const handleDuplicateObjective = () => {
    if (goal?.id) {
      duplicateObjectiveMutation.mutate(goal.id);
    }
  };

  const confirmDeleteObjective = () => {
    setDeleteObjectiveModal(false);
    
    if (id) {
      // Show loading toast
      toast({
        title: "Menghapus goal...",
        description: "Goal sedang dihapus...",
        className: "border-orange-200 bg-orange-50 text-orange-800",
      });
      
      // Redirect immediately, then start deletion in background
      setLocation("/");
      
      // Start deletion process in background
      deleteObjectiveMutation.mutate(id);
    }
  };

  // Create initiative with success metrics mutation
  const createInitiativeWithMetricsMutation = useMutation({
    mutationFn: async (data: { initiative: any; successMetrics: any[] }) => {
      const response = await fetch(`/api/initiatives/with-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectiveId: id,
          organizationId: user?.organizationId,
          initiative: data.initiative,
          successMetrics: data.successMetrics,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create initiative");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/initiatives/objective/${id}`],
      });
      setShowInitiativeFormModal(false);
      toast({
        title: "Rencana berhasil dibuat",
        description: "Rencana dengan ukuran keberhasilan telah ditambahkan",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat inisiatif",
        variant: "destructive",
      });
    },
  });

  const getKeyResultTypeIcon = (type: string) => {
    switch (type) {
      case "increase_to":
        return <TrendingUp className="w-4 h-4" />;
      case "decrease_to":
        return <TrendingDown className="w-4 h-4" />;
      case "achieve_or_not":
        return <Target className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getKeyResultTypeTooltip = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Target peningkatan: Progress dihitung berdasarkan peningkatan dari nilai awal ke target";
      case "decrease_to":
        return "Target penurunan: Progress dihitung berdasarkan penurunan dari nilai awal ke target";
      case "achieve_or_not":
        return "Target biner: 100% jika tercapai, 0% jika belum";
      default:
        return type;
    }
  };

  const formatCurrency = (value: string | number, unit: string) => {
    if (unit?.toLowerCase() === "rp" || unit?.toLowerCase() === "rupiah") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return `Rp ${numValue.toLocaleString("id-ID")}`;
    }
    return `${value} ${unit || ""}`.trim();
  };

  const calculateProgress = (
    current: string,
    target: string,
    keyResultType: string,
    baseValue?: string | null,
  ): number => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = baseValue ? parseFloat(baseValue) : 0;

    switch (keyResultType) {
      case "increase_to":
        // Formula: (Current - Base) / (Target - Base) * 100%
        if (targetNum <= baseNum) return 0; // Invalid configuration
        const increaseProgress =
          ((currentNum - baseNum) / (targetNum - baseNum)) * 100;
        return Math.min(100, Math.max(0, increaseProgress));

      case "decrease_to":
        // Formula: (Base - Current) / (Base - Target) * 100%
        if (baseNum <= targetNum) return 0; // Invalid configuration
        const decreaseProgress =
          ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));

      case "should_stay_above":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;

      case "should_stay_below":
        // Binary: 100% if current <= target, 0% otherwise
        return currentNum <= targetNum ? 100 : 0;

      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;

      default:
        return 0;
    }
  };

  const calculateOverallProgress = (keyResults: KeyResult[]): number => {
    if (!keyResults || keyResults.length === 0) return 0;

    const progressSum = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(
        kr.currentValue,
        kr.targetValue,
        kr.keyResultType,
        kr.baseValue,
      );
      return sum + progress;
    }, 0);

    return Math.round(progressSum / keyResults.length);
  };

  const handleCheckIn = (keyResult: KeyResult) => {
    setCheckInModal({ open: true, keyResult });
  };

  // Task update mutation for status changes
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: string;
    }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, {
        status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tasks/objective/${id}`],
      });
      toast({
        title: "Status berhasil diperbarui",
        description: "Status task telah diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui status task",
        variant: "destructive",
      });
    },
  });

  // Delete objective mutation
  const deleteObjectiveMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      const response = await apiRequest("DELETE", `/api/objectives/${objectiveId}`);
      return response.json();
    },
    onMutate: () => {
      // Deletion process started in background
    },
    onSuccess: () => {
      // Invalidate all objective-related queries (for when user returns)
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/objectives/${id}`] });
      // Invalidate initiatives cache to refresh daily focus page
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/objective/${id}`] });
      // Invalidate tasks cache to refresh daily focus page
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/objective/${id}`] });
      // Invalidate key results cache
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus goal",
        variant: "destructive",
      });
    },
  });

  // Duplicate objective mutation
  const duplicateObjectiveMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      const response = await apiRequest("POST", `/api/objectives/${objectiveId}/duplicate`);
      return response.json();
    },
    onSuccess: (duplicatedObjective) => {
      toast({
        title: "Goal berhasil diduplikasi",
        description: "Goal telah diduplikasi dengan status baru.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Invalidate all objective-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      
      // Navigate to the duplicated objective
      window.location.href = `/objectives/${duplicatedObjective.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menduplikasi goal",
        variant: "destructive",
      });
    },
  });

  // Task delete mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tasks/objective/${id}`],
      });
      toast({
        title: "Task berhasil dihapus",
        description: "Task telah dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  // Handle task status update
  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  // Handle task delete
  const handleTaskDelete = (task: Task) => {
    setDeletingTask(task);
  };

  // Confirm task deletion
  const confirmDeleteTask = () => {
    if (deletingTask) {
      deleteTaskMutation.mutate(deletingTask.id);
      setDeletingTask(null);
    }
  };

  // Handle task edit
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditKeyResultModal({ open: true, keyResult });
  };

  const getOwnerDisplay = () => {
    if (!owner) {
      return "Memuat...";
    }

    if (goal?.ownerType === "user" || goal?.ownerType === "individual") {
      const userOwner = owner as User;
      return (
        `${userOwner.firstName || ""} ${userOwner.lastName || ""}`.trim() ||
        userOwner.email
      );
    } else {
      const teamOwner = owner as Team;
      return teamOwner.name;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTugasByInisiatif = (inisiatifId: string) => {
    return tugas.filter((task) => task.initiativeId === inisiatifId);
  };

  // Tour functionality
  const tourSteps = [
    {
      target: '.tour-objective-info',
      title: 'Informasi Goal',
      description: 'Kartu ini menampilkan detail lengkap goal termasuk deskripsi, pemilik, siklus waktu, dan progress keseluruhan dengan indikator threshold ideal.'
    },
    {
      target: '.tour-tabs',
      title: 'Navigasi Tab',
      description: 'Tab berbentuk panah dengan nomor urut: 1) Angka Target untuk melihat key results, 2) Rencana untuk initiatives, 3) Tugas untuk task management.'
    },
    {
      target: '.tour-key-results',
      title: 'Angka Target (Key Results)',
      description: 'Setiap key result menampilkan progress bar, nilai saat ini vs target, dan dapat diperluas untuk melihat initiatives terkait.'
    },
    {
      target: '.tour-check-in',
      title: 'Update Progress',
      description: 'Tombol "Update" memungkinkan Anda mencatat progress terbaru untuk setiap key result dengan penjelasan dan catatan.'
    },
    {
      target: '.tour-initiatives',
      title: 'Rencana (Initiatives)',
      description: 'Tab Rencana menampilkan semua initiatives dalam bentuk kartu dengan status, prioritas, progress, dan anggota tim.'
    },
    {
      target: '.tour-tasks',
      title: 'Tugas (Tasks)',
      description: 'Tab Tugas mengorganisir semua tasks dalam tabel dengan health score, status, prioritas, dan assignee untuk tracking detail.'
    }
  ];

  const startTour = () => {
    setShowTour(true);
    setTourStep(0);
    setTourForceUpdate(0);
    // Scroll to first element
    setTimeout(() => {
      const element = document.querySelector(tourSteps[0]?.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
      setTourForceUpdate(prev => prev + 1);
    } else {
      setShowTour(false);
      setTourStep(0);
    }
    
    // Scroll to highlighted element and force update
    setTimeout(() => {
      const currentStep = tourSteps[tourStep + 1] || tourSteps[0];
      const element = document.querySelector(currentStep?.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTourForceUpdate(prev => prev + 1);
    }, 100);
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
      setTourForceUpdate(prev => prev + 1);
      // Scroll to previous element
      setTimeout(() => {
        const element = document.querySelector(tourSteps[tourStep - 1]?.target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Force re-render tour overlay when step changes
  useEffect(() => {
    if (showTour) {
      // Force re-render by triggering state change
      const timeout = setTimeout(() => {
        setTourForceUpdate(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [tourStep, showTour]);

  if (isLoading) {
    return <ObjectiveDetailSkeleton />;
  }

  if (!goal) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Goal tidak ditemukan</p>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress(goal?.keyResults || []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header with Back Button and Actions */}
      <div className="mb-6">
        {/* Back button and Actions in same row */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditObjectiveModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Ubah Goal
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDuplicateObjective}
                  disabled={duplicateObjectiveMutation.isPending}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {duplicateObjectiveMutation.isPending ? "Menduplikasi..." : "Duplikat Goal"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 hover:text-red-700"
                  onClick={handleDeleteObjective}
                  disabled={deleteObjectiveMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteObjectiveMutation.isPending ? "Menghapus..." : "Hapus Goal"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Mission Card - Show when not all missions completed */}
      {goal && !(goal.keyResults?.length > 0 && inisiatif.length > 0 && tugas.length > 0) && (
        <MissionCard
          missions={[
            {
              id: 'add-key-result',
              title: 'Tambahkan Angka Target Pertama',
              description: 'Buat minimal 1 angka target untuk mengukur kemajuan goal ini. Angka target yang jelas akan membantu tracking progress.',
              icon: <Target className="h-5 w-5" />,
              action: () => setAddKeyResultModal({ open: true }),
              isCompleted: goal.keyResults?.length > 0,
              points: 25,
              difficulty: 'easy'
            },
            {
              id: 'add-initiative',
              title: 'Buat Rencana Aksi',
              description: 'Tambahkan inisiatif atau inisiatif untuk mencapai goal ini. Rencana yang konkret akan memudahkan eksekusi.',
              icon: <Flag className="h-5 w-5" />,
              action: () => setShowInitiativeFormModal(true),
              isCompleted: inisiatif.length > 0,
              points: 30,
              difficulty: 'medium'
            },
            {
              id: 'add-task',
              title: 'Buat Tugas Pertama',
              description: 'Tambahkan tugas konkret yang bisa dikerjakan hari ini. Task yang spesifik akan mendorong action nyata.',
              icon: <CheckSquare className="h-5 w-5" />,
              action: () => setShowTaskModal(true),
              isCompleted: tugas.length > 0,
              points: 20,
              difficulty: 'easy'
            }
          ]}
          className="mb-6"
        />
      )}
      {/* Visual Overview Section for easy understanding */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 h-full tour-objective-info">
          <ObjectiveOverviewCard
            objective={goal}
            initiatives={inisiatif}
            tasks={tugas}
            daysRemaining={daysRemaining}
            cycle={cycle}
            parentObjective={parentObjective}
            owner={owner}
            team={undefined}
          />
        </div>
        <div className="lg:col-span-1 h-full">
          <ActivityLogCard objectiveId={goal?.id} />
        </div>
      </div>
      {/* Angka Target Summary Card */}
      <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
              Angka Target
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center ml-1"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Angka Target</h4>
                    <p className="text-sm text-gray-600">
                      Angka target adalah metrik kuantitatif yang mengukur keberhasilan goal secara objektif. 
                      Setiap angka target memiliki:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                      <li>Nilai baseline (titik awal pengukuran)</li>
                      <li>Nilai target (hasil yang ingin dicapai)</li>
                      <li>Nilai saat ini (progress terkini)</li>
                      <li>Tipe target (increase, decrease, binary, threshold)</li>
                      <li>Unit pengukuran (%, Rp, jumlah, dll)</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Contoh:</strong> Meningkatkan penjualan dari 100 juta menjadi 150 juta per bulan
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </h3>
            <p className="text-blue-700 text-sm leading-relaxed">Angka target menentukan bagaimana goal ini akan diukur dan memastikan kemajuan goal secara objektif.</p>
          </div>
          {goal?.keyResults?.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setAddKeyResultModal({ open: true })}
              className="border-blue-600 text-blue-600 hover:bg-blue-100 w-full sm:w-auto sm:ml-4 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="sm:hidden">Tambah</span>
              <span className="hidden sm:inline">Tambah Angka Target</span>
            </Button>
          )}
        </div>



        {/* Key Results List - moved from tab */}
        <div className="mt-6 space-y-4">
          {goal?.keyResults?.length === 0 ? (
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-8 text-center">
              <Target className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Belum ada Angka Target
              </h3>
              <p className="text-blue-700 mb-4">
                Mulai tambahkan Angka Target untuk mengukur progress goal
                ini
              </p>
              <Button
                variant="outline"
                onClick={() => setAddKeyResultModal({ open: true })}
                className="border-blue-600 text-blue-600 hover:bg-blue-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Angka Target Pertama
              </Button>
            </div>
          ) : (
            goal?.keyResults?.map((kr) => {
              const progress = calculateProgress(
                kr.currentValue,
                kr.targetValue,
                kr.keyResultType,
                kr.baseValue,
              );

              const getKeyResultTypeIcon = (type: string) => {
                switch (type) {
                  case "increase_to":
                    return {
                      icon: TrendingUp,
                      tooltip:
                        "Target Peningkatan - Progress dihitung dari nilai awal ke target",
                    };
                  case "decrease_to":
                    return {
                      icon: TrendingDown,
                      tooltip:
                        "Target Penurunan - Progress dihitung dari nilai awal ke bawah",
                    };
                  case "achieve_or_not":
                    return {
                      icon: Target,
                      tooltip:
                        "Target Binary - Berhasil atau tidak berhasil (100% atau 0%)",
                    };
                  case "should_stay_above":
                    return {
                      icon: Plus,
                      tooltip:
                        "Target Minimum - Nilai harus tetap di atas batas yang ditentukan",
                    };
                  case "should_stay_below":
                    return {
                      icon: Minus,
                      tooltip:
                        "Target Maksimum - Nilai harus tetap di bawah batas yang ditentukan",
                    };
                  default:
                    return { icon: Target, tooltip: "Key Result" };
                }
              };

              const typeConfig = getKeyResultTypeIcon(kr.keyResultType);
              const IconComponent = typeConfig.icon;

              const krInitiatives = inisiatif.filter(
                (r) => r.keyResultId === kr.id,
              );

              return (
                <div
                  key={kr.id}
                  className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg space-y-2 sm:space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">

                        <Link
                          href={`/key-results/${kr.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                        >
                          {kr.title}
                        </Link>
                        <div className="relative group">
                          <IconComponent className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help" />
                          <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                            {typeConfig.tooltip}
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-black"></div>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        {(() => {
                          // Handle achieve_or_not type
                          if (kr.keyResultType === "achieve_or_not") {
                            return progress >= 100
                              ? "Status: Tercapai"
                              : "Status: Belum tercapai";
                          }

                          // Handle should_stay types
                          if (
                            kr.keyResultType === "should_stay_above" ||
                            kr.keyResultType === "should_stay_below"
                          ) {
                            const currentVal = parseFloat(kr.currentValue);
                            const targetVal = parseFloat(kr.targetValue);
                            const unitDisplay =
                              kr.unit === "Rp"
                                ? "Rp "
                                : kr.unit === "%"
                                  ? ""
                                  : "";
                            const unitSuffix = kr.unit === "%" ? "%" : "";

                            return `Saat ini: ${unitDisplay}${currentVal.toLocaleString("id-ID")}${unitSuffix} | Threshold: ${unitDisplay}${targetVal.toLocaleString("id-ID")}${unitSuffix}`;
                          }

                          // Handle increase_to and decrease_to types
                          const currentVal = parseFloat(kr.currentValue);
                          const targetVal = parseFloat(kr.targetValue);
                          const baseVal = kr.baseValue
                            ? parseFloat(kr.baseValue)
                            : 0;

                          if (kr.keyResultType === "decrease_to") {
                            if (kr.unit === "Rp") {
                              return `Rp ${baseVal.toLocaleString("id-ID")} → Rp ${targetVal.toLocaleString("id-ID")} (capaian: Rp ${currentVal.toLocaleString("id-ID")})`;
                            } else if (kr.unit === "%") {
                              return `${baseVal.toLocaleString("id-ID")}% → ${targetVal.toLocaleString("id-ID")}% (capaian: ${currentVal.toLocaleString("id-ID")}%)`;
                            } else {
                              return `${baseVal.toLocaleString("id-ID")} → ${targetVal.toLocaleString("id-ID")} ${kr.unit || ""} (capaian: ${currentVal.toLocaleString("id-ID")})`;
                            }
                          } else {
                            // increase_to type
                            if (kr.unit === "Rp") {
                              return `Rp ${baseVal.toLocaleString("id-ID")} → Rp ${targetVal.toLocaleString("id-ID")} (capaian: Rp ${currentVal.toLocaleString("id-ID")})`;
                            } else if (kr.unit === "%") {
                              return `${baseVal.toLocaleString("id-ID")}% → ${targetVal.toLocaleString("id-ID")}% (capaian: ${currentVal.toLocaleString("id-ID")}%)`;
                            } else {
                              return `${baseVal.toLocaleString("id-ID")} → ${targetVal.toLocaleString("id-ID")} ${kr.unit || ""} (capaian: ${currentVal.toLocaleString("id-ID")})`;
                            }
                          }
                        })()}
                      </div>
                    </div>

                    {/* Action Buttons - Top Right */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCheckIn(kr)}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white tour-check-in"
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="sm:hidden">Update</span>
                        <span className="hidden sm:inline">Update</span>
                      </Button>
                      <Link href={`/key-results/${kr.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleEditKeyResult(kr)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Angka Target
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteKeyResult(kr)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Angka Target
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress section with last check-in - consistent with dashboard */}
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="w-full sm:flex-1 sm:mr-4">
                      {/* Mobile: Use compact mode, Desktop: Use full progress bar */}
                      <div className="block sm:hidden">
                        <SimpleProgressStatus
                          status={kr.status}
                          progressPercentage={progress}
                          timeProgressPercentage={
                            kr.timeProgressPercentage || 0
                          }
                          dueDate={null}
                          startDate={cycle?.startDate}
                          compact={true}
                          keyResultType={kr.type}
                        />
                      </div>
                      <div className="hidden sm:block">
                        <SimpleProgressStatus
                          status={kr.status}
                          progressPercentage={progress}
                          timeProgressPercentage={
                            kr.timeProgressPercentage || 0
                          }
                          dueDate={null}
                          startDate={cycle?.startDate}
                          compact={false}
                          keyResultType={kr.type}
                        />
                      </div>
                    </div>
                    {kr.lastCheckIn && (
                      <div className="text-xs text-gray-500 sm:text-right sm:ml-4 sm:shrink-0">
                        <div className="flex items-center gap-1 sm:justify-end">
                          <span className="text-gray-400">
                            Terakhir update:
                          </span>
                          <span className="text-gray-600">
                            {kr.lastCheckIn.createdAt &&
                              new Date(
                                kr.lastCheckIn.createdAt,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                          </span>
                        </div>
                        {kr.lastCheckIn.notes && (
                          <div className="relative group mt-1">
                            <div className="text-gray-400 italic text-xs max-w-xs truncate sm:text-right cursor-help">
                              "{kr.lastCheckIn.notes}"
                            </div>
                            {/* Custom tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-sm min-w-0 break-words">
                              {kr.lastCheckIn.notes}
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom section - Assignee and Initiative count */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {/* Assignee information - Left */}
                    <div className="relative group text-xs text-gray-600 flex items-center gap-2">
                      {kr.assignedTo ? (
                        <>
                          <Avatar className="w-5 h-5">
                            <AvatarImage 
                              src={getUserProfileImage(kr.assignedTo)} 
                              alt={getUserName(kr.assignedTo)}
                            />
                            <AvatarFallback className="bg-blue-500 text-white text-xs font-medium cursor-help">
                              {getUserInitials(kr.assignedTo)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-800">
                            {getUserName(kr.assignedTo)}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center cursor-help">
                            <UserIcon className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-gray-500 italic">
                            Belum ditentukan
                          </span>
                        </>
                      )}

                      {/* Tooltip for assignee info */}
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {kr.assignedTo
                          ? `Penanggung jawab: ${getUserName(kr.assignedTo)} - Bertanggung jawab untuk memantau dan melaporkan progress angka target ini`
                          : "Belum ada penanggung jawab - Assign seseorang untuk memantau progress angka target ini"}
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                      </div>
                    </div>

                    {/* Initiative count - Right */}
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>
                        {
                          inisiatif.filter((r) => r.keyResultId === kr.id)
                            .length
                        }
                      </span>
                      <span>inisiatif</span>
                    </div>
                  </div>


                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Inisiatif Summary Card */}
      <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-green-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 shrink-0" />
              Inisiatif
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center ml-1"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Inisiatif</h4>
                    <p className="text-sm text-gray-600">
                      Inisiatif adalah langkah-langkah strategis dan terstruktur yang dirancang untuk mencapai angka target. 
                      Setiap inisiatif memiliki:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                      <li>Tujuan yang jelas dan terukur</li>
                      <li>Timeline dengan tanggal mulai dan selesai</li>
                      <li>Budget dan alokasi sumber daya</li>
                      <li>PIC (Person In Charge) yang bertanggung jawab</li>
                      <li>Priority score untuk menentukan urgensi</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Contoh:</strong> Kampanye digital marketing untuk meningkatkan brand awareness
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </h3>
            <p className="text-green-700 text-sm leading-relaxed">Inisiatif adalah langkah-langkah strategis untuk mencapai ukuran keberhasilan.</p>
          </div>
          {inisiatif.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowInitiativeFormModal(true)}
              className="border-green-600 text-green-600 hover:bg-green-100 w-full sm:w-auto sm:ml-4 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="sm:hidden">Tambah</span>
              <span className="hidden sm:inline">Tambah Inisiatif</span>
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {inisiatif.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4">
          <div className="bg-white p-3 md:p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Selesai
              </span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {inisiatif.filter((r) => r.status === "completed").length}
            </div>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Berjalan
              </span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {inisiatif.filter((r) => r.status === "in_progress").length}
            </div>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <Building className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Budget
              </span>
            </div>
            <div className="text-sm md:text-lg font-bold text-purple-600">
              Rp{" "}
              {inisiatif
                .reduce((sum, r) => sum + parseFloat(r.budget || "0"), 0)
                .toLocaleString("id-ID", { notation: "compact" })}
            </div>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Progress
              </span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {inisiatif.length > 0
                ? Math.round(
                    inisiatif.reduce(
                      (sum, r) => sum + (r.progressPercentage || 0),
                      0,
                    ) / inisiatif.length,
                  )
                : 0}
              %
            </div>
          </div>
        </div>
        )}

        {/* Inisiatif List */}
        <div className="mt-6 space-y-4">
          {inisiatif.length === 0 ? (
            <div className="border-2 border-dashed border-green-200 bg-green-50/50 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Belum ada inisiatif
              </h3>
              <p className="text-green-700 mb-4">
                Mulai buat inisiatif untuk mencapai ukuran keberhasilan yang
                telah ditetapkan
              </p>
              <Button
                variant="outline"
                onClick={() => setShowInitiativeFormModal(true)}
                className="border-green-600 text-green-600 hover:bg-green-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Inisiatif Pertama
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inisiatif
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prioritas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenggat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PIC
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inisiatif
                        .sort((a, b) => {
                          const scoreA = parseFloat(a.priorityScore || "0");
                          const scoreB = parseFloat(b.priorityScore || "0");
                          return scoreB - scoreA; // Sort by priority score descending
                        })
                        .map((initiative) => {
                        const rawScore = initiative.priorityScore;
                        const score = parseFloat(rawScore || "0");
                        
                        let color: string;
                        let label: string;
                        
                        if (score >= 4.0) {
                          color = "bg-red-100 text-red-800";
                          label = "Kritis";
                        } else if (score >= 3.0) {
                          color = "bg-orange-100 text-orange-800";
                          label = "Tinggi";
                        } else if (score >= 2.0) {
                          color = "bg-yellow-100 text-yellow-800";
                          label = "Sedang";
                        } else {
                          color = "bg-green-100 text-green-800";
                          label = "Rendah";
                        }

                        return (
                          <tr
                            key={initiative.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-4">
                              <div>
                                <Link href={`/initiatives/${initiative.id}`}>
                                  <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                    {initiative.title}
                                  </div>
                                </Link>
                                
                                {initiative.keyResultId && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Target className="w-3 h-3 text-blue-600" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Angka Target</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span className="text-xs text-blue-600 font-medium">
                                      {goal?.keyResults?.find((kr: any) => kr.id === initiative.keyResultId)?.title || 'Unknown'}
                                    </span>
                                  </div>
                                )}
                                {initiative.budget && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Budget: Rp{" "}
                                    {parseFloat(
                                      initiative.budget,
                                    ).toLocaleString("id-ID")}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {(() => {
                                const status = initiative.status || "draft";
                                const getStatusInfo = (status: string) => {
                                  const statusMap = {
                                    'draft': {
                                      label: 'Draft',
                                      bgColor: 'bg-gray-100',
                                      textColor: 'text-gray-800',
                                    },
                                    'sedang_berjalan': {
                                      label: 'Sedang Berjalan',
                                      bgColor: 'bg-blue-100',
                                      textColor: 'text-blue-800',
                                    },
                                    'selesai': {
                                      label: 'Selesai',
                                      bgColor: 'bg-green-100',
                                      textColor: 'text-green-800',
                                    },
                                    'dibatalkan': {
                                      label: 'Dibatalkan',
                                      bgColor: 'bg-red-100',
                                      textColor: 'text-red-800',
                                    }
                                  };
                                  return statusMap[status as keyof typeof statusMap] || statusMap['draft'];
                                };
                                
                                const statusInfo = getStatusInfo(status);
                                
                                return (
                                  <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                    {statusInfo.label}
                                  </Badge>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col items-center gap-1">
                                <Badge className={color}>
                                  {label}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {score.toFixed(1)}/5.0
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${(() => {
                                      const progress =
                                        initiative.progressPercentage || 0;
                                      if (progress >= 100)
                                        return "bg-green-600";
                                      if (progress >= 80)
                                        return "bg-green-500";
                                      if (progress >= 60)
                                        return "bg-orange-500";
                                      return "bg-red-500";
                                    })()}`}
                                    style={{
                                      width: `${initiative.progressPercentage || 0}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {initiative.progressPercentage || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                {initiative.startDate && (
                                  <div className="text-xs text-gray-500">
                                    Mulai: {new Date(initiative.startDate).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </div>
                                )}
                                {initiative.dueDate ? (
                                  <div
                                    className={`text-sm ${
                                      new Date(initiative.dueDate) < new Date()
                                        ? "text-red-600 font-medium"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    Selesai: {new Date(initiative.dueDate).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">
                                    Selesai: -
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {initiative.picId ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage 
                                      src={getUserProfileImage(initiative.picId)} 
                                      alt={getUserName(initiative.picId)}
                                    />
                                    <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                      {getUserInitials(initiative.picId)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-900 truncate">
                                    {getUserName(initiative.picId)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  Tidak ditugaskan
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => window.location.href = `/initiatives/${initiative.id}`}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Lihat Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingInitiative(initiative);
                                        setShowInitiativeFormModal(true);
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Ubah
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => setDeletingInitiative(initiative)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 p-3">
                  {inisiatif
                    .sort((a, b) => {
                      const scoreA = parseFloat(a.priorityScore || "0");
                      const scoreB = parseFloat(b.priorityScore || "0");
                      return scoreB - scoreA; // Sort by priority score descending
                    })
                    .map((initiative) => {
                    const rawScore = initiative.priorityScore;
                    const score = parseFloat(rawScore || "0");
                    
                    let color: string;
                    let label: string;
                    
                    if (score >= 4.0) {
                      color = "bg-red-100 text-red-800";
                      label = "Kritis";
                    } else if (score >= 3.0) {
                      color = "bg-orange-100 text-orange-800";
                      label = "Tinggi";
                    } else if (score >= 2.0) {
                      color = "bg-yellow-100 text-yellow-800";
                      label = "Sedang";
                    } else {
                      color = "bg-green-100 text-green-800";
                      label = "Rendah";
                    }

                    return (
                      <div key={initiative.id} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Link href={`/initiatives/${initiative.id}`}>
                              <h4 className="font-medium text-sm text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
                                {initiative.title}
                              </h4>
                            </Link>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {(() => {
                              const status = initiative.status || "draft";
                              const getStatusInfo = (status: string) => {
                                const statusMap = {
                                  'draft': { label: 'Draft', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
                                  'sedang_berjalan': { label: 'Berjalan', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
                                  'selesai': { label: 'Selesai', bgColor: 'bg-green-100', textColor: 'text-green-800' },
                                  'dibatalkan': { label: 'Batal', bgColor: 'bg-red-100', textColor: 'text-red-800' }
                                };
                                return statusMap[status as keyof typeof statusMap] || statusMap['draft'];
                              };
                              
                              const statusInfo = getStatusInfo(status);
                              
                              return (
                                <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} text-xs px-1.5 py-0.5`}>
                                  {statusInfo.label}
                                </Badge>
                              );
                            })()}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.location.href = `/initiatives/${initiative.id}`}>
                                  <Eye className="mr-2 h-3 w-3" />Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingInitiative(initiative); setShowInitiativeFormModal(true); }}>
                                  <Edit className="mr-2 h-3 w-3" />Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => setDeletingInitiative(initiative)}>
                                  <Trash2 className="mr-2 h-3 w-3" />Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Priority, Progress & PIC Row */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Badge className={`${color} text-xs px-1.5 py-0.5`}>
                              {label}
                            </Badge>
                            <span className="text-gray-400">{score.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${(() => {
                                  const progress = initiative.progressPercentage || 0;
                                  if (progress >= 100) return "bg-green-600";
                                  if (progress >= 80) return "bg-green-500";
                                  if (progress >= 60) return "bg-orange-500";
                                  return "bg-red-500";
                                })()}`}
                                style={{ width: `${initiative.progressPercentage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 min-w-8">
                              {initiative.progressPercentage || 0}%
                            </span>
                          </div>
                        </div>

                        {/* Date & PIC */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="text-gray-500">
                            {initiative.dueDate ? (
                              <span className={new Date(initiative.dueDate) < new Date() ? "text-red-600 font-medium" : ""}>
                                {new Date(initiative.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                              </span>
                            ) : (
                              <span className="text-gray-400">No deadline</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {initiative.picId ? (
                              <>
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={getUserProfileImage(initiative.picId)} alt={getUserName(initiative.picId)} />
                                  <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                                    {getUserInitials(initiative.picId)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-900 truncate max-w-16">
                                  {getUserName(initiative.picId)}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Header with Description */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 md:p-6 rounded-lg border border-purple-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              Tugas & Aktivitas
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button" 
                    className="inline-flex items-center justify-center ml-1"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="max-w-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Tugas & Aktivitas</h4>
                    <p className="text-sm text-gray-600">
                      Tugas adalah aktivitas operasional harian yang mendukung pelaksanaan inisiatif strategis. 
                      Setiap tugas memiliki:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                      <li>Deskripsi yang jelas dan actionable</li>
                      <li>PIC (Person In Charge) yang bertanggung jawab</li>
                      <li>Deadline untuk penyelesaian</li>
                      <li>Tingkat prioritas (rendah, sedang, tinggi, kritis)</li>
                      <li>Status tracking (belum mulai, berjalan, selesai, dibatalkan)</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Contoh:</strong> Membuat konten sosial media untuk kampanye produk baru
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </h3>
            <p className="text-purple-700 text-sm leading-relaxed">Tugas adalah aktivitas operasional yang mendukung pelaksanaan inisiatif. </p>
          </div>
          {tugas.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowTaskModal(true)}
              className="border-purple-600 text-purple-600 hover:bg-purple-50 w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Task
            </Button>
          )}
        </div>



        {/* Tugas List */}
        <div className="mt-6 space-y-4">
          {tugas.length === 0 ? (
            <div className="border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-lg p-8 text-center">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h3 className="text-lg font-medium text-purple-900 mb-2">
                Belum ada tugas
              </h3>
              <p className="text-purple-700 mb-4">
                Tugas akan muncul ketika inisiatif dibuat dan dijabarkan ke
                aktivitas operasional.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowTaskModal(true)}
                className="border-purple-600 text-purple-600 hover:bg-purple-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Task Pertama
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prioritas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenggat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PIC
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tugas.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <div>
                                <Link
                                  href={`/tasks/${task.id}`}
                                  className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {task.title}
                                </Link>
                                {task.initiative && (
                                  <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                                    Inisiatif: {task.initiative.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge
                              className={getTaskPriorityColor(task.priority || "medium")}
                            >
                              {getTaskPriorityLabel(task.priority || "medium")}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
                                >
                                  {getTaskStatusLabel(task.status)}
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleTaskStatusUpdate(task.id, "not_started")}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "not_started" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Belum Dimulai</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTaskStatusUpdate(task.id, "in_progress")}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "in_progress" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Sedang Berjalan</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTaskStatusUpdate(task.id, "completed")}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "completed" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Selesai</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTaskStatusUpdate(task.id, "cancelled")}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {task.status === "cancelled" && (
                                      <Check className="h-3 w-3" />
                                    )}
                                    <span>Dibatalkan</span>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="px-4 py-4">
                            {task.dueDate ? (
                              <span
                                className={`text-sm ${
                                  new Date(task.dueDate) < new Date()
                                    ? "text-red-600 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                {new Date(task.dueDate).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {task.assignedTo ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage
                                    src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                  />
                                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                    {getUserInitials(task.assignedTo)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-900">
                                  {getUserName(task.assignedTo)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Belum Ditugaskan</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/tasks/${task.id}`}
                                    className="cursor-pointer flex items-center"
                                  >
                                    <Eye className="w-3 h-3 mr-2" />
                                    Lihat Detail
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditTask(task)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTaskDelete(task)}
                                  className="cursor-pointer text-red-600"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-3">
                  {tugas.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 bg-white border rounded-lg space-y-3 ${
                        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed" 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Header with title and status */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-sm line-clamp-2"
                          >
                            {task.title}
                          </Link>
                          {task.initiative && (
                            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-2 inline-block">
                              Inisiatif: {task.initiative.title}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium flex-shrink-0`}
                            >
                              {getTaskStatusLabel(task.status)}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTaskStatusUpdate(task.id, "not_started")}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {task.status === "not_started" && (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Belum Dimulai</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTaskStatusUpdate(task.id, "in_progress")}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {task.status === "in_progress" && (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Sedang Berjalan</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTaskStatusUpdate(task.id, "completed")}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {task.status === "completed" && (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Selesai</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTaskStatusUpdate(task.id, "cancelled")}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {task.status === "cancelled" && (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Dibatalkan</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Priority and Due Date */}
                      <div className="flex items-center justify-between">
                        <Badge
                          className={getTaskPriorityColor(task.priority || "medium")}
                        >
                          {getTaskPriorityLabel(task.priority || "medium")}
                        </Badge>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span
                            className={`${
                              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"
                                ? "text-red-600 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "Tidak ada"}
                          </span>
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">PIC:</span>
                          {task.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage
                                  src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)}
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                  {getUserInitials(task.assignedTo)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-700 font-medium">
                                {getUserName(task.assignedTo)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Belum ditugaskan</span>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-gray-100 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/tasks/${task.id}`}
                                className="cursor-pointer flex items-center"
                              >
                                <Eye className="w-3 h-3 mr-2" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditTask(task)}
                              className="cursor-pointer"
                            >
                              <Edit className="w-3 h-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTaskDelete(task)}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Modals */}
      {checkInModal.keyResult && (
        <CheckInModal
          keyResultId={checkInModal.keyResult.id}
          keyResultTitle={checkInModal.keyResult.title}
          currentValue={checkInModal.keyResult.currentValue}
          targetValue={checkInModal.keyResult.targetValue}
          unit={checkInModal.keyResult.unit}
          keyResultType={checkInModal.keyResult.keyResultType}
          open={checkInModal.open}
          onOpenChange={(open) =>
            setCheckInModal({
              open,
              keyResult: open ? checkInModal.keyResult : undefined,
            })
          }
        />
      )}
      <EditKeyResultModal
        open={editKeyResultModal.open}
        onOpenChange={(open) => setEditKeyResultModal({ open })}
        keyResult={editKeyResultModal.keyResult}
        objectiveId={id}
        goalOwner={userOwner}
        onSuccess={() => {
          // Invalidate cache to refresh the data
          console.log("🔄 Starting cache invalidation for objective:", id);
          queryClient.invalidateQueries({ queryKey: [`/api/objectives/${id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/cycles/${goal?.cycleId}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
          queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
          console.log("✅ Cache invalidated after key result edit");
          
          // Also refetch the current query to ensure immediate refresh
          queryClient.refetchQueries({ queryKey: [`/api/objectives/${id}`] });
          console.log("🔄 Refetching objective data for immediate refresh");
        }}
      />
      {/* Add Key Result Modal */}
      <KeyResultModal
        open={addKeyResultModal.open}
        onOpenChange={(open) => setAddKeyResultModal({ open })}
        onSubmit={(data) => handleCreateKeyResult(data as any)}
        users={users}
        goalOwner={userOwner}
      />
      {/* Initiative Form Modal */}
      <InitiativeFormModal
        open={showInitiativeFormModal}
        onOpenChange={(open) => {
          setShowInitiativeFormModal(open);
          if (!open) {
            setEditingInitiative(null);
          }
        }}
        onSuccess={() => {
          // Invalidate queries to refresh the initiative list
          queryClient.invalidateQueries({ queryKey: [`/api/initiatives/objective/${id}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
          queryClient.invalidateQueries({ queryKey: [`/api/objectives/${id}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
          queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
          

        }}
        keyResultId=""
        objectiveId={id}
        initiative={editingInitiative ?? undefined}
      />
      {/* Edit Objective Modal */}
      {goal && (
        <EditObjectiveModal
          objective={goal}
          open={editObjectiveModal}
          onOpenChange={setEditObjectiveModal}
        />
      )}
      {/* Task Modal */}
      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        initiativeId={undefined}
        objectiveId={id}
        isAdding={!editingTask}
      />
      {/* Delete Key Result Confirmation Dialog */}
      <AlertDialog
        open={deleteKeyResultModal.open}
        onOpenChange={(open) => setDeleteKeyResultModal({ open, keyResult: deleteKeyResultModal.keyResult })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Angka Target</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Angka Target "{deleteKeyResultModal.keyResult?.title}"?
              <br />
              <br />
              Tindakan ini tidak dapat dibatalkan dan akan menghapus:
              <br />
              • Data Angka Target
              <br />
              • Semua check-in terkait
              <br />
              • Riwayat progress
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteKeyResult}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Initiative Confirmation Dialog */}
      <AlertDialog open={!!deletingInitiative} onOpenChange={() => setDeletingInitiative(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Inisiatif</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus inisiatif "{deletingInitiative?.title}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInitiative}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Task</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus task "{deletingTask?.title}"?
              <br />
              <br />
              Tindakan ini tidak dapat dibatalkan dan akan menghapus:
              <br />
              • Task dan semua data terkait
              <br />
              • Semua komentar task
              <br />
              • Riwayat audit trail
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Objective Confirmation Dialog */}
      <AlertDialog open={deleteObjectiveModal} onOpenChange={setDeleteObjectiveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus goal "{goal?.title}"?
              <br />
              <br />
              Tindakan ini tidak dapat dibatalkan dan akan menghapus:
              <br />
              • Goal dan semua data terkait
              <br />
              • Semua Angka Target
              <br />
              • Semua Inisiatif dan Tasks
              <br />
              • Riwayat progress dan check-in
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteObjectiveMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteObjective}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteObjectiveMutation.isPending}
            >
              {deleteObjectiveMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




