import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserStatsCard } from "@/components/gamification/user-stats-card";
import { AchievementsGrid } from "@/components/gamification/achievements-grid";
import { Leaderboard } from "@/components/gamification/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Users, ChevronDown, ChevronUp } from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("progress");
  const [isPointInfoExpanded, setIsPointInfoExpanded] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Achievements & Progress
          </h1>
          <p className="text-gray-600 mt-2">
            Track your progress, unlock achievements, and compete with your team
          </p>
          
          {/* Point Calculation Info */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <button
              onClick={() => setIsPointInfoExpanded(!isPointInfoExpanded)}
              className="w-full flex items-center justify-between text-left hover:bg-blue-100 -m-2 p-2 rounded transition-colors"
            >
              <h3 className="font-semibold text-blue-900">Sistem Poin & Level</h3>
              {isPointInfoExpanded ? (
                <ChevronUp className="h-5 w-5 text-blue-700" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-700" />
              )}
            </button>
            
            {isPointInfoExpanded && (
              <div className="mt-3 space-y-4">
                {/* Point Activities */}
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Aktivitas yang Memberikan Poin:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Update Key Result (Update Progress): <strong>10 poin</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Membuat Initiative: <strong>25 poin</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Menyelesaikan Objective: <strong>50 poin</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Kolaborasi dalam Tim: <strong>5-15 poin</strong></span>
                    </div>
                  </div>
                </div>

                {/* Level System */}
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Sistem Level:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• Level 1 → Level 2: <strong>100 poin</strong></div>
                    <div>• Level 3 dan seterusnya: <strong>+50 poin per level</strong></div>
                    <div className="text-xs text-blue-600 mt-2">
                      Contoh: Level 3 (150 poin), Level 4 (200 poin), Level 5 (250 poin)
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Achievement Categories:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
                    <div className="bg-white px-2 py-1 rounded">Progress</div>
                    <div className="bg-white px-2 py-1 rounded">Streak</div>
                    <div className="bg-white px-2 py-1 rounded">Milestone</div>
                    <div className="bg-white px-2 py-1 rounded">Collaboration</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="progress" className="flex items-center gap-2 text-base px-4 py-3" data-tour="achievement-progress-tab">
              <Trophy className="w-5 h-5" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2 text-base px-4 py-3" data-tour="achievement-medals-tab">
              <Medal className="w-5 h-5" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2 text-base px-4 py-3" data-tour="achievement-leaderboard-tab">
              <Users className="w-5 h-5" />
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
            <div data-tour="leaderboard">
              <Leaderboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}