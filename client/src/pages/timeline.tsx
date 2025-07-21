import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

// Constants
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

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
  
  // UI States
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [showReactionModal, setShowReactionModal] = useState<Record<string, boolean>>({});
  const [currentReactionsTimelineId, setCurrentReactionsTimelineId] = useState<string | null>(null);
  const [selectedReactionTab, setSelectedReactionTab] = useState('all');
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  // Lazy loading states - simpler approach showing N items at a time
  const [displayedItemCount, setDisplayedItemCount] = useState(3);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch timeline data
  const { data: timelineData = [], isLoading } = useQuery<TimelineItem[]>({
    queryKey: ['/api/timeline'],
    enabled: !!user?.id,
  });

  // Fetch teams data untuk filtering
  const { data: teams = [] } = useQuery<{ id: string; name: string; }[]>({
    queryKey: ['/api/teams'],
    enabled: !!user?.id,
  });

  const { data: teamMembers = [] } = useQuery<{ id: string; userId: string; }[]>({
    queryKey: ['/api/teams', teamFilter, 'members'],
    enabled: !!user?.id && teamFilter !== 'all',
  });

  // Fetch timeline reactions
  const { data: timelineReactions = {} } = useQuery<Record<string, Record<string, number>>>({
    queryKey: ['/api/timeline/reactions'],
    enabled: !!user?.id,
  });

  // Fetch timeline comments
  const { data: timelineComments = {} } = useQuery<Record<string, { id: string; content: string; createdAt: string; user: { name: string; profileImageUrl?: string; }; }[]>>({
    queryKey: ['/api/timeline/comments'],
    enabled: !!user?.id,
  });

  // Fetch detailed reactions for a specific timeline item (for modal)
  const { data: detailedReactions = [], isLoading: isLoadingDetailedReactions } = useQuery<{ id: string; emoji: string; user: { name: string; profileImageUrl?: string; }; createdAt: string; }[]>({
    queryKey: [`/api/timeline/${currentReactionsTimelineId}/detailed-reactions`],
    enabled: !!currentReactionsTimelineId && !!user?.id,
    staleTime: 0,
  });

  // Filter timeline data
  const filteredData = useMemo(() => {
    return timelineData.filter((item: TimelineItem) => {
      // Activity Type Filter
      if (activityTypeFilter !== 'all') {
        if (activityTypeFilter === 'check_in' && item.type !== 'check_in') return false;
        if (activityTypeFilter === 'daily_update' && item.type !== 'daily_update') return false;
      }

      // User Filter
      if (userFilter === 'current' && item.userId !== user?.id) return false;

      // Team Filter
      if (teamFilter !== 'all') {
        const memberIds = (teamMembers || []).map((member: any) => member.userId);
        if (!memberIds.includes(item.userId)) return false;
      }

      // Date Range Filter
      if (dateRangeFilter !== 'all') {
        const itemDate = new Date(item.updateDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        switch (dateRangeFilter) {
          case 'today':
            if (itemDate < today) return false;
            break;
          case 'yesterday':
            if (itemDate < yesterday || itemDate >= today) return false;
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

  const toggleDetails = (itemId: string) => {
    setExpandedDetails(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleComments = (itemId: string) => {
    setShowComments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleReaction = (itemId: string) => {
    // Toggle like reaction
    addReactionMutation.mutate({ itemId, emoji: '❤️' });
  };

  const openReactionsModal = (timelineId: string) => {
    setCurrentReactionsTimelineId(timelineId);
    setSelectedReactionTab('all'); // Reset tab selection
    setShowReactionModal(prev => ({ ...prev, [timelineId]: true }));
  };

  const closeReactionsModal = (timelineId: string) => {
    setCurrentReactionsTimelineId(null);
    setShowReactionModal(prev => ({ ...prev, [timelineId]: false }));
  };

  // Mutations for comments and reactions
  const addCommentMutation = useMutation({
    mutationFn: async ({ itemId, content }: { itemId: string; content: string }) => {
      const response = await fetch(`/api/timeline/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      return response.json();
    },
    onMutate: () => {
      // Store current scroll position before mutation
      const currentScrollY = window.scrollY;
      sessionStorage.setItem('timeline-scroll-position', currentScrollY.toString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline/comments'] });
      // Restore scroll position after mutation
      setTimeout(() => {
        const savedScrollY = sessionStorage.getItem('timeline-scroll-position');
        if (savedScrollY) {
          window.scrollTo(0, parseInt(savedScrollY));
          sessionStorage.removeItem('timeline-scroll-position');
        }
      }, 50);
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ itemId, emoji }: { itemId: string; emoji: string }) => {
      const response = await fetch(`/api/timeline/${itemId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
      return response.json();
    },
    onMutate: () => {
      // Store current scroll position before mutation
      const currentScrollY = window.scrollY;
      sessionStorage.setItem('timeline-scroll-position', currentScrollY.toString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline/reactions'] });
      // Restore scroll position after mutation
      setTimeout(() => {
        const savedScrollY = sessionStorage.getItem('timeline-scroll-position');
        if (savedScrollY) {
          window.scrollTo(0, parseInt(savedScrollY));
          sessionStorage.removeItem('timeline-scroll-position');
        }
      }, 50);
    },
  });

  const handleAddComment = (itemId: string) => {
    const content = commentTexts[itemId]?.trim();
    if (content) {
      addCommentMutation.mutate({ itemId, content });
      setCommentTexts(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const handleReaction = (itemId: string, emoji: string) => {
    addReactionMutation.mutate({ itemId, emoji });
    setShowReactionPicker(prev => ({ ...prev, [itemId]: false }));
  };

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Intersection Observer for loading more items (after filteredData is defined)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedItemCount < filteredData.length) {
          console.log('🔄 Loading more items. Current:', displayedItemCount, 'Total:', filteredData.length);
          setDisplayedItemCount(prev => Math.min(prev + 3, filteredData.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current && displayedItemCount < filteredData.length) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayedItemCount, filteredData.length]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayedItemCount(3);
    console.log('🔄 Filter changed, resetting to show 3 items');
  }, [activityTypeFilter, userFilter, teamFilter, dateRangeFilter, contentTypeFilter]);

  // TimelineCard component - simplified without complex lazy loading
  function TimelineCard({ 
    item, 
    index
  }: {
    item: TimelineItem;
    index: number;
  }) {

    return (
      <Card className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3 md:p-4">
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="flex-shrink-0">
                {item.userProfileImageUrl || item.user?.profileImageUrl ? (
                  <img 
                    src={item.userProfileImageUrl || item.user?.profileImageUrl} 
                    alt={item.userName || item.user?.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                    {getUserInitials({ name: item.userName || item.user?.name || 'User' })}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                      {item.userName || item.user?.name}
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
                  {(item.tasksUpdated + item.tasksCompleted) > 0 && (
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
                  {item.checkInValue && item.keyResultTargetValue && (
                    <div className="mb-2">
                      {(() => {
                        const currentValue = parseFloat(item.checkInValue.toString().replace(/[^\d.-]/g, ''));
                        const targetValue = parseFloat(item.keyResultTargetValue.toString().replace(/[^\d.-]/g, ''));
                        const percentage = Math.min((currentValue / targetValue) * 100, 100);
                        
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-purple-700">Progress:</span>
                              <span className="text-xs font-medium text-purple-800">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
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
          
          {/* Social Engagement Section */}
          <div className="border-t border-gray-100">
            {/* Reactions Summary Bar */}
            {(timelineReactions[item.id] && Object.keys(timelineReactions[item.id]).length > 0) || (timelineComments[item.id] && timelineComments[item.id].length > 0) ? (
              <div className="px-3 md:px-4 py-2 border-b border-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  {/* Left side - Reactions */}
                  <div className="flex items-center space-x-2">
                    {timelineReactions[item.id] && Object.keys(timelineReactions[item.id]).length > 0 && (
                      <div className="flex items-center space-x-1">
                        {/* Show top 3 emoji reactions */}
                        <div className="flex -space-x-1">
                          {Object.entries(timelineReactions[item.id] || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([emoji]) => {
                              // Get background color based on emoji
                              const getEmojiBackground = (emoji: string) => {
                                switch(emoji) {
                                  case '👍': return 'bg-blue-500';
                                  case '❤️': return 'bg-red-500';
                                  case '😂': return 'bg-yellow-400';
                                  case '😮': return 'bg-orange-400';
                                  case '😢': return 'bg-blue-400';
                                  case '😡': return 'bg-red-600';
                                  default: return 'bg-gray-400';
                                }
                              };
                              
                              return (
                                <div key={emoji} className={`w-5 h-5 ${getEmojiBackground(emoji)} rounded-full flex items-center justify-center text-xs border-2 border-white shadow-sm`}>
                                  <span className="text-white text-[10px]">{emoji}</span>
                                </div>
                              );
                            })}
                        </div>
                        {/* Total reaction count */}
                        <span 
                          className="text-gray-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openReactionsModal(item.id);
                          }}
                        >
                          {Object.values(timelineReactions[item.id] || {}).reduce((sum, count) => sum + count, 0)} orang
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Right side - Comments count */}
                  {timelineComments[item.id] && timelineComments[item.id].length > 0 && (
                    <span className="text-gray-500 hover:underline cursor-pointer">
                      {timelineComments[item.id]?.length || 0} komentar
                    </span>
                  )}
                </div>
              </div>
            ) : null}
            
            {/* Engagement buttons */}
            <div className="px-3 md:px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4 md:space-x-6">
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleReaction(item.id);
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-xs md:text-sm">
                    {timelineReactions[item.id]?.['❤️'] || 0}
                  </span>
                  <span className="text-xs hidden sm:inline">Suka</span>
                </button>
                
                {/* Comment Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleComments(item.id);
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs md:text-sm">
                    {timelineComments[item.id]?.length || 0}
                  </span>
                  <span className="text-xs hidden sm:inline">Komentar</span>
                </button>
                
                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${window.location.origin}/timeline#${item.id}`);
                    toast({ title: "Link disalin", description: "Link timeline telah disalin ke clipboard" });
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Bagikan</span>
                </button>
              </div>
              
              {/* Reaction Picker */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReactionPicker(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                  }}
                  className="text-gray-500 hover:text-yellow-500 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>
                
                {showReactionPicker[item.id] && (
                  <div 
                    className="absolute right-0 bottom-8 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex space-x-1">
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleReaction(item.id, emoji);
                          }}
                          className="hover:bg-gray-100 rounded p-1 text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Comments Section */}
            {showComments[item.id] && (
              <div className="px-3 md:px-4 pb-3 space-y-2">
                {/* Existing Comments */}
                {timelineComments[item.id]?.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-2 text-xs md:text-sm">
                    <div className="flex-shrink-0">
                      {comment.user?.profileImageUrl ? (
                        <img 
                          src={comment.user.profileImageUrl} 
                          alt={comment.user.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {getUserInitials({ name: comment.user?.name || 'User' })}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2">
                      <div className="font-semibold text-gray-900">{comment.user?.name}</div>
                      <div className="text-gray-700">{comment.content}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Comment */}
                <div className="flex space-x-2 mt-3">
                  <div className="flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt={user.name || 'User'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {getUserInitials({ name: user?.name || 'User' })}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex space-x-2">
                    <Textarea
                      placeholder="Tulis komentar..."
                      value={commentTexts[item.id] || ''}
                      onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="flex-1 min-h-[32px] text-xs md:text-sm"
                      rows={1}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(item.id)}
                      disabled={!commentTexts[item.id]?.trim() || addCommentMutation.isPending}
                      className="px-3"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Emoji options for coworker expressions
  const REACTION_EMOJIS = ['👍', '❤️', '🎉', '💪', '🔥', '👏', '😍', '🚀', '⭐', '💯', '👌', '🤝'];

  if (isLoading) {
    return <div className="text-center py-12">Loading timeline...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Page Header - Fixed */}
      <div className="flex-shrink-0 mb-4 md:mb-6 bg-white rounded-lg shadow-sm p-3 md:p-4">
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

      {/* Main Layout Container - Flex and scrollable */}
      <div className="flex-1 flex gap-4 lg:gap-6 min-h-0">
        {/* Filter Sidebar - Fixed positioning */}
        <div className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-white' : 'hidden'} lg:block lg:w-72 lg:flex-shrink-0`}>
          <div className="h-full bg-white border border-gray-200 rounded-lg overflow-y-auto lg:sticky lg:top-0 slim-scroll"
               style={{ height: showMobileFilters ? '100vh' : 'calc(100vh - 120px)' }}>
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

              {/* Activity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Aktivitas
                </label>
                <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe aktivitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aktivitas</SelectItem>
                    <SelectItem value="daily_update">Update Harian</SelectItem>
                    <SelectItem value="check_in">Cek-in Progress</SelectItem>
                  </SelectContent>
                </Select>
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
                    {(teams || []).map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rentang Waktu
                </label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rentang waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="yesterday">Kemarin</SelectItem>
                    <SelectItem value="week">Minggu Ini</SelectItem>
                    <SelectItem value="month">Bulan Ini</SelectItem>
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

        {/* Main Content - Scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto slim-scroll">
          <div className="pr-2"> {/* Add padding for scrollbar */}
            {timelineData && timelineData.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {/* Debug info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                  Total items: {timelineData.length} | Filtered: {filteredData.length} | Showing: {Math.min(displayedItemCount, filteredData.length)}
                </div>
                
                {/* Show only the first N items */}
                {filteredData.slice(0, displayedItemCount).map((item: TimelineItem, index: number) => (
                  <TimelineCard key={item.id} item={item} index={index} />
                ))}
                
                {/* Load more trigger */}
                {displayedItemCount < filteredData.length && (
                  <div 
                    ref={loadMoreRef}
                    className="flex justify-center py-4"
                  >
                    <div className="animate-pulse text-sm text-gray-500">
                      Memuat lebih banyak...
                    </div>
                  </div>
                )}
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
                  Mulai dengan melakukan cek-in atau update harian untuk melihat activity feed
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Leaderboard Sidebar - Fixed positioning */}
        <div className="hidden xl:block xl:w-80 xl:flex-shrink-0">
          <div className="sticky top-0 h-screen">
            <div style={{ height: 'calc(100vh - 120px)' }} className="overflow-y-auto slim-scroll">
              <Leaderboard limit={8} />
            </div>
          </div>
        </div>
      </div>

      {/* Reactions Modal */}
      {currentReactionsTimelineId && (() => {
        console.log('Modal rendering for timeline ID:', currentReactionsTimelineId);
        console.log('Detailed reactions data:', detailedReactions);
        console.log('Is loading detailed reactions:', isLoadingDetailedReactions);
        
        // Group reactions by emoji
        const reactionGroups = (detailedReactions as any[]).reduce((groups: Record<string, any[]>, reaction: any) => {
          const emoji = reaction.emoji;
          if (!groups[emoji]) {
            groups[emoji] = [];
          }
          groups[emoji].push(reaction);
          return groups;
        }, {} as Record<string, any[]>);

        const emojiTabs = Object.keys(reactionGroups);
        const totalCount = (detailedReactions as any[]).length;
        
        console.log('Reaction groups:', reactionGroups);
        console.log('Total count:', totalCount);

        return (
          <Dialog 
            open={showReactionModal[currentReactionsTimelineId] || false} 
            onOpenChange={(open) => !open && closeReactionsModal(currentReactionsTimelineId)}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reaksi</DialogTitle>
              </DialogHeader>
              
              {/* Reaction Tabs */}
              {totalCount > 0 && (
                <div className="flex space-x-1 border-b border-gray-200 mb-3">
                  {/* All tab */}
                  <button
                    onClick={() => setSelectedReactionTab('all')}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                      selectedReactionTab === 'all' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>Semua</span>
                    <span>{totalCount}</span>
                  </button>
                  
                  {/* Individual emoji tabs */}
                  {emojiTabs.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedReactionTab(emoji)}
                      className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                        selectedReactionTab === emoji 
                          ? 'border-blue-500 text-blue-600 bg-blue-50' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{reactionGroups[emoji].length}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Reaction List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(() => {
                  const reactionsToShow = selectedReactionTab === 'all' ? detailedReactions : reactionGroups[selectedReactionTab] || [];
                  
                  return reactionsToShow.length > 0 ? (
                    <div className="space-y-2">
                      {(reactionsToShow as any[]).map((reaction: any) => (
                        <div key={reaction.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex-shrink-0">
                            {reaction.user?.profileImageUrl ? (
                              <img 
                                src={reaction.user.profileImageUrl} 
                                alt={reaction.user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {getUserInitials({ name: reaction.user?.name || 'User' })}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{reaction.user?.name}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(reaction.createdAt), "MMM dd, HH:mm")}
                            </div>
                          </div>
                          <div className="text-lg">
                            {reaction.emoji}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-500 text-sm">Belum ada reaksi</div>
                    </div>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}