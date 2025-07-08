import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Sparkles, Award } from "lucide-react";
import TrialAchievementCard from "@/components/trial/trial-achievement-card";
import TrialProgressOverview from "@/components/trial/trial-progress-overview";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

export default function TrialAchievements() {
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    data: achievements = [],
    isLoading: achievementsLoading,
    error: achievementsError,
  } = useQuery({
    queryKey: ["/api/trial/achievements"],
  });

  const {
    data: progress,
    isLoading: progressLoading,
    error: progressError,
  } = useQuery({
    queryKey: ["/api/trial/progress"],
  });

  // Initialize trial progress when user first visits
  useEffect(() => {
    if (user?.id) {
      apiRequest("POST", "/api/trial/track-action", {
        action: "view_achievements",
        metadata: { page: "trial_achievements" }
      }).catch(console.error);
    }
  }, [user?.id]);

  if (achievementsLoading || progressLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (achievementsError || progressError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Gagal Memuat Data
              </h3>
              <p className="text-gray-500">
                Terjadi kesalahan saat memuat data achievement. Silakan coba lagi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultProgress = {
    totalPoints: 0,
    achievementsUnlocked: 0,
    currentStreak: 0,
    longestStreak: 0,
  };

  const userProgress = progress || defaultProgress;
  const unlockedAchievements = achievements.filter((a: any) => a.unlocked);
  const lockedAchievements = achievements.filter((a: any) => !a.unlocked);

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  const categories = [
    { key: "setup", label: "Setup", icon: Target, color: "text-blue-600" },
    { key: "workflow", label: "Workflow", icon: Sparkles, color: "text-green-600" },
    { key: "monitoring", label: "Monitoring", icon: Trophy, color: "text-purple-600" },
    { key: "mastery", label: "Mastery", icon: Award, color: "text-orange-600" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-orange-600" />
          Achievement Trial
        </h1>
        <p className="text-lg text-gray-600">
          Buka achievement dan kumpulkan poin selama masa trial Anda
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrialProgressOverview
          progress={userProgress}
          totalAchievements={achievements.length}
          className="lg:col-span-1"
        />

        {/* Recent Achievements */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              Achievement Terbaru
            </CardTitle>
            <CardDescription>
              Achievement yang baru saja Anda buka
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unlockedAchievements.length > 0 ? (
              <div className="space-y-3">
                {unlockedAchievements
                  .sort((a: any, b: any) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
                  .slice(0, 3)
                  .map((achievement: any) => (
                    <TrialAchievementCard
                      key={achievement.id}
                      achievement={achievement}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Belum ada achievement yang terbuka. Mulai eksplorasi platform untuk membuka achievement pertama Anda!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.key} value={category.key}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement: any) => (
              <TrialAchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <category.icon className={`w-5 h-5 ${category.color}`} />
              <h2 className="text-xl font-semibold text-gray-900">{category.label}</h2>
              <Badge variant="secondary">
                {achievementsByCategory[category.key]?.length || 0} Achievement
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementsByCategory[category.key]?.map((achievement: any) => (
                <TrialAchievementCard
                  key={achievement.id}
                  achievement={achievement}
                />
              )) || (
                <div className="col-span-full text-center py-8">
                  <category.icon className={`w-12 h-12 ${category.color} mx-auto mb-4 opacity-50`} />
                  <p className="text-gray-500">
                    Belum ada achievement di kategori ini.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Call to Action */}
      {userProgress.totalPoints < 100 && (
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                Mulai Perjalanan Anda!
              </h3>
              <p className="text-orange-700 mb-4">
                Jelajahi platform dan buka achievement untuk mendapatkan poin dan meningkatkan level Anda.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge className="bg-orange-600 hover:bg-orange-700">
                  Buat Objective Pertama
                </Badge>
                <Badge className="bg-orange-600 hover:bg-orange-700">
                  Undang Anggota Tim
                </Badge>
                <Badge className="bg-orange-600 hover:bg-orange-700">
                  Lengkapi Profil
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}