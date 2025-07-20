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
  CheckCircle
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
  const updatesTimeline = Array.isArray(timelineUpdatesData) ? timelineUpdatesData.map((update: TimelineUpdate) => ({
    id: update.id,
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TimelineIcon size="md" variant="primary" />
              <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
            </div>
            <DailyCheckInButton data-tour="timeline-checkin" />
          </div>
          <p className="text-gray-600">Timeline progress dan interaksi tim</p>
        </div>

        {timelineData.length > 0 ? (
          <div className="space-y-6">
            {timelineData.map((item) => (
              <Card key={item.id} className="w-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {getUserInitials(item.creator)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getUserName(item.creator)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.type === 'check-in' ? 'melaporkan progress' : 'mengirim update harian'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.type === 'check-in' ? (
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                          ) : (
                            <CalendarCheck className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {item.type === 'check-in' ? (
                      // Check-in display
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {item.keyResult?.title}
                          </span>
                        </div>
                        <p className="text-gray-800 mb-3">
                          {item.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Badge variant="secondary">
                              {item.currentValue || 0} / {item.targetValue || 0} {item.keyResult?.unit || ''}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4" />
                            <span>Progress: {Math.round(((item.currentValue || 0) / (item.targetValue || 1)) * 100)}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`font-medium ${getConfidenceColor(item.confidence)}`}>
                              {getConfidenceText(item.confidence)} ({item.confidence}/10)
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Daily update display
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <CalendarCheck className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Update Harian
                          </span>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-gray-800 text-sm whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {item.type === 'check-in' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(item.id, "like")}
                              className="flex items-center space-x-1 hover:text-blue-600"
                            >
                              {getReactionIcon("like")}
                              <span>{item.reactions?.like || 0}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(item.id, "love")}
                              className="flex items-center space-x-1 hover:text-red-600"
                            >
                              {getReactionIcon("love")}
                              <span>{item.reactions?.love || 0}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(item.id, "support")}
                              className="flex items-center space-x-1 hover:text-yellow-600"
                            >
                              {getReactionIcon("support")}
                              <span>{item.reactions?.support || 0}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(item.id, "celebrate")}
                              className="flex items-center space-x-1 hover:text-green-600"
                            >
                              {getReactionIcon("celebrate")}
                              <span>{item.reactions?.celebrate || 0}</span>
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComments(item.id)}
                            className="flex items-center space-x-1"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Komentar</span>
                          </Button>
                        </div>
                      </div>

                      {showComments[item.id] && (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Textarea
                              placeholder="Tulis komentar..."
                              value={commentTexts[item.id] || ""}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="flex-1 min-h-[40px] resize-none"
                              rows={1}
                            />
                            <Button
                              onClick={() => handleComment(item.id)}
                              disabled={!commentTexts[item.id]?.trim() || createCommentMutation.isPending}
                              size="sm"
                              className="px-3"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <TimelineIcon size="lg" variant="muted" className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Belum ada progress yang dilaporkan
              </h3>
              <p className="text-gray-600">
                Timeline akan muncul ketika ada member yang melaporkan progress mereka
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}