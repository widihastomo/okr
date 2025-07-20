import { useState, useMemo, useEffect } from 'react';
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
import DailyCheckInButton from '@/components/daily-checkin-button';
import TimelineIcon from '@/components/ui/timeline-icon';
import { Leaderboard } from '@/components/gamification/leaderboard';
import { apiRequest } from '@/lib/queryClient';

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
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  
  // Social interaction states
  const [reactions, setReactions] = useState<Record<string, { [emoji: string]: number }>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [reactionUsers, setReactionUsers] = useState<Record<string, { [emoji: string]: string[] }>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showReactionModal, setShowReactionModal] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  
  // Expandable details state
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Fetch timeline data
  const { data: timelineData = [], isLoading } = useQuery<TimelineItem[]>({
    queryKey: ['/api/timeline'],
  });

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return timelineData.filter((item) => {
      if (userFilter !== 'all' && userFilter !== 'current' && item.userId !== userFilter) return false;
      
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
  }, [timelineData, activityTypeFilter, userFilter, dateRangeFilter, contentTypeFilter]);

  const clearAllFilters = () => {
    setActivityTypeFilter('all');
    setUserFilter('all');
    setDateRangeFilter('all');
    setContentTypeFilter('all');
  };

  const isDefaultFilter = activityTypeFilter === 'all' && userFilter === 'all' && 
    dateRangeFilter === 'all' && contentTypeFilter === 'all';

  const toggleReaction = (itemId: string) => {
    setReactions(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleComments = (itemId: string) => {
    setShowComments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const createCommentMutation = useMutation({
    mutationFn: (data: { timelineId: string; comment: string }) => 
      apiRequest(`/api/timeline/${data.timelineId}/comments`, 'POST', { comment: data.comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline'] });
    }
  });

  const handleComment = (itemId: string) => {
    const comment = commentTexts[itemId]?.trim();
    if (!comment) return;
    
    createCommentMutation.mutate({ timelineId: itemId, comment });
    setCommentTexts(prev => ({ ...prev, [itemId]: '' }));
  };

  const toggleDetails = (itemId: string) => {
    setExpandedDetails(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Set demo data for reactions when timeline data is loaded
  useEffect(() => {
    if (timelineData && timelineData.length > 0) {
      const firstItemId = timelineData[0].id;
      setReactions({
        [firstItemId]: {
          '👍': 5,
          '🔥': 3,
          '💪': 2
        }
      });
      setReactionUsers({
        [firstItemId]: {
          '👍': ['Test User5', 'Belina Yee', 'John Doe', 'Jane Smith', 'Mike Wilson'],
          '🔥': ['Alice Cooper', 'Bob Johnson', 'Charlie Brown'],
          '💪': ['David Lee', 'Emily Davis']
        }
      });
    }
  }, [timelineData]);

  // Emoji options for coworker expressions
  const REACTION_EMOJIS = ['👍', '❤️', '🎉', '💪', '🔥', '👏', '😍', '🚀', '⭐', '💯', '👌', '🤝'];

  const handleReaction = (itemId: string, emoji: string) => {
    const currentUserReaction = userReactions[itemId];
    const currentUser = (user as any)?.name || 'Anonymous User';
    
    // Close reaction picker
    setShowReactionPicker(prev => ({ ...prev, [itemId]: false }));
    
    // If user already reacted with this emoji, remove it
    if (currentUserReaction === emoji) {
      setUserReactions(prev => {
        const newReactions = { ...prev };
        delete newReactions[itemId];
        return newReactions;
      });
      setReactions(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [emoji]: Math.max(0, (prev[itemId]?.[emoji] || 1) - 1)
        }
      }));
      setReactionUsers(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [emoji]: (prev[itemId]?.[emoji] || []).filter(name => name !== currentUser)
        }
      }));
    } else {
      // Add new reaction or change existing
      if (currentUserReaction) {
        // Remove old reaction
        setReactions(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            [currentUserReaction]: Math.max(0, (prev[itemId]?.[currentUserReaction] || 1) - 1)
          }
        }));
        setReactionUsers(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            [currentUserReaction]: (prev[itemId]?.[currentUserReaction] || []).filter(name => name !== currentUser)
          }
        }));
      }
      
      // Add new reaction
      setUserReactions(prev => ({ ...prev, [itemId]: emoji }));
      setReactions(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [emoji]: (prev[itemId]?.[emoji] || 0) + 1
        }
      }));
      setReactionUsers(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [emoji]: [...(prev[itemId]?.[emoji] || []), currentUser]
        }
      }));
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading timeline...</div>;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TimelineIcon className="w-8 h-8" />
            Activity Timeline
          </h1>
          <div className="flex items-center gap-3">
            <DailyCheckInButton data-tour="timeline-checkin" />
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3">
          Timeline aktivitas dan update progress dari tim Anda dalam format feed
        </p>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <div className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-white' : 'hidden'} lg:block lg:w-72 lg:flex-shrink-0`}>
          <div className="h-full bg-white border border-gray-200 rounded-lg overflow-y-auto">
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
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
            <div className="p-4 space-y-6">
              {/* Filter Counter */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">
                  Showing {filteredData.length} of {timelineData.length} activities
                </div>
                {filteredData.length !== timelineData.length && (
                  <div className="text-xs text-blue-700 mt-1">
                    {timelineData.length - filteredData.length} activities filtered out
                  </div>
                )}
              </div>

              {/* Activity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type
                </label>
                <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="check_in">Check-ins</SelectItem>
                    <SelectItem value="daily_update">Daily Updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User / Team Member
                </label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="current">Current User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="key_results">Key Results</SelectItem>
                    <SelectItem value="metrics">Success Metrics</SelectItem>
                    <SelectItem value="deliverables">Deliverables</SelectItem>
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
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {timelineData.length > 0 ? (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <Card key={item.id} className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                  <CardContent className="p-0">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {item.userProfileImageUrl ? (
                            <img 
                              src={item.userProfileImageUrl} 
                              alt={item.userName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {getUserInitials({ name: item.userName })}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {item.userName}
                              </h3>
                              <span className="text-gray-500 text-xs">•</span>
                              <span className="text-gray-500 text-xs">
                                {format(new Date(item.updateDate), "MMM dd, HH:mm")}
                              </span>
                            </div>
                            {item.type === 'check_in' ? (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                Capaian Angka target
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                Update Harian
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mt-1">
                            {item.type === 'check_in' 
                              ? `Update capaian: ${item.keyResultTitle || 'Key Result'}`
                              : 'Membagikan update progress harian'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {/* Summary Statistics - Hide for check_in items */}
                        {item.type !== 'check_in' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
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
                                className="flex items-center gap-1 text-xs h-7 px-2 text-gray-500 hover:text-gray-700"
                              >
                                <span>{expandedDetails[item.id] ? 'Sembunyikan' : 'Lihat Detail'}</span>
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
                            <div className="bg-blue-50 rounded-lg p-2">
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
                          
                          {/* Key Results Details */}
                          {item.keyResultsSummary && (
                            <div className="bg-purple-50 rounded-lg p-2">
                              
                              <div className="text-xs text-purple-700">
                                {item.keyResultsSummary && item.keyResultsSummary.split(', ').map((kr, index) => (
                                  <div key={index} className="mb-1 last:mb-0">
                                    {item.type === 'check_in' && item.keyResultId ? (
                                      <Link href={`/key-results/${item.keyResultId}`} className="text-purple-700 hover:text-purple-900 hover:underline">
                                        {kr}
                                      </Link>
                                    ) : (
                                      <span>{kr}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Progress Information for Check-ins */}
                              {item.type === 'check_in' && item.keyResultTitle && (
                                <div className="mt-2 pt-2 border-t border-purple-200">
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
                                      const current = parseFloat(item.checkInValue) || 0;
                                      const target = parseFloat(item.keyResultTargetValue) || 1;
                                      const baseline = parseFloat(item.keyResultBaseValue) || 0;
                                      
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
                          const itemReactions = reactions[item.id] || {};
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
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReaction(item.id)}
                              className={`flex items-center space-x-1 text-xs h-7 px-2 rounded-full ${
                                reactions[item.id] ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-blue-600'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${reactions[item.id] ? 'fill-current' : ''}`} />
                              <span>{reactions[item.id] ? 'Disukai' : 'Suka'}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(item.id)}
                              className="flex items-center space-x-1 text-xs h-7 px-2 rounded-full text-gray-500 hover:text-blue-600"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Komentar</span>
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
                                className="flex items-center space-x-1 text-xs h-7 px-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                              >
                                <Smile className="w-3 h-3" />
                                <span>Reaksi</span>
                              </Button>

                              {/* Reaction Picker Dropdown */}
                              {showReactionPicker[item.id] && (
                                <div 
                                  className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[280px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="grid grid-cols-6 gap-1">
                                    {REACTION_EMOJIS.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReaction(item.id, emoji)}
                                        className="flex items-center justify-center p-2 h-10 w-10 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-110"
                                      >
                                        <span className="text-xl">{emoji}</span>
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
                              {/* Sample comment */}
                              <div className="flex space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                  JD
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900 mr-2">John Doe</span>
                                    <span className="text-gray-700">Progress bagus! Lanjutkan 👍</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">2 jam lalu</div>
                                </div>
                              </div>
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
                              <div className="flex-1 flex items-center space-x-2">
                                <div className="flex-1 relative">
                                  <Textarea
                                    placeholder="Tulis komentar..."
                                    value={commentTexts[item.id] || ""}
                                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="flex-1 min-h-[36px] resize-none border-gray-300 rounded-full px-3 py-2 text-sm"
                                    rows={1}
                                  />
                                </div>
                                <Button
                                  onClick={() => handleComment(item.id)}
                                  disabled={!commentTexts[item.id]?.trim() || createCommentMutation.isPending}
                                  size="sm"
                                  variant="ghost"
                                  className="p-2 h-8 w-8 rounded-full hover:bg-gray-100"
                                >
                                  <Send className="w-4 h-4 text-blue-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reaction Detail Modal */}
                        {showReactionModal[item.id] && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
                              {/* Modal Header */}
                              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Reactions</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowReactionModal(prev => ({ ...prev, [item.id]: false }))}
                                  className="p-1 h-8 w-8 rounded-full hover:bg-gray-100"
                                >
                                  <span className="text-gray-500 text-lg">×</span>
                                </Button>
                              </div>
                              
                              {/* Modal Content */}
                              <div className="max-h-[60vh] overflow-y-auto">
                                {(() => {
                                  const itemReactions = reactions[item.id] || {};
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
                                      
                                      {/* User List */}
                                      <div className="p-4 space-y-3">
                                        {sortedReactions.map(([emoji, count]) => {
                                          const users = reactionUsers[item.id]?.[emoji] || [];
                                          return users.map((userName, index) => (
                                            <div key={`${emoji}-${index}`} className="flex items-center space-x-3">
                                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                              </div>
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-900">{userName}</div>
                                              </div>
                                              <div className="text-lg">{emoji}</div>
                                            </div>
                                          ));
                                        })}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <TimelineIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Belum ada activity yang ditampilkan
              </h3>
              <p className="text-gray-600 mb-4">
                Timeline akan menampilkan update harian dan progress check-in dari tim Anda
              </p>
              <div className="text-sm text-gray-500">
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