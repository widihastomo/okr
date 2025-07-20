import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send,
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { getUserInitials } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
  voters: Array<{
    id: string;
    name: string;
    profileImage?: string;
  }>;
}

interface PollUpdateCardProps {
  id: string;
  userName: string;
  userProfileImage?: string;
  createdAt: string;
  pollTitle: string;
  pollDescription?: string;
  options: PollOption[];
  totalVotes: number;
  reactions: {
    likes: number;
    hearts: number;
    thumbsUp: number;
  };
  seenByCount: number;
  onVote: (optionId: string) => void;
  onReaction: (reactionType: string) => void;
  onComment: (comment: string) => void;
  userVotes: string[];
}

export default function PollUpdateCard({
  id,
  userName,
  userProfileImage,
  createdAt,
  pollTitle,
  pollDescription,
  options,
  totalVotes,
  reactions,
  seenByCount,
  onVote,
  onReaction,
  onComment,
  userVotes
}: PollUpdateCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});

  const handleVote = (optionId: string) => {
    onVote(optionId);
  };

  const handleReaction = (type: string) => {
    setUserReactions(prev => ({ ...prev, [type]: !prev[type] }));
    onReaction(type);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(commentText.trim());
      setCommentText('');
    }
  };

  const renderUserAvatars = (voters: PollOption['voters'], maxShow: number = 5) => {
    const visibleVoters = voters.slice(0, maxShow);
    const remainingCount = voters.length - maxShow;

    return (
      <div className="flex -space-x-1">
        {visibleVoters.map((voter) => (
          <div
            key={voter.id}
            className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs border-2 border-white"
            title={voter.name}
          >
            {getUserInitials({ name: voter.name })}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-xs border-2 border-white">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials({ name: userName })}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {userName}
                  </h3>
                  <span className="text-gray-700 text-sm">created a poll.</span>
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {format(new Date(createdAt), "MMMM dd, yyyy")}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="p-1">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Poll Content */}
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 text-base mb-2">
              {pollTitle}
            </h4>
            {pollDescription && (
              <p className="text-gray-700 text-sm">
                {pollDescription}
              </p>
            )}
          </div>

          {/* Poll Options */}
          <div className="space-y-3 mb-4">
            {options.map((option) => (
              <div
                key={option.id}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleVote(option.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {userVotes.includes(option.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-800 flex-1">
                      {option.text}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {option.voters.length > 0 && renderUserAvatars(option.voters)}
                    <span className="text-xs text-gray-500 font-medium">
                      {option.voters.length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* More Options Link */}
          <div className="text-center mb-4">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              3 More Options...
            </Button>
          </div>
        </div>

        {/* Engagement Section */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('like')}
                className={`flex items-center space-x-2 text-sm h-8 px-3 rounded-full ${
                  userReactions.like ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${userReactions.like ? 'fill-current' : ''}`} />
                <span>Like</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 text-sm h-8 px-3 rounded-full text-gray-500 hover:text-blue-600"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-sm h-8 px-3 rounded-full text-gray-500 hover:text-blue-600"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>

          {/* Reaction Summary */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Heart className="w-2 h-2 text-white fill-current" />
                </div>
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">👍</span>
                </div>
                <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-xs">😄</span>
                </div>
              </div>
              <span>
                Test User#, Belina Yee and {reactions.likes + reactions.hearts + reactions.thumbsUp - 2} others
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span>✓</span>
              <span>Seen by {seenByCount}</span>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="border-t border-gray-100 pt-3">
              {/* Sample Comment */}
              <div className="flex space-x-3 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  UL
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2">
                    <div className="font-semibold text-sm text-gray-900">Uchi Lara</div>
                    <div className="text-sm text-gray-800">
                      I look forward to seeing the answers to the TOP questions posted after the Live Q&A too. Great way to keep us all informed as some of us won't be able to attend at that time
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <button className="hover:underline font-medium">Like</button>
                    <button className="hover:underline font-medium">Reply</button>
                    <span>1y</span>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3 text-blue-500 fill-current" />
                      <span>2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* More Comments */}
              <Button variant="ghost" size="sm" className="text-gray-600 text-sm mb-3">
                View 1 more comment
              </Button>

              {/* Add Comment */}
              <div className="flex space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {getUserInitials({ name: "Current User" })}
                  </div>
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 min-h-[36px] resize-none border-gray-300 rounded-full px-3 py-2 text-sm"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
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
  );
}