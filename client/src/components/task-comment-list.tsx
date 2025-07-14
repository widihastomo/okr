import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { TaskComment, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Edit2, Trash2, User as UserIcon, Reply, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { TaskCommentEditor } from "./task-comment-editor";

interface TaskCommentListProps {
  taskId: string;
}

type TaskCommentWithUser = TaskComment & { user: User };

export function TaskCommentList({ taskId }: TaskCommentListProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<TaskCommentWithUser[]>({
    queryKey: [`/api/tasks/${taskId}/comments`],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Organize comments into thread structure
  const organizeComments = (comments: TaskCommentWithUser[]) => {
    const parentComments = comments.filter(comment => !comment.parentId);
    const childComments = comments.filter(comment => comment.parentId);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: childComments.filter(child => child.parentId === parent.id)
    }));
  };

  const threadedComments = organizeComments(comments);

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleReplyAdded = (parentId: string) => {
    setReplyingToCommentId(null);
    // Auto-expand replies when a new reply is added
    setExpandedReplies(prev => new Set(prev).add(parentId));
  };

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}/comments/${commentId}`, {
        content,
        mentionedUsers: [], // Simple implementation - could be enhanced
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      setEditingCommentId(null);
      setEditContent("");
      toast({
        title: "Berhasil",
        description: "Komentar berhasil diperbarui",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui komentar",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      setDeleteCommentId(null);
      toast({
        title: "Berhasil",
        description: "Komentar berhasil dihapus",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menghapus komentar",
        variant: "destructive",
      });
    },
  });

  const handleEditStart = (comment: TaskCommentWithUser) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleEditSave = (commentId: string, content?: string) => {
    const contentToSave = content || editContent;
    if (!contentToSave.trim()) return;
    updateCommentMutation.mutate({ commentId, content: contentToSave.trim() });
  };

  const handleDeleteConfirm = () => {
    if (deleteCommentId) {
      deleteCommentMutation.mutate(deleteCommentId);
    }
  };

  const renderCommentContent = (content: string) => {
    // Simple markdown-like rendering
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline">$1</a>');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p className="text-sm">Belum ada komentar untuk task ini</p>
        <p className="text-xs mt-1">Jadilah yang pertama berkomentar!</p>
      </div>
    );
  }

  const renderComment = (comment: TaskCommentWithUser & { replies?: TaskCommentWithUser[] }, isReply = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-3 group ${isReply ? 'ml-8' : ''}`}
    >
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
          {(comment.user.firstName || 'U')?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-3 py-2 relative">
          <div className="flex items-center gap-2 mb-1 pr-8">
            <span className="font-medium text-sm text-gray-900">
              {comment.user.firstName && comment.user.lastName
                ? `${comment.user.firstName} ${comment.user.lastName}`
                : comment.user.firstName || 'User'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(comment.createdAt ? new Date(comment.createdAt) : new Date(), {
                addSuffix: true,
                locale: id,
              })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(diedit)</span>
            )}
          </div>

          {/* Action menu - positioned inside bubble at top-right */}
          {currentUser?.id === comment.userId && editingCommentId !== comment.id && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleEditStart(comment)}
                    className="text-sm"
                  >
                    <Edit2 className="mr-2 h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteCommentId(comment.id)}
                    className="text-sm text-red-600"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {editingCommentId === comment.id ? (
            <div className="space-y-2 mt-2">
              <TaskCommentEditor
                taskId={taskId}
                onCommentSubmit={(content) => {
                  handleEditSave(comment.id, content);
                }}
                initialContent={editContent}
                placeholder="Edit komentar..."
                submitButtonText={updateCommentMutation.isPending ? "Menyimpan..." : "Simpan"}
                isSubmitting={updateCommentMutation.isPending}
                showCancelButton={true}
                onCancel={handleEditCancel}
              />
            </div>
          ) : (
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: renderCommentContent(comment.content),
              }}
            />
          )}
        </div>
        
        {/* Reply and view replies section */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingToCommentId(comment.id)}
            className="h-6 px-2 text-xs hover:text-gray-700"
          >
            <Reply className="h-3 w-3 mr-1" />
            Balas
          </Button>
          
          {/* Show reply count and toggle */}
          {comment.replies && comment.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleReplies(comment.id)}
              className="h-6 px-2 text-xs hover:text-gray-700"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              {comment.replies.length} balasan
            </Button>
          )}
        </div>
        
        {/* Reply form */}
        {replyingToCommentId === comment.id && (
          <div className="ml-4 mt-2 border-l-2 border-orange-200 pl-4">
            <TaskCommentEditor
              taskId={taskId}
              parentId={comment.id}
              placeholder="Balas komentar..."
              submitButtonText="Kirim Balasan"
              onCommentAdded={() => handleReplyAdded(comment.id)}
              showCancelButton={true}
              onCancel={() => setReplyingToCommentId(null)}
            />
          </div>
        )}
        
        {/* Nested replies display */}
        {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.id) && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {threadedComments.map((comment) => renderComment(comment))}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komentar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteCommentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCommentMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}