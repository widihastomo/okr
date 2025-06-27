import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Target, TrendingUp, Users, Clock, BarChart3, Edit, Trash2, ChevronRight, Home, ChevronDown, User, Check, CheckCircle2 } from "lucide-react";
import { CheckInModal } from "@/components/check-in-modal";
import InitiativeModal from "@/components/initiative-modal";
import { ProgressStatus } from "@/components/progress-status";
import { format } from "date-fns";
import type { KeyResultWithDetails } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer } from "recharts";

export default function KeyResultDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const keyResultId = params.id as string;
  const queryClient = useQueryClient();
  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());
  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Helper function to toggle initiative expansion
  const toggleInitiativeExpansion = (initiativeId: string) => {
    setExpandedInitiatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(initiativeId)) {
        newSet.delete(initiativeId);
      } else {
        newSet.add(initiativeId);
      }
      return newSet;
    });
  };

  // Function to update task status
  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // Update local state immediately for better UX
      setTaskStatuses(prev => ({
        ...prev,
        [taskId]: newStatus
      }));

      // Here we would call the API to update the task status
      // For now, we'll show a success toast
      toast({
        title: "Status Updated",
        description: `Task status berhasil diubah ke ${newStatus}`,
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/key-results/${keyResultId}/initiatives`]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status task",
        variant: "destructive",
      });
      
      // Revert local state on error
      setTaskStatuses(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    }
  };
  
  const { data: keyResult, isLoading } = useQuery<KeyResultWithDetails>({
    queryKey: [`/api/key-results/${keyResultId}`],
    enabled: !!keyResultId,
  });

  const { data: initiatives, isLoading: initiativesLoading } = useQuery<any[]>({
    queryKey: [`/api/key-results/${keyResultId}/initiatives`],
    enabled: !!keyResultId,
  });

  // Get objective data to access cycle information
  const { data: objective } = useQuery({
    queryKey: [`/api/objectives/${keyResult?.objectiveId}`],
    enabled: !!keyResult?.objectiveId,
  });

  // Helper function to get tasks for a specific initiative
  const getTasksForInitiative = (initiativeId: string) => {
    if (!expandedInitiatives.has(initiativeId)) return [];
    // For now, return mock tasks until we implement the API endpoint
    return [
      {
        id: `task-${initiativeId}-1`,
        title: "Task 1",
        description: "Sample task description",
        priority: "high",
        assignedTo: "John Doe",
        dueDate: "2025-01-15",
        status: taskStatuses[`task-${initiativeId}-1`] || "in_progress"
      },
      {
        id: `task-${initiativeId}-2`,
        title: "Task 2", 
        description: "Another task description",
        priority: "medium",
        assignedTo: "Jane Smith",
        dueDate: "2025-01-20",
        status: taskStatuses[`task-${initiativeId}-2`] || "completed"
      }
    ];
  };

  // Helper function to get status badge variant and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return {
          variant: "default" as const,
          label: "Selesai",
          icon: <CheckCircle2 className="h-3 w-3" />,
          color: "text-green-600"
        };
      case "in_progress":
        return {
          variant: "secondary" as const,
          label: "Sedang Dikerjakan",
          icon: <Clock className="h-3 w-3" />,
          color: "text-blue-600"
        };
      case "pending":
        return {
          variant: "outline" as const,
          label: "Pending",
          icon: <Calendar className="h-3 w-3" />,
          color: "text-yellow-600"
        };
      case "blocked":
        return {
          variant: "destructive" as const,
          label: "Blocked",
          icon: <Trash2 className="h-3 w-3" />,
          color: "text-red-600"
        };
      default:
        return {
          variant: "outline" as const,
          label: "Not Started",
          icon: <Calendar className="h-3 w-3" />,
          color: "text-gray-600"
        };
    }
  };

  const handleInitiativeSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/key-results/${keyResultId}/initiatives`]
    });
  };

  // Prepare chart data from check-ins with diagonal guideline
  const prepareChartData = () => {
    // Use default cycle dates for now - in production this would come from the cycle data
    const startDate = new Date(2025, 0, 1); // Jan 1, 2025
    const endDate = new Date(2025, 2, 31);   // Mar 31, 2025
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create diagonal guideline data points (from 0% to 100% across cycle period)
    const guidelinePoints = [];
    const numPoints = 5; // Number of points for the diagonal line
    
    for (let i = 0; i <= numPoints; i++) {
      const progress = (i / numPoints) * 100;
      const dayOffset = (i / numPoints) * totalDays;
      const pointDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      guidelinePoints.push({
        date: format(pointDate, "dd MMM"),
        actual: null, // No actual data for guideline points
        ideal: progress,
        guideline: progress, // Diagonal guideline value
        value: null
      });
    }

    if (!keyResult?.checkIns || keyResult.checkIns.length === 0) {
      // Return only guideline points if no check-ins exist
      return guidelinePoints;
    }

    // Sort check-ins by date
    const sortedCheckIns = [...keyResult.checkIns].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    // Calculate progress for each check-in
    const checkInData = sortedCheckIns.map((checkIn) => {
      // Calculate actual progress
      const current = parseFloat(checkIn.value);
      const target = parseFloat(keyResult.targetValue);
      const base = parseFloat(keyResult.baseValue || "0");
      
      let actualProgress = 0;
      if (keyResult.keyResultType === "increase_to") {
        actualProgress = ((current - base) / (target - base)) * 100;
      } else if (keyResult.keyResultType === "decrease_to") {
        actualProgress = ((base - current) / (base - target)) * 100;
      } else if (keyResult.keyResultType === "achieve_or_not") {
        actualProgress = current >= target ? 100 : 0;
      }

      // Calculate ideal progress based on time
      const checkInDate = new Date(checkIn.createdAt || Date.now());
      const daysPassed = Math.ceil((checkInDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const idealProgress = Math.min((daysPassed / totalDays) * 100, 100);

      return {
        date: format(checkInDate, "dd MMM"),
        actual: Math.max(0, Math.min(100, actualProgress)),
        ideal: Math.max(0, Math.min(100, idealProgress)),
        guideline: idealProgress, // Add guideline value for consistency
        value: current
      };
    });

    // Combine and sort all data points by date
    const allData = [...guidelinePoints, ...checkInData];
    return allData.sort((a, b) => {
      const dateA = new Date(a.date + " 2025");
      const dateB = new Date(b.date + " 2025");
      return dateA.getTime() - dateB.getTime();
    });
  };

  const chartData = keyResult ? prepareChartData() : [];

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "currency":
        return "Rp";
      case "number":
        return "";
      default:
        return unit;
    }
  };

  const formatValue = (value: string, unit: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (unit === "currency") {
      return `Rp ${numValue.toLocaleString('id-ID')}`;
    } else if (unit === "percentage") {
      return `${numValue.toFixed(1)}%`;
    } else {
      return numValue.toLocaleString('id-ID');
    }
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    const baseNum = baseValue ? parseFloat(baseValue) : 0;
    
    if (isNaN(currentNum) || isNaN(targetNum)) return 0;
    
    if (keyResultType === "achieve_or_not") {
      return currentNum >= targetNum ? 100 : 0;
    } else if (keyResultType === "decrease_to") {
      if (baseNum === 0) return 0;
      return Math.max(0, Math.min(100, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
    } else {
      return Math.max(0, Math.min(100, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!keyResult) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Key Result tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Key Result yang Anda cari tidak dapat ditemukan.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(
    keyResult.currentValue,
    keyResult.targetValue,
    keyResult.keyResultType,
    keyResult.baseValue
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      on_track: "bg-green-100 text-green-800 border-green-200",
      at_risk: "bg-yellow-100 text-yellow-800 border-yellow-200",
      behind: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      ahead: "bg-purple-100 text-purple-800 border-purple-200"
    };

    const statusLabels = {
      on_track: "On Track",
      at_risk: "At Risk", 
      behind: "Behind",
      completed: "Completed",
      ahead: "Ahead"
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-3">
          <CheckInModal 
            keyResultId={keyResult.id}
            keyResultTitle={keyResult.title}
            currentValue={keyResult.currentValue}
            targetValue={keyResult.targetValue}
            unit={keyResult.unit}
            keyResultType={keyResult.keyResultType}
          />
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Key Result
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Result Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Result Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title and Description */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{keyResult.title}</h1>
                {keyResult.description && (
                  <p className="text-gray-600 mb-3">{keyResult.description}</p>
                )}
                
                {/* Key Result Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {keyResult.keyResultType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Unit:</span>
                    <Badge variant="outline" className="text-xs">
                      {keyResult.unit}
                    </Badge>
                  </div>
                  {keyResult.lastUpdated && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Last Updated:</span>
                      <span className="text-gray-500 text-xs">
                        {format(new Date(keyResult.lastUpdated), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="font-semibold text-blue-600">
                    {formatValue(keyResult.currentValue, keyResult.unit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Target</p>
                  <p className="font-semibold text-green-600">
                    {formatValue(keyResult.targetValue, keyResult.unit)}
                  </p>
                </div>
                {keyResult.baseValue && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Base</p>
                    <p className="font-semibold text-gray-600">
                      {formatValue(keyResult.baseValue, keyResult.unit)}
                    </p>
                  </div>
                )}
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="font-semibold text-purple-600">{progress.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-3" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                {keyResult.status && getStatusBadge(keyResult.status)}
              </div>
            </CardContent>
          </Card>

          {/* Achievement Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Achievement
                </CardTitle>
                <CardDescription>
                  Progress tracking over time compared to ideal timeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const actualData = payload.find(p => p.dataKey === 'actual');
                            const idealData = payload.find(p => p.dataKey === 'ideal');
                            const guidelineData = payload.find(p => p.dataKey === 'guideline');
                            
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-medium text-gray-900 mb-2">{label}</p>
                                <div className="space-y-1">
                                  {actualData && actualData.value && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                      <span className="text-sm text-gray-600">Actual Progress:</span>
                                      <span className="text-sm font-medium">{Number(actualData.value).toFixed(1)}%</span>
                                    </div>
                                  )}
                                  {guidelineData && guidelineData.value && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-gray-600 border-dashed rounded-full"></div>
                                      <span className="text-sm text-gray-600">Target Guideline:</span>
                                      <span className="text-sm font-medium">{Number(guidelineData.value).toFixed(1)}%</span>
                                    </div>
                                  )}
                                  {idealData && idealData.value && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-gray-400 border-dashed rounded-full"></div>
                                      <span className="text-sm text-gray-600">Current Ideal:</span>
                                      <span className="text-sm font-medium">{Number(idealData.value).toFixed(1)}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#actualGradient)"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="guideline"
                        stroke="#6b7280"
                        strokeWidth={2}
                        strokeDasharray="8 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ideal"
                        stroke="#9ca3af"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Initiatives Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Initiatives
                  </CardTitle>
                  <CardDescription>
                    Strategic actions and projects to achieve this key result
                  </CardDescription>
                </div>
                <InitiativeModal keyResultId={keyResult.id} onSuccess={handleInitiativeSuccess} />
              </div>
            </CardHeader>
            <CardContent>
              {initiativesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : initiatives && initiatives.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initiatives.map((initiative) => {
                      const isExpanded = expandedInitiatives.has(initiative.id);
                      const tasks = getTasksForInitiative(initiative.id);

                      return (
                        <>
                          <TableRow key={initiative.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleInitiativeExpansion(initiative.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <p className="font-semibold">{initiative.title}</p>
                                  {initiative.description && (
                                    <p className="text-sm text-gray-600 mt-1">{initiative.description}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                initiative.status === "completed" ? "default" : 
                                initiative.status === "in_progress" ? "secondary" :
                                initiative.status === "on_hold" ? "destructive" :
                                "outline"
                              }>
                                {initiative.status?.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                initiative.priority === "critical" ? "destructive" :
                                initiative.priority === "high" ? "secondary" :
                                "outline"
                              }>
                                {initiative.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${initiative.progressPercentage || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {initiative.progressPercentage || 0}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {initiative.dueDate ? (
                                <span className={`text-sm ${
                                  new Date(initiative.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {format(new Date(initiative.dueDate), "MMM dd, yyyy")}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expandable Tasks Section */}
                          {isExpanded && (
                            <TableRow key={`${initiative.id}-tasks`}>
                              <TableCell colSpan={6} className="p-0">
                                <div className="bg-gray-50 p-4 border-l-4 border-blue-500">
                                  <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Tasks ({tasks?.length || 0})
                                  </h4>
                                  {tasks && tasks.length > 0 ? (
                                    <div className="space-y-2">
                                      {tasks.map((task: any) => {
                                        const statusDisplay = getStatusDisplay(task.status);
                                        return (
                                          <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <p className="font-medium text-sm">{task.title}</p>
                                                  <div className="flex items-center gap-1">
                                                    {statusDisplay.icon}
                                                    <span className={`text-xs font-medium ${statusDisplay.color}`}>
                                                      {statusDisplay.label}
                                                    </span>
                                                  </div>
                                                </div>
                                                {task.description && (
                                                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                  {task.assignedTo && (
                                                    <div className="flex items-center gap-1">
                                                      <User className="h-3 w-3" />
                                                      <span>{task.assignedTo}</span>
                                                    </div>
                                                  )}
                                                  {task.dueDate && (
                                                    <span className={
                                                      new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                                                    }>
                                                      {format(new Date(task.dueDate), "MMM dd")}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge variant={
                                                  task.priority === "critical" ? "destructive" :
                                                  task.priority === "high" ? "secondary" :
                                                  "outline"
                                                } className="text-xs">
                                                  {task.priority}
                                                </Badge>
                                                <Select
                                                  value={task.status}
                                                  onValueChange={(newStatus) => handleTaskStatusUpdate(task.id, newStatus)}
                                                >
                                                  <SelectTrigger className="w-32 h-8 text-xs">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="not_started">Belum Dimulai</SelectItem>
                                                    <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="blocked">Blocked</SelectItem>
                                                    <SelectItem value="completed">Selesai</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No tasks available</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No initiatives yet</p>
                  <p className="text-sm">Create your first initiative to start working towards this key result.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keyResult.checkIns && keyResult.checkIns.length > 0 ? (
                keyResult.checkIns.map((checkIn, index) => (
                  <div key={checkIn.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-blue-600">
                          {formatValue(checkIn.value, keyResult.unit)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {checkIn.createdAt ? format(new Date(checkIn.createdAt), "MMM dd") : "Unknown"}
                        </p>
                      </div>
                      {checkIn.notes && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{checkIn.notes}</p>
                      )}
                      {checkIn.confidence && (
                        <p className="text-xs text-gray-500 mt-1">Confidence: {checkIn.confidence}/10</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No check-ins yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Share Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}