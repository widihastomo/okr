import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Star, 
  Flame, 
  Medal,
  Award,
  Zap
} from "lucide-react";

interface DailyAchievementsProps {
  userId: string;
}

export function DailyAchievements({ userId }: DailyAchievementsProps) {
  const { data: userAchievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: [`/api/gamification/achievements/${userId}`],
    enabled: !!userId,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  const isLoading = isLoadingAchievements || isLoadingStats;

  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-900 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Pencapaian Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading achievements...</div>
        </CardContent>
      </Card>
    );
  }

  const recentAchievements = (userAchievements as any[])?.slice(0, 3) || [];
  const currentStreak = (stats as any)?.currentStreak || 0;
  const longestStreak = (stats as any)?.longestStreak || 0;

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'progress': return <Trophy className="h-4 w-4" />;
      case 'streak': return <Flame className="h-4 w-4" />;
      case 'milestone': return <Star className="h-4 w-4" />;
      case 'collaboration': return <Medal className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-purple-900 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Pencapaian & Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-purple-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Current Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-xs text-gray-500">hari berturut-turut</div>
          </div>
          
          <div className="p-3 bg-white border border-purple-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Best Streak</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{longestStreak}</div>
            <div className="text-xs text-gray-500">rekor terbaik</div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div>
          <h4 className="text-sm font-medium text-purple-900 mb-3">Pencapaian Terbaru</h4>
          {recentAchievements.length > 0 ? (
            <div className="space-y-2">
              {recentAchievements.map((userAchievement: any) => (
                <div 
                  key={userAchievement.id} 
                  className="p-3 bg-white border border-purple-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      {getAchievementIcon(userAchievement.achievement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {userAchievement.achievement.title}
                        </h5>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRarityColor(userAchievement.achievement.rarity)}`}
                        >
                          {userAchievement.achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {userAchievement.achievement.description}
                      </p>
                      <div className="text-xs text-purple-600 mt-1">
                        +{userAchievement.achievement.points} poin
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-white border border-purple-200 rounded-lg">
              <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600">
                Belum ada pencapaian terbaru
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Selesaikan task dan update progress untuk unlock achievements!
              </div>
            </div>
          )}
        </div>

        {/* Motivation */}
        <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-800 mb-1">
            🎯 Target hari ini: Pertahankan streak!
          </div>
          <div className="text-xs text-purple-600">
            Setiap aktivitas akan menambah poin dan progress
          </div>
        </div>
      </CardContent>
    </Card>
  );
}