import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Flame, Star } from "lucide-react";

interface TrialProgressOverviewProps {
  progress: {
    totalPoints: number;
    achievementsUnlocked: number;
    currentStreak: number;
    longestStreak: number;
  };
  totalAchievements: number;
  className?: string;
}

export default function TrialProgressOverview({ 
  progress, 
  totalAchievements, 
  className 
}: TrialProgressOverviewProps) {
  const achievementProgress = totalAchievements > 0 
    ? (progress.achievementsUnlocked / totalAchievements) * 100 
    : 0;

  const getPointsLevel = (points: number) => {
    if (points >= 500) return { level: "Expert", color: "text-purple-600", bgColor: "bg-purple-100" };
    if (points >= 300) return { level: "Advanced", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (points >= 150) return { level: "Intermediate", color: "text-green-600", bgColor: "bg-green-100" };
    if (points >= 50) return { level: "Beginner", color: "text-orange-600", bgColor: "bg-orange-100" };
    return { level: "Starter", color: "text-gray-600", bgColor: "bg-gray-100" };
  };

  const userLevel = getPointsLevel(progress.totalPoints);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-orange-600" />
          Progress Trial Anda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points and Level */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">
                {progress.totalPoints}
              </span>
              <span className="text-sm text-gray-600">poin</span>
            </div>
            <Badge className={`${userLevel.bgColor} ${userLevel.color} border-0`}>
              Level {userLevel.level}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Target berikutnya</div>
            <div className="text-lg font-semibold text-gray-900">
              {progress.totalPoints >= 500 ? "MAX" : 
               progress.totalPoints >= 300 ? "500" :
               progress.totalPoints >= 150 ? "300" :
               progress.totalPoints >= 50 ? "150" : "50"} poin
            </div>
          </div>
        </div>

        {/* Achievement Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Achievement Terbuka
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {progress.achievementsUnlocked}/{totalAchievements}
            </span>
          </div>
          <Progress 
            value={achievementProgress} 
            className="h-2"
          />
          <div className="text-xs text-gray-500 mt-1">
            {achievementProgress.toFixed(0)}% selesai
          </div>
        </div>

        {/* Streak Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-lg font-bold text-orange-700">
                {progress.currentStreak}
              </span>
            </div>
            <div className="text-xs text-orange-600">Streak Saat Ini</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-700">
                {progress.longestStreak}
              </span>
            </div>
            <div className="text-xs text-gray-600">Streak Terpanjang</div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-800">
            {progress.currentStreak >= 7 ? "🔥 Luar biasa! Anda dalam streak yang fantastis!" :
             progress.currentStreak >= 3 ? "👏 Terus pertahankan konsistensi Anda!" :
             progress.achievementsUnlocked >= 5 ? "🚀 Progress yang mengesankan!" :
             "💪 Terus semangat mencapai goals Anda!"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}