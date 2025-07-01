import { Card, CardContent } from "@/components/ui/card";
import { Target, CheckCircle, AlertTriangle, TrendingUp, Clock, Trophy } from "lucide-react";
import type { OKRWithKeyResults } from "@shared/schema";

interface StatsOverviewProps {
  okrs: OKRWithKeyResults[];
  isLoading?: boolean;
}

export default function StatsOverview({ okrs, isLoading }: StatsOverviewProps) {
  // Calculate stats from filtered OKR data
  const calculateStats = () => {
    if (!okrs || okrs.length === 0) {
      return {
        totalOKRs: 0,
        onTrack: 0,
        atRisk: 0,
        completed: 0,
        behind: 0,
        avgProgress: 0
      };
    }

    const totalOKRs = okrs.length;
    const onTrack = okrs.filter(okr => okr.status === 'on_track').length;
    const atRisk = okrs.filter(okr => okr.status === 'at_risk').length;
    const completed = okrs.filter(okr => okr.status === 'completed').length;
    const behind = okrs.filter(okr => okr.status === 'behind').length;
    const inProgress = okrs.filter(okr => okr.status === 'in_progress').length;
    
    // Calculate average progress
    const totalProgress = okrs.reduce((sum, okr) => sum + (okr.overallProgress || 0), 0);
    const avgProgress = totalOKRs > 0 ? Math.round(totalProgress / totalOKRs) : 0;

    return {
      totalOKRs,
      onTrack,
      atRisk,
      completed,
      behind,
      inProgress,
      avgProgress
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total OKRs",
      value: stats.totalOKRs,
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: Trophy,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Behind",
      value: stats.behind,
      icon: Clock,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
    {
      title: "Avg Progress",
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="shadow-sm border border-gray-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
