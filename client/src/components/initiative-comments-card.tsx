import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { InitiativeCommentEditor } from "./initiative-comment-editor";
import { ThreadedCommentList } from "./threaded-comment-list";
import { InitiativeComment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InitiativeCommentsCardProps {
  initiativeId: string;
}

export function InitiativeCommentsCard({ initiativeId }: InitiativeCommentsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<(InitiativeComment & { user: any }) | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/comments`],
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/initiatives/${initiativeId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/comments`] });
      toast({
        title: "Komentar berhasil dihapus",
        description: "Komentar telah dihapus dari sistem.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast({
        title: "Gagal menghapus komentar",
        description: "Terjadi kesalahan saat menghapus komentar.",
        variant: "destructive",
      });
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await apiRequest("PATCH", `/api/initiatives/${initiativeId}/comments/${commentId}`, {
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/comments`] });
      setEditingComment(null);
      toast({
        title: "Komentar berhasil diperbarui",
        description: "Perubahan komentar telah disimpan.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      toast({
        title: "Gagal memperbarui komentar",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
        variant: "destructive",
      });
    }
  });

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const handleEdit = (comment: InitiativeComment & { user: any }) => {
    setEditingComment(comment);
  };

  const handleDelete = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleSaveEdit = (content: string) => {
    if (editingComment) {
      updateCommentMutation.mutate({ commentId: editingComment.id, content });
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
  };

  const handleToggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            Komentar ({comments.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <InitiativeCommentEditor initiativeId={initiativeId} />
          
          {replyingTo && (
            <div className="pl-4 border-l-2 border-orange-200 bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Membalas komentar</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Batal
                </Button>
              </div>
              <InitiativeCommentEditor
                initiativeId={initiativeId}
                parentId={replyingTo}
                placeholder="Tulis balasan..."
                submitButtonText="Balas"
                onCommentAdded={() => setReplyingTo(null)}
              />
            </div>
          )}

          {editingComment && (
            <div className="pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Mengedit komentar</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Batal
                </Button>
              </div>
              <InitiativeCommentEditor
                initiativeId={initiativeId}
                initialContent={editingComment.content}
                placeholder="Edit komentar..."
                submitButtonText="Simpan"
                isEditing={true}
                onSave={handleSaveEdit}
                showCancelButton={true}
                onCancel={handleCancelEdit}
              />
            </div>
          )}

          <ThreadedCommentList
            comments={comments}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReply={handleReply}
            onToggleReplies={handleToggleReplies}
            expandedReplies={expandedReplies}
          />
        </CardContent>
      )}
    </Card>
  );
}