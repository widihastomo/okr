import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Reply, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { InitiativeComment } from '@shared/schema';

interface ThreadedCommentListProps {
  comments: (InitiativeComment & { user: any })[];
  onEdit: (comment: InitiativeComment & { user: any }) => void;
  onDelete: (commentId: string) => void;
  onReply: (parentId: string) => void;
  onToggleReplies?: (commentId: string) => void;
  expandedReplies?: Set<string>;
  editingCommentId?: string | null;
  disabled?: boolean;
}

interface ThreadedComment extends InitiativeComment {
  user: any;
  replies: ThreadedComment[];
  replyCount: number;
}

export function ThreadedCommentList({ 
  comments, 
  onEdit, 
  onDelete, 
  onReply,
  onToggleReplies,
  expandedReplies = new Set(),
  editingCommentId = null,
  disabled = false
}: ThreadedCommentListProps) {
  const { user } = useAuth();

  // Build comment tree structure
  const buildCommentTree = (comments: (InitiativeComment & { user: any })[]): ThreadedComment[] => {
    const commentMap = new Map<string, ThreadedComment>();
    const rootComments: ThreadedComment[] = [];

    // First pass: Create all comment objects
    comments.forEach(comment => {
      const threadedComment: ThreadedComment = {
        ...comment,
        replies: [],
        replyCount: 0
      };
      commentMap.set(comment.id, threadedComment);
    });

    // Second pass: Build tree structure
    comments.forEach(comment => {
      const threadedComment = commentMap.get(comment.id)!;
      
      if (comment.parentId) {
        // This is a reply
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          parentComment.replies.push(threadedComment);
          parentComment.replyCount++;
        }
      } else {
        // This is a root comment
        rootComments.push(threadedComment);
      }
    });

    return rootComments.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  };

  const threadedComments = buildCommentTree(comments);

  const renderComment = (comment: ThreadedComment, level: number = 0) => {
    const isExpanded = expandedReplies.has(comment.id);
    const hasReplies = comment.replies.length > 0;
    
    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-4 sm:ml-8 pl-2 sm:pl-4 border-l-2 border-gray-200' : ''}`}>
        <div className="relative p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 3 dots menu in top right corner */}
          {user?.id === comment.userId && !disabled && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-orange-600 h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(comment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Ubah
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Komentar</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus komentar ini? Aksi ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(comment.id)}
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          <div className="flex items-start space-x-2 sm:space-x-3">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
              <AvatarImage src={comment.user?.profileImageUrl || ''} />
              <AvatarFallback>
                {comment.user?.name 
                  ? comment.user.name.trim().split(' ').map(n => n[0]).join('').toUpperCase()
                  : comment.user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              {/* Header with user info and timestamp */}
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">
                  {comment.user?.name && comment.user.name.trim() !== ""
                    ? comment.user.name.trim()
                    : comment.user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt || ''), { 
                    addSuffix: true, 
                    locale: id 
                  })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400">(diedit)</span>
                )}
              </div>
              
              {editingCommentId !== comment.id && (
                <div 
                  className="mt-2 text-sm text-gray-700 prose prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              )}
              
              {/* Reply button and replies toggle */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(comment.id)}
                    className="text-gray-500 hover:text-orange-600 h-7 px-2 sm:h-8 sm:px-3"
                  >
                    <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="ml-1 text-xs">Balas</span>
                  </Button>
                )}
                
                {hasReplies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleReplies?.(comment.id)}
                    className="text-gray-500 hover:text-orange-600 h-7 px-2 sm:h-8 sm:px-3"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs">Sembunyikan {comment.replyCount} balasan</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs">Tampilkan {comment.replyCount} balasan</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Render replies */}
        {hasReplies && isExpanded && (
          <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (threadedComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Belum ada komentar. Jadilah yang pertama memberikan komentar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {threadedComments.map(comment => renderComment(comment))}
    </div>
  );
}