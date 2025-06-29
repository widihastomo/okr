import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Lock, 
  Star,
  Trophy,
  Target,
  CheckCircle,
  Flame,
  Users,
  Briefcase,
  Heart,
  Calendar,
  TrendingUp,
  Crown,
  Diamond,
  Zap
} from "lucide-react";

interface AchievementsGridProps {
  userId: string;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Target,
    Trophy,
    CheckCircle,
    Award,
    Flame,
    Zap,
    Calendar,
    Star,
    TrendingUp,
    Crown,
    Diamond,
    Users,
    Briefcase,
    Heart,
  };
  return icons[iconName] || Award;
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "rare":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "epic":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "legendary":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function AchievementsGrid({ userId }: AchievementsGridProps) {
  const { data: achievements, isLoading } = useQuery({
    queryKey: [`/api/gamification/achievements/${userId}`],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading achievements...</div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No achievements yet!</p>
            <p className="text-sm">Start completing objectives to earn your first badge.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedAchievements = achievements.filter((a: any) => a.isCompleted);
  const inProgressAchievements = achievements.filter((a: any) => !a.isCompleted);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Achievements
          <Badge variant="secondary" className="ml-auto">
            {completedAchievements.length} / {achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completed Achievements */}
        {completedAchievements.length > 0 && (
          <div>
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedAchievements.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedAchievements.map((userAchievement: any) => {
                const IconComponent = getIconComponent(userAchievement.achievement.badgeIcon);
                return (
                  <div
                    key={userAchievement.id}
                    className={`p-4 rounded-lg border-2 ${userAchievement.achievement.badgeColor} bg-opacity-50`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-full shadow-sm">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{userAchievement.achievement.name}</h4>
                          <Badge className={getRarityColor(userAchievement.achievement.rarity)} size="sm">
                            {userAchievement.achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{userAchievement.achievement.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-yellow-600 font-medium">
                            +{userAchievement.achievement.points} points
                          </span>
                          <span className="text-gray-500">
                            {new Date(userAchievement.unlockedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In Progress Achievements */}
        {inProgressAchievements.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              In Progress ({inProgressAchievements.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inProgressAchievements.map((userAchievement: any) => {
                const IconComponent = getIconComponent(userAchievement.achievement.badgeIcon);
                const condition = userAchievement.achievement.condition as any;
                const progressPercentage = Math.min((userAchievement.progress / condition.target) * 100, 100);
                
                return (
                  <div
                    key={userAchievement.id}
                    className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-full shadow-sm opacity-60">
                        <IconComponent className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-700 truncate">{userAchievement.achievement.name}</h4>
                          <Badge className={getRarityColor(userAchievement.achievement.rarity)} size="sm">
                            {userAchievement.achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{userAchievement.achievement.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1 mb-2">
                          <Progress value={progressPercentage} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{userAchievement.progress} / {condition.target}</span>
                            <span>{Math.round(progressPercentage)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-yellow-600 font-medium">
                            +{userAchievement.achievement.points} points
                          </span>
                          <span className="text-gray-500">
                            {condition.target - userAchievement.progress} more to go
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        <div>
          <h3 className="font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            More achievements coming soon...
          </h3>
          <div className="text-center py-4 text-gray-400">
            <Lock className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Keep completing objectives to unlock more achievements!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}