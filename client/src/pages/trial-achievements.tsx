import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, ChevronDown, ChevronRight, CheckCircle2, Users, Calendar, BarChart3, Lightbulb, CheckSquare, TrendingUp, LineChart, Zap, Flame, UserPlus, PartyPopper, Target, Sparkles, Trophy, Award } from "lucide-react";
import TrialProgressOverview from "@/components/trial/trial-progress-overview";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";

// Mission action functions
const missionActions = {
  addMember: () => window.location.href = "/client-users",
  createTeam: () => window.location.href = "/teams", 
  createObjective: () => window.location.href = "/",
  addKeyResult: () => window.location.href = "/",
  addInitiative: () => window.location.href = "/",
  addTask: () => window.location.href = "/daily-focus",
  updateKeyResult: () => window.location.href = "/",
  updateMetrics: () => window.location.href = "/",
  updateTaskStatus: () => window.location.href = "/daily-focus",
  dailyUpdate: () => window.location.href = "/daily-focus",
};

// Icon mapping
const iconMapping = {
  PartyPopper: PartyPopper,
  UserPlus: UserPlus,
  Users: Users,
  Calendar: Calendar,
  Target: Target,
  BarChart3: BarChart3,
  Lightbulb: Lightbulb,
  CheckSquare: CheckSquare,
  TrendingUp: TrendingUp,
  LineChart: LineChart,
  Zap: Zap,
  Flame: Flame,
  Trophy: Trophy,
  Award: Award,
};

interface MissionCardProps {
  missions: any[];
  title: string;
  description: string;
  className?: string;
}

function MissionCard({ missions, title, description, className }: MissionCardProps) {
  const completedMissions = missions.filter(m => m.unlocked).length;
  const totalMissions = missions.length;
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
        <CardHeader 
          className="pb-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Rocket className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-bold text-orange-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                {title}
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                  {completedMissions}/{totalMissions}
                </Badge>
              </CardTitle>
              <p className="text-sm text-orange-600 mt-1">{description}</p>
              <div className="flex items-center gap-3 mt-2">
                <Progress 
                  value={(completedMissions / totalMissions) * 100} 
                  className="h-1.5 bg-orange-100 flex-1"
                />
                <span className="text-xs text-orange-600 font-medium">
                  {Math.round((completedMissions / totalMissions) * 100)}%
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-orange-600 hover:bg-orange-100 p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-3 pt-0">
            {missions.map((mission, index) => {
              const IconComponent = iconMapping[mission.icon] || Target;
              const missionKey = mission.name.includes("Tambah Pengguna") || mission.name.includes("Menambahkan Member") ? "addMember" :
                                mission.name.includes("Buat Tim") || mission.name.includes("Membuat Tim") ? "createTeam" :
                                mission.name.includes("Buat Objective") || mission.name.includes("Membuat Objective") ? "createObjective" :
                                mission.name.includes("Tambah Key Result") || mission.name.includes("Menambahkan Key Result") ? "addKeyResult" :
                                mission.name.includes("Buat Inisiatif") || mission.name.includes("Menambahkan Inisiatif") ? "addInitiative" :
                                mission.name.includes("Tambah Task") || mission.name.includes("Menambahkan Task") ? "addTask" :
                                mission.name.includes("Update Capaian Key Result") ? "updateKeyResult" :
                                mission.name.includes("Update Capaian Metrik") ? "updateMetrics" :
                                mission.name.includes("Update Status Task") ? "updateTaskStatus" :
                                mission.name.includes("Update Harian") ? "dailyUpdate" :
                                "addMember";
              
              return (
                <div
                  key={mission.id}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    mission.unlocked 
                      ? "bg-green-50 border-green-200 opacity-75" 
                      : "bg-white border-orange-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      mission.unlocked 
                        ? "bg-green-100 text-green-600" 
                        : "bg-orange-100 text-orange-600"
                    }`}>
                      {mission.unlocked ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-orange-600 min-w-[20px]">
                          {index + 1}.
                        </span>
                        <h4 className={`font-medium text-sm ${
                          mission.unlocked ? "text-green-700 line-through" : "text-gray-800"
                        }`}>
                          {mission.name.replace(/🎯 Misi: |📊 Misi: |💡 Misi: |✅ Misi: |🔄 Misi: |📈 Misi: |⚡ Misi: |🎖️ Misi: /g, "")}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {mission.description}
                      </p>
                      {!mission.unlocked && (
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs h-7"
                          onClick={() => missionActions[missionKey]()}
                        >
                          Mulai
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (achievementsError || progressError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ Error loading achievements</div>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const defaultProgress = {
    currentLevel: 1,
    totalPoints: 0,
    pointsToNextLevel: 100,
    currentStreak: 0,
    totalUnlockedAchievements: 0,
  };

  const userProgress = progress || defaultProgress;

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  // Manually define mission order based on user requirements
  const orderedMissions = [
    { key: "add_member", title: "1. Menambahkan Member", description: "Tambahkan anggota tim untuk memulai kolaborasi" },
    { key: "create_team", title: "2. Membuat Tim", description: "Buat tim untuk mengorganisir anggota" },
    { key: "create_objective", title: "3. Membuat Objective", description: "Tetapkan tujuan yang ingin dicapai" },
    { key: "add_key_result", title: "4. Menambahkan Key Result", description: "Tambahkan metrik untuk mengukur progress" },
    { key: "add_initiative", title: "5. Menambahkan Inisiatif", description: "Buat rencana aksi untuk mencapai objective" },
    { key: "add_task", title: "6. Menambahkan Task", description: "Pecah inisiatif menjadi tugas konkret" },
    { key: "update_key_result", title: "7. Update Capaian Key Result", description: "Perbarui progress metrik pencapaian" },
    { key: "update_metrics", title: "8. Update Capaian Metrik Inisiatif", description: "Pantau dan update metrik inisiatif" },
    { key: "update_task", title: "9. Update Status Task", description: "Ubah status tugas yang sedang dikerjakan" },
    { key: "daily_update", title: "10. Update Harian Instan", description: "Lakukan update harian untuk progress tracking" },
  ];

  // Create single mission card with all missions ordered
  const allMissionsOrdered = orderedMissions.map(orderedMission => {
    // Find matching achievement from API data
    const matchingAchievement = achievements.find(achievement => {
      const name = achievement.name.toLowerCase();
      return (
        (orderedMission.key === "add_member" && (name.includes("tambah pengguna") || name.includes("member"))) ||
        (orderedMission.key === "create_team" && name.includes("tim")) ||
        (orderedMission.key === "create_objective" && name.includes("objective")) ||
        (orderedMission.key === "add_key_result" && name.includes("key result")) ||
        (orderedMission.key === "add_initiative" && name.includes("inisiatif")) ||
        (orderedMission.key === "add_task" && name.includes("task")) ||
        (orderedMission.key === "update_key_result" && name.includes("check-in")) ||
        (orderedMission.key === "update_metrics" && name.includes("update progress")) ||
        (orderedMission.key === "update_task" && name.includes("selesaikan task")) ||
        (orderedMission.key === "daily_update" && name.includes("konsistensi"))
      );
    });

    return matchingAchievement ? {
      ...matchingAchievement,
      name: orderedMission.title,
      description: orderedMission.description,
      icon: orderedMission.key === "add_member" ? "UserPlus" :
            orderedMission.key === "create_team" ? "Users" :
            orderedMission.key === "create_objective" ? "Target" :
            orderedMission.key === "add_key_result" ? "BarChart3" :
            orderedMission.key === "add_initiative" ? "Lightbulb" :
            orderedMission.key === "add_task" ? "CheckSquare" :
            orderedMission.key === "update_key_result" ? "TrendingUp" :
            orderedMission.key === "update_metrics" ? "LineChart" :
            orderedMission.key === "update_task" ? "CheckCircle2" :
            "Zap"
    } : {
      id: orderedMission.key,
      name: orderedMission.title,
      description: orderedMission.description,
      unlocked: false,
      icon: orderedMission.key === "add_member" ? "UserPlus" :
            orderedMission.key === "create_team" ? "Users" :
            orderedMission.key === "create_objective" ? "Target" :
            orderedMission.key === "add_key_result" ? "BarChart3" :
            orderedMission.key === "add_initiative" ? "Lightbulb" :
            orderedMission.key === "add_task" ? "CheckSquare" :
            orderedMission.key === "update_key_result" ? "TrendingUp" :
            orderedMission.key === "update_metrics" ? "LineChart" :
            orderedMission.key === "update_task" ? "CheckCircle2" :
            "Zap"
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Rocket className="h-8 w-8 text-orange-500" />
          Misi Onboarding Platform
        </h1>
        <p className="text-gray-600">
          Ikuti misi-misi onboarding untuk menguasai platform dan mendapatkan poin
        </p>
      </div>

      {/* Progress Overview */}
      <TrialProgressOverview progress={userProgress} />

      {/* Onboarding Mission Card */}
      <div className="space-y-6">
        <MissionCard
          missions={allMissionsOrdered}
          title="Panduan Onboarding Platform"
          description="Ikuti langkah-langkah berikut secara berurutan untuk menguasai platform"
        />
      </div>
    </div>
  );
}