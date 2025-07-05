import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  PlayCircle,
  Target,
  BarChart3
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CheckInModal } from "@/components/check-in-modal";
import SuccessMetricsModalSimple from "@/components/success-metrics-modal-simple";
import { useAuth } from "@/hooks/useAuth";

export default function DailyFocusPage() {
  const { user } = useAuth();
  const userId = user && typeof user === 'object' && 'id' in user ? (user as any).id : null;
  
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const [selectedKeyResult, setSelectedKeyResult] = useState<any>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSuccessMetricsModalOpen, setIsSuccessMetricsModalOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);

  // Fetch data
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/objectives"],
  });

  const { data: keyResults = [] } = useQuery({
    queryKey: ["/api/key-results"],
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      return await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/tasks`] });
      toast({
        title: "Task berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get today's date info
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Helper functions
  const calculateKeyResultProgress = (keyResult: any): number => {
    const current = Number(keyResult.currentValue) || 0;
    const target = Number(keyResult.targetValue) || 0;
    const base = Number(keyResult.baseValue) || 0;

    if (keyResult.keyResultType === "achieve_or_not") {
      return keyResult.achieved ? 100 : 0;
    }

    if (keyResult.keyResultType === "increase_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((current - base) / (target - base)) * 100));
    }

    if (keyResult.keyResultType === "decrease_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((base - current) / (base - target)) * 100));
    }

    if (keyResult.keyResultType === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (keyResult.keyResultType === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Sedang Berjalan';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Belum Dimulai';
    }
  };

  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleCheckInKeyResult = (keyResult: any) => {
    setSelectedKeyResult(keyResult);
    setIsCheckInModalOpen(true);
  };

  const handleUpdateMetrics = (initiative: any) => {
    setSelectedInitiative(initiative);
    setIsSuccessMetricsModalOpen(true);
  };

  // Filter data for today's focus
  const todayTasks = (allTasks as any[]).filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split('T')[0] : null;
    return dueDate === todayStr || task.status === 'in_progress';
  });

  const overdueTasks = (allTasks as any[]).filter((task: any) => {
    const dueDate = task.dueDate ? task.dueDate.split('T')[0] : null;
    return dueDate && dueDate < todayStr && task.status !== 'completed' && task.status !== 'cancelled';
  });

  const activeKeyResults = (keyResults as any[]).filter((kr: any) => {
    const progress = calculateKeyResultProgress(kr);
    return progress < 100 && kr.status !== 'completed' && kr.status !== 'cancelled';
  });

  const activeInitiatives = (initiatives as any[]).filter((init: any) => 
    init.status === 'sedang_berjalan' || init.status === 'draft'
  );

  // Get related objectives for today's activities
  const getRelatedObjectives = () => {
    const relatedObjIds = new Set();
    
    // From key results
    activeKeyResults.forEach((kr: any) => {
      if (kr.objectiveId) relatedObjIds.add(kr.objectiveId);
    });
    
    // From initiatives
    activeInitiatives.forEach((init: any) => {
      if (init.keyResultId) {
        const kr = (keyResults as any[]).find((k: any) => k.id === init.keyResultId);
        if (kr?.objectiveId) relatedObjIds.add(kr.objectiveId);
      }
    });

    return (objectives as any[]).filter((obj: any) => 
      relatedObjIds.has(obj.id) || obj.status === 'on_track' || obj.status === 'at_risk'
    );
  };

  const relatedObjectives = getRelatedObjectives();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Focus</h1>
          <p className="text-gray-600">Kelola aktivitas harian Anda hari ini</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {today.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Hari Ini</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayTasks.filter(t => t.status === 'completed').length} selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Perlu perhatian segera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Angka Target Aktif</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeyResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Belum mencapai target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inisiatif Aktif</CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInitiatives.length}</div>
            <p className="text-xs text-muted-foreground">
              Sedang berjalan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Objective Awareness Section */}
      {relatedObjectives.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objective Terkait Aktivitas Hari Ini
            </CardTitle>
            <CardDescription className="text-blue-700">
              Tetap ingat tujuan utama yang mendorong aktivitas harian Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedObjectives.slice(0, 4).map((obj: any) => {
                const objKeyResults = (keyResults as any[]).filter(kr => kr.objectiveId === obj.id);
                const objProgress = objKeyResults.length > 0 
                  ? objKeyResults.reduce((sum, kr) => sum + calculateKeyResultProgress(kr), 0) / objKeyResults.length 
                  : 0;
                
                return (
                  <div key={obj.id} className="p-4 bg-white border border-blue-200 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-blue-900 line-clamp-2">{obj.title}</h3>
                        {obj.description && (
                          <p className="text-sm text-blue-700 mt-1 line-clamp-2">{obj.description}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Progress</span>
                          <span className="font-medium text-blue-900">{objProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={objProgress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={
                            obj.status === 'on_track' ? 'border-green-300 text-green-700 bg-green-50' :
                            obj.status === 'at_risk' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                            obj.status === 'behind' ? 'border-red-300 text-red-700 bg-red-50' :
                            'border-blue-300 text-blue-700 bg-blue-50'
                          }
                        >
                          {obj.status === 'on_track' ? 'On Track' :
                           obj.status === 'at_risk' ? 'At Risk' :
                           obj.status === 'behind' ? 'Behind' :
                           obj.status}
                        </Badge>
                        
                        <div className="text-xs text-blue-600">
                          {objKeyResults.length} Angka Target
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {relatedObjectives.length > 4 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-blue-600">
                  +{relatedObjectives.length - 4} objective lainnya terkait aktivitas Anda
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Task Prioritas</TabsTrigger>
          <TabsTrigger value="progress">Update Progress</TabsTrigger>
          <TabsTrigger value="initiatives">Kelola Inisiatif</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Prioritas Hari Ini</CardTitle>
              <CardDescription>
                Fokus pada task yang perlu diselesaikan hari ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Task Terlambat
                  </h3>
                  {overdueTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">{task.title}</p>
                        <p className="text-sm text-red-600">
                          Tenggat: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : 'Tidak ada'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTaskStatusColor(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Today's Tasks */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Task Hari Ini</h3>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada task untuk hari ini</p>
                  </div>
                ) : (
                  todayTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : 'Tidak ada tenggat'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTaskStatusColor(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Progress Angka Target</CardTitle>
              <CardDescription>
                Lakukan check-in pada angka target yang aktif
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeKeyResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Semua angka target sudah tercapai</p>
                </div>
              ) : (
                activeKeyResults.map((kr: any) => {
                  const progress = calculateKeyResultProgress(kr);
                  return (
                    <div key={kr.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-blue-900">{kr.title}</h3>
                        <Button 
                          size="sm" 
                          onClick={() => handleCheckInKeyResult(kr)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Check-in
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Saat ini: {kr.currentValue}</span>
                          <span>Target: {kr.targetValue}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kelola Inisiatif Aktif</CardTitle>
              <CardDescription>
                Update metrics dan kelola inisiatif yang sedang berjalan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeInitiatives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada inisiatif aktif</p>
                </div>
              ) : (
                activeInitiatives.map((init: any) => (
                  <div key={init.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-purple-900">{init.title}</h3>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateMetrics(init)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Update Metrics
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Status</span>
                        <Badge variant="outline">{init.status}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{init.progress || 0}%</span>
                      </div>
                      <Progress value={init.progress || 0} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedKeyResult && (
        <CheckInModal
          open={isCheckInModalOpen}
          onOpenChange={setIsCheckInModalOpen}
          keyResultId={selectedKeyResult.id}
          keyResultTitle={selectedKeyResult.title}
          currentValue={selectedKeyResult.currentValue}
          targetValue={selectedKeyResult.targetValue}
          unit={selectedKeyResult.unit}
          keyResultType={selectedKeyResult.keyResultType}
        />
      )}

      {selectedInitiative && (
        <SuccessMetricsModalSimple
          open={isSuccessMetricsModalOpen}
          onOpenChange={setIsSuccessMetricsModalOpen}
          initiativeId={selectedInitiative.id}
        />
      )}
    </div>
  );
}