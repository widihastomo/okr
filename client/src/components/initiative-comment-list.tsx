import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Edit2, Trash2, User as UserIcon } from "lucide-react";
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
import { InitiativeCommentEditor } from "./initiative-comment-editor";

interface InitiativeCommentListProps {
  initiativeId: string;
}

type InitiativeCommentWithUser = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  user: User;
};

export function InitiativeCommentList({ initiativeId }: InitiativeCommentListProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<InitiativeCommentWithUser[]>({
    queryKey: [`/api/initiatives/${initiativeId}/comments`],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await apiRequest("PATCH", `/api/initiatives/${initiativeId}/comments/${commentId}`, {
        content,
        mentionedUsers: [], // Simple implementation - could be enhanced
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/comments`] });
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
      await apiRequest("DELETE", `/api/initiatives/${initiativeId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/comments`] });
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

  const handleEditStart = (comment: InitiativeCommentWithUser) => {
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
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Belum ada komentar untuk inisiatif ini</p>
        <p className="text-sm">Mulai diskusi dengan menambahkan komentar pertama</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-medium">
                  {getUserInitials(comment.user)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {getUserName(comment.user)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { 
                        addSuffix: true, 
                        locale: id 
                      })}
                    </span>
                    {comment.createdAt !== comment.updatedAt && (
                      <span className="text-xs text-gray-400">(diedit)</span>
                    )}
                  </div>
                  
                  {currentUser?.id === comment.authorId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(comment)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteCommentId(comment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className="mt-2">
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <InitiativeCommentEditor
                        initiativeId={initiativeId}
                        initialContent={editContent}
                        onSave={(content) => handleEditSave(comment.id, content)}
                        onCancel={handleEditCancel}
                        isEditing={true}
                      />
                    </div>
                  ) : (
                    <div 
                      className="text-gray-700 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: renderCommentContent(comment.content) 
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCommentId !== null} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komentar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="focus:ring-orange-500">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}