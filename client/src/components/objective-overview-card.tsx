import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  FileText,
  CheckSquare,
  AlertTriangle,
  Calendar,
  Building,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import type { OKRWithKeyResults, Initiative, Task, User, Cycle } from "@shared/schema";
import { Link } from "wouter";
import { calculateKeyResultProgress } from "@shared/progress-calculator";

interface ObjectiveOverviewCardProps {
  objective: OKRWithKeyResults;
  initiatives?: Initiative[];
  tasks?: Task[];
  daysRemaining?: number;
  cycle?: Cycle;
  parentObjective?: OKRWithKeyResults;
  owner?: User | any; // Can be User or Team
  team?: any;
}

export default function ObjectiveOverviewCard({
  objective,
  initiatives = [],
  tasks = [],
  daysRemaining,
  cycle,
  parentObjective,
  owner,
  team,
}: ObjectiveOverviewCardProps) {
  // Helper function for displaying owner information
  const getOwnerDisplay = () => {
    if (objective.ownerType === "team") {
      // Handle team owner - check if owner has name property (Team type)
      return (owner as any)?.name || "Tim tidak ditemukan";
    } else {
      // Handle user owner - check if owner has firstName/lastName properties (User type)
      const userOwner = owner as any;
      return userOwner?.firstName && userOwner?.lastName 
        ? `${userOwner.firstName} ${userOwner.lastName}` 
        : userOwner?.email || "User tidak ditemukan";
    }
  };

  // Helper function for calculating overall progress
  const calculateOverallProgress = (keyResults: any[]): number => {
    if (!keyResults || keyResults.length === 0) return 0;
    const progressSum = keyResults.reduce((sum, kr) => {
      const result = calculateKeyResultProgress(
        kr.currentValue,
        kr.targetValue,
        kr.keyResultType,
        kr.baseValue,
      );
      return sum + result.progressPercentage;
    }, 0);
    return Math.round(progressSum / keyResults.length);
  };

  // Calculate statistics
  const totalKeyResults = objective.keyResults.length;
  const completedKeyResults = objective.keyResults.filter((kr) => {
    const result = calculateKeyResultProgress(
      kr.currentValue,
      kr.targetValue,
      kr.keyResultType,
      kr.baseValue,
    );
    return result.progressPercentage >= 100;
  }).length;

  const totalInitiatives = initiatives.length;
  const completedInitiatives = initiatives.filter(
    (i) => i.status === "completed",
  ).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const overallProgress = calculateOverallProgress(objective.keyResults);

  // Visual indicators
  const getHealthColor = (progress: number) => {
    if (progress >= 80) return "text-green-600 bg-green-100";
    if (progress >= 60) return "text-yellow-600 bg-yellow-100";
    if (progress >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        {/* Title and Description - Moved to top */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getHealthColor(overallProgress)}`}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-2">
                {objective.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {objective.description}
              </p>
            </div>
          </div>
          <Badge className={getHealthColor(overallProgress)}>
            {overallProgress}%
          </Badge>
        </div>

        {/* Additional Info Section */}
        <div className="mt-4 space-y-3 mb-6 pb-4 border-b border-gray-200">
          {/* Goal Induk Info */}
          {parentObjective && (
            <div className="flex items-start sm:items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
              <span className="text-gray-500 flex-shrink-0">
                Bagian dari:
              </span>
              <Link href={`/objectives/${parentObjective.id}`}>
                <span className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-start sm:items-center gap-1 break-words">
                  {parentObjective.title}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                </span>
              </Link>
            </div>
          )}

          {/* Periode and Pemilik Info - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm">
            <div className="flex items-start sm:items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium">
                  {cycle?.name || "Tidak ada cycle"}
                </span>
                {cycle && (
                  <span className="text-xs text-gray-400 block sm:inline">
                    ({new Date(cycle.startDate).toLocaleDateString("id-ID")} -{" "}
                    {new Date(cycle.endDate).toLocaleDateString("id-ID")})
                  </span>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Progress Bar with Visual Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Progress Keseluruhan
            </span>
            <span className="text-2xl font-bold text-gray-900">{overallProgress}%</span>
          </div>
          <div className="relative">
            <Progress value={overallProgress} className="h-4" />
            {/* Add milestone markers */}
            <div className="absolute top-0 left-1/4 w-0.5 h-4 bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-3/4 w-0.5 h-4 bg-gray-300 opacity-50"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Key Results */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">
              {completedKeyResults}/{totalKeyResults}
            </div>
            <div className="text-xs text-blue-700">Key Results</div>
          </div>

          {/* Initiatives */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {completedInitiatives}/{totalInitiatives}
            </div>
            <div className="text-xs text-green-700">Rencana</div>
          </div>

          {/* Tasks */}
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">
              {completedTasks}/{totalTasks}
            </div>
            <div className="text-xs text-purple-700">Tugas</div>
          </div>
        </div>

        {/* Time & Status Indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              {daysRemaining !== undefined
                ? daysRemaining > 0
                  ? `${daysRemaining} hari tersisa`
                  : "Berakhir"
                : "Tidak ada deadline"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {overallProgress < 50 && daysRemaining && daysRemaining < 30 && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Perlu perhatian</span>
              </div>
            )}
            {/* Owner Information */}
            <div className="flex items-center gap-2">
              {objective.ownerType === "team" ? (
                <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
              <span className="font-medium text-gray-700 text-sm">
                {getOwnerDisplay()}
              </span>
            </div>
          </div>
        </div>

        {/* Key Results Mini Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Results Teratas
          </h4>
          <div className="space-y-1">
            {objective.keyResults.slice(0, 2).map((kr) => {
              const result = calculateKeyResultProgress(
                kr.currentValue,
                kr.targetValue,
                kr.keyResultType,
                kr.baseValue,
              );
              const progress = result.progressPercentage;
              return (
                <div
                  key={kr.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate flex-1 mr-2">{kr.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <span className="text-gray-500 min-w-8">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              );
            })}
            {objective.keyResults.length > 2 && (
              <div className="text-xs text-gray-400 text-center pt-1">
                +{objective.keyResults.length - 2} key results lainnya
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
