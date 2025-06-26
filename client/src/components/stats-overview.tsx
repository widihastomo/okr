import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Target, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface Stats {
  totalOKRs: number;
  onTrack: number;
  atRisk: number;
  completed: number;
  avgProgress: number;
}

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

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
      value: stats?.totalOKRs || 0,
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-primary"
    },
    {
      title: "On Track",
      value: stats?.onTrack || 0,
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "At Risk",
      value: stats?.atRisk || 0,
      icon: AlertTriangle,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Avg Progress",
      value: `${stats?.avgProgress || 0}%`,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
