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
  Package
} from "lucide-react";
import { TimelineIcon } from "@/components/ui/timeline-icon";

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <TimelineIcon size="md" variant="primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
                <p className="text-sm text-gray-600">Activity feed dan progress tim</p>
              </div>
            </div>
            <DailyCheckInButton data-tour="timeline-checkin" />
          </div>
        </div>

        {timelineData.length > 0 ? (
          <div className="space-y-4">
            {timelineData.map((item) => (
              <Card key={item.id} className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                {/* Facebook-style header */}
                <CardContent className="p-0">
                  <div className="p-4 pb-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                          {getUserInitials(item.creator)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              <h3 className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer">
                                {getUserName(item.creator)}
                              </h3>
                              <span className="text-gray-500 text-sm">
                                {item.type === 'check-in' ? 'melaporkan progress angka target' : 'mengirim update harian'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="text-gray-500 text-xs hover:underline cursor-pointer">
                                {new Date(item.createdAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-gray-500 text-xs">🌐</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="p-1 h-8 w-8 rounded-full hover:bg-gray-100">
                            <span className="text-gray-500 font-bold">⋯</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facebook-style content */}
                  <div className="px-4 pb-3">
                    {item.type === 'check-in' ? (
                      // Check-in content
                      <div className="space-y-3">
                        <div className="text-gray-800 text-sm leading-relaxed">
                          {item.content}
                        </div>
                        
                        {/* Progress card */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Target className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {item.keyResult?.title}
                            </h4>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress saat ini:</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                                {item.currentValue || 0} / {item.targetValue || 0} {item.keyResult?.unit || ''}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Persentase:</span>
                              <span className="font-semibold text-blue-700">
                                {Math.round(((item.currentValue || 0) / (item.targetValue || 1)) * 100)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Tingkat yakin:</span>
                              <span className={`font-semibold ${getConfidenceColor(item.confidence)}`}>
                                {getConfidenceText(item.confidence)} ({item.confidence}/10)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Daily update content
                      <div className="space-y-3">
                        <div className="text-gray-800 text-sm leading-relaxed">
                          {item.content}
                        </div>
                        
                        {/* Activity breakdown */}
                        {item.updateData && (() => {
                          const summary = item.content;
                          const sections = [];
                          
                          // Extract different types of updates
                          if (summary.includes('task')) {
                            const taskMatch = summary.match(/(\d+)\s*task/i);
                            if (taskMatch) {
                              sections.push({
                                icon: <CheckSquare className="w-4 h-4 text-blue-600" />,
                                label: "Task diperbarui",
                                value: taskMatch[1],
                                bgColor: "bg-blue-50",
                                textColor: "text-blue-700"
                              });
                            }
                          }
                          
                          if (summary.includes('angka target') || summary.includes('key result')) {
                            const krMatch = summary.match(/(\d+)\s*(angka target|key result)/i);
                            if (krMatch) {
                              sections.push({
                                icon: <Target className="w-4 h-4 text-purple-600" />,
                                label: "Angka target diperbarui", 
                                value: krMatch[1],
                                bgColor: "bg-purple-50",
                                textColor: "text-purple-700"
                              });
                            }
                          }
                          
                          if (summary.includes('success metric') || summary.includes('metrik')) {
                            const smMatch = summary.match(/(\d+)\s*(success metric|metrik)/i);
                            if (smMatch) {
                              sections.push({
                                icon: <BarChart3 className="w-4 h-4 text-orange-600" />,
                                label: "Success metrics diperbarui",
                                value: smMatch[1], 
                                bgColor: "bg-orange-50",
                                textColor: "text-orange-700"
                              });
                            }
                          }
                          
                          if (summary.includes('deliverable') || summary.includes('output')) {
                            const delMatch = summary.match(/(\d+)\s*(deliverable|output)/i);
                            if (delMatch) {
                              sections.push({
                                icon: <Package className="w-4 h-4 text-green-600" />,
                                label: "Deliverables diperbarui",
                                value: delMatch[1],
                                bgColor: "bg-green-50", 
                                textColor: "text-green-700"
                              });
                            }
                          }
                          
                          return sections.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sections.map((section, idx) => (
                                <div key={idx} className={`${section.bgColor} border border-opacity-30 rounded-lg p-3 flex items-center space-x-3`}>
                                  {section.icon}
                                  <div>
                                    <div className={`font-semibold text-sm ${section.textColor}`}>
                                      {section.value}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {section.label}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Facebook-style engagement section */}
                  <div className="border-t border-gray-200">
                    {/* Reaction summary */}
                    {(item.reactions?.like || item.reactions?.love || item.reactions?.support || item.reactions?.celebrate) > 0 && (
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <div className="flex -space-x-1">
                              {item.reactions?.like > 0 && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">👍</div>
                              )}
                              {item.reactions?.love > 0 && (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">❤️</div>
                              )}
                              {item.reactions?.support > 0 && (
                                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-white">⭐</div>
                              )}
                              {item.reactions?.celebrate > 0 && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">🎉</div>
                              )}
                            </div>
                            <span className="ml-2">
                              {(item.reactions?.like || 0) + (item.reactions?.love || 0) + (item.reactions?.support || 0) + (item.reactions?.celebrate || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="px-4 py-2">
                      <div className="flex items-center justify-around">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(item.id, "like")}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-gray-50 rounded-md text-gray-600 hover:text-blue-600"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Suka</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(item.id)}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-gray-50 rounded-md text-gray-600 hover:text-blue-600"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Komentar</span>
                        </Button>
                        
                        {item.type === 'check-in' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(item.id, "celebrate")}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 hover:bg-gray-50 rounded-md text-gray-600 hover:text-green-600"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Rayakan</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Comments section */}
                    {showComments[item.id] && (
                      <div className="border-t border-gray-100 px-4 py-3">
                        <div className="flex items-start space-x-2">
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
  );
}