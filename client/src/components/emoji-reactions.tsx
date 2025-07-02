import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { EmojiReaction, User } from '@shared/schema';

interface EmojiReactionWithUser extends EmojiReaction {
  user: User;
}

interface EmojiReactionsProps {
  objectiveId: string;
  className?: string;
}

const AVAILABLE_EMOJIS = [
  '👍', '👎', '❤️', '🎉', '🚀', '💪', '🔥', '⭐', '✅', '❌',
  '👏', '💯', '🤔', '😊', '😍', '🤩', '😎', '🙌', '👌', '💡'
];

export function EmojiReactions({ objectiveId, className }: EmojiReactionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: reactions = [], isLoading } = useQuery<EmojiReactionWithUser[]>({
    queryKey: ['/api/objectives', objectiveId, 'reactions'],
    enabled: !!objectiveId,
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const response = await fetch(`/api/objectives/${objectiveId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/objectives', objectiveId, 'reactions'] });
      setIsOpen(false);
      toast({
        title: "Reaksi ditambahkan",
        description: "Reaksi emoji berhasil ditambahkan ke goal",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: () => {
      toast({
        title: "Gagal menambahkan reaksi",
        description: "Terjadi kesalahan saat menambahkan reaksi emoji",
        variant: "destructive",
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const response = await fetch(`/api/objectives/${objectiveId}/reactions/${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/objectives', objectiveId, 'reactions'] });
      toast({
        title: "Reaksi dihapus",
        description: "Reaksi emoji berhasil dihapus dari goal",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: () => {
      toast({
        title: "Gagal menghapus reaksi",
        description: "Terjadi kesalahan saat menghapus reaksi emoji",
        variant: "destructive",
      });
    },
  });

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: Record<string, EmojiReactionWithUser[]>, reaction: EmojiReactionWithUser) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  const handleEmojiClick = (emoji: string) => {
    if (!user) return;

    const userReaction = groupedReactions[emoji]?.find(r => r.userId === user.id);
    
    if (userReaction) {
      // Remove reaction if user already reacted with this emoji
      removeReactionMutation.mutate({ emoji });
    } else {
      // Add reaction if user hasn't reacted with this emoji
      addReactionMutation.mutate({ emoji });
    }
  };

  const handleAddEmoji = (emoji: string) => {
    if (!user) return;
    addReactionMutation.mutate({ emoji });
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full"></div>
        <div className="w-12 h-6 bg-gray-100 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const userHasReacted = user && emojiReactions.some(r => r.userId === user.id);
        const count = emojiReactions.length;
        
        return (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-2 py-1 text-sm transition-all duration-200 hover:scale-105",
              userHasReacted 
                ? "bg-blue-100 border-blue-300 text-blue-700 shadow-md" 
                : "bg-white hover:bg-gray-50"
            )}
            onClick={() => handleEmojiClick(emoji)}
            title={emojiReactions.map(r => 
              r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''} (${r.user.email})` : 'Unknown User'
            ).join(', ')}
          >
            <span className="mr-1">{emoji}</span>
            <span className="text-xs font-medium">{count}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      {user && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
              title="Tambah reaksi emoji"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-5 gap-1">
              {AVAILABLE_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-lg hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => handleAddEmoji(emoji)}
                  title={`Tambah reaksi ${emoji}`}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}