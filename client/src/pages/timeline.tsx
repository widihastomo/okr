import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  Send 
} from 'lucide-react';
import { format } from 'date-fns';
import { getUserInitials } from '@/lib/utils';
import DailyCheckInButton from '@/components/daily-checkin-button';
import TimelineIcon from '@/components/ui/timeline-icon';
import { apiRequest } from '@/lib/queryClient';

interface TimelineItem {
  id: string;
  type: 'check_in' | 'daily_update';
  createdAt: string;
  userName: string;
  userId: string;
  keyResultTitle?: string;
  previousValue?: number;
  currentValue?: number;
  notes?: string;
  summary?: string;
}

export default function TimelinePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Filter states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  
  // Social interaction states
  const [reactions, setReactions] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  // Fetch timeline data
  const { data: timelineData = [], isLoading } = useQuery<TimelineItem[]>({
    queryKey: ['/api/timeline'],
  });

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return timelineData.filter((item) => {
      if (activityTypeFilter !== 'all' && item.type !== activityTypeFilter) return false;
      if (userFilter !== 'all' && userFilter !== 'current' && item.userId !== userFilter) return false;
      
      // Date range filtering
      if (dateRangeFilter !== 'all') {
        const itemDate = new Date(item.createdAt);
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
      apiRequest(`/api/timeline/${data.timelineId}/comments`, {
        method: 'POST',
        body: { comment: data.comment }
      }),
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

  if (isLoading) {
    return <div className="text-center py-12">Loading timeline...</div>;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TimelineIcon size="md" variant="primary" className="w-8 h-8" />
            Activity Timeline
          </h1>
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
        <p className="text-gray-600 text-sm mb-3">
          Timeline aktivitas dan update progress dari tim Anda dalam format feed
        </p>
        <div className="flex items-center justify-center">
          <DailyCheckInButton data-tour="timeline-checkin" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <div className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-white' : 'hidden'} lg:block lg:w-80 lg:flex-shrink-0`}>
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
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {getUserInitials({ name: item.userName || "User" })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {item.userName || "Unknown User"}
                            </h3>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-gray-500 text-xs">
                              {format(new Date(item.createdAt), "MMM dd, HH:mm")}
                            </span>
                            <Badge variant={item.type === 'check_in' ? 'default' : 'secondary'} className="text-xs">
                              {item.type === 'check_in' ? 'Check-in' : 'Daily Update'}
                            </Badge>
                          </div>
                          <p className="text-gray-700 text-sm mt-1">
                            {item.type === 'check_in' 
                              ? `Updated ${item.keyResultTitle} progress` 
                              : 'Shared daily update with team'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {item.type === 'check_in' ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-gray-700">
                                {item.keyResultTitle}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Progress Update
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-gray-600">
                                Previous: <span className="font-medium text-gray-900">{item.previousValue}</span>
                              </div>
                              <div className="text-blue-600">
                                Current: <span className="font-medium text-blue-700">{item.currentValue}</span>
                              </div>
                            </div>
                            {item.notes && (
                              <div className="mt-2 text-sm text-gray-700 bg-white rounded p-2">
                                <div className="font-medium text-gray-600 mb-1">Notes:</div>
                                {item.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-700 text-sm leading-relaxed">
                            <div className="font-medium text-gray-600 mb-2">Daily Update Summary:</div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div dangerouslySetInnerHTML={{ __html: item.summary || "No summary available" }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Engagement Section */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReaction(item.id)}
                              className={`flex items-center space-x-2 text-sm h-8 px-3 rounded-full ${
                                reactions[item.id] ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-blue-600'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${reactions[item.id] ? 'fill-current' : ''}`} />
                              <span>{reactions[item.id] ? 'Liked' : 'Like'}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(item.id)}
                              className="flex items-center space-x-2 text-sm h-8 px-3 rounded-full text-gray-500 hover:text-blue-600"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Comment</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-2 text-sm h-8 px-3 rounded-full text-gray-500 hover:text-blue-600"
                            >
                              <Share2 className="w-4 h-4" />
                              <span>Share</span>
                            </Button>
                          </div>
                        </div>

                        {/* Comments Section */}
                        {showComments[item.id] && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="space-y-3 mb-3">
                              {/* Sample comment */}
                              <div className="flex space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                  JD
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900 mr-2">John Doe</span>
                                    <span className="text-gray-700">Great progress! Keep it up 👍</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">2h ago</div>
                                </div>
                              </div>
                            </div>

                            {/* Add Comment */}
                            <div className="flex space-x-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                  {getUserInitials({ name: "Current User" })}
                                </div>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <TimelineIcon size="lg" variant="muted" className="w-16 h-16 mx-auto mb-4" />
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
      </div>
    </>
  );
}