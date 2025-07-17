import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  Briefcase,
  ListTodo,
  Award,
  Calendar,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Objective, KeyResult, User, Team, Cycle, Initiative, Task } from "@shared/schema";

// Define analytics data types
interface AnalyticsData {
  objectives: Objective[];
  keyResults: KeyResult[];
  users: User[];
  teams: Team[];
  cycles: Cycle[];
  initiatives: Initiative[];
  tasks: any[];
}

// Helper function to calculate key result progress
function calculateKeyResultProgress(keyResult: KeyResult): number {
  const current = parseFloat(keyResult.currentValue);
  const target = parseFloat(keyResult.targetValue);
  const base = keyResult.baseValue ? parseFloat(keyResult.baseValue) : 0;

  if (keyResult.keyResultType === "achieve_or_not") {
    return current >= target ? 100 : 0;
  } else if (keyResult.keyResultType === "decrease_to") {
    if (base <= target) return 0;
    return Math.round(((base - current) / (base - target)) * 100);
  } else {
    // increase_to
    if (target <= base) return 0;
    return Math.round(((current - base) / (target - base)) * 100);
  }
}

interface OverviewStats {
  totalObjectives: number;
  completedObjectives: number;
  totalKeyResults: number;
  completedKeyResults: number;
  totalInitiatives: number;
  completedInitiatives: number;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
  onTrackPercentage: number;
}

export default function AnalyticsPage() {
  const [selectedCycle, setSelectedCycle] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Fetch all required data
  const { data: objectives = [] } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
  });

  const { data: keyResults = [] } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"],
  });

  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: ["/api/initiatives"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Calculate overview statistics
  const calculateOverviewStats = (): OverviewStats => {
    const filteredObjectives = objectives.filter(
      (obj) =>
        (selectedCycle === "all" || obj.cycleId === selectedCycle) &&
        (selectedTeam === "all" || obj.teamId === selectedTeam)
    );

    const filteredKeyResults = keyResults.filter((kr) =>
      filteredObjectives.some((obj) => obj.id === kr.objectiveId)
    );

    const filteredInitiatives = initiatives.filter((init) =>
      filteredKeyResults.some((kr) => kr.id === init.keyResultId)
    );

    const completedObjectives = filteredObjectives.filter(
      (obj) => obj.status === "completed"
    ).length;

    const completedKeyResults = filteredKeyResults.filter(
      (kr) => kr.status === "completed"
    ).length;

    const completedInitiatives = filteredInitiatives.filter(
      (init) => (init.progressPercentage || 0) >= 100
    ).length;

    const completedTasks = tasks.filter(
      (task: Task) => task.status === "completed"
    ).length;

    const averageProgress =
      filteredKeyResults.length > 0
        ? filteredKeyResults.reduce((sum, kr) => sum + calculateKeyResultProgress(kr), 0) /
          filteredKeyResults.length
        : 0;

    const onTrackCount = filteredKeyResults.filter(
      (kr) => kr.status === "on_track" || kr.status === "completed"
    ).length;

    const onTrackPercentage =
      filteredKeyResults.length > 0
        ? (onTrackCount / filteredKeyResults.length) * 100
        : 0;

    return {
      totalObjectives: filteredObjectives.length,
      completedObjectives,
      totalKeyResults: filteredKeyResults.length,
      completedKeyResults,
      totalInitiatives: filteredInitiatives.length,
      completedInitiatives,
      totalTasks: tasks.length,
      completedTasks,
      averageProgress,
      onTrackPercentage,
    };
  };

  const stats = calculateOverviewStats();

  // Prepare data for status distribution chart
  const getStatusDistribution = () => {
    const statusCounts: Record<string, number> = {};
    
    objectives.forEach((obj) => {
      statusCounts[obj.status] = (statusCounts[obj.status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      not_started: "#6B7280",
      on_track: "#10B981",
      at_risk: "#F59E0B",
      behind: "#EF4444",
      completed: "#8B5CF6",
      paused: "#3B82F6",
      canceled: "#DC2626",
      partially_achieved: "#F97316",
      not_achieved: "#991B1B",
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: colors[status] || "#6B7280",
    }));
  };

  // Prepare data for progress over time
  const getProgressOverTime = () => {
    // Group key results by month
    const monthlyProgress: Record<string, { total: number; count: number }> = {};
    
    keyResults.forEach((kr) => {
      if (kr.dueDate) {
        const month = new Date(kr.dueDate).toLocaleDateString("id-ID", {
          month: "short",
          year: "numeric",
        });
        
        if (!monthlyProgress[month]) {
          monthlyProgress[month] = { total: 0, count: 0 };
        }
        
        monthlyProgress[month].total += calculateKeyResultProgress(kr);
        monthlyProgress[month].count += 1;
      }
    });

    return Object.entries(monthlyProgress)
      .map(([month, data]) => ({
        month,
        averageProgress: data.total / data.count,
      }))
      .slice(-6); // Last 6 months
  };

  // Prepare team performance data
  const getTeamPerformance = () => {
    return teams.map((team) => {
      const teamObjectives = objectives.filter((obj) => obj.teamId === team.id);
      const teamKeyResults = keyResults.filter((kr) =>
        teamObjectives.some((obj) => obj.id === kr.objectiveId)
      );

      const averageProgress =
        teamKeyResults.length > 0
          ? teamKeyResults.reduce((sum, kr) => sum + calculateKeyResultProgress(kr), 0) /
            teamKeyResults.length
          : 0;

      const completedCount = teamKeyResults.filter(
        (kr) => kr.status === "completed"
      ).length;

      return {
        name: team.name,
        averageProgress,
        totalObjectives: teamObjectives.length,
        completedKeyResults: completedCount,
        totalKeyResults: teamKeyResults.length,
      };
    });
  };

  // Prepare user performance data
  const getUserPerformance = () => {
    return users
      .map((user) => {
        const userObjectives = objectives.filter(
          (obj) => obj.ownerId === user.id
        );
        const userKeyResults = keyResults.filter((kr) =>
          userObjectives.some((obj) => obj.id === kr.objectiveId)
        );

        const averageProgress =
          userKeyResults.length > 0
            ? userKeyResults.reduce((sum, kr) => sum + calculateKeyResultProgress(kr), 0) /
              userKeyResults.length
            : 0;

        const completedCount = userKeyResults.filter(
          (kr) => kr.status === "completed"
        ).length;

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          averageProgress,
          totalObjectives: userObjectives.length,
          completedKeyResults: completedCount,
          totalKeyResults: userKeyResults.length,
        };
      })
      .filter((user) => user.totalObjectives > 0)
      .sort((a, b) => b.averageProgress - a.averageProgress)
      .slice(0, 10); // Top 10 performers
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      not_started: "Belum Dimulai",
      on_track: "Sesuai Jalur",
      at_risk: "Berisiko",
      behind: "Terlambat",
      completed: "Selesai",
      paused: "Ditunda",
      canceled: "Dibatalkan",
      partially_achieved: "Tercapai Sebagian",
      not_achieved: "Tidak Tercapai",
      in_progress: "Sedang Berjalan",
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">
            Monitor progress dan performa Goal, initiative, dan tim
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cycle</SelectItem>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="analytics-chart">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Objectives
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalObjectives}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedObjectives} selesai (
              {stats.totalObjectives > 0
                ? Math.round(
                    (stats.completedObjectives / stats.totalObjectives) * 100
                  )
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedKeyResults} selesai (
              {stats.totalKeyResults > 0
                ? Math.round(
                    (stats.completedKeyResults / stats.totalKeyResults) * 100
                  )
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progress Rata-rata
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageProgress.toFixed(1)}%
            </div>
            <Progress value={stats.averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.onTrackPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Key Results sesuai jalur
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Performance</TabsTrigger>
          <TabsTrigger value="users">User Performance</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives & Tasks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status Objective</CardTitle>
                <CardDescription>
                  Breakdown status dari semua objectives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getStatusDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Progress Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>
                  Rata-rata progress key results per bulan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getProgressOverTime()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="averageProgress"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Initiatives
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalInitiatives}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedInitiatives} selesai
                </p>
                <Progress
                  value={
                    stats.totalInitiatives > 0
                      ? (stats.completedInitiatives / stats.totalInitiatives) *
                        100
                      : 0
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tasks
                </CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedTasks} selesai
                </p>
                <Progress
                  value={
                    stats.totalTasks > 0
                      ? (stats.completedTasks / stats.totalTasks) * 100
                      : 0
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Cycles
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cycles.filter((c) => c.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dari {cycles.length} total cycles
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teams Performance Tab */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Comparison</CardTitle>
              <CardDescription>
                Perbandingan performa antar tim berdasarkan progress Goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getTeamPerformance()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="averageProgress"
                    fill="#3B82F6"
                    name="Progress Rata-rata (%)"
                  />
                  <Bar
                    dataKey="completedKeyResults"
                    fill="#10B981"
                    name="Key Results Selesai"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Performance Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTeamPerformance().map((team) => (
                  <div
                    key={team.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-500">
                          {team.totalObjectives} Objectives •{" "}
                          {team.totalKeyResults} Key Results
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {team.averageProgress.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-500">
                        Progress rata-rata
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Performance Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                10 user dengan progress Goal terbaik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getUserPerformance().map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                            variant={
                              index === 0
                                ? "default"
                                : index === 1
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {index + 1}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-500">
                          {user.totalObjectives} Objectives •{" "}
                          {user.completedKeyResults}/{user.totalKeyResults} KRs
                          selesai
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {user.averageProgress.toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-500">Progress</p>
                      </div>
                      {user.averageProgress >= 80 && (
                        <Award className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Performance Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Distribution</CardTitle>
              <CardDescription>
                Distribusi metrik performa user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart
                  data={getUserPerformance()
                    .slice(0, 5)
                    .map((user) => ({
                      name: user.name.split(" ")[0],
                      progress: user.averageProgress,
                      objectives: user.totalObjectives * 10,
                      completed: (user.completedKeyResults / user.totalKeyResults) * 100,
                    }))}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Progress"
                    dataKey="progress"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Objectives"
                    dataKey="objectives"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Completion Rate"
                    dataKey="completed"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initiatives & Tasks Tab */}
        <TabsContent value="initiatives" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Initiative Progress Distribution</CardTitle>
                <CardDescription>
                  Distribusi progress dari semua initiatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        range: "0-25%",
                        count: initiatives.filter((i) => (i.progressPercentage || 0) < 25)
                          .length,
                      },
                      {
                        range: "25-50%",
                        count: initiatives.filter(
                          (i) => (i.progressPercentage || 0) >= 25 && (i.progressPercentage || 0) < 50
                        ).length,
                      },
                      {
                        range: "50-75%",
                        count: initiatives.filter(
                          (i) => (i.progressPercentage || 0) >= 50 && (i.progressPercentage || 0) < 75
                        ).length,
                      },
                      {
                        range: "75-99%",
                        count: initiatives.filter(
                          (i) => (i.progressPercentage || 0) >= 75 && (i.progressPercentage || 0) < 100
                        ).length,
                      },
                      {
                        range: "100%",
                        count: initiatives.filter((i) => (i.progressPercentage || 0) >= 100)
                          .length,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Status Overview</CardTitle>
                <CardDescription>Status dari semua tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: "todo", label: "To Do", color: "bg-gray-500" },
                    {
                      status: "in_progress",
                      label: "In Progress",
                      color: "bg-blue-500",
                    },
                    {
                      status: "completed",
                      label: "Completed",
                      color: "bg-green-500",
                    },
                  ].map((status) => {
                    const count = tasks.filter(
                      (t) => t.status === status.status
                    ).length;
                    const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;

                    return (
                      <div key={status.status}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">
                            {status.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${status.color} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Initiative Priority Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Initiative Priority vs Progress</CardTitle>
              <CardDescription>
                Matriks prioritas dan progress initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">
                    High Priority - Low Progress
                  </h4>
                  <div className="border rounded-lg p-4 min-h-[150px]">
                    {initiatives
                      .filter((i) => i.priority === "high" && (i.progressPercentage || 0) < 50)
                      .map((init) => (
                        <div
                          key={init.id}
                          className="flex justify-between items-center mb-2"
                        >
                          <span className="text-sm">{init.title}</span>
                          <Badge variant="destructive">
                            {init.progressPercentage || 0}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">
                    High Priority - High Progress
                  </h4>
                  <div className="border rounded-lg p-4 min-h-[150px]">
                    {initiatives
                      .filter(
                        (i) => i.priority === "high" && (i.progressPercentage || 0) >= 50
                      )
                      .map((init) => (
                        <div
                          key={init.id}
                          className="flex justify-between items-center mb-2"
                        >
                          <span className="text-sm">{init.title}</span>
                          <Badge variant="secondary">{init.progressPercentage || 0}%</Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-600">
                    Low Priority - Low Progress
                  </h4>
                  <div className="border rounded-lg p-4 min-h-[150px]">
                    {initiatives
                      .filter(
                        (i) =>
                          (i.priority === "low" || i.priority === "medium") &&
                          (i.progressPercentage || 0) < 50
                      )
                      .slice(0, 5)
                      .map((init) => (
                        <div
                          key={init.id}
                          className="flex justify-between items-center mb-2"
                        >
                          <span className="text-sm">{init.title}</span>
                          <Badge variant="outline">{init.progressPercentage || 0}%</Badge>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">
                    Low Priority - High Progress
                  </h4>
                  <div className="border rounded-lg p-4 min-h-[150px]">
                    {initiatives
                      .filter(
                        (i) =>
                          (i.priority === "low" || i.priority === "medium") &&
                          (i.progressPercentage || 0) >= 50
                      )
                      .slice(0, 5)
                      .map((init) => (
                        <div
                          key={init.id}
                          className="flex justify-between items-center mb-2"
                        >
                          <span className="text-sm">{init.title}</span>
                          <Badge>{init.progressPercentage || 0}%</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}