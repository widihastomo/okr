import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Medal, 
  Award,
  Crown,
  Star,
  TrendingUp
} from "lucide-react";

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [`/api/gamification/leaderboard?limit=${limit}`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No data available yet!</p>
            <p className="text-sm">Be the first to earn points and claim the top spot.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
          <Badge variant="secondary" className="ml-auto">
            Top {leaderboard.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((entry: any, index: number) => {
          const position = index + 1;
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                position <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12">
                {position <= 3 ? (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadgeColor(position)}`}>
                    {getRankIcon(position)}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center">
                    {getRankIcon(position)}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {entry.user.firstName?.charAt(0)}{entry.user.lastName?.charAt(0)}
                  </div>
                  
                  {/* Name */}
                  <div className="font-medium text-gray-900 truncate">
                    {entry.user.firstName} {entry.user.lastName}
                  </div>
                  
                  {/* Level Badge */}
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200" size="sm">
                    Level {entry.level}
                  </Badge>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="font-medium">{entry.totalPoints.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>{entry.currentStreak} day streak</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-blue-500" />
                    <span>{entry.objectivesCompleted} objectives</span>
                  </div>
                </div>
              </div>

              {/* Points Display */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {entry.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No rankings yet!</p>
            <p className="text-sm">Complete objectives and earn points to appear on the leaderboard.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}