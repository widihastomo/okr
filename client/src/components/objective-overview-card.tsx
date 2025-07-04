import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import type {
  OKRWithKeyResults,
  Initiative,
  Task,
  User,
  Cycle,
} from "@shared/schema";
import { Link } from "wouter";
import { calculateKeyResultProgress } from "@shared/progress-calculator";
import {
  calculateIdealProgress,
  getProgressStatus,
  getStatusColor,
} from "@shared/status-helper";
import { ObjectiveStatusBadge } from "./objective-status-badge";

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

  // Visual indicators for icon styling based on progress
  const getHealthColor = (progress: number) => {
    if (progress >= 80) return "text-green-600 bg-green-100";
    if (progress >= 60) return "text-yellow-600 bg-yellow-100";
    if (progress >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  // Helper function to truncate text with character limit (responsive)
  const truncateText = (
    text: string,
    maxLength: number,
    mobileLength?: number,
  ) => {
    // Use shorter length for mobile if provided
    const effectiveLength =
      window.innerWidth < 768 && mobileLength ? mobileLength : maxLength;
    if (text.length <= effectiveLength) return text;
    return text.substring(0, effectiveLength) + "...";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader className="pb-4">
        {/* Title and Description - Moved to top */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`p-2 rounded-full ${getHealthColor(overallProgress)} flex-shrink-0 hidden sm:flex`}
            >
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 sm:ml-0 -ml-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-lg cursor-help truncate max-w-full">
                      {truncateText(objective.title, 50, 30)}
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{objective.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-gray-600 mt-1 cursor-help truncate max-w-full">
                      {truncateText(objective.description || "", 60, 40)}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>{objective.description || ""}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {(() => {
            const getProgressConfig = (status: string) => {
              switch (status) {
                case "on_track":
                  return {
                    bgColor: "bg-green-100",
                    textColor: "text-green-800",
                    dotColor: "bg-green-500",
                    label: "Sesuai Target",
                  };
                case "at_risk":
                  return {
                    bgColor: "bg-orange-100",
                    textColor: "text-orange-800",
                    dotColor: "bg-orange-500",
                    label: "Berisiko",
                  };
                case "behind":
                  return {
                    bgColor: "bg-red-100",
                    textColor: "text-red-800",
                    dotColor: "bg-red-500",
                    label: "Tertinggal",
                  };
                case "completed":
                  return {
                    bgColor: "bg-purple-100",
                    textColor: "text-purple-800",
                    dotColor: "bg-purple-500",
                    label: "Selesai",
                  };
                case "in_progress":
                  return {
                    bgColor: "bg-blue-100",
                    textColor: "text-blue-800",
                    dotColor: "bg-blue-500",
                    label: "Berlangsung",
                  };
                case "not_started":
                  return {
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-800",
                    dotColor: "bg-gray-500",
                    label: "Belum Dimulai",
                  };
                case "paused":
                  return {
                    bgColor: "bg-yellow-100",
                    textColor: "text-yellow-800",
                    dotColor: "bg-yellow-500",
                    label: "Dijeda",
                  };
                case "canceled":
                  return {
                    bgColor: "bg-red-100",
                    textColor: "text-red-800",
                    dotColor: "bg-red-500",
                    label: "Dibatalkan",
                  };
                case "partially_achieved":
                  return {
                    bgColor: "bg-amber-100",
                    textColor: "text-amber-800",
                    dotColor: "bg-amber-500",
                    label: "Tercapai Sebagian",
                  };
                case "not_achieved":
                  return {
                    bgColor: "bg-red-100",
                    textColor: "text-red-800",
                    dotColor: "bg-red-500",
                    label: "Tidak Tercapai",
                  };
                default:
                  return {
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-800",
                    dotColor: "bg-gray-500",
                    label: "Tidak Diketahui",
                  };
              }
            };
            const config = getProgressConfig(objective.status);
            return (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 ${config.bgColor} ${config.textColor} rounded-full text-xs font-medium whitespace-nowrap`}
              >
                <div
                  className={`w-1.5 h-1.5 ${config.dotColor} rounded-full flex-shrink-0`}
                ></div>
                <span className="truncate">{config.label}</span>
              </div>
            );
          })()}
        </div>

        {/* Additional Info Section */}
        <div className="mt-4 space-y-3 mb-6 pb-4 border-b border-gray-200">
          {/* Goal Induk Info */}
          {parentObjective && (
            <div className="flex items-start sm:items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
              <span className="text-gray-500 flex-shrink-0">Bagian dari:</span>
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

            <div className="flex items-start sm:items-center gap-2">
              {objective.ownerType === "team" ? (
                <Building className="w-4 h-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium break-words">
                  {getOwnerDisplay()}
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  ({objective.ownerType === "team" ? "Tim" : "Individual"})
                </span>
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
              {(() => {
                if (!cycle || !daysRemaining) return null;
                
                // Calculate ideal progress based on time passed
                const cycleStart = new Date(cycle.startDate);
                const cycleEnd = new Date(cycle.endDate);
                const now = new Date();

                const totalDuration = cycleEnd.getTime() - cycleStart.getTime();
                const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
                const idealProgress = Math.min(100, Math.max(0, (timePassed / totalDuration) * 100));
                
                // Show warning if actual progress is significantly behind ideal progress AND deadline is approaching
                const progressGap = idealProgress - overallProgress;
                const shouldShowWarning = progressGap > 20 && daysRemaining < 45;
                
                return shouldShowWarning ? (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Perlu perhatian</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Progress Bar with Visual Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Progress Keseluruhan
            </span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                {overallProgress}%
              </span>
              {cycle && (
                <div className="text-xs text-gray-500">
                  Target:{" "}
                  {(() => {
                    // Calculate ideal progress based on time passed
                    const cycleStart = new Date(cycle.startDate);
                    const cycleEnd = new Date(cycle.endDate);
                    const now = new Date();

                    const totalDuration =
                      cycleEnd.getTime() - cycleStart.getTime();
                    const timePassed = Math.max(
                      0,
                      now.getTime() - cycleStart.getTime(),
                    );
                    const idealProgress = Math.min(
                      100,
                      Math.max(0, (timePassed / totalDuration) * 100),
                    );

                    return Math.round(idealProgress);
                  })()}
                  %
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Progress
              value={overallProgress}
              className="h-4"
              variant={(() => {
                // Determine color based on status and progress
                if (overallProgress >= 100) return "completed";
                if (overallProgress >= 80) return "on-track";
                if (overallProgress >= 60) return "at-risk";
                return "behind";
              })()}
            />
            {/* Add milestone markers */}
            <div className="absolute top-0 left-1/4 w-0.5 h-4 bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-3/4 w-0.5 h-4 bg-gray-300 opacity-50"></div>

            {/* Ideal progress threshold indicator */}
            {cycle &&
              (() => {
                const cycleStart = new Date(cycle.startDate);
                const cycleEnd = new Date(cycle.endDate);
                const now = new Date();

                const totalDuration = cycleEnd.getTime() - cycleStart.getTime();
                const timePassed = Math.max(
                  0,
                  now.getTime() - cycleStart.getTime(),
                );
                const idealProgress = Math.min(
                  100,
                  Math.max(0, (timePassed / totalDuration) * 100),
                );

                return (
                  <div
                    className="absolute top-0 w-0.5 h-4 bg-blue-500 opacity-75"
                    style={{ left: `${idealProgress}%` }}
                    title={`Capaian ideal berdasarkan waktu: ${Math.round(idealProgress)}%`}
                  ></div>
                );
              })()}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          {cycle && (
            <div className="text-xs text-gray-500 text-center">
              <span className="inline-flex items-center gap-1">
                <div className="w-2 h-0.5 bg-blue-500 opacity-75"></div>
                Capaian ideal berdasarkan waktu yang telah berlalu
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex flex-col lg:h-96">
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
      </CardContent>
    </Card>
  );
}
