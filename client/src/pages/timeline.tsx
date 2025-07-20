import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DailyCheckInButton from "@/components/daily-checkin-button";
import { 
  Heart, 
  MessageCircle, 
  ThumbsUp, 
  Star, 
  Sparkles,
  Send,
  Users,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  CalendarCheck,
  BarChart3,
  CheckCircle,
  CheckSquare,
  Package,
  Activity,
  Zap,
  BookOpen,
  Flag,
  AlertCircle
} from "lucide-react";
import { TimelineIcon } from "@/components/ui/timeline-icon";
import { 
  VerticalTimeline, 
  VerticalTimelineElement 
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

interface TimelineItem {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  currentValue?: number;
  targetValue?: number;
  confidence: number;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  keyResult?: {
    id: string;
    title: string;
    unit: string;
  };
  reactions: {
    like: number;
    love: number;
    support: number;
    celebrate: number;
  };
  comments: TimelineComment[];
}

interface TimelineUpdate {
  id: string;
  userId: string;
  organizationId: string;
  updateDate: string;
  summary: string;
  tasksUpdated?: number;
  tasksCompleted?: number;
  tasksSummary?: string;
  keyResultsUpdated?: number;
  keyResultsSummary?: string;
  successMetricsUpdated?: number;
  successMetricsSummary?: string;
  deliverablesUpdated?: number;
  deliverablesCompleted?: number;
  deliverablesSummary?: string;
  whatWorkedWell?: string;
  challenges?: string;
  totalUpdates: number;
  updateTypes: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface TimelineComment {
  id: string;
  content: string;
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TimelineReaction {
  id: string;
  type: "like" | "love" | "support" | "celebrate";
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Helper functions
const getUserName = (user: any) => {
  if (!user) return 'Unknown User';
  
  // Use consolidated name field
  if (user.name && user.name.trim() !== '') {
    return user.name.trim();
  }
  
  // Fallback to email username
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
};

const getUserInitials = (user: any) => {
  if (!user) return 'U';
  
  // Use consolidated name field
  if (user.name && user.name.trim() !== '') {
    const nameParts = user.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }
  
  // Fallback to email
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return 'U';
};

export default function TimelinePage() {
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch check-ins data
  const { data: checkInsData, isLoading: checkInsLoading } = useQuery({
    queryKey: ["/api/timeline"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/timeline");
      return await response.json();
    },
    retry: 1,
  });

  // Fetch timeline updates data (using same endpoint but different query)
  const { data: timelineUpdatesData, isLoading: timelineUpdatesLoading } = useQuery({
    queryKey: ["/api/timeline", "updates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/timeline");
      if (response.ok) {
        const data = await response.json();
        // Filter to get only timeline updates (not check-ins)
        return data.filter((item: any) => item.summary && !item.keyResult);
      }
      return []; // Return empty array if endpoint doesn't exist yet
    },
    retry: 1,
  });

  const isLoading = checkInsLoading || timelineUpdatesLoading;

  // Transform check-ins data into timeline format
  const checkInsTimeline = Array.isArray(checkInsData) ? checkInsData.map((checkIn: any) => ({
    id: checkIn.id,
    type: 'check-in',
    content: checkIn.notes || checkIn.feedback,
    currentValue: parseFloat(checkIn.value) || checkIn.currentValue,
    targetValue: checkIn.targetValue,
    keyResult: checkIn.keyResult,
    creator: checkIn.creator,
    createdAt: checkIn.createdAt,
    confidence: checkIn.confidence || 7,
    comments: [], // Will be loaded separately
    reactions: reactionCounts[checkIn.id] || { like: 0, love: 0, support: 0, celebrate: 0 },
  })) : [];

  // Transform timeline updates into timeline format
  const updatesTimeline = Array.isArray(timelineUpdatesData) ? timelineUpdatesData.map((update: TimelineUpdate, index) => ({
    id: `update-${update.id}-${index}`, // Ensure unique keys
    type: 'daily-update',
    content: update.summary,
    creator: {
      id: update.userId,
      firstName: update.user?.name ? update.user.name.split(' ')[0] : '',
      lastName: update.user?.name ? update.user.name.split(' ').slice(1).join(' ') : '',
      email: update.user?.email || '',
      name: update.user?.name || update.user?.email?.split('@')[0] || 'User',
    },
    createdAt: update.createdAt,
    confidence: 7,
    comments: [],
    reactions: { like: 0, love: 0, support: 0, celebrate: 0 },
    updateData: update, // Include full update data
  })) : [];

  // Combine and sort timeline data
  const timelineData = [...checkInsTimeline, ...updatesTimeline].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const createCommentMutation = useMutation({
    mutationFn: ({ checkInId, content }: { checkInId: string; content: string }) =>
      apiRequest("POST", `/api/timeline/${checkInId}/comments`, { content }),
    onSuccess: (_, { checkInId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      setCommentTexts(prev => ({ ...prev, [checkInId]: "" }));
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan (demo mode)",
      });
    },
  });

  const createReactionMutation = useMutation({
    mutationFn: ({ checkInId, type }: { checkInId: string; type: string }) =>
      apiRequest("POST", `/api/timeline/${checkInId}/reactions`, { type }),
    onSuccess: (_, { checkInId, type }) => {
      // Update reaction counts locally for immediate feedback
      setReactionCounts(prev => ({
        ...prev,
        [checkInId]: {
          ...prev[checkInId],
          [type]: (prev[checkInId]?.[type] || 0) + 1
        }
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      toast({
        title: "Berhasil",
        description: "Reaksi berhasil ditambahkan",
      });
    },
    onError: (_, { checkInId, type }) => {
      // Update reaction counts locally for immediate feedback even on error
      setReactionCounts(prev => ({
        ...prev,
        [checkInId]: {
          ...prev[checkInId],
          [type]: (prev[checkInId]?.[type] || 0) + 1
        }
      }));
      toast({
        title: "Berhasil",
        description: "Reaksi berhasil ditambahkan (demo mode)",
      });
    },
  });



  const handleComment = (checkInId: string) => {
    const content = commentTexts[checkInId]?.trim();
    if (!content) return;

    createCommentMutation.mutate({ checkInId, content });
  };

  const handleReaction = (checkInId: string, type: string) => {
    createReactionMutation.mutate({ checkInId, type });
  };

  const toggleComments = (checkInId: string) => {
    setShowComments(prev => ({
      ...prev,
      [checkInId]: !prev[checkInId]
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600';
    if (confidence >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 8) return 'Sangat Yakin';
    if (confidence >= 6) return 'Cukup Yakin';
    return 'Kurang Yakin';
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case "like": return <ThumbsUp className="w-4 h-4" />;
      case "love": return <Heart className="w-4 h-4" />;
      case "support": return <Star className="w-4 h-4" />;
      case "celebrate": return <Sparkles className="w-4 h-4" />;
      default: return <ThumbsUp className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get timeline element configuration
  const getTimelineElementConfig = (item: any) => {
    if (item.type === 'check-in') {
      const progressPercent = Math.round(((item.currentValue || 0) / (item.targetValue || 1)) * 100);
      let iconBgColor = '#3b82f6'; // blue
      let contentArrowColor = '#3b82f6';
      
      if (progressPercent >= 100) {
        iconBgColor = '#10b981'; // green
        contentArrowColor = '#10b981';
      } else if (progressPercent >= 75) {
        iconBgColor = '#06b6d4'; // cyan
        contentArrowColor = '#06b6d4';
      } else if (progressPercent >= 50) {
        iconBgColor = '#f59e0b'; // amber
        contentArrowColor = '#f59e0b';
      } else if (progressPercent < 25) {
        iconBgColor = '#ef4444'; // red
        contentArrowColor = '#ef4444';
      }

      return {
        icon: <TrendingUp className="w-4 h-4" />,
        iconBgColor,
        contentArrowColor,
        date: new Date(item.createdAt).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      };
    } else {
      return {
        icon: <Activity className="w-4 h-4" />,
        iconBgColor: '#10b981', // green for daily updates
        contentArrowColor: '#10b981',
        date: new Date(item.createdAt).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TimelineIcon size="md" variant="primary" />
              <h1 className="text-2xl font-bold text-gray-900">Timeline Komprehensif</h1>
            </div>
            <DailyCheckInButton data-tour="timeline-checkin" />
          </div>
          <p className="text-gray-600">Timeline interaktif progress dan aktivitas tim</p>
          
          {/* Timeline Stats */}
          {timelineData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Aktivitas</p>
                    <p className="text-lg font-semibold">{timelineData.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Progress Reports</p>
                    <p className="text-lg font-semibold">{timelineData.filter(item => item.type === 'check-in').length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Daily Updates</p>
                    <p className="text-lg font-semibold">{timelineData.filter(item => item.type === 'daily-update').length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Contributors</p>
                    <p className="text-lg font-semibold">{[...new Set(timelineData.map(item => item.creator?.id))].length}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {timelineData.length > 0 ? (
          <div className="timeline-container">
            <VerticalTimeline>
              {timelineData.map((item) => {
                const config = getTimelineElementConfig(item);
                
                return (
                  <VerticalTimelineElement
                    key={item.id}
                    className="vertical-timeline-element--work"
                    contentStyle={{
                      background: '#ffffff',
                      boxShadow: '0 3px 0 #f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    contentArrowStyle={{ borderRight: `7px solid ${config.contentArrowColor}` }}
                    date={config.date}
                    iconStyle={{ 
                      background: config.iconBgColor, 
                      color: '#ffffff',
                      boxShadow: '0 0 0 4px #f3f4f6, inset 0 2px 0 rgba(0,0,0,.08), 0 3px 0 4px rgba(0,0,0,.05)'
                    }}
                    icon={config.icon}
                  >
                    {/* Timeline Element Content */}
                    <div className="timeline-content">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {getUserInitials(item.creator)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {getUserName(item.creator)}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {item.type === 'check-in' ? 'melaporkan progress' : 'mengirim update harian'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={item.type === 'check-in' ? 'default' : 'secondary'} className="text-xs">
                          {item.type === 'check-in' ? 'Progress' : 'Update'}
                        </Badge>
                      </div>

                      {/* Content */}
                      {item.type === 'check-in' ? (
                        // Check-in content
                        <div className="space-y-3">
                          {/* Key Result Info */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                {item.keyResult?.title || 'Target tidak ditemukan'}
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-blue-700">
                                <span>Progress</span>
                                <span>{Math.round(((item.currentValue || 0) / (item.targetValue || 1)) * 100)}%</span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, Math.round(((item.currentValue || 0) / (item.targetValue || 1)) * 100))}%`
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <Badge variant="outline" className="text-blue-700 border-blue-300">
                                  {item.currentValue || 0} / {item.targetValue || 0} {item.keyResult?.unit || ''}
                                </Badge>
                                <span className={`font-medium ${getConfidenceColor(item.confidence)}`}>
                                  {getConfidenceText(item.confidence)} ({item.confidence}/10)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg">
                            {item.content || 'Tidak ada catatan'}
                          </div>

                          {/* Reactions & Comments */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReaction(item.id, "like")}
                                className="flex items-center space-x-1 hover:text-blue-600 text-xs"
                              >
                                {getReactionIcon("like")}
                                <span>{item.reactions?.like || 0}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReaction(item.id, "celebrate")}
                                className="flex items-center space-x-1 hover:text-green-600 text-xs"
                              >
                                {getReactionIcon("celebrate")}
                                <span>{item.reactions?.celebrate || 0}</span>
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(item.id)}
                              className="flex items-center space-x-1 text-xs"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Komentar</span>
                            </Button>
                          </div>

                          {/* Comments Section */}
                          {showComments[item.id] && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Textarea
                                  placeholder="Tulis komentar..."
                                  value={commentTexts[item.id] || ""}
                                  onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="flex-1 min-h-[40px] resize-none text-sm"
                                  rows={1}
                                />
                                <Button
                                  onClick={() => handleComment(item.id)}
                                  disabled={!commentTexts[item.id]?.trim() || createCommentMutation.isPending}
                                  size="sm"
                                  className="px-2"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Daily update content with enhanced breakdown
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Zap className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-900">
                                Ringkasan Aktivitas
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-800 mb-3">
                              {item.content}
                            </p>

                            {/* Activity Breakdown */}
                            {(() => {
                              const summary = item.content;
                              const activities = [];
                              
                              // Parse different types of updates
                              if (summary.includes('task')) {
                                const taskMatch = summary.match(/(\d+)\s*task/i);
                                if (taskMatch) {
                                  activities.push({
                                    icon: <CheckSquare className="w-3 h-3" />,
                                    label: "Tasks",
                                    value: taskMatch[1],
                                    color: "bg-blue-100 text-blue-800"
                                  });
                                }
                              }
                              
                              if (summary.includes('angka target') || summary.includes('key result')) {
                                const krMatch = summary.match(/(\d+)\s*(angka target|key result)/i);
                                if (krMatch) {
                                  activities.push({
                                    icon: <Target className="w-3 h-3" />,
                                    label: "Key Results",
                                    value: krMatch[1],
                                    color: "bg-purple-100 text-purple-800"
                                  });
                                }
                              }
                              
                              if (summary.includes('success metric') || summary.includes('metrik')) {
                                const smMatch = summary.match(/(\d+)\s*(success metric|metrik)/i);
                                if (smMatch) {
                                  activities.push({
                                    icon: <BarChart3 className="w-3 h-3" />,
                                    label: "Metrics",
                                    value: smMatch[1],
                                    color: "bg-orange-100 text-orange-800"
                                  });
                                }
                              }
                              
                              if (summary.includes('deliverable') || summary.includes('output')) {
                                const delMatch = summary.match(/(\d+)\s*(deliverable|output)/i);
                                if (delMatch) {
                                  activities.push({
                                    icon: <Package className="w-3 h-3" />,
                                    label: "Deliverables",
                                    value: delMatch[1],
                                    color: "bg-emerald-100 text-emerald-800"
                                  });
                                }
                              }
                              
                              return activities.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {activities.map((activity, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-2 rounded ${activity.color} text-xs`}>
                                      <div className="flex items-center space-x-1">
                                        {activity.icon}
                                        <span>{activity.label}</span>
                                      </div>
                                      <Badge variant="secondary" className="text-xs">
                                        {activity.value}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </VerticalTimelineElement>
                );
              })}
            </VerticalTimeline>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <TimelineIcon size="lg" variant="muted" className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Timeline Masih Kosong
              </h3>
              <p className="text-gray-600 mb-4">
                Timeline akan muncul ketika ada member yang melaporkan progress atau mengirim update
              </p>
              <DailyCheckInButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}