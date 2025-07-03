import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Flame, 
  TrendingUp, 
  Target, 
  CheckCircle,
  Users,
  Calendar
} from "lucide-react";

interface UserStatsCardProps {
  userId: string;
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">No stats available</div>
        </CardContent>
      </Card>
    );
  }

  const calculateLevelProgress = (totalPoints: number, level: number) => {
    const currentLevelPoints = level === 1 ? 0 : 100 + (level - 2) * 50;
    const nextLevelPoints = level === 1 ? 100 : 100 + (level - 1) * 50;
    const progressInLevel = totalPoints - currentLevelPoints;
    const pointsForNextLevel = nextLevelPoints - currentLevelPoints;
    return Math.min((progressInLevel / pointsForNextLevel) * 100, 100);
  };

  const levelProgress = calculateLevelProgress(stats.totalPoints, stats.level);
  const nextLevelPoints = stats.level === 1 ? 100 : 100 + (stats.level - 1) * 50;
  const pointsToNextLevel = nextLevelPoints - stats.totalPoints;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Trophy className="h-5 w-5" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level and Points */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-lg px-3 py-1">
              Level {stats.level}
            </Badge>
            <div className="flex items-center text-yellow-600">
              <Star className="h-4 w-4 mr-1" />
              <span className="font-semibold">{stats.totalPoints.toLocaleString()} points</span>
            </div>
          </div>
          
          {pointsToNextLevel > 0 && (
            <div className="space-y-2">
              <Progress value={levelProgress} className="h-2" />
              <p className="text-sm text-gray-600">
                {pointsToNextLevel} points to level {stats.level + 1}
              </p>
            </div>
          )}
        </div>

        {/* Activity Streak */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Current Streak</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-orange-600">{stats.currentStreak} days</div>
            <div className="text-xs text-gray-500">Best: {stats.longestStreak} days</div>
          </div>
        </div>

        {/* Achievement Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <Target className="h-4 w-4 text-green-500" />
            <div className="text-center flex-1">
              <div className="font-bold text-green-600">{stats.objectivesCompleted}</div>
              <div className="text-xs text-gray-600">Objectives</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <div className="text-center flex-1">
              <div className="font-bold text-blue-600">{stats.keyResultsCompleted}</div>
              <div className="text-xs text-gray-600">Key Results</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <div className="text-center flex-1">
              <div className="font-bold text-purple-600">{stats.checkInsCreated}</div>
              <div className="text-xs text-gray-600">Updates</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <Users className="h-4 w-4 text-indigo-500" />
            <div className="text-center flex-1">
              <div className="font-bold text-indigo-600">{stats.initiativesCreated}</div>
              <div className="text-xs text-gray-600">Initiatives</div>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Last active:</span>
          </div>
          <span>
            {stats.lastActivityDate 
              ? new Date(stats.lastActivityDate).toLocaleDateString('id-ID')
              : 'Never'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}