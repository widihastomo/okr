import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TimelineEntry {
  id: string;
  value: number;
  notes?: string;
  confidence: number;
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  keyResult: {
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
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

export default function TimelinePage() {
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checkInsData, isLoading } = useQuery({
    queryKey: ["/api/timeline"],
    queryFn: () => apiRequest("GET", "/api/timeline"),
    retry: 1,
  });

  // Transform check-ins data into timeline format
  const timelineData = Array.isArray(checkInsData) ? checkInsData.map((checkIn: any) => ({
    id: checkIn.id,
    type: 'check-in',
    content: checkIn.feedback,
    currentValue: checkIn.currentValue,
    targetValue: checkIn.targetValue,
    keyResult: checkIn.keyResult,
    creator: checkIn.creator,
    createdAt: checkIn.createdAt,
    comments: [], // Will be loaded separately
    reactions: [], // Will be loaded separately
  })) : [];

  const createCommentMutation = useMutation({
    mutationFn: ({ checkInId, content }: { checkInId: string; content: string }) =>
      apiRequest("POST", `/api/timeline/${checkInId}/comments`, { content }),
    onSuccess: (_, { checkInId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", checkInId, "comments"] });
      setCommentTexts(prev => ({ ...prev, [checkInId]: "" }));
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
      });
    },
  });

  const createReactionMutation = useMutation({
    mutationFn: ({ checkInId, type }: { checkInId: string; type: string }) =>
      apiRequest("POST", `/api/timeline/${checkInId}/reactions`, { type }),
    onSuccess: (_, { checkInId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline", checkInId, "reactions"] });
      toast({
        title: "Berhasil",
        description: "Reaksi berhasil ditambahkan",
      });
    },
  });

  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.lastName) return user.lastName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const handleComment = (checkInId: string) => {
    const content = commentTexts[checkInId]?.trim();
    if (!content) return;

    createCommentMutation.mutate({ checkInId, content });
  };

  const handleReaction = (checkInId: string, type: string) => {
    createReactionMutation.mutate({ checkInId, type });
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timeline Progress</h1>
          <p className="text-gray-600">
            Lihat dan berikan dukungan untuk progress teman-teman dalam mencapai target
          </p>
        </div>

        {timelineData.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <Clock className="w-12 h-12 mx-auto mb-2" />
              <p>Belum ada progress yang dilaporkan</p>
              <p className="text-sm mt-2">Timeline akan menampilkan progress check-in dari semua anggota tim</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {timelineData.map((entry: TimelineEntry) => (
            <Card key={entry.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getUserInitials(entry.creator)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {getUserName(entry.creator)}
                      </span>
                      <span className="text-sm text-gray-500">
                        melaporkan progress untuk
                      </span>
                      <Target className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.keyResult.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Confidence: {entry.confidence}/10
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress Update</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {entry.value} {entry.keyResult.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (entry.value / entry.keyResult.targetValue) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Target: {entry.keyResult.targetValue} {entry.keyResult.unit}</span>
                    <span>
                      {Math.min(100, Math.round((entry.value / entry.keyResult.targetValue) * 100))}%
                    </span>
                  </div>
                </div>

                {entry.notes && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 italic">"{entry.notes}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReaction(entry.id, "like")}
                      disabled={createReactionMutation.isPending}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReaction(entry.id, "love")}
                      disabled={createReactionMutation.isPending}
                    >
                      <Heart className="w-4 h-4 mr-1 text-red-500" />
                      Love
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReaction(entry.id, "celebrate")}
                      disabled={createReactionMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
                      Celebrate
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Comment
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-500 text-white text-xs">
                        You
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex items-center space-x-2">
                      <Textarea
                        placeholder="Tulis komentar atau dukungan..."
                        value={commentTexts[entry.id] || ""}
                        onChange={(e) => setCommentTexts(prev => ({ 
                          ...prev, 
                          [entry.id]: e.target.value 
                        }))}
                        className="flex-1 min-h-[40px] max-h-[120px]"
                        rows={1}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(entry.id)}
                        disabled={!commentTexts[entry.id]?.trim() || createCommentMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}