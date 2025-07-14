import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Edit2, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';

interface InitiativeComment {
  id: string;
  initiativeId: string;
  userId: string;
  content: string;
  mentionedUsers: string[] | null;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    role: string;
    isActive: boolean;
  };
}

interface InitiativeCommentUnifiedProps {
  initiativeId: string;
}

export function InitiativeCommentUnified({ initiativeId }: InitiativeCommentUnifiedProps) {
  const [isCommenting, setIsCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch comments
  const { data: commentsData = [], isLoading } = useQuery<InitiativeComment[]>({
    queryKey: ['/api/initiatives', initiativeId, 'comments'],
    queryFn: () => apiRequest('GET', `/api/initiatives/${initiativeId}/comments`),
    enabled: !!initiativeId
  });

  // Ensure comments is always an array
  const comments = Array.isArray(commentsData) ? commentsData : [];

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest('POST', `/api/initiatives/${initiativeId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives', initiativeId, 'comments'] });
      setNewComment('');
      setIsCommenting(false);
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      apiRequest('PATCH', `/api/initiatives/${initiativeId}/comments/${commentId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives', initiativeId, 'comments'] });
      setEditingCommentId(null);
      setEditingContent('');
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiRequest('DELETE', `/api/initiatives/${initiativeId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives', initiativeId, 'comments'] });
    }
  });

  const handleCreateComment = () => {
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment);
    }
  };

  const handleUpdateComment = (commentId: string) => {
    if (editingContent.trim()) {
      updateCommentMutation.mutate({ commentId, content: editingContent });
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const startEditing = (comment: InitiativeComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const getUserDisplayName = (user: InitiativeComment['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'User';
  };

  const getUserInitials = (user: InitiativeComment['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const isCommentExpanded = (commentId: string) => expandedComments.has(commentId);

  const shouldTruncate = (content: string) => content.length > 200;

  const truncateContent = (content: string) => {
    if (content.length <= 200) return content;
    return content.substring(0, 200) + '...';
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Komentar Inisiatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Komentar Inisiatif
            <Badge variant="secondary" className="ml-2">
              {comments.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommenting(!isCommenting)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Komentar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Section */}
        {isCommenting && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar..."
              className="min-h-[100px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCommenting(false);
                  setNewComment('');
                }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleCreateComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {createCommentMutation.isPending ? 'Mengirim...' : 'Kirim'}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada komentar untuk inisiatif ini</p>
              <p className="text-sm">Jadilah yang pertama untuk memberikan komentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-white rounded-lg border">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.user.profileImageUrl || ''} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(comment.user)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getUserDisplayName(comment.user)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                      {comment.isEdited && (
                        <Badge variant="secondary" className="text-xs">
                          Diedit
                        </Badge>
                      )}
                    </div>
                    
                    {comment.userId === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditing(comment)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Ubah
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
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
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {/* Comment Content */}
                  <div className="text-sm">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          placeholder="Ubah komentar..."
                          className="min-h-[80px] resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={!editingContent.trim() || updateCommentMutation.isPending}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                          >
                            {updateCommentMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {shouldTruncate(comment.content) && !isCommentExpanded(comment.id)
                            ? truncateContent(comment.content)
                            : comment.content}
                        </div>
                        {shouldTruncate(comment.content) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCommentExpansion(comment.id)}
                            className="mt-2 text-blue-600 hover:text-blue-700 p-0 h-auto"
                          >
                            {isCommentExpanded(comment.id) ? 'Tampilkan lebih sedikit' : 'Tampilkan lebih banyak'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}