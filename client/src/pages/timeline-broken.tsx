import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Filter, 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send,
  ChevronDown,
  ChevronUp,
  Smile,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { getUserInitials } from '@/lib/utils';
import { DailyUpdateSimple } from '@/components/daily-update-simple';
import TimelineIcon from '@/components/ui/timeline-icon';
import { Leaderboard } from '@/components/gamification/leaderboard';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TimelineItem {
  id: string;
  userId: string;
  organizationId: string;
  updateDate: string;
  summary: string;
  tasksUpdated: number;
  tasksCompleted: number;
  tasksSummary: string;
  keyResultsUpdated: number;
  keyResultsSummary: string;
  successMetricsUpdated: number;
  successMetricsSummary: string;
  deliverablesUpdated: number;
  deliverablesCompleted: number;
  deliverablesSummary: string;
  whatWorkedWell: string;
  challenges: string;
  totalUpdates: number;
  updateTypes: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImageUrl: string | null;
  };
  // Check-in specific fields
  type?: 'check_in' | 'daily_update';
  userName?: string;
  userProfileImageUrl?: string;
  keyResultId?: string;
  keyResultTitle?: string;
  keyResultUnit?: string;
  keyResultTargetValue?: string;
  keyResultBaseValue?: string;
  keyResultType?: string;
  checkInValue?: string;
  checkInNotes?: string;
}

export default function TimelinePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Helper function for thousand separator formatting
  const formatWithThousandSeparator = (value: string | number) => {
    if (!value && value !== 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value.toString();
    return numValue.toLocaleString('id-ID');
  };
  
  // Filter states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  
  // Social interaction states - now using API data
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showReactionModal, setShowReactionModal] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  
  // Expandable details state
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  
  // Lazy loading state
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Toggle details function
  const toggleDetails = (itemId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Intersection Observer callback untuk lazy loading
  const observeItem = useCallback((node: HTMLElement | null, itemId: string) => {
    if (!node) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleItems(prev => new Set([...prev, itemId]));
          observerRef.current?.unobserve(entry.target);
        }
      },
      {
        rootMargin: '100px 0px', // Load items 100px before they come into view
        threshold: 0.1
      }
    );

    observerRef.current.observe(node);
  }, []);

  // Initialize first few items as visible
  useEffect(() => {
    if (filteredData.length > 0) {
      const initialVisible = filteredData.slice(0, 5).map(item => item.id);
      setVisibleItems(new Set(initialVisible));
    }
  }, [filteredData]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Fetch timeline data
  const { data: timelineData = [], isLoading } = useQuery<TimelineItem[]>({
    queryKey: ['/api/timeline'],
  });

  // Fetch teams data for filter
  const { data: teamsData = [] } = useQuery<any[]>({
    queryKey: ['/api/teams'],
  });

  // Fetch comments for timeline items
  const { data: timelineComments = {} } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/timeline/comments'],
    enabled: timelineData.length > 0,
  });

  // Fetch reactions for timeline items
  const { data: timelineReactions = {} } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/timeline/reactions'],
    enabled: timelineData.length > 0,
  });

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: async ({ checkInId, content }: { checkInId: string; content: string }) => {
      return apiRequest('POST', `/api/timeline/${checkInId}/comments`, { content });
    },
    onSuccess: (_, { checkInId }) => {
      setCommentTexts(prev => ({ ...prev, [checkInId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['/api/timeline/comments'] });
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menambahkan komentar",
        variant: "destructive",
      });
    }
  });

  // Mutation for reactions
  const reactionMutation = useMutation({
    mutationFn: async ({ checkInId, emoji }: { checkInId: string; emoji: string }) => {
      return apiRequest('POST', `/api/timeline/${checkInId}/reactions`, { type: emoji });
    },
    onSuccess: (response: any, { checkInId, emoji }) => {
      setShowReactionPicker(prev => ({ ...prev, [checkInId]: false }));
      queryClient.invalidateQueries({ queryKey: ['/api/timeline/reactions'] });
      
      // Show appropriate toast message
      if (response?.action === 'added') {
        toast({
          title: "Berhasil",
          description: "Reaksi berhasil ditambahkan",
        });
      } else if (response?.action === 'removed') {
        toast({
          title: "Berhasil", 
          description: "Reaksi berhasil dihapus",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Reaksi berhasil diperbarui",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menambahkan reaksi",
        variant: "destructive",
      });
    }
  });

  // Handler functions
  const handleReaction = (timelineItemId: string, emoji: string) => {
    reactionMutation.mutate({ checkInId: timelineItemId, emoji });
  };

  const handleAddComment = (timelineItemId: string) => {
    const content = commentTexts[timelineItemId];
    if (!content?.trim()) return;
    
    addCommentMutation.mutate({ checkInId: timelineItemId, content: content.trim() });
  };

  const toggleComments = (timelineItemId: string) => {
    setShowComments(prev => ({ ...prev, [timelineItemId]: !prev[timelineItemId] }));
  };

  const toggleReaction = (timelineItemId: string) => {
    // For simple like/unlike - using heart emoji
    handleReaction(timelineItemId, '❤️');
  };

  // Get team members for filtering
  const teamMembers = useMemo(() => {
    const members = new Map();
    teamsData.forEach((team: any) => {
      if (team.members) {
        team.members.forEach((member: any) => {
          if (member.user) {
            members.set(member.user.id, {
              ...member.user,
              teamId: team.id,
              teamName: team.name
            });
          }
        });
      }
    });
    return members;
  }, [teamsData]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return timelineData.filter((item) => {
      // Activity type filter
      if (activityTypeFilter !== 'all') {
        if (activityTypeFilter === 'check_in' && item.type !== 'check_in') return false;
        if (activityTypeFilter === 'daily_update' && item.type !== 'daily_update' && item.type !== undefined) return false;
      }

      // User filter
      if (userFilter !== 'all') {
        if (userFilter === 'current' && item.userId !== user?.id) return false;
        if (userFilter !== 'current' && item.userId !== userFilter) return false;
      }
      
      // Team filter
      if (teamFilter !== 'all') {
        const userTeamInfo = teamMembers.get(item.userId);
        if (!userTeamInfo || userTeamInfo.teamId !== teamFilter) return false;
      }

      // Content type filter
      if (contentTypeFilter !== 'all') {
        switch (contentTypeFilter) {
          case 'tasks':
            if (!item.tasksSummary && item.tasksUpdated === 0) return false;
            break;
          case 'key_results':
            if (!item.keyResultsSummary && item.keyResultsUpdated === 0 && item.type !== 'check_in') return false;
            break;
          case 'metrics':
            if (!item.successMetricsSummary && item.successMetricsUpdated === 0) return false;
            break;
          case 'deliverables':
            if (!item.deliverablesSummary && item.deliverablesUpdated === 0) return false;
            break;
        }
      }
      
      // Date range filtering
      if (dateRangeFilter !== 'all') {
        const itemDate = new Date(item.updateDate);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        switch (dateRangeFilter) {
          case 'today':
            if (itemDate < startOfDay) return false;
            break;
          case 'week':
            if (itemDate < startOfWeek) return false;
            break;
          case 'month':
            if (itemDate < startOfMonth) return false;
            break;
        }
      }
      
      return true;
    });
  }, [timelineData, activityTypeFilter, userFilter, teamFilter, dateRangeFilter, contentTypeFilter, teamMembers, user?.id]);

  const clearAllFilters = () => {
    setActivityTypeFilter('all');
    setUserFilter('all');
    setTeamFilter('all');
    setDateRangeFilter('all');
    setContentTypeFilter('all');
  };

  const isDefaultFilter = activityTypeFilter === 'all' && userFilter === 'all' && teamFilter === 'all' && 
    dateRangeFilter === 'all' && contentTypeFilter === 'all';







  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);



  // Emoji options for coworker expressions
  const REACTION_EMOJIS = ['👍', '❤️', '🎉', '💪', '🔥', '👏', '😍', '🚀', '⭐', '💯', '👌', '🤝'];

  // TimelineCard komponen dengan lazy loading
  function TimelineCard({ 
    item, 
    index, 
    isVisible, 
    onObserve
  }: any) {
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Initialize observer when component mounts
    useEffect(() => {
      if (cardRef.current && !isVisible) {
        onObserve(cardRef.current, item.id);
      }
    }, [item.id, isVisible, onObserve]);

    // Show skeleton placeholder untuk item yang belum visible
    if (!isVisible) {
      return (
        <div 
          ref={cardRef}
          className="w-full bg-gray-100 shadow-sm border border-gray-200 rounded-lg overflow-hidden animate-pulse"
          style={{ height: '200px' }}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Card className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3 md:p-4">
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="flex-shrink-0">
                {item.userProfileImageUrl ? (
                  <img 
                    src={item.userProfileImageUrl} 
                    alt={item.userName}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                    {getUserInitials({ name: item.userName })}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                      {item.userName}
                    </h3>
                    <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                    <span className="text-gray-500 text-xs hidden sm:inline">
                      {format(new Date(item.updateDate), "MMM dd, HH:mm")}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {item.type === 'check_in' ? (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 whitespace-nowrap">
                        <span className="hidden sm:inline">Capaian Angka target</span>
                        <span className="sm:hidden">Check-in</span>
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
                    {format(new Date(item.updateDate), "MMM dd, HH:mm")}
                  </span>
                  <p className="text-gray-700 text-xs md:text-sm mt-1">
                    {item.type === 'check_in' 
                      ? (
                        <span>
                          Update capaian: {item.keyResultId ? (
                            <Link href={`/key-results/${item.keyResultId}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                              {item.keyResultTitle || 'Key Result'}
                            </Link>
                          ) : (
                            <span className="font-medium">{item.keyResultTitle || 'Key Result'}</span>
                          )}
                        </span>
                      )
                      : 'Membagikan update progress harian'
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
                <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                  {item.tasksUpdated + item.tasksCompleted > 0 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      📋 {item.tasksUpdated + item.tasksCompleted} tugas
                    </Badge>
                  )}
                  {item.keyResultsUpdated > 0 && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                      🎯 {item.keyResultsUpdated} target
                    </Badge>
                  )}
                  {item.successMetricsUpdated > 0 && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      📊 {item.successMetricsUpdated} metrik
                    </Badge>
                  )}
                  {item.deliverablesUpdated > 0 && (
                    <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800">
                      📦 {item.deliverablesUpdated} output
                    </Badge>
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
                  <div className="mb-2">
                    {(() => {
                      let progressPercentage = 0;
                      const current = parseFloat(item.checkInValue || '0') || 0;
                      const target = parseFloat(item.keyResultTargetValue || '1') || 1;
                      const baseline = parseFloat(item.keyResultBaseValue || '0') || 0;
                      
                      // Calculate progress based on key result type
                      if (item.keyResultType === 'increase_to') {
                        progressPercentage = baseline !== target 
                          ? Math.min(100, Math.max(0, ((current - baseline) / (target - baseline)) * 100))
                          : current >= target ? 100 : 0;
                      } else if (item.keyResultType === 'decrease_to') {
                        progressPercentage = baseline !== target 
                          ? Math.min(100, Math.max(0, ((baseline - current) / (baseline - target)) * 100))
                          : current <= target ? 100 : 0;
                      } else if (item.keyResultType === 'achieve_or_not') {
                        progressPercentage = current >= target ? 100 : 0;
                      }
                      
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-700">Progress:</span>
                            <span className="text-xs font-bold text-purple-900">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progressPercentage >= 100 ? 'bg-green-500' :
                                progressPercentage >= 75 ? 'bg-blue-500' :
                                progressPercentage >= 50 ? 'bg-yellow-500' :
                                progressPercentage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {item.checkInNotes && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-purple-800 mb-1">Catatan:</div>
                      <div className="text-xs text-purple-700 italic">"{item.checkInNotes}"</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading timeline...</div>;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-4 md:mb-6 bg-white rounded-lg shadow-sm p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TimelineIcon className="w-6 h-6 md:w-8 md:h-8" />
            <span className="hidden sm:inline">Activity Timeline</span>
            <span className="sm:hidden">Timeline</span>
          </h1>
          <div className="flex items-center gap-2 md:gap-3">
            <DailyUpdateSimple />
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden xs:inline">Filter</span>
              </Button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-xs md:text-sm">
          Timeline aktivitas dan update progress dari tim Anda dalam format feed
        </p>
      </div>

      <div className="flex gap-4 lg:gap-6">
        {/* Filter Sidebar */}
        <div className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-white' : 'hidden'} lg:block lg:w-72 lg:flex-shrink-0`}>
          <div className="h-full bg-white border border-gray-200 rounded-lg overflow-y-auto"
               style={{ height: showMobileFilters ? '100vh' : 'auto' }}>
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between p-3 md:p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Filter Timeline</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Filter Content */}
            <div className="p-3 md:p-4 space-y-4 md:space-y-6">
              {/* Filter Counter */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3">
                <div className="text-sm font-medium text-blue-900">
                  Menampilkan {filteredData.length} dari {timelineData.length} aktivitas
                </div>
                {filteredData.length !== timelineData.length && (
                  <div className="text-xs text-blue-700 mt-1">
                    {timelineData.length - filteredData.length} aktivitas disembunyikan
                  </div>
                )}
              </div>

              

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pengguna / Anggota Tim
                </label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pengguna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pengguna</SelectItem>
                    <SelectItem value="current">Pengguna Saat Ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Berdasarkan Tim
                </label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tim</SelectItem>
                    {teamsData.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                        {team.members && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({team.members.length} anggota)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rentang Tanggal
                </label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rentang tanggal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="week">Minggu Ini</SelectItem>
                    <SelectItem value="month">Bulan Ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Konten
                </label>
                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe konten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Konten</SelectItem>
                    <SelectItem value="tasks">Tugas</SelectItem>
                    <SelectItem value="key_results">Target Utama</SelectItem>
                    <SelectItem value="metrics">Metrik Sukses</SelectItem>
                    <SelectItem value="deliverables">Output</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-full"
                disabled={isDefaultFilter}
              >
                Hapus Semua Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {timelineData.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {filteredData.map((item, index) => (
                <TimelineCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  isVisible={visibleItems.has(item.id)}
                  onObserve={observeItem}
                />
              ))}
            </div>
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <div className="flex-shrink-0">
                          {item.userProfileImageUrl ? (
                            <img 
                              src={item.userProfileImageUrl} 
                              alt={item.userName}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                              {getUserInitials({ name: item.userName })}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                                {item.userName}
                              </h3>
                              <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                              <span className="text-gray-500 text-xs hidden sm:inline">
                                {format(new Date(item.updateDate), "MMM dd, HH:mm")}
                              </span>
                            </div>
                            <div className="flex-shrink-0">
                              {item.type === 'check_in' ? (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 whitespace-nowrap">
                                  <span className="hidden sm:inline">Capaian Angka target</span>
                                  <span className="sm:hidden">Check-in</span>
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
                              {format(new Date(item.updateDate), "MMM dd, HH:mm")}
                            </span>
                            <p className="text-gray-700 text-xs md:text-sm mt-1">
                              {item.type === 'check_in' 
                                ? (
                                  <span>
                                    Update capaian: {item.keyResultId ? (
                                      <Link href={`/key-results/${item.keyResultId}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                        {item.keyResultTitle || 'Key Result'}
                                      </Link>
                                    ) : (
                                      <span className="font-medium">{item.keyResultTitle || 'Key Result'}</span>
                                    )}
                                  </span>
                                )
                                : 'Membagikan update progress harian'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-3 md:p-4">
                      <div className="space-y-2 md:space-y-3">
                        {/* Summary Statistics - Hide for check_in items */}
                        {item.type !== 'check_in' && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                              {item.tasksUpdated + item.tasksCompleted > 0 && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  📋 {item.tasksUpdated + item.tasksCompleted} tugas
                                </Badge>
                              )}
                              {item.keyResultsUpdated > 0 && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                  🎯 {item.keyResultsUpdated} target
                                </Badge>
                              )}
                              {item.successMetricsUpdated > 0 && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  📊 {item.successMetricsUpdated} metrik
                                </Badge>
                              )}
                              {item.deliverablesUpdated > 0 && (
                                <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800">
                                  📦 {item.deliverablesUpdated} output
                                </Badge>
                              )}
                            </div>
                            
                            {/* Toggle Details Button - only for non-check_in items */}
                            {(item.tasksSummary || item.keyResultsSummary || item.successMetricsSummary || item.deliverablesSummary) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDetails(item.id)}
                                className="flex items-center gap-1 text-xs h-6 md:h-7 px-1 md:px-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                              >
                                <span className="hidden sm:inline">{expandedDetails[item.id] ? 'Sembunyikan' : 'Lihat Detail'}</span>
                                <span className="sm:hidden">{expandedDetails[item.id] ? 'Tutup' : 'Detail'}</span>
                                {expandedDetails[item.id] ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Detailed Update Information - Always show for check_in, expandable for others */}
                        {(item.type === 'check_in' || expandedDetails[item.id]) && (
                          <div className="space-y-2">
                            {/* Tasks Details */}
                          {item.tasksSummary && (
                            <div className="bg-blue-50 rounded-lg p-2 md:p-3">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs font-medium text-blue-800">📋 Tugas ({item.tasksUpdated + item.tasksCompleted})</span>
                                {item.tasksCompleted > 0 && <span className="bg-green-200 text-green-800 text-xs px-1 rounded">{item.tasksCompleted} selesai</span>}
                              </div>
                              <div className="text-xs text-blue-700">
                                {item.tasksSummary && item.tasksSummary.split(', ').map((task, index) => (
                                  <div key={index} className="mb-1 last:mb-0">
                                    <span>{task}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          
                          {/* Progress Information for Check-ins */}
                          {item.type === 'check_in' && item.keyResultTitle && (
                            <div className="bg-purple-50 rounded-lg p-2">
                              <div className="pt-2 border-purple-200">
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
                                <div className="mb-2">
                                  {(() => {
                                    let progressPercentage = 0;
                                    const current = parseFloat(item.checkInValue || '0') || 0;
                                    const target = parseFloat(item.keyResultTargetValue || '1') || 1;
                                    const baseline = parseFloat(item.keyResultBaseValue || '0') || 0;
                                    
                                    // Calculate progress based on key result type
                                    if (item.keyResultType === 'increase_to') {
                                      progressPercentage = baseline !== target 
                                        ? Math.min(100, Math.max(0, ((current - baseline) / (target - baseline)) * 100))
                                        : current >= target ? 100 : 0;
                                    } else if (item.keyResultType === 'decrease_to') {
                                      progressPercentage = baseline !== target 
                                        ? Math.min(100, Math.max(0, ((baseline - current) / (baseline - target)) * 100))
                                        : current <= target ? 100 : 0;
                                    } else if (item.keyResultType === 'achieve_or_not') {
                                      progressPercentage = current >= target ? 100 : 0;
                                    }
                                    
                                    return (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-purple-700">Progress:</span>
                                          <span className="text-xs font-bold text-purple-900">
                                            {Math.round(progressPercentage)}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-purple-100 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                              progressPercentage >= 100 ? 'bg-green-500' :
                                              progressPercentage >= 75 ? 'bg-blue-500' :
                                              progressPercentage >= 50 ? 'bg-yellow-500' :
                                              progressPercentage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                                
                                {item.checkInNotes && (
                                  <div className="mt-2">
                                    <div className="text-xs font-medium text-purple-800 mb-1">Catatan:</div>
                                    <div className="text-xs text-purple-700 italic">"{item.checkInNotes}"</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Success Metrics Details */}
                          {item.successMetricsSummary && (
                            <div className="bg-orange-50 rounded-lg p-2">
                              <div className="text-xs font-medium text-orange-800 mb-1">📊 Metrik Sukses ({item.successMetricsUpdated})</div>
                              <div className="text-xs text-orange-700">
                                {item.successMetricsSummary && item.successMetricsSummary.split(', ').map((metric, index) => (
                                  <div key={index} className="mb-1 last:mb-0">
                                    <span>{metric}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deliverables Details */}
                          {item.deliverablesSummary && (
                            <div className="bg-indigo-50 rounded-lg p-2">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs font-medium text-indigo-800">📦 Output ({item.deliverablesUpdated})</span>
                                {item.deliverablesCompleted > 0 && <span className="bg-green-200 text-green-800 text-xs px-1 rounded">{item.deliverablesCompleted} selesai</span>}
                              </div>
                              <div className="text-xs text-indigo-700">
                                {item.deliverablesSummary && item.deliverablesSummary.split(', ').map((deliverable, index) => (
                                  <div key={index} className="mb-1 last:mb-0">
                                    <span>{deliverable}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Summary if no detailed info */}
                          {!item.tasksSummary && !item.keyResultsSummary && !item.successMetricsSummary && !item.deliverablesSummary && item.summary && (
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="text-xs font-medium text-gray-600 mb-1">📝 Ringkasan Update:</div>
                              <div className="text-xs line-clamp-3" dangerouslySetInnerHTML={{ __html: item.summary }} />
                            </div>
                          )}
                          </div>
                        )}

                        {/* Key Information Only */}
                        {(item.whatWorkedWell || item.challenges) && (
                          <div className="space-y-2">
                            {item.whatWorkedWell && (
                              <div className="bg-green-50 rounded-lg p-2">
                                <div className="font-medium text-green-800 mb-1 text-xs">✅ Yang Berjalan Baik:</div>
                                <div className="text-xs text-green-700">{item.whatWorkedWell}</div>
                              </div>
                            )}
                            {item.challenges && (
                              <div className="bg-red-50 rounded-lg p-2">
                                <div className="font-medium text-red-800 mb-1 text-xs">⚠️ Tantangan:</div>
                                <div className="text-xs text-red-700">{item.challenges}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reaction Summary Display - positioned between content and engagement buttons */}
                        {(() => {
                          const itemReactions = timelineReactions[item.id] || {};
                          const activeReactions = Object.entries(itemReactions).filter(([, count]) => count > 0);
                          
                          if (activeReactions.length === 0) return null;
                          
                          // Sort by count and get top emojis
                          const sortedReactions = activeReactions.sort(([,a], [,b]) => b - a);
                          const totalCount = activeReactions.reduce((sum, [, count]) => sum + count, 0);
                          const topEmojis = sortedReactions.slice(0, 3).map(([emoji]) => emoji);
                          
                          return (
                            <div className="mt-3">
                              <button
                                onClick={() => setShowReactionModal(prev => ({ ...prev, [item.id]: true }))}
                                className="flex items-center space-x-2 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                              >
                                <div className="flex items-center bg-white border border-gray-200 rounded-full px-1 py-0.5">
                                  <span className="text-xs mr-0.5 px-0.5">{topEmojis.join('')}</span>
                                  <span className="text-xs text-gray-600">{totalCount}</span>
                                </div>
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Engagement Section */}
                      <div className="mt-3 pt-2 md:pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 md:space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReaction(item.id)}
                              className={`flex items-center space-x-1 text-xs h-6 md:h-7 px-1 md:px-2 rounded-full ${
                                (timelineReactions[item.id] as any)?.['❤️'] > 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-blue-600'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${(timelineReactions[item.id] as any)?.['❤️'] > 0 ? 'fill-current' : ''}`} />
                              <span className="hidden sm:inline">{(timelineReactions[item.id] as any)?.['❤️'] > 0 ? 'Disukai' : 'Suka'}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(item.id)}
                              className="flex items-center space-x-1 text-xs h-6 md:h-7 px-1 md:px-2 rounded-full text-gray-500 hover:text-blue-600"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Komentar</span>
                            </Button>
                            <div className="relative">
                              {/* Reaction Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowReactionPicker(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                                }}
                                className="flex items-center space-x-1 text-xs h-6 md:h-7 px-1 md:px-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                              >
                                <Smile className="w-3 h-3" />
                                <span className="hidden sm:inline">Reaksi</span>
                              </Button>

                              {/* Reaction Picker Dropdown */}
                              {showReactionPicker[item.id] && (
                                <div 
                                  className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-[240px] md:min-w-[280px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="grid grid-cols-5 md:grid-cols-6 gap-1">
                                    {REACTION_EMOJIS.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReaction(item.id, emoji)}
                                        className="flex items-center justify-center p-1 md:p-2 h-8 w-8 md:h-10 md:w-10 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-110"
                                      >
                                        <span className="text-lg md:text-xl">{emoji}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}


                            </div>
                          </div>
                        </div>

                        {/* Comments Section */}
                        {showComments[item.id] && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="space-y-2 mb-3">
                              {/* Real comments from API */}
                              {(timelineComments[item.id] || []).map((comment: any) => (
                                <div key={comment.id} className="flex space-x-2">
                                  <div className="flex-shrink-0">
                                    {comment.user?.profileImageUrl ? (
                                      <img 
                                        src={comment.user.profileImageUrl} 
                                        alt={comment.user.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                        {getUserInitials(comment.user?.name || comment.user?.email || "U")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-900 mr-2">{comment.user?.name || comment.user?.email}</span>
                                      <span className="text-gray-700">{comment.content}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* No comments message */}
                              {(!timelineComments[item.id] || timelineComments[item.id].length === 0) && (
                                <div className="text-center text-gray-500 text-sm py-2">
                                  Belum ada komentar. Jadilah yang pertama!
                                </div>
                              )}
                            </div>

                            {/* Add Comment */}
                            <div className="flex space-x-2">
                              <div className="flex-shrink-0">
                                {(user as any)?.profileImageUrl ? (
                                  <img 
                                    src={(user as any).profileImageUrl} 
                                    alt={(user as any).name || (user as any).email}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                    {getUserInitials((user as any)?.name || (user as any)?.email || "User")}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 flex items-center space-x-1 md:space-x-2">
                                <div className="flex-1 relative">
                                  <Textarea
                                    placeholder="Tulis komentar..."
                                    value={commentTexts[item.id] || ""}
                                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="flex-1 min-h-[32px] md:min-h-[36px] resize-none border-gray-300 rounded-full px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
                                    rows={1}
                                  />
                                </div>
                                <Button
                                  onClick={() => handleAddComment(item.id)}
                                  disabled={!commentTexts[item.id]?.trim() || addCommentMutation.isPending}
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 md:p-2 h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-gray-100"
                                >
                                  <Send className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reaction Detail Modal */}
                        {showReactionModal[item.id] && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2 max-h-[80vh] overflow-hidden">
                              {/* Modal Header */}
                              <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Reactions</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowReactionModal(prev => ({ ...prev, [item.id]: false }))}
                                  className="p-1 h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-gray-100"
                                >
                                  <span className="text-gray-500 text-lg">×</span>
                                </Button>
                              </div>
                              
                              {/* Modal Content */}
                              <div className="max-h-[60vh] overflow-y-auto">
                                {(() => {
                                  const itemReactions = timelineReactions[item.id] || {};
                                  const activeReactions = Object.entries(itemReactions).filter(([, count]) => count > 0);
                                  const sortedReactions = activeReactions.sort(([,a], [,b]) => b - a);
                                  const totalCount = activeReactions.reduce((sum, [, count]) => sum + count, 0);
                                  
                                  return (
                                    <div>
                                      {/* Reaction Tabs */}
                                      <div className="flex border-b border-gray-200 overflow-x-auto">
                                        <button className="flex items-center space-x-2 px-4 py-3 border-b-2 border-blue-500 text-blue-600 font-medium whitespace-nowrap">
                                          <span>Semua</span>
                                          <span className="text-sm text-gray-500">{totalCount}</span>
                                        </button>
                                        {sortedReactions.map(([emoji, count]) => (
                                          <button
                                            key={emoji}
                                            className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-900 whitespace-nowrap"
                                          >
                                            <span className="text-lg">{emoji}</span>
                                            <span className="text-sm text-gray-500">{count}</span>
                                          </button>
                                        ))}
                                      </div>
                                      
                                      {/* User List - will need API integration for user details */}
                                      <div className="p-4 space-y-3">
                                        <div className="text-center text-gray-500 text-sm py-4">
                                          Detail pengguna yang memberikan reaksi akan segera tersedia
                                        </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-8 md:py-12 px-4">
              <TimelineIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Belum ada activity yang ditampilkan
              </h3>
              <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">
                Timeline akan menampilkan update harian dan progress check-in dari tim Anda
              </p>
              <div className="text-xs md:text-sm text-gray-500">
                Mulai dengan melakukan check-in atau update harian untuk melihat activity feed
              </div>
            </div>
          )}
        </div>
        
        {/* Leaderboard Sidebar */}
        <div className="hidden xl:block xl:w-80 xl:flex-shrink-0">
          <div className="sticky top-6">
            <Leaderboard limit={8} />
          </div>
        </div>
      </div>
    </>
  );
}