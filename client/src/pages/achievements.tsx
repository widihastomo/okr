import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserStatsCard } from "@/components/gamification/user-stats-card";
import { AchievementsGrid } from "@/components/gamification/achievements-grid";
import { Leaderboard } from "@/components/gamification/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Users } from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("progress");

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Achievements & Progress
          </h1>
          <p className="text-gray-600 mt-2">
            Track your progress, unlock achievements, and compete with your team
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <UserStatsCard userId={user.id} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementsGrid userId={user.id} />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}