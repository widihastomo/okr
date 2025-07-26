import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Target,
  BarChart3,
  Trophy,
  MoveUp,
  MoveDown,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  MoreHorizontal,
  Eye,
  User,
  Edit,
  Trash2,
  Check,
  ExternalLink,
  Plus,
  ChevronsUpDown,
  Rocket,

  CheckCircle2,
  UserPlus,
  Users,
  Lightbulb,
  CheckSquare,
  LineChart,
  Zap,
  MessageSquare,
  Info,
  HelpCircle,
  ArrowRight,
  Heart,
  Share2,
  Send,
  Smile,
  Sun,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import MetricsUpdateModal from "@/components/metrics-update-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { UserStatsCard } from "@/components/gamification/user-stats-card";
import { DailyAchievements } from "@/components/daily-achievements";
import { DailyUpdateSimple } from "@/components/daily-update-simple";
import { useAuth } from "@/hooks/useAuth";
import GoalFormModal from "@/components/goal-form-modal";
import TaskModal from "@/components/task-modal";
import InitiativeFormModal from "@/components/initiative-form-modal";
import TourStartButton from "@/components/tour-start-button";
import { CompanyDetailsModal } from "@/components/CompanyDetailsModal";
import WelcomeScreen from "@/components/WelcomeScreen";
import { DailyFocusCards } from "@/components/DailyFocusCards";


// Icon mapping for mission cards
const iconMapping = {
  UserPlus: UserPlus,
  Users: Users,
  Target: Target,
  BarChart3: BarChart3,
  Lightbulb: Lightbulb,
  CheckSquare: CheckSquare,
  TrendingUp: TrendingUp,
  LineChart: LineChart,
  CheckCircle2: CheckCircle2,
  Zap: Zap,
};

// Mission action functions for 3 core missions
const missionActions = {
  addMember: () => (window.location.href = "/client-users"),
  createObjective: () => (window.location.href = "/"),
  updateKeyResult: () => (window.location.href = "/"),
};

// Mission Card Component
interface MissionCardProps {
  missions: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
  }>;
  title: string;
  description: string;
  className?: string;
}

function MissionCard({
  missions,
  title,
  description,
  className,
}: MissionCardProps) {
  const completedMissions = missions.filter((m) => m.unlocked).length;
  const totalMissions = missions.length;
  const [isExpanded, setIsExpanded] = useState(false);

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
                <Target className="h-4 w-4 text-yellow-500" />
                {title}
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                >
                  {completedMissions}/{totalMissions}
                </Badge>
              </CardTitle>
              <p className="text-sm text-orange-600 mt-1">{description}</p>
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
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-3 pt-0">
            {missions.map((mission, index) => {
              const IconComponent = iconMapping[mission.icon] || Target;
              const missionKey =
                mission.name.includes("Tambah Pengguna") ||
                mission.name.includes("Menambahkan Member")
                  ? "addMember"
                  : mission.name.includes("Buat Objective") ||
                      mission.name.includes("Membuat Objective")
                    ? "createObjective"
                    : mission.name.includes("Update Capaian Key Result")
                      ? "updateKeyResult"
                      : "addMember";

              return (
                <div
                  key={mission.id}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    mission.unlocked
                      ? "bg-green-50 border-green-200 opacity-75"
                      : "bg-white border-orange-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-full flex-shrink-0 ${
                        mission.unlocked
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {mission.unlocked ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-orange-600 min-w-[20px]">
                          {index + 1}.
                        </span>
                        <h4
                          className={`font-medium text-sm ${
                            mission.unlocked
                              ? "text-green-700 line-through"
                              : "text-gray-800"
                          }`}
                        >
                          {mission.name.replace(
                            /🎯 Misi: |📊 Misi: |💡 Misi: |✅ Misi: |🔄 Misi: |📈 Misi: |⚡ Misi: |🎖️ Misi: /g,
                            "",
                          )}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {mission.description}
                      </p>
                      {!mission.unlocked && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs h-7"
                          onClick={() => missionActions[missionKey]()}
                        >
                          Mulai
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Timeline Feed Component
function TimelineFeedComponent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Timeline states
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this_week');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [reactions, setReactions] = useState<Record<string, {liked: boolean, likeCount: number}>>({});

  // Helper function for thousand separator formatting
  const formatWithThousandSeparator = (value: string | number) => {
    if (!value && value !== 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value.toString();
    return numValue.toLocaleString('id-ID');
  };

  // Helper function for human-readable time difference
  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const updateTime = new Date(date);
    const diffInMs = now.getTime() - updateTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Baru saja';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    } else if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`;
    } else {
      return updateTime.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Helper function to check if date is within filter range
  const isDateInRange = (itemDate: string | Date, filter: string) => {
    const now = new Date();
    const itemDateTime = new Date(itemDate);
    const diffInMs = now.getTime() - itemDateTime.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    switch (filter) {
      case 'today':
        return diffInDays === 0;
      case 'this_week':
        return diffInDays <= 7;
      case 'this_month':
        return diffInDays <= 30;
      case 'all':
        return true;
      default:
        return true;
    }
  };

  // Get timeline data
  const { data: timelineData = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['/api/timeline'],
    enabled: !!user,
  });

  // Get users for filter
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Get teams for filter
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    enabled: !!user,
  });

  // State to track comments for each timeline item
  const [commentsData, setCommentsData] = useState<{[key: string]: any[]}>({});
  const [commentsLoading, setCommentsLoading] = useState<{[key: string]: boolean}>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<{[key: string]: boolean}>({});

  // Emoticons for picker
  const emoticons = ['😊', '😄', '😆', '😍', '🥰', '😂', '🤣', '😭', '😢', '😓', '😤', '😡', '🤔', '😴', '🤯', '🥳', '🎉', '👍', '👎', '❤️', '💯', '🔥', '✨', '⚡', '💪', '🙌', '👏', '🎯', '✅', '❌', '⭐'];

  // Function to fetch comments for a timeline item
  const fetchCommentsForItem = async (timelineItemId: string) => {
    if (commentsLoading[timelineItemId] || commentsData[timelineItemId]) return;
    
    setCommentsLoading(prev => ({ ...prev, [timelineItemId]: true }));
    try {
      const response = await fetch(`/api/timeline/${timelineItemId}/comments`, {
        credentials: 'include',
      });
      if (response.ok) {
        const comments = await response.json();
        setCommentsData(prev => ({ ...prev, [timelineItemId]: comments }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [timelineItemId]: false }));
    }
  };

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ timelineId, content }: { timelineId: string; content: string }) => {
      const response = await apiRequest('POST', `/api/timeline/${timelineId}/comments`, { content });
      return response.json();
    },
    onSuccess: (newComment, variables) => {
      // Immediately update local comments data with new comment
      setCommentsData(prev => ({
        ...prev,
        [variables.timelineId]: [...(prev[variables.timelineId] || []), newComment]
      }));
      
      // Invalidate timeline and comments queries to ensure sync
      queryClient.invalidateQueries({ queryKey: ['/api/timeline'] });
      queryClient.invalidateQueries({ queryKey: [`/api/timeline/${variables.timelineId}/comments`] });
      
      // Show success feedback
      console.log('✅ Comment added successfully:', newComment);
    },
    onError: (error) => {
      console.error('❌ Error adding comment:', error);
    }
  });

  // Filter timeline data
  const filteredTimeline = (timelineData as any[]).filter((item: any) => {
    // Activity type filter
    if (timelineFilter !== 'all' && item.type !== timelineFilter) return false;
    
    // User filter
    if (userFilter !== 'all' && item.userId !== userFilter) return false;
    
    // Team filter (check if user belongs to selected team)
    if (teamFilter !== 'all') {
      const itemUser = (users as any[]).find((u: any) => u.id === item.userId);
      if (!itemUser || !itemUser.teamId || itemUser.teamId !== teamFilter) return false;
    }
    
    // Date filter
    if (!isDateInRange(item.updateDate || item.createdAt, dateFilter)) return false;
    
    return true;
  });

  const handleAddComment = (timelineId: string, content: string) => {
    addCommentMutation.mutate({ timelineId, content });
    setCommentTexts(prev => ({ ...prev, [timelineId]: '' }));
  };

  // Toggle emoji picker
  const toggleEmojiPicker = (timelineId: string) => {
    console.log('🎭 Toggling emoji picker for:', timelineId);
    console.log('🎭 Current state:', showEmojiPicker);
    
    setShowEmojiPicker(prev => {
      const newState = { ...prev, [timelineId]: !prev[timelineId] };
      console.log('🎭 New state:', newState);
      return newState;
    });
  };

  // Add emoji to comment text
  const addEmojiToComment = (timelineId: string, emoji: string) => {
    setCommentTexts(prev => ({
      ...prev,
      [timelineId]: (prev[timelineId] || '') + emoji
    }));
    setShowEmojiPicker(prev => ({ ...prev, [timelineId]: false }));
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on emoji picker container or emoji button
      if (!target.closest('.emoji-picker-container') && !target.closest('.emoji-button')) {
        console.log('🎭 Closing emoji picker due to outside click');
        setShowEmojiPicker({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleComments = (id: string) => {
    setShowComments(prev => {
      const newValue = !prev[id];
      // Fetch comments when opening for the first time
      if (newValue && !commentsData[id]) {
        fetchCommentsForItem(id);
      }
      return { ...prev, [id]: newValue };
    });
  };

  // Handle reaction toggle
  const handleReactionToggle = (itemId: string) => {
    setReactions(prev => {
      const current = prev[itemId] || { liked: false, likeCount: 0 };
      return {
        ...prev,
        [itemId]: {
          liked: !current.liked,
          likeCount: current.liked ? current.likeCount - 1 : current.likeCount + 1
        }
      };
    });
  };

  if (timelineLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Timeline Feed
        </CardTitle>
        <CardDescription>
          Activity feed dari update harian dan progress tim
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Sidebar - Filters (Desktop) */}
          <div className="lg:w-64 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filter Aktivitas</label>
                <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Aktivitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aktivitas</SelectItem>
                    <SelectItem value="daily_update">Update Harian</SelectItem>
                    <SelectItem value="check_in">Check-in Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filter User</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua User</SelectItem>
                    {(users as any[]).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filter Tim</label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Tim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tim</SelectItem>
                    {(teams as any[]).map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filter Tanggal</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Minggu Ini" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="this_week">Minggu Ini</SelectItem>
                    <SelectItem value="this_month">Bulan Ini</SelectItem>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Summary */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {filteredTimeline.length} aktivitas ditampilkan
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 lg:overflow-y-auto border-r border-gray-200 max-h-[600px]">
            <div className="p-4 max-w-2xl mx-auto">
              {filteredTimeline.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-8 md:py-12 px-4">
            <MessageSquare className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              Belum ada activity yang ditampilkan
            </h3>
            <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">
              Timeline akan menampilkan update harian dan progress check-in dari tim Anda
            </p>
            <div className="text-xs md:text-sm text-gray-500">
              Mulai dengan melakukan cek-in atau update harian untuk melihat activity feed
            </div>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredTimeline.slice(0, 5).map((item: any) => (
              <div key={item.id} className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-3 md:p-4">
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="flex-shrink-0">
                      {(item as any).userProfileImageUrl ? (
                        <img 
                          src={(item as any).userProfileImageUrl} 
                          alt={(item as any).userName || 'User'}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                          {((item as any).userName || item.user?.name || item.user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                            {(item as any).userName || item.user?.name || item.user?.email || 'User'}
                          </h3>
                          <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                          <span className="text-gray-500 text-xs hidden sm:inline">
                            {new Date(item.updateDate || item.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          {item.type === 'check_in' ? (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 whitespace-nowrap">
                              <span className="hidden sm:inline">Capaian Angka target</span>
                              <span className="sm:hidden">Cek-in</span>
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs whitespace-nowrap">
                              <span className="hidden sm:inline">Update Harian</span>
                              <span className="sm:hidden">Update</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500 text-xs sm:hidden block">
                          {new Date(item.updateDate || item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <p className="text-gray-700 text-xs md:text-sm mt-1">
                          {item.type === 'check_in' 
                            ? (
                              <span>
                                Update capaian: <span className="font-medium">{item.keyResultTitle || 'Key Result'}</span>
                              </span>
                            )
                            : (item.summary || 'Membagikan update progress harian')
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-3 md:px-4 pb-3 md:pb-4">
                  <div className="space-y-2">
                    {/* Summary Statistics - Hide for check_in items */}
                    {item.type !== 'check_in' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                            {(item.tasksUpdated + (item.tasksCompleted || 0)) > 0 && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                📋 {item.tasksUpdated + (item.tasksCompleted || 0)} tugas
                              </Badge>
                            )}
                            {item.keyResultsUpdated > 0 && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                🎯 {item.keyResultsUpdated} target
                              </Badge>
                            )}
                            {(item.successMetricsUpdated || 0) > 0 && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                📊 {item.successMetricsUpdated} metrik
                              </Badge>
                            )}
                            {(item.deliverablesUpdated || 0) > 0 && (
                              <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800">
                                📦 {item.deliverablesUpdated} output
                              </Badge>
                            )}
                          </div>

                          {/* Detail Toggle Button */}
                          {((item.tasksUpdated + (item.tasksCompleted || 0)) > 0 || 
                            item.keyResultsUpdated > 0 || 
                            (item.successMetricsUpdated || 0) > 0 || 
                            (item.deliverablesUpdated || 0) > 0 ||
                            item.whatWorkedWell ||
                            item.challenges) && (
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                            >
                              <span>{expandedDetails[item.id] ? 'Sembunyikan' : 'Lihat Detail'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${
                                expandedDetails[item.id] ? 'rotate-180' : ''
                              }`} />
                            </button>
                          )}
                        </div>

                        {/* Expandable Detail Section */}
                        {expandedDetails[item.id] && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                            {/* Tasks Detail */}
                            {(item.tasksUpdated + (item.tasksCompleted || 0)) > 0 && item.tasksSummary && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="font-semibold text-sm text-blue-800">Tugas yang Diupdate:</span>
                                </div>
                                <div className="text-sm text-gray-700 pl-4 space-y-1">
                                  {item.tasksSummary.split(', ').map((task: string, index: number) => {
                                    const match = task.match(/^(.+?)\s*\((.+?)\s*->\s*(.+?)\)$/);
                                    if (match) {
                                      const [, taskName, oldStatus, newStatus] = match;
                                      const statusMap: Record<string, string> = {
                                        'belum_mulai': 'Belum Mulai',
                                        'in_progress': 'Sedang Berjalan',
                                        'completed': 'Selesai',
                                        'cancelled': 'Dibatalkan'
                                      };
                                      return (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-xs">•</span>
                                          <span className="font-medium">{taskName.trim()}</span>
                                          <span className="text-xs text-gray-500">
                                            ({statusMap[oldStatus.trim()] || oldStatus.trim()} → {statusMap[newStatus.trim()] || newStatus.trim()})
                                          </span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-xs">•</span>
                                          <span>{task.trim()}</span>
                                        </div>
                                      );
                                    }
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Key Results Detail */}
                            {item.keyResultsUpdated > 0 && item.keyResultsSummary && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <span className="font-semibold text-sm text-purple-800">Key Result yang Diupdate:</span>
                                </div>
                                <div className="text-sm text-gray-700 pl-4 space-y-1">
                                  {item.keyResultsSummary.split(', ').map((keyResult: string, index: number) => {
                                    const match = keyResult.match(/^(.+?)\s*\((.+?)\s*->\s*(.+?)\)$/);
                                    if (match) {
                                      const [, krName, oldValue, newValue] = match;
                                      return (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-xs">•</span>
                                          <span className="font-medium">{krName.trim()}</span>
                                          <span className="text-xs text-gray-500">
                                            ({oldValue.trim()} → {newValue.trim()})
                                          </span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-xs">•</span>
                                          <span>{keyResult.trim()}</span>
                                        </div>
                                      );
                                    }
                                  })}
                                </div>
                              </div>
                            )}

                            {/* What Worked Well */}
                            {item.whatWorkedWell && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-semibold text-sm text-green-800">Yang Berjalan Baik:</span>
                                </div>
                                <div className="text-sm text-gray-700 pl-4">
                                  {item.whatWorkedWell}
                                </div>
                              </div>
                            )}

                            {/* Challenges */}
                            {item.challenges && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="font-semibold text-sm text-red-800">Tantangan:</span>
                                </div>
                                <div className="text-sm text-gray-700 pl-4">
                                  {item.challenges}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress Information for Check-ins */}
                    {item.type === 'check_in' && item.keyResultTitle && (
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-purple-800">Progress Capaian:</span>
                          <span className="text-xs font-bold text-purple-900">
                            {formatWithThousandSeparator(item.checkInValue || '')} {item.keyResultUnit || ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-purple-700">Target:</span>
                          <span className="text-xs text-purple-700">
                            {formatWithThousandSeparator(item.keyResultTargetValue || '')} {item.keyResultUnit || ''}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {item.checkInValue && item.keyResultTargetValue && (
                          <div className="mb-2">
                            {(() => {
                              const currentValue = parseFloat(item.checkInValue.toString().replace(/[^\d.-]/g, ''));
                              const targetValue = parseFloat(item.keyResultTargetValue.toString().replace(/[^\d.-]/g, ''));
                              const percentage = Math.min((currentValue / targetValue) * 100, 100);

                              return (
                                <div className="w-full bg-purple-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {item.checkInNotes && (
                          <div className="mt-2 pt-2 border-t border-purple-200">
                            <div className="text-xs font-medium text-purple-800 mb-1">Catatan:</div>
                            <div className="text-xs text-purple-700 italic">"{item.checkInNotes}"</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Engagement Bar */}
                <div className="border-t border-gray-100 px-3 md:px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactionToggle(item.id)}
                        className={`px-2 py-1 transition-colors ${
                          reactions[item.id]?.liked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${reactions[item.id]?.liked ? 'fill-current' : ''}`} />
                        <span className="text-xs">
                          {reactions[item.id]?.liked ? 'Disukai' : 'Suka'}
                          {reactions[item.id]?.likeCount > 0 && ` (${reactions[item.id].likeCount})`}
                        </span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(item.id)}
                        className="text-gray-500 hover:text-blue-500 px-2 py-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        <span className="text-xs">
                          Komentar
                          {commentsData[item.id]?.length > 0 ? ` (${commentsData[item.id].length})` : ''}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  {showComments[item.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      {/* Existing Comments */}
                      {commentsData[item.id]?.length > 0 && (
                        <div className="space-y-3 mb-3">
                          {commentsData[item.id].map((comment: any) => (
                            <div key={comment.id} className="flex space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                {(comment.userName || comment.userEmail || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-900">
                                      {comment.userName || comment.userEmail}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {getTimeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {comment.content}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {commentsLoading[item.id] && (
                        <div className="text-center py-2">
                          <div className="text-xs text-gray-500">Memuat komentar...</div>
                        </div>
                      )}

                      {/* Add New Comment */}
                      <div className="flex space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {((user as any)?.name || (user as any)?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex space-x-2">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                placeholder="Tulis komentar..."
                                value={commentTexts[item.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && commentTexts[item.id]?.trim()) {
                                    handleAddComment(item.id, commentTexts[item.id]);
                                  }
                                }}
                                className="w-full text-sm px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🎭 Emoji button clicked for item:', item.id);
                                  toggleEmojiPicker(item.id);
                                }}
                                className="emoji-button absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
                              >
                                <Smile className="w-3 h-3 text-gray-500" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (commentTexts[item.id]?.trim()) {
                                  handleAddComment(item.id, commentTexts[item.id]);
                                }
                              }}
                              disabled={!commentTexts[item.id]?.trim() || addCommentMutation.isPending}
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* Emoji Picker */}
                          {(() => {
                            const shouldShow = showEmojiPicker[item.id];
                            console.log(`🎭 Should show emoji picker for ${item.id}:`, shouldShow);
                            return shouldShow && (
                              <div className="emoji-picker-container bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                <div className="text-xs text-gray-500 mb-2 font-medium">Pilih Emoticon:</div>
                                <div className="grid grid-cols-8 gap-1">
                                  {emoticons.map((emoji, index) => (
                                    <button
                                      key={index}
                                      onClick={() => addEmojiToComment(item.id, emoji)}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-sm transition-colors"
                                      title={emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredTimeline.length > 5 && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/timeline'}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Lihat Semua di Timeline Lengkap
                </Button>
              </div>
            )}
          </div>
        )}
            </div>
          </div>

          {/* Right Sidebar - User Activity (Desktop) */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tim Activity</label>
                <div className="text-xs text-gray-500">
                  Update terbaru dari anggota tim
                </div>
              </div>
              
              <div className="space-y-3">
                {(() => {
                  // Create user activity summary from timeline data
                  const userActivity = (users as any[]).map((user: any) => {
                    const userTimeline = (timelineData || []).filter((item: any) => 
                      item.userId === user.id
                    );
                    
                    const lastUpdate = userTimeline.length > 0 
                      ? userTimeline.sort((a: any, b: any) => 
                          new Date(b.updateDate || b.createdAt).getTime() - 
                          new Date(a.updateDate || a.createdAt).getTime()
                        )[0]
                      : null;
                    
                    return {
                      ...user,
                      lastUpdate,
                      updateCount: userTimeline.length
                    };
                  }).sort((a: any, b: any) => {
                    // Sort by last update date (most recent first)
                    if (!a.lastUpdate && !b.lastUpdate) return 0;
                    if (!a.lastUpdate) return 1;
                    if (!b.lastUpdate) return -1;
                    return new Date(b.lastUpdate.updateDate || b.lastUpdate.createdAt).getTime() - 
                           new Date(a.lastUpdate.updateDate || a.lastUpdate.createdAt).getTime();
                  });

                  return userActivity.map((userInfo: any) => (
                    <div key={userInfo.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        {userInfo.profileImageUrl ? (
                          <img 
                            src={userInfo.profileImageUrl} 
                            alt={userInfo.name || userInfo.email}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {(userInfo.name || userInfo.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {userInfo.name || userInfo.email}
                          </h3>
                          {userInfo.updateCount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {userInfo.updateCount}
                            </span>
                          )}
                        </div>
                        
                        {userInfo.lastUpdate ? (
                          <div className="mt-1">
                            <div className="text-xs text-gray-500">
                              {getTimeAgo(userInfo.lastUpdate.updateDate || userInfo.lastUpdate.createdAt)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {userInfo.lastUpdate.type === 'check_in' ? (
                                <span className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                  Check-in target
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  Update harian
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <div className="text-xs text-gray-400 italic">
                              Belum ada update
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DailyFocusPage() {
  const { user } = useAuth();
  const userId =
    user && typeof user === "object" && "id" in user ? (user as any).id : null;

  // Move all hooks before any early returns
  const [selectedKeyResult, setSelectedKeyResult] = useState<any>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSuccessMetricsModalOpen, setIsSuccessMetricsModalOpen] =
    useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "all"); // Filter state - default to current user
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Goal creation modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Initiative creation modal state
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('daily-focus');
  
  // Modal states for company details and welcome screen
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);







  // Status update mutation
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusUpdateMutation = useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
    }: {
      taskId: string;
      newStatus: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });
      toast({
        title: "Status berhasil diupdate",
        description: "Status task telah diperbarui",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle status update from dropdown
  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    statusUpdateMutation.mutate({ taskId, newStatus });
  };

  // Fetch data with status calculation
  const { data: objectives = [], isLoading: isLoadingObjectives } = useQuery({
    queryKey: ["/api/okrs"],
  });



  // Extract key results from objectives data (includes calculated status)
  const keyResults = React.useMemo(() => {
    return (objectives as any[]).flatMap((obj: any) => obj.keyResults || []);
  }, [objectives]);

  const { data: initiatives = [], isLoading: isLoadingInitiatives } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: myTasks = [], isLoading: isLoadingMyTasks } = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
  });

  const { data: allTasks = [], isLoading: isLoadingAllTasks } = useQuery({
    queryKey: ["/api/tasks"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Filter active users for better performance
  const activeUsers = (users as any[]).filter((user: any) => user.isActive === true);

  const { data: cycles = [], isLoading: isLoadingCycles } = useQuery({
    queryKey: ["/api/cycles"],
  });

  // Trial achievements query for missions
  const { data: achievements = [], isLoading: isLoadingAchievements } =
    useQuery({
      queryKey: ["/api/trial/achievements"],
      enabled: !!userId,
    });

  // Organization data query
  const { data: organizationData, isLoading: isOrgDataLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });

  // Current user data query
  const { data: currentUserData, isLoading: isUserDataLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });

  // Update selectedUserId when userId changes
  useEffect(() => {
    if (userId && selectedUserId === "all") {
      setSelectedUserId("all");
    }
  }, [userId, selectedUserId]);

  // Company details and welcome screen logic
  useEffect(() => {
    if (!currentUserData || isUserDataLoading || !organizationData || isOrgDataLoading) {
      return;
    }

    const companyDetailsCompleted = localStorage.getItem("company-details-completed");
    const onboardingCompleted = localStorage.getItem("onboarding-completed");
    const welcomeShown = localStorage.getItem("welcome-screen-shown");
    const tourStarted = localStorage.getItem("tour-started");
    const tourCompleted = localStorage.getItem("tour-completed");
    
    console.log("🔍 Company details check:", { companyDetailsCompleted, onboardingCompleted, welcomeShown, tourStarted, tourCompleted });
    console.log("🔍 Current user data:", currentUserData);
    console.log("🔍 Is loading:", isUserDataLoading);
    
    // Check if organization has complete company details from database
    let hasCompleteCompanyDetails = false;
    if (organizationData?.organization) {
      const org = organizationData.organization;
      hasCompleteCompanyDetails = !!(org.companyAddress && org.province && org.city);
      console.log("🏢 Database company details check:", { 
        companyAddress: org.companyAddress, 
        province: org.province, 
        city: org.city,
        hasCompleteCompanyDetails
      });
    }
    
    // Company details modal HIDDEN per user request
    // Only show modal if we have loaded organization data and company details are incomplete
    if (false && organizationData && !isOrgDataLoading && !hasCompleteCompanyDetails) {
      console.log("📝 Showing company details modal - missing required fields");
      setShowCompanyDetailsModal(true);
      return;
    }
    
    // For users with complete company details, ensure modal is hidden
    if (hasCompleteCompanyDetails) {
      console.log("✅ Company details are complete - hiding modal");
      setShowCompanyDetailsModal(false);
      
      // Update localStorage to reflect completion
      if (companyDetailsCompleted !== "true") {
        localStorage.setItem("company-details-completed", "true");
      }
      
      // Show welcome screen if user hasn't seen it AND hasn't started/completed tour
      if (welcomeShown !== "true" && tourStarted !== "true" && tourCompleted !== "true") {
        console.log("✅ Triggering welcome screen display");
        setShowWelcomeScreen(true);
      }
    }

    // Listen for manual welcome screen trigger
    const handleShowWelcomeScreen = () => {
      console.log("🎉 Manual welcome screen triggered");
      setShowWelcomeScreen(true);
    };

    window.addEventListener('showWelcomeScreen', handleShowWelcomeScreen);
    
    return () => {
      window.removeEventListener('showWelcomeScreen', handleShowWelcomeScreen);
    };
  }, [currentUserData, isUserDataLoading, organizationData, isOrgDataLoading]);

  // Custom hook to get comment count for a specific task
  const useTaskCommentCount = (taskId: string) => {
    const { data: comments = [] } = useQuery({
      queryKey: [`/api/tasks/${taskId}/comments`],
      enabled: !!taskId,
      staleTime: 30000, // Cache for 30 seconds
    });
    return (comments as any[]).length;
  };

  // Task Comment Count Component
  const TaskCommentCount = ({ taskId }: { taskId: string }) => {
    const commentCount = useTaskCommentCount(taskId);

    if (commentCount === 0) {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
              <MessageSquare className="h-3 w-3" />
              <span>{commentCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{commentCount} komentar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Specific 3-step sequential missions configuration
  const missionSequence = [
    {
      name: "Menambahkan Member",
      icon: "UserPlus",
      description:
        "Tambahkan anggota baru ke tim Anda untuk memulai kolaborasi",
    },
    {
      name: "Membuat Objective",
      icon: "Target",
      description: "Definisikan tujuan utama yang ingin dicapai tim Anda",
    },
    {
      name: "Update Capaian Key Result",
      icon: "TrendingUp",
      description: "Pantau dan update progress pencapaian target angka",
    },
  ];

  // Transform achievements to match mission sequence order
  const orderlyMissions = missionSequence.map((mission, index) => {
    const achievement = achievements.find(
      (a) =>
        a.name.includes(mission.name) ||
        a.description.includes(mission.name.toLowerCase()),
    );

    return {
      id: `mission-${index + 1}`,
      name: mission.name,
      description: mission.description,
      icon: mission.icon,
      unlocked: achievement ? achievement.unlocked : false,
    };
  });

  // Task creation mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });

      // Force refetch to ensure data is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      }, 100);

      toast({
        title: "Task berhasil dibuat",
        description: "Task baru telah ditambahkan",
        variant: "success",
      });
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal membuat task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Task deletion mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });
      toast({
        title: "Task berhasil dihapus",
        description: "Task telah dihapus dari sistem",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menghapus task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle opening goal modal
  const handleOpenGoalModal = () => {
    setIsGoalModalOpen(true);
  };

  // Task action handlers

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const { data: stats } = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: any;
    }) => {
      return await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/tasks`],
      });
      toast({
        title: "Task berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get today's date info using GMT+7 timezone
  const today = new Date();
  const utc = today.getTime() + today.getTimezoneOffset() * 60000;
  const gmt7Date = new Date(utc + 7 * 3600000); // GMT+7
  const todayStr =
    gmt7Date.getFullYear() +
    "-" +
    String(gmt7Date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(gmt7Date.getDate()).padStart(2, "0");

  // Helper function for key result type icons
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
            "Target Penurunan - Progress dihitung mundur dari nilai awal ke target",
        };
      case "should_stay_above":
        return {
          icon: MoveUp,
          tooltip:
            "Tetap Di Atas - Nilai harus tetap berada di atas ambang batas target",
        };
      case "should_stay_below":
        return {
          icon: MoveDown,
          tooltip:
            "Tetap Di Bawah - Nilai harus tetap berada di bawah ambang batas target",
        };
      case "achieve_or_not":
        return {
          icon: Target,
          tooltip: "Target Binary - 100% jika tercapai, 0% jika tidak",
        };
      default:
        return {
          icon: Target,
          tooltip: "Tipe target tidak diketahui",
        };
    }
  };

  // Helper functions
  const calculateKeyResultProgress = (keyResult: any): number => {
    const current = Number(keyResult.currentValue) || 0;
    const target = Number(keyResult.targetValue) || 0;
    const base = Number(keyResult.baseValue) || 0;

    if (keyResult.keyResultType === "achieve_or_not") {
      return keyResult.achieved ? 100 : 0;
    }

    if (keyResult.keyResultType === "increase_to") {
      if (base === target) return 0;
      return Math.min(
        100,
        Math.max(0, ((current - base) / (target - base)) * 100),
      );
    }

    if (keyResult.keyResultType === "decrease_to") {
      if (base === target) return 0;
      return Math.min(
        100,
        Math.max(0, ((base - current) / (base - target)) * 100),
      );
    }

    if (keyResult.keyResultType === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (keyResult.keyResultType === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

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

  // Helper functions for priority styling
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

  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleCheckInKeyResult = (keyResult: any) => {
    setSelectedKeyResult(keyResult);
    setIsCheckInModalOpen(true);
  };

  const handleUpdateMetrics = (initiative: any) => {
    setSelectedInitiative(initiative);
    setIsSuccessMetricsModalOpen(true);
  };

  // Helper function to get user name by ID (using consolidated name field)
  const getUserName = (userId: string): string => {
    if (!users || !userId) return "Tidak ditentukan";
    const user = users.find((u: any) => u.id === userId);

    // Use the consolidated name field
    if (user?.name && user.name.trim() !== "") {
      return user.name.trim();
    }

    // Fallback to email username if name is not available
    if (user?.email) {
      return user.email.split('@')[0];
    }

    return "Pengguna";
  };

  // Helper function to get user initials for avatar (using consolidated name field)
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

  // Helper function to get initiative count for a key result
  const getInitiativeCount = (keyResultId: string): number => {
    return initiatives.filter((init: any) => init.keyResultId === keyResultId)
      .length;
  };
  
  useEffect(() => {
    // Check localStorage flags
    const companyDetailsCompleted = localStorage.getItem("company-details-completed");
    const welcomeShown = localStorage.getItem("welcome-screen-shown");
    const onboardingCompleted = localStorage.getItem("onboarding-completed");
    const tourStarted = localStorage.getItem("tour-started");
    const tourCompleted = localStorage.getItem("tour-completed");
    
    console.log("🔍 Company details check:", { companyDetailsCompleted, onboardingCompleted, welcomeShown, tourStarted, tourCompleted });
    console.log("🔍 Current user data:", currentUserData);
    console.log("🔍 Is loading:", isUserDataLoading);
    
    // Check if organization has complete company details from database
    let hasCompleteCompanyDetails = false;
    if (organizationData?.organization) {
      const org = organizationData.organization;
      hasCompleteCompanyDetails = !!(org.companyAddress && org.province && org.city);
      console.log("🏢 Database company details check:", { 
        companyAddress: org.companyAddress, 
        province: org.province, 
        city: org.city,
        hasCompleteCompanyDetails
      });
    }
    
    // Company details modal HIDDEN per user request
    // Only show modal if we have loaded organization data and company details are incomplete
    if (false && organizationData && !isOrgDataLoading && !hasCompleteCompanyDetails) {
      console.log("📝 Showing company details modal - missing required fields");
      setShowCompanyDetailsModal(true);
      return;
    }
    
    // For users with complete company details, ensure modal is hidden
    if (hasCompleteCompanyDetails) {
      console.log("✅ Company details are complete - hiding modal");
      setShowCompanyDetailsModal(false);
      
      // Update localStorage to reflect completion
      if (companyDetailsCompleted !== "true") {
        localStorage.setItem("company-details-completed", "true");
      }
      
      // Show welcome screen if user hasn't seen it AND hasn't started/completed tour
      if (welcomeShown !== "true" && tourStarted !== "true" && tourCompleted !== "true") {
        console.log("✅ Triggering welcome screen display");
        setShowWelcomeScreen(true);
      }
    }

    // Listen for manual welcome screen trigger
    const handleShowWelcomeScreen = () => {
      console.log("🎉 Manual welcome screen triggered");
      setShowWelcomeScreen(true);
    };

    window.addEventListener('showWelcomeScreen', handleShowWelcomeScreen);
    
    return () => {
      window.removeEventListener('showWelcomeScreen', handleShowWelcomeScreen);
    };
  }, [currentUserData, isUserDataLoading, organizationData, isOrgDataLoading]);

  const handleCompanyDetailsComplete = () => {
    setShowCompanyDetailsModal(false);
    
    // Force refresh user data to get updated company details
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    
    // After company details, show welcome screen
    setShowWelcomeScreen(true);
  };

  const handleCloseWelcomeScreen = () => {
    setShowWelcomeScreen(false);
    localStorage.setItem("welcome-screen-shown", "true");
  };

  const handleStartTour = () => {
    setShowWelcomeScreen(false);
    localStorage.setItem("welcome-screen-shown", "true");
    
    // Dispatch custom event to start tour
    const startTourEvent = new CustomEvent('startTour', {
      detail: { fromWelcomeScreen: true }
    });
    window.dispatchEvent(startTourEvent);
    
    console.log("Starting tour...");
  };

  // Early return check - must be AFTER all hooks are called
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton />
      </div>
    );
  }



  // Apply user filter to tasks and key results
  const filteredTasks =
    selectedUserId === "all"
      ? (allTasks as any[])
      : (allTasks as any[]).filter(
          (task: any) => task.assignedTo === selectedUserId,
        );

  const filteredKeyResults =
    selectedUserId === "all"
      ? (keyResults as any[])
      : (keyResults as any[]).filter(
          (kr: any) => kr.assignedTo === selectedUserId,
        );

  const filteredInitiatives =
    selectedUserId === "all"
      ? (initiatives as any[])
      : (initiatives as any[]).filter(
          (init: any) => init.picId === selectedUserId,
        );



  // Helper function to categorize tasks by date - matching Tasks page logic
  const categorizeTaskByDate = (task: any): 'overdue' | 'today' | 'upcoming' => {
    if (!task.dueDate) return 'upcoming';
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today && task.status !== 'completed' && task.status !== 'cancelled') {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  // Filter data for today's focus
  const todayTasks = filteredTasks.filter((task: any) => {
    // For today's tasks, use startDate if available, otherwise fallback to dueDate
    // Also include in-progress tasks regardless of date
    if (task.status === "in_progress") return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check startDate first for today's tasks
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate.getTime() === today.getTime()) return true;
    }
    
    // Fallback to dueDate logic for backward compatibility
    return categorizeTaskByDate(task) === 'today';
  });

  const overdueTasks = filteredTasks.filter((task: any) => {
    // Overdue tasks use dueDate (tasks that were due before today)
    return categorizeTaskByDate(task) === 'overdue';
  });

  // Tomorrow's tasks - use startDate if available, otherwise fallback to dueDate
  const tomorrowTasks = filteredTasks.filter((task: any) => {
    if (task.status === "completed" || task.status === "cancelled") return false;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Check startDate first for tomorrow's tasks
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate.getTime() === tomorrow.getTime();
    }
    
    // Fallback to dueDate logic for backward compatibility
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === tomorrow.getTime();
    }
    
    return false;
  });

  const activeKeyResults = filteredKeyResults.filter((kr: any) => {
    // Include key results that are not cancelled
    // This allows showing all active key results including 100% completed ones
    return kr.status !== "cancelled";
  });

  const activeInitiatives = filteredInitiatives.filter((init: any) => {
    // Include draft and running initiatives
    if (init.status === "sedang_berjalan" || init.status === "draft" || init.status === "in_progress" || init.status === "not_started") {
      return true;
    }
    
    // Include cancelled initiatives - they can be reopened
    if (init.status === "dibatalkan" || init.status === "cancelled") {
      return true;
    }
    
    // Include completed initiatives if they are still within today's timeline
    if (init.status === "selesai" || init.status === "completed") {
      const dueDate = init.dueDate ? init.dueDate.split("T")[0] : null;
      const startDate = init.startDate ? init.startDate.split("T")[0] : null;
      
      // Show completed initiatives if:
      // 1. Due date is today or later (still within timeline), OR
      // 2. Start date is today (recently started and completed), OR
      // 3. No due date but started recently (within last 7 days)
      let shouldInclude = false;
      
      if (dueDate && dueDate >= todayStr) {
        shouldInclude = true; // Due date is today or future
      } else if (startDate && startDate === todayStr) {
        shouldInclude = true; // Started today
      } else if (!dueDate && startDate) {
        // No due date - check if started recently (within last 7 days)
        const startTime = new Date(startDate).getTime();
        const todayTime = new Date(todayStr).getTime();
        const daysDiff = (todayTime - startTime) / (1000 * 60 * 60 * 24);
        shouldInclude = daysDiff <= 7; // Show if completed within last 7 days
      }
      
      return shouldInclude;
    }
    
    return false;
  });



  // Get related objectives for today's activities
  const getRelatedObjectives = () => {
    const relatedObjIds = new Set();

    // From key results
    activeKeyResults.forEach((kr: any) => {
      if (kr.objectiveId) relatedObjIds.add(kr.objectiveId);
    });

    // From initiatives
    activeInitiatives.forEach((init: any) => {
      if (init.keyResultId) {
        const kr = (keyResults as any[]).find(
          (k: any) => k.id === init.keyResultId,
        );
        if (kr?.objectiveId) relatedObjIds.add(kr.objectiveId);
      }
    });

    // Filter objectives by related IDs or status
    let filteredObjectives = (objectives as any[]).filter(
      (obj: any) =>
        relatedObjIds.has(obj.id) ||
        obj.status === "on_track" ||
        obj.status === "at_risk" ||
        obj.status === "in_progress" ||
        obj.status === "not_started",
    );

    // Apply user filter - show objectives that are owned by user or have key results assigned to the selected user
    if (selectedUserId !== "all") {
      filteredObjectives = filteredObjectives.filter((obj: any) => {
        // Include objective if user is the owner
        if (obj.ownerId === selectedUserId) {
          return true;
        }

        // Include objective if any of its key results are assigned to the selected user
        const objectiveKeyResults = (keyResults as any[]).filter(
          (kr: any) => kr.objectiveId === obj.id,
        );
        return objectiveKeyResults.some(
          (kr: any) => kr.assignedTo === selectedUserId,
        );
      });
    }

    return filteredObjectives;
  };

  const relatedObjectives = getRelatedObjectives();

  // Missing function implementations
  const handleToggleTaskStatus = (taskId: number, newStatus: string) => {
    statusUpdateMutation.mutate({
      id: taskId,
      status: newStatus
    });
  };

  const handleOpenCheckInModal = (keyResult: any) => {
    setSelectedKeyResult(keyResult);
    setIsCheckInModalOpen(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID");
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcomeScreen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div data-tour="dashboard">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              Pusat kendali produktivitas dan progress Anda
            </p>
          </div>

          {/* User Filter, Daily Check-in, and Tour Button - desktop */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="hidden sm:flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih anggota tim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Anggota Tim</SelectItem>
                  {activeUsers?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name && user.name.trim() !== ''
                        ? user.name.trim()
                        : user.email?.split('@')[0] || user.username || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:block" data-tour="update-harian-instan">
              <DailyUpdateSimple />
            </div>
            <div className="hidden sm:block">
              <TourStartButton variant="outline" size="sm" />
            </div>
          </div>
        </div>

        {/* Onboarding Missions Section - Only for client owners */}
        {user && (
          <div data-testid="onboarding-missions">
            <MissionCard
              missions={orderlyMissions}
              title="Panduan Onboarding Platform"
              description="Ikuti langkah-langkah ini untuk memulai menggunakan platform"
              className="mb-6"
            />
          </div>
        )}

        {/* Controls - Mobile User Filter */}
        <div className="flex flex-col sm:hidden gap-3">
          {/* User Filter - Mobile only */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih anggota tim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Anggota Tim</SelectItem>
                {activeUsers?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name && user.name.trim() !== ''
                      ? user.name.trim()
                      : user.email?.split('@')[0] || user.username || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons - Mobile */}
          <div className="flex items-center gap-2 justify-end">
            <div data-tour="update-harian-instan">
              <DailyUpdateSimple />
            </div>
            <TourStartButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
      {/* Filter Indicator - Only show when viewing another user's data */}
      {selectedUserId !== "all" && selectedUserId !== userId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <User className="h-4 w-4" />
            <span>
              Menampilkan objective, task, dan aktivitas untuk:{" "}
              <span className="font-medium">
                {(() => {
                  const selectedUser = activeUsers?.find((u: any) => u.id === selectedUserId);
                  if (selectedUser?.name && selectedUser.name.trim() !== '') {
                    return selectedUser.name.trim();
                  }
                  return selectedUser?.email?.split('@')[0] || selectedUser?.username || "Unknown";
                })()}
              </span>
            </span>
          </div>
        </div>
      )}
      
      {/* Compact Progress & Motivation */}
      <Card
        className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50"
      >
        <CardContent className="p-3 md:p-4">
          {/* Mobile: 3-column layout */}
          <div className="block md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                Progress Hari Ini
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Task Selesai */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-green-700">
                  {todayTasks.filter((t) => t.status === "completed").length}
                </div>
                <div className="text-xs text-green-600">Task Selesai</div>
                {todayTasks.filter((t) => t.status === "completed").length >
                  0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1">
                    +
                    {todayTasks.filter((t) => t.status === "completed").length *
                      10}{" "}
                    poin
                  </div>
                )}
              </div>

              {/* Target Aktif */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-lg font-semibold text-blue-700">
                  {activeKeyResults.length}
                </div>
                <div className="text-xs text-blue-600">Total Target</div>
              </div>

              {/* Streak */}
              <div className="text-center p-3 bg-white/50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-sm">🔥</span>
                </div>
                <div className="text-lg font-semibold text-orange-700">
                  {(stats as any)?.currentStreak || 0}
                </div>
                <div className="text-xs text-orange-600">Hari Berturut</div>
              </div>
            </div>
          </div>

          {/* Desktop: Original horizontal layout */}
          <div className="hidden md:block">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Progress Hari Ini
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">
                      {
                        todayTasks.filter((t) => t.status === "completed")
                          .length
                      }{" "}
                      task selesai
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-700">
                      {activeKeyResults.length} total target
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(stats as any)?.currentStreak &&
                  (stats as any).currentStreak > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full cursor-help">
                          <span>🔥</span>
                          <span>
                            {(stats as any).currentStreak} hari berturut
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Jumlah hari berturut-turut Anda menyelesaikan
                          setidaknya satu task
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                {todayTasks.filter((t) => t.status === "completed").length >
                  0 && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    +
                    {todayTasks.filter((t) => t.status === "completed").length *
                      10}{" "}
                    poin hari ini
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      
      {/* Main Content Tabs */}
      <div className="w-full">
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("daily-focus")}
              className={`pb-3 px-4 border-b-2 font-medium text-base ${
                activeTab === "daily-focus"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-tour="daily-focus-tab"
            >
              <div className="flex items-center space-x-2">
                <Sun className="w-5 h-5" />
                <span>Daily Focus</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 px-4 border-b-2 font-medium text-base ${
                activeTab === "timeline"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-tour="timeline-tab"
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Timeline</span>
              </div>
            </button>
          </div>
        </div>

        {/* Daily Focus Tab Content */}
        {activeTab === "daily-focus" && (
        <div className="space-y-6 mt-6">
          {/* Goal Section */}
          <Card className="border-blue-200 bg-blue-50" data-tour="goal-terkait-aktivitas">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-blue-900 flex items-center gap-2 text-base sm:text-lg">
                    <Target className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">
                      Goal Terkait Aktivitas Hari Ini
                    </span>
                  </CardTitle>
                  <CardDescription className="text-blue-700 text-sm mt-1">
                    {relatedObjectives.length > 0
                      ? "Tetap ingat tujuan utama yang mendorong aktivitas harian Anda"
                      : "Mulai dengan menetapkan goal utama untuk mengarahkan aktivitas harian Anda"}
                  </CardDescription>
                </div>
                {relatedObjectives.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto flex-shrink-0"
                    onClick={handleOpenGoalModal}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Tambah Goal</span>
                    <span className="sm:hidden">Tambah</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {relatedObjectives.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-12 gap-4 pb-2 min-w-max">
                      {relatedObjectives.map((obj: any) => {
                        const objKeyResults = (keyResults as any[]).filter(
                          (kr) => kr.objectiveId === obj.id,
                        );
                        const objProgress =
                          objKeyResults.length > 0
                            ? objKeyResults.reduce(
                                (sum, kr) => sum + calculateKeyResultProgress(kr),
                                0,
                              ) / objKeyResults.length
                            : 0;

                        return (
                          <div
                            key={obj.id}
                            className="p-4 bg-white border border-blue-200 rounded-lg col-span-4"
                          >
                            <div className="space-y-3">
                              <div>
                                <Link
                                  href={`/objectives/${obj.id}`}
                                  className="font-medium text-blue-900 hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  <h3 className="line-clamp-2">{obj.title}</h3>
                                </Link>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-700">Progress</span>
                                  <span className="font-medium text-blue-900">
                                    {objProgress.toFixed(0)}%
                                  </span>
                                </div>
                                <Progress value={objProgress} className="h-2" />
                              </div>

                              {/* Target Ideal Information */}
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Target Ideal: {obj.targetIdeal || "70"}% pada
                                periode ini
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className={
                                    obj.status === "on_track"
                                      ? "border-green-300 text-green-700 bg-green-50"
                                      : obj.status === "at_risk"
                                        ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                        : obj.status === "behind"
                                          ? "border-red-300 text-red-700 bg-red-50"
                                          : obj.status === "not_started"
                                            ? "border-gray-300 text-gray-700 bg-gray-50"
                                            : "border-blue-300 text-blue-700 bg-blue-50"
                                  }
                                >
                                  {obj.status === "on_track"
                                    ? "On Track"
                                    : obj.status === "at_risk"
                                      ? "At Risk"
                                      : obj.status === "behind"
                                        ? "Behind"
                                        : obj.status === "not_started"
                                          ? "Belum Mulai"
                                          : obj.status === "in_progress"
                                            ? "Sedang Berjalan"
                                            : obj.status}
                                </Badge>

                                <div className="text-xs text-blue-600">
                                  {objKeyResults.length} Angka Target
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {relatedObjectives.length > 3 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-blue-600">
                        Geser ke kanan untuk melihat goal lainnya
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 px-4">
                  <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    Belum Ada Goal
                  </h3>
                  <p className="text-sm text-blue-600 mb-4 max-w-md mx-auto">
                    Buat goal pertama Anda untuk mengarahkan aktivitas harian dan
                    mencapai target yang jelas
                  </p>
                  <Button
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                    onClick={handleOpenGoalModal}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Goal Pertama
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <DailyFocusCards
            overdueTasks={overdueTasks}
            todayTasks={todayTasks}
            tomorrowTasks={tomorrowTasks}
            isLoadingAllTasks={isLoadingAllTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenTaskModal={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            onToggleTaskStatus={handleToggleTaskStatus}
            activeKeyResults={activeKeyResults}
            isLoadingObjectives={isLoadingObjectives}
            onOpenCheckInModal={handleOpenCheckInModal}
            activeInitiatives={activeInitiatives}
            isLoadingInitiatives={isLoadingInitiatives}
            onUpdateMetrics={handleUpdateMetrics}
            cycles={cycles}
            users={users}
            userFilter={selectedUserId}
            formatDate={formatDate}
          />
          {/* End Daily Focus Tab Content */}
        </div>
        )}

        {/* Timeline Tab Content */}
        {activeTab === "timeline" && (
        <div className="space-y-6 mt-6">
          <TimelineFeedComponent />
        </div>
        )}
      </div>
      {/* Modals */}
      {selectedKeyResult && (
        <CheckInModal
          open={isCheckInModalOpen}
          onOpenChange={setIsCheckInModalOpen}
          keyResultId={selectedKeyResult.id}
          keyResultTitle={selectedKeyResult.title}
          currentValue={selectedKeyResult.currentValue}
          targetValue={selectedKeyResult.targetValue}
          unit={selectedKeyResult.unit}
          keyResultType={selectedKeyResult.keyResultType}
        />
      )}
      {selectedInitiative && (
        <MetricsUpdateModal
          open={isSuccessMetricsModalOpen}
          onOpenChange={setIsSuccessMetricsModalOpen}
          initiativeId={selectedInitiative.id}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Task</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus task "{taskToDelete?.title}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTask}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={selectedTask || undefined}
      />

      {isGoalModalOpen && (
        <GoalFormModal
          open={isGoalModalOpen}
          onOpenChange={setIsGoalModalOpen}
        />
      )}

      {isInitiativeModalOpen && (
        <InitiativeFormModal
          open={isInitiativeModalOpen}
          onOpenChange={setIsInitiativeModalOpen}
        />
      )}

      {showWelcomeScreen && (
        <WelcomeScreen
          onDismiss={handleDismissWelcome}
          onStartTour={handleStartTour}  
        />
      )}

      {showCompanyDetailsModal && (
        <CompanyDetailsModal 
          open={showCompanyDetailsModal}
          onComplete={handleCompanyDetailsComplete}
        />
      )}
    </div>
  );
}

