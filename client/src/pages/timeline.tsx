import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { User } from '@shared/schema';

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
  const commentTextRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Scroll preservation untuk mengatasi scroll ke atas saat engagement button diklik - menggunakan window scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const preservedScrollRef = useRef<number>(0);

  // Helper functions for scroll preservation
  const saveScrollPosition = useCallback(() => {
    // Try both container and window scroll
    if (scrollContainerRef.current) {
      preservedScrollRef.current = scrollContainerRef.current.scrollTop;
    } else {
      preservedScrollRef.current = window.pageYOffset || document.documentElement.scrollTop;
    }
    console.log('💾 Saved scroll position:', preservedScrollRef.current);
  }, []);

  const restoreScrollPosition = useCallback(() => {
    setTimeout(() => {
      const savedPosition = preservedScrollRef.current;
      if (savedPosition > 0) {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedPosition;
          console.log('↩️ Restored container scroll to:', savedPosition);
        } else {
          window.scrollTo(0, savedPosition);
          console.log('↩️ Restored window scroll to:', savedPosition);
        }
      }
    }, 100); // Increased delay to 100ms
  }, []);

  // Lazy loading states - simpler approach showing N items at a time
  const [displayedItemCount, setDisplayedItemCount] = useState(3);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch timeline data
  const { data: timelineData = [], isLoading } = useQuery<TimelineItem[]>({
    queryKey: ['/api/timeline'],
    enabled: !!user,
  });

  // Fetch teams data untuk filtering
  const { data: teams = [] } = useQuery<{ id: string; name: string; }[]>({
    queryKey: ['/api/teams'],
    enabled: !!user,
  });

  const { data: teamMembers = [] } = useQuery<{ id: string; userId: string; }[]>({
    queryKey: ['/api/teams', teamFilter, 'members'],
    enabled: !!user && teamFilter !== 'all',
  });

  // Fetch timeline reactions
  const { data: timelineReactions = {} } = useQuery<Record<string, Record<string, number>>>({
    queryKey: ['/api/timeline/reactions'],
    enabled: !!user,
  });

  // Fetch timeline comments
  const { data: timelineComments = {} } = useQuery<Record<string, { id: string; content: string; createdAt: string; user: { name: string; profileImageUrl?: string; }; }[]>>({
    queryKey: ['/api/timeline/comments'],
    enabled: !!user,
  });

  // Fetch detailed reactions for a specific timeline item (for modal)
  const { data: detailedReactions = [], isLoading: isLoadingDetailedReactions } = useQuery<{ id: string; emoji: string; user: { name: string; profileImageUrl?: string; }; createdAt: string; }[]>({
    queryKey: [`/api/timeline/${currentReactionsTimelineId}/detailed-reactions`],
    enabled: !!currentReactionsTimelineId && !!user,
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
      if (userFilter === 'current' && user && item.userId !== user.id) return false;

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

  // Mutations for comments and reactions
  const addCommentMutation = useMutation({
    mutationFn: async ({ itemId, content, mentionedUsers }: { itemId: string; content: string; mentionedUsers?: string[] }) => {
      const response = await fetch(`/api/timeline/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, mentionedUsers: mentionedUsers || [] }),
      });
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline/comments'] });
      restoreScrollPosition(); // Restore scroll after comment added
      toast({
        title: "Komentar berhasil ditambahkan",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan komentar",
        description: error.message,
        variant: "destructive",
      });
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
    onSuccess: (data) => {
      // First restore scroll before invalidation to prevent jump
      restoreScrollPosition();

      // Then invalidate queries with additional scroll restoration
      queryClient.invalidateQueries({ queryKey: ['/api/timeline/reactions'] });

      // Additional scroll restoration after query invalidation
      setTimeout(() => {
        restoreScrollPosition();
      }, 300);

      // Show appropriate toast based on action
      if (data.action === 'added') {
        toast({
          title: "Reaksi ditambahkan",
          variant: "default",
        });
      } else if (data.action === 'removed') {
        toast({
          title: "Reaksi dihapus",
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan reaksi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleComments = useCallback((itemId: string) => {
    saveScrollPosition();
    setShowComments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    restoreScrollPosition();
  }, [saveScrollPosition, restoreScrollPosition]);

  const toggleDetails = useCallback((itemId: string) => {
    saveScrollPosition();
    setExpandedDetails(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    restoreScrollPosition();
  }, [saveScrollPosition, restoreScrollPosition]);

  const toggleReaction = useCallback((itemId: string) => {
    saveScrollPosition();
    // Toggle like reaction using heart emoji (❤️)
    addReactionMutation.mutate({ itemId, emoji: '❤️' });
  }, [addReactionMutation, saveScrollPosition]);

  // Check if user has liked this item
  const getUserHasLiked = useCallback((itemId: string) => {
    return timelineReactions[itemId]?.['❤️'] > 0;
  }, [timelineReactions]);

  // Old useEffect removed - now using helper functions for scroll preservation

  const openReactionsModal = useCallback((timelineId: string) => {
    saveScrollPosition();
    setCurrentReactionsTimelineId(timelineId);
    setSelectedReactionTab('all'); // Reset tab selection
    setShowReactionModal(prev => ({ ...prev, [timelineId]: true }));
    setTimeout(() => restoreScrollPosition(), 50);
  }, [saveScrollPosition, restoreScrollPosition]);

  const closeReactionsModal = (timelineId: string) => {
    setCurrentReactionsTimelineId(null);
    setShowReactionModal(prev => ({ ...prev, [timelineId]: false }));
  };



  const handleAddComment = useCallback((itemId: string, content: string, mentionedUsers: string[] = []) => {
    if (content?.trim()) {
      saveScrollPosition();
      addCommentMutation.mutate({ itemId, content: content.trim(), mentionedUsers });
    }
  }, [addCommentMutation, saveScrollPosition]);

  const handleCommentChange = useCallback((itemId: string, value: string) => {
    setCommentTexts(prev => ({ ...prev, [itemId]: value }));
  }, []);

  const handleReaction = useCallback((itemId: string, emoji: string) => {
    saveScrollPosition();
    addReactionMutation.mutate({ itemId, emoji });
    setShowReactionPicker(prev => ({ ...prev, [itemId]: false }));
    // Give a small delay to ensure scroll position is maintained
    setTimeout(() => restoreScrollPosition(), 50);
  }, [addReactionMutation, saveScrollPosition, restoreScrollPosition]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Intersection Observer for loading more items - simplified to prevent loops
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

    const currentRef = loadMoreRef.current;
    if (currentRef && displayedItemCount < filteredData.length) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [displayedItemCount, filteredData.length]);

  // Reset display count when filters change - optimized to prevent unnecessary re-renders
  useEffect(() => {
    // Always reset to 3 when filters change
    setDisplayedItemCount(3);
    console.log('🔄 Filter changed, resetting to show 3 items');
  }, [activityTypeFilter, userFilter, teamFilter, dateRangeFilter, contentTypeFilter]);

  // Timeline Comment Editor with mention functionality
  const TimelineCommentEditor = memo(({ 
    itemId, 
    onSubmit, 
    disabled 
  }: {
    itemId: string;
    onSubmit: (content: string, mentionedUsers: string[]) => void;
    disabled: boolean;
  }) => {
    const [content, setContent] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // Handle input change to sync with textarea value changes from mention clicks
    useEffect(() => {
      const textarea = editorRef.current;
      if (textarea) {
        const handleInputChange = () => {
          setContent(textarea.value);
        };

        textarea.addEventListener('input', handleInputChange);
        return () => textarea.removeEventListener('input', handleInputChange);
      }
    }, []);

    // Fetch users for mention suggestions
    const { data: users = [] } = useQuery<User[]>({
      queryKey: ['/api/users'],
    });

    const handleContentChange = useCallback((value: string) => {
      setContent(value);

      // Get cursor position from the textarea
      const textarea = editorRef.current;
      if (!textarea) return;

      const currentCursorPosition = textarea.selectionStart;

      // Check for @ mentions - only at current cursor position
      const textBeforeCursor = value.substring(0, currentCursorPosition);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const afterAt = textBeforeCursor.substring(atIndex + 1);
        const hasSpaceInQuery = afterAt.includes(" ");

        if (!hasSpaceInQuery && afterAt.length <= 20) { // Reasonable query length limit
          setMentionQuery(afterAt);
          setShowMentionSuggestions(true);
          setCursorPosition(atIndex);
        } else {
          setShowMentionSuggestions(false);
        }
      } else {
        setShowMentionSuggestions(false);
      }
    }, []);

    const handleMentionSelect = useCallback((user: User) => {
      const beforeMention = content.substring(0, cursorPosition);
      const afterMention = content.substring(cursorPosition + mentionQuery.length + 1);
      const userName = user.name || user.email?.split('@')[0] || 'User';
      const newContent = `${beforeMention}@${userName} ${afterMention}`;

      setContent(newContent);
      setMentionedUsers(prev => [...prev, user.id]);
      setShowMentionSuggestions(false);
      setMentionQuery("");

      // Update textarea and set cursor position after the mention
      if (editorRef.current) {
        const newCursorPosition = cursorPosition + userName.length + 2; // +2 for @ and space
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 0);
      }
    }, [content, cursorPosition, mentionQuery]);

    const filteredUsers = users.filter(user => {
      if (!mentionQuery) return true;
      const userName = user.name || user.email?.split('@')[0] || '';
      return userName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
             (user.email && user.email.toLowerCase().includes(mentionQuery.toLowerCase()));
    });

    // Close mention dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
          setShowMentionSuggestions(false);
        }
      };

      if (showMentionSuggestions) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showMentionSuggestions]);

    // Handle keyboard navigation in mention suggestions
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (showMentionSuggestions && filteredUsers.length > 0) {
        if (e.key === 'Escape') {
          setShowMentionSuggestions(false);
          e.preventDefault();
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }, [showMentionSuggestions, filteredUsers]);

    const handleSubmit = () => {
      const trimmedContent = content.trim();
      if (trimmedContent) {
        onSubmit(trimmedContent, mentionedUsers);
        setContent('');
        setMentionedUsers([]);
        setShowMentionSuggestions(false);
        setMentionQuery('');
      }
    };

    const renderCommentContent = (content: string) => {
      return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
    };

    return (
      <div className="flex-1 flex space-x-2 relative z-10">
        <div className="flex-1 relative">
          <textarea
            ref={editorRef}
            id={`comment-${itemId}`}
            placeholder="Tulis komentar... (gunakan @nama untuk mention)"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[40px] text-sm px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white relative z-10"
            rows={1}
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />

          {/* Mention Suggestions Dropdown */}
          {showMentionSuggestions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
              {filteredUsers.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMentionSelect(user);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {(user.name || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{user.name || user.email?.split('@')[0] || 'User'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={!content.trim() || disabled}
          className="px-3 relative z-10"
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    );
  });

  // Timeline Card Skeleton Component
  function TimelineCardSkeleton() {
    return (
      <Card className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3 md:p-4">
            <div className="flex items-start space-x-2 md:space-x-3">
              {/* Profile Image Skeleton */}
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />

              <div className="flex-1 min-w-0 space-y-3">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>

                {/* Summary Skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Progress Bar Skeleton */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>

                {/* Statistics Badges Skeleton */}
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-18 rounded-full" />
                  <Skeleton className="h-6 w-22 rounded-full" />
                </div>

                {/* Engagement Buttons Skeleton */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-18" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // TimelineCard component - memoized to prevent unnecessary re-renders
  const TimelineCard = memo(({ 
    item, 
    index
  }: {
    item: TimelineItem;
    index: number;
  }) => {

    return (
      <Card className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <CardContent className="p-0">
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
                    {getUserInitials({ name: (item as any).userName || 'User' })}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                      {(item as any).userName || 'User'}
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
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

                    {/* Detail Toggle Button */}
                    {((item.tasksUpdated + item.tasksCompleted) > 0 || 
                      item.keyResultsUpdated > 0 || 
                      item.successMetricsUpdated > 0 || 
                      item.deliverablesUpdated > 0 ||
                      item.whatWorkedWell ||
                      item.challenges) && (
                      <button
                        onClick={() => toggleDetails(item.id)}
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
                      {(item.tasksUpdated + item.tasksCompleted) > 0 && item.tasksSummary && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-semibold text-sm text-blue-800">Tugas yang Diupdate:</span>
                          </div>
                          <div className="text-sm text-gray-700 pl-4 space-y-1">
                            {item.tasksSummary.split(', ').map((task, index) => {
                              // Parse format: "Task Name (status_lama -> status_baru)"
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
                                // Fallback untuk format lama
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
                            {item.keyResultsSummary.split(', ').map((keyResult, index) => {
                              // Parse format: "KR Name (old_value -> new_value unit)" 
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

                      {/* Success Metrics Detail */}
                      {item.successMetricsUpdated > 0 && item.successMetricsSummary && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="font-semibold text-sm text-orange-800">Metrik Sukses yang Diupdate:</span>
                          </div>
                          <div className="text-sm text-gray-700 pl-4 space-y-1">
                            {item.successMetricsSummary.split(', ').map((metric, index) => {
                              // Parse format: "Metric Name (old_value -> new_value unit)"
                              const match = metric.match(/^(.+?)\s*\((.+?)\s*->\s*(.+?)\)$/);
                              if (match) {
                                const [, metricName, oldValue, newValue] = match;
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs">•</span>
                                    <span className="font-medium">{metricName.trim()}</span>
                                    <span className="text-xs text-gray-500">
                                      ({oldValue.trim()} → {newValue.trim()})
                                    </span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs">•</span>
                                    <span>{metric.trim()}</span>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                      )}

                      {/* Deliverables Detail */}
                      {item.deliverablesUpdated > 0 && item.deliverablesSummary && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="font-semibold text-sm text-indigo-800">Output yang Diselesaikan:</span>
                          </div>
                          <div className="text-sm text-gray-700 pl-4 space-y-1">
                            {item.deliverablesSummary.split(', ').map((deliverable, index) => {
                              // Parse format: "Deliverable Name (belum -> selesai)" atau format lain
                              const match = deliverable.match(/^(.+?)\s*\((.+?)\s*->\s*(.+?)\)$/);
                              if (match) {
                                const [, deliverableName, oldStatus, newStatus] = match;
                                const statusMap: Record<string, string> = {
                                  'belum': 'Belum Selesai',
                                  'selesai': 'Selesai',
                                  'false': 'Belum Selesai',
                                  'true': 'Selesai'
                                };
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs">•</span>
                                    <span className="font-medium">{deliverableName.trim()}</span>
                                    <span className="text-xs text-gray-500">
                                      ({statusMap[oldStatus.trim()] || oldStatus.trim()} → {statusMap[newStatus.trim()] || newStatus.trim()})
                                    </span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs">•</span>
                                    <span>{deliverable.trim()}</span>
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
                          onClick={() => openReactionsModal(item.id)}
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
                    e.stopPropagation();
                    toggleReaction(item.id);
                  }}
                  disabled={addReactionMutation.isPending}
                  className={`flex items-center space-x-1 transition-all duration-200 ${
                    getUserHasLiked(item.id)
                      ? 'text-red-500 hover:text-red-600 scale-105' 
                      : 'text-gray-500 hover:text-red-500 hover:scale-105'
                  } ${addReactionMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {getUserHasLiked(item.id) ? (
                    <Heart className="w-4 h-4 fill-current" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                  <span className="text-xs md:text-sm font-medium">
                    {timelineReactions[item.id]?.['❤️'] || 0}
                  </span>
                  <span className="text-xs hidden sm:inline">Suka</span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => toggleComments(item.id)}
                  className={`flex items-center space-x-1 transition-colors ${
                    showComments[item.id]
                      ? 'text-blue-500 hover:text-blue-600'
                      : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  {showComments[item.id] ? (
                    <MessageCircle className="w-4 h-4 fill-current" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  <span className="text-xs md:text-sm">
                    {timelineComments[item.id]?.length || 0}
                  </span>
                  <span className="text-xs hidden sm:inline">Komentar</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => {
                    saveScrollPosition();
                    navigator.clipboard.writeText(`${window.location.origin}/timeline#${item.id}`);
                    toast({ 
                      title: "Link disalin", 
                      description: "Link timeline telah disalin ke clipboard",
                      variant: "default"
                    });
                    setTimeout(() => restoreScrollPosition(), 100);
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
                    e.stopPropagation();
                    saveScrollPosition();
                    setShowReactionPicker(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                    setTimeout(() => restoreScrollPosition(), 50);
                  }}
                  className={`transition-colors ${
                    showReactionPicker[item.id]
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-500 hover:text-yellow-500'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showReactionPicker[item.id] && (
                  <div 
                    className="absolute right-0 bottom-8 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 animate-in fade-in duration-200 scale-95 data-[state=open]:scale-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex space-x-1">
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(item.id, emoji)}
                          disabled={addReactionMutation.isPending}
                          className={`hover:bg-gray-100 rounded p-1 text-lg transition-all duration-200 hover:scale-110 relative group ${
                            addReactionMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                          } ${timelineReactions[item.id]?.[emoji] > 0 ? 'bg-blue-50 ring-2 ring-blue-200' : ''}`}
                          title={`Reaksi dengan ${emoji} (${timelineReactions[item.id]?.[emoji] || 0})`}
                        >
                          <span className="relative flex items-center justify-center">
                            {emoji}
                            {timelineReactions[item.id]?.[emoji] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shadow-sm animate-pulse">
                                {timelineReactions[item.id][emoji]}
                              </span>
                            )}
                          </span>
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
                      <div className="text-gray-700">
                        {comment.content.split(/(@\w+)/g).map((part: string, index: number) => {
                          if (part.startsWith('@')) {
                            const mentionName = part.substring(1);
                            return (
                              <span
                                key={index}
                                className="text-blue-600 font-medium cursor-pointer hover:text-blue-800 hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  const timelineEditor = document.getElementById(`comment-${item.id}`) as HTMLTextAreaElement;
                                  
                                  if (timelineEditor) {
                                    const currentContent = timelineEditor.value;
                                    const newContent = currentContent ? `${currentContent} @${mentionName} ` : `@${mentionName} `;
                                    
                                    timelineEditor.value = newContent;
                                    timelineEditor.focus();
                                    
                                    // Trigger input event for React to update state
                                    const inputEvent = new Event('input', { bubbles: true });
                                    timelineEditor.dispatchEvent(inputEvent);
                                    
                                    // Set cursor position to end
                                    setTimeout(() => {
                                      timelineEditor.setSelectionRange(newContent.length, newContent.length);
                                    }, 10);
                                  }
                                }}
                              >
                                {part}
                              </span>
                            );
                          }
                          return <span key={index}>{part}</span>;
                        })}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="flex space-x-2 mt-3">
                  <div className="flex-shrink-0">
                    {user && (user as any).profileImageUrl ? (
                      <img 
                        src={(user as any).profileImageUrl} 
                        alt={(user as any).name || 'User'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {getUserInitials({ name: (user as any)?.name || 'User' })}
                      </div>
                    )}
                  </div>
                  <TimelineCommentEditor
                    itemId={item.id}
                    onSubmit={(content, mentionedUsers) => handleAddComment(item.id, content, mentionedUsers)}
                    disabled={addCommentMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

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
        <div ref={scrollContainerRef} className="flex-1 min-w-0 overflow-y-auto slim-scroll">
          <div className="pr-2"> {/* Add padding for scrollbar */}
            {isLoading ? (
              /* Loading skeleton state */
              <div className="space-y-3 md:space-y-4">
                {[...Array(3)].map((_, index) => (
                  <TimelineCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            ) : timelineData && timelineData.length > 0 ? (
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