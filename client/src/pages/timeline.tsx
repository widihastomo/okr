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
                          {item.user.profileImageUrl ? (
                            <img 
                              src={item.user.profileImageUrl} 
                              alt={item.user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {getUserInitials({ name: item.user.name })}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {item.user.name}
                            </h3>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-gray-500 text-xs">
                              {format(new Date(item.updateDate), "MMM dd, HH:mm")}
                            </span>
                            <Badge variant="default" className="text-xs">
                              Daily Update
                            </Badge>
                            {item.totalUpdates > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {item.totalUpdates} updates
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mt-1">
                            Shared comprehensive daily progress update
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <div className="space-y-4">
                        {/* Main Summary */}
                        <div className="text-gray-700 text-sm leading-relaxed">
                          <div className="font-medium text-gray-600 mb-2">Daily Update Summary:</div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div dangerouslySetInnerHTML={{ __html: item.summary || "No summary available" }} />
                          </div>
                        </div>

                        {/* Update Statistics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {item.tasksUpdated > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-blue-600">{item.tasksUpdated}</div>
                              <div className="text-xs text-blue-700">Tasks Updated</div>
                            </div>
                          )}
                          {item.tasksCompleted > 0 && (
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-green-600">{item.tasksCompleted}</div>
                              <div className="text-xs text-green-700">Tasks Completed</div>
                            </div>
                          )}
                          {item.keyResultsUpdated > 0 && (
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-purple-600">{item.keyResultsUpdated}</div>
                              <div className="text-xs text-purple-700">Key Results</div>
                            </div>
                          )}
                          {item.successMetricsUpdated > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-orange-600">{item.successMetricsUpdated}</div>
                              <div className="text-xs text-orange-700">Success Metrics</div>
                            </div>
                          )}
                          {item.deliverablesUpdated > 0 && (
                            <div className="bg-indigo-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-indigo-600">{item.deliverablesUpdated}</div>
                              <div className="text-xs text-indigo-700">Deliverables</div>
                            </div>
                          )}
                          {item.deliverablesCompleted > 0 && (
                            <div className="bg-teal-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-teal-600">{item.deliverablesCompleted}</div>
                              <div className="text-xs text-teal-700">Completed</div>
                            </div>
                          )}
                        </div>

                        {/* Detailed Information */}
                        <div className="space-y-3">
                          {item.tasksSummary && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="font-medium text-blue-800 mb-1 text-sm">📋 Tasks Progress</div>
                              <div className="text-sm text-blue-700">{item.tasksSummary}</div>
                            </div>
                          )}
                          
                          {item.keyResultsSummary && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="font-medium text-purple-800 mb-1 text-sm">🎯 Key Results Progress</div>
                              <div className="text-sm text-purple-700">{item.keyResultsSummary}</div>
                            </div>
                          )}

                          {item.successMetricsSummary && (
                            <div className="bg-orange-50 rounded-lg p-3">
                              <div className="font-medium text-orange-800 mb-1 text-sm">📊 Success Metrics</div>
                              <div className="text-sm text-orange-700">{item.successMetricsSummary}</div>
                            </div>
                          )}

                          {item.deliverablesSummary && (
                            <div className="bg-indigo-50 rounded-lg p-3">
                              <div className="font-medium text-indigo-800 mb-1 text-sm">📦 Deliverables</div>
                              <div className="text-sm text-indigo-700">{item.deliverablesSummary}</div>
                            </div>
                          )}

                          {item.whatWorkedWell && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="font-medium text-green-800 mb-1 text-sm">✅ What Worked Well</div>
                              <div className="text-sm text-green-700">{item.whatWorkedWell}</div>
                            </div>
                          )}

                          {item.challenges && (
                            <div className="bg-red-50 rounded-lg p-3">
                              <div className="font-medium text-red-800 mb-1 text-sm">⚠️ Challenges</div>
                              <div className="text-sm text-red-700">{item.challenges}</div>
                            </div>
                          )}
                        </div>

                        {/* Update Types */}
                        {item.updateTypes && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                            Types: {item.updateTypes}
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
                                {user?.profileImageUrl ? (
                                  <img 
                                    src={user.profileImageUrl} 
                                    alt={user.name || user.email}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                    {getUserInitials({ name: user?.name || user?.email || "User" })}
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
      </div>
    </>
  );
}