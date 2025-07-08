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
  addUser: () => window.location.href = "/client-users",
  createTeam: () => window.location.href = "/teams", 
  manageCycle: () => window.location.href = "/cycles",
  createObjective: () => window.location.href = "/",
  addKeyResults: () => window.location.href = "/",
  createInitiative: () => window.location.href = "/",
  addTask: () => window.location.href = "/daily-focus",
  firstCheckin: () => window.location.href = "/",
  updateProgress: () => window.location.href = "/",
  completeTask: () => window.location.href = "/daily-focus",
  consistency: () => window.location.href = "/daily-focus",
  completeObjective: () => window.location.href = "/",
  masterInitiative: () => window.location.href = "/",
  graduateOnboarding: () => toast({ title: "Selamat!", description: "Anda telah menyelesaikan semua misi onboarding!" }),
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
  const { toast } = useToast();
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
            {missions.map((mission) => {
              const IconComponent = iconMapping[mission.icon] || Target;
              const missionKey = mission.name.includes("Tambah Pengguna") ? "addUser" :
                                mission.name.includes("Buat Tim") ? "createTeam" :
                                mission.name.includes("Kelola Cycle") ? "manageCycle" :
                                mission.name.includes("Buat Objective") ? "createObjective" :
                                mission.name.includes("Tambah Key Results") ? "addKeyResults" :
                                mission.name.includes("Buat Inisiatif") ? "createInitiative" :
                                mission.name.includes("Tambah Task") ? "addTask" :
                                mission.name.includes("Lakukan Check-in") ? "firstCheckin" :
                                mission.name.includes("Update Progress") ? "updateProgress" :
                                mission.name.includes("Selesaikan Task") ? "completeTask" :
                                mission.name.includes("Konsistensi") ? "consistency" :
                                mission.name.includes("Selesaikan Objective") ? "completeObjective" :
                                mission.name.includes("Master Inisiatif") ? "masterInitiative" :
                                "graduateOnboarding";
              
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
                        <h4 className={`font-medium text-sm ${
                          mission.unlocked ? "text-green-700 line-through" : "text-gray-800"
                        }`}>
                          {mission.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          +{mission.points} poin
                        </Badge>
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
                          Mulai Misi
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

  const categoryInfo = {
    setup: { 
      title: "Onboarding Dasar", 
      description: "Menyiapkan fondasi untuk penggunaan platform",
      icon: Target,
      color: "bg-blue-500"
    },
    workflow: { 
      title: "Manajemen Tim", 
      description: "Menguasai alur kerja manajemen tim dan goal",
      icon: Users,
      color: "bg-green-500"
    },
    monitoring: { 
      title: "Eksekusi Strategi", 
      description: "Memantau progress dan melakukan eksekusi",
      icon: TrendingUp,
      color: "bg-purple-500"
    },
    mastery: { 
      title: "Monitoring & Evaluasi", 
      description: "Menguasai sistem evaluasi dan pencapaian",
      icon: Award,
      color: "bg-orange-500"
    }
  };

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

      {/* Mission Cards by Category */}
      <div className="space-y-6">
        {Object.entries(categoryInfo).map(([categoryKey, info]) => {
          const categoryMissions = achievementsByCategory[categoryKey] || [];
          
          if (categoryMissions.length === 0) return null;
          
          return (
            <MissionCard
              key={categoryKey}
              missions={categoryMissions}
              title={info.title}
              description={info.description}
            />
          );
        })}
      </div>
    </div>
  );
}