import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, User as UserIcon, Clock, Plus, Target, BarChart3, TrendingUp, TrendingDown, CheckCircle2, MoreVertical, Building, ClipboardList, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import EditKeyResultModal from "@/components/edit-key-result-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OKRWithKeyResults, KeyResult, Initiative, Task, Cycle, User, Team } from "@shared/schema";

// Type for tasks with initiative info
type TaskWithInitiative = Task & {
  initiative?: {
    id: string;
    title: string;
  };
};

export default function ObjectiveDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [checkInModal, setCheckInModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });
  const [editKeyResultModal, setEditKeyResultModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });
  
  // Fetch objective data
  const { data: objective, isLoading } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/okrs/${id}`],
    enabled: !!id,
  });

  // Fetch cycle data
  const { data: cycle } = useQuery<Cycle>({
    queryKey: [`/api/cycles/${objective?.cycleId}`],
    enabled: !!objective?.cycleId,
  });

  // Fetch owner data
  const { data: owner } = useQuery<User | Team>({
    queryKey: objective?.ownerType === 'user' 
      ? [`/api/users/${objective?.ownerId}`]
      : [`/api/teams/${objective?.ownerId}`],
    enabled: !!objective?.ownerId && !!objective?.ownerType,
  });

  // Fetch initiatives for this objective
  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: [`/api/initiatives/objective/${id}`],
    enabled: !!id,
  });

  // Fetch tasks for initiatives
  const { data: tasks = [] } = useQuery<TaskWithInitiative[]>({
    queryKey: [`/api/tasks/objective/${id}`],
    enabled: !!id,
  });

  const getKeyResultTypeIcon = (type: string) => {
    switch (type) {
      case "increase_to":
        return <TrendingUp className="w-4 h-4" />;
      case "decrease_to":
        return <TrendingDown className="w-4 h-4" />;
      case "achieve_or_not":
        return <Target className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getKeyResultTypeTooltip = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Target peningkatan: Progress dihitung berdasarkan peningkatan dari nilai awal ke target";
      case "decrease_to":
        return "Target penurunan: Progress dihitung berdasarkan penurunan dari nilai awal ke target";
      case "achieve_or_not":
        return "Target biner: 100% jika tercapai, 0% jika belum";
      default:
        return type;
    }
  };

  const formatCurrency = (value: string | number, unit: string) => {
    if (unit?.toLowerCase() === 'rp' || unit?.toLowerCase() === 'rupiah') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return `Rp ${numValue.toLocaleString('id-ID')}`;
    }
    return `${value} ${unit || ''}`.trim();
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = baseValue ? parseFloat(baseValue) : 0;
    
    switch (keyResultType) {
      case "increase_to":
        if (targetNum === baseNum) return currentNum >= targetNum ? 100 : 0;
        const increaseProgress = ((currentNum - baseNum) / (targetNum - baseNum)) * 100;
        return Math.min(100, Math.max(0, increaseProgress));
        
      case "decrease_to":
        if (baseNum <= targetNum) return currentNum <= targetNum ? 100 : 0;
        const decreaseProgress = ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
      case "achieve_or_not":
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
    }
  };

  const calculateOverallProgress = (keyResults: KeyResult[]): number => {
    if (!keyResults || keyResults.length === 0) return 0;
    
    const progressSum = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      return sum + progress;
    }, 0);
    
    return Math.round(progressSum / keyResults.length);
  };

  const handleCheckIn = (keyResult: KeyResult) => {
    setCheckInModal({ open: true, keyResult });
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditKeyResultModal({ open: true, keyResult });
  };

  const getOwnerDisplay = () => {
    if (!owner) return "Tidak ada";
    
    if (objective?.ownerType === 'user') {
      const userOwner = owner as User;
      return `${userOwner.firstName || ''} ${userOwner.lastName || ''}`.trim() || userOwner.email;
    } else {
      const teamOwner = owner as Team;
      return teamOwner.name;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTasksByInitiative = (initiativeId: string) => {
    return tasks.filter(task => task.initiativeId === initiativeId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center text-gray-500 mt-2">Memuat objective...</p>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Objective tidak ditemukan</p>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress(objective.keyResults);

  return (
    <div className="p-4 sm:p-6 max-w-full">
      {/* Page Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{objective.title}</h1>
                <ObjectiveStatusBadge status={objective.status} />
              </div>
              {objective.description && (
                <p className="text-gray-600">{objective.description}</p>
              )}
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Objective Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Periode</span>
            </div>
            <p className="font-medium">{cycle?.name || "Tidak ada cycle"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              {objective.ownerType === 'team' ? (
                <Building className="w-4 h-4 text-gray-500" />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm text-gray-500">Owner</span>
            </div>
            <p className="font-medium">{getOwnerDisplay()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Key Results</span>
            </div>
            <p className="font-medium">{objective.keyResults.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Progress Keseluruhan</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{overallProgress}%</p>
              <Progress value={overallProgress} className="flex-1 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="key-results" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="key-results">Key Results ({objective.keyResults.length})</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives ({initiatives.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
        </TabsList>

        {/* Key Results Tab */}
        <TabsContent value="key-results" className="space-y-4">
          {objective.keyResults.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Belum ada key results untuk objective ini
              </CardContent>
            </Card>
          ) : (
            objective.keyResults.map((kr) => {
              const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
              
              return (
                <Card key={kr.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Key Result Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{kr.title}</h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {getKeyResultTypeIcon(kr.keyResultType)}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getKeyResultTypeTooltip(kr.keyResultType)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {kr.description && (
                            <p className="text-sm text-gray-600 mb-3">{kr.description}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckIn(kr)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Check-in
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditKeyResult(kr)}
                            className="text-primary hover:text-blue-700"
                            title="Edit Key Result"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Saat ini: {formatCurrency(kr.currentValue, kr.unit)}</span>
                          <span>Target: {formatCurrency(kr.targetValue, kr.unit)}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <SimpleProgressStatus
                          status={kr.status}
                          progressPercentage={progress}
                          timeProgressPercentage={kr.timeProgressPercentage || 0}
                          dueDate={kr.dueDate ? (typeof kr.dueDate === 'string' ? kr.dueDate : kr.dueDate.toISOString()) : null}
                          startDate={cycle?.startDate || null}
                        />
                        
                        {kr.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Target: {new Date(kr.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Initiatives Tab */}
        <TabsContent value="initiatives" className="space-y-4">
          {initiatives.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Belum ada initiatives untuk objective ini
              </CardContent>
            </Card>
          ) : (
            initiatives.map((initiative) => {
              const initiativeTasks = getTasksByInitiative(initiative.id);
              
              return (
                <Card key={initiative.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/initiatives/${initiative.id}`}>
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {initiative.title}
                            </h3>
                          </Link>
                          {initiative.description && (
                            <p className="text-sm text-gray-600 mt-1">{initiative.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadgeClass(initiative.status)}>
                            {initiative.status === 'not_started' ? 'Belum Mulai' :
                             initiative.status === 'in_progress' ? 'Sedang Berjalan' :
                             initiative.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <Link href={`/initiatives/${initiative.id}`}>
                                <DropdownMenuItem>
                                  <ClipboardList className="w-4 h-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                              </Link>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Initiative Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{initiative.progressPercentage || 0}%</span>
                        </div>
                        <Progress value={initiative.progressPercentage || 0} className="h-2" />
                      </div>

                      {/* Initiative Tasks Summary */}
                      {initiativeTasks.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <CheckSquare className="w-4 h-4 inline-block mr-1" />
                          {initiativeTasks.filter(t => t.status === 'completed').length} dari {initiativeTasks.length} task selesai
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Belum ada tasks untuk objective ini
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {task.initiative && (
                            <Link href={`/initiatives/${task.initiative.id}`}>
                              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                <ClipboardList className="w-3 h-3 inline-block mr-1" />
                                {task.initiative.title}
                              </span>
                            </Link>
                          )}
                          
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge className={getStatusBadgeClass(task.status)}>
                        {task.status === 'not_started' ? 'Belum Mulai' :
                         task.status === 'in_progress' ? 'Sedang Berjalan' :
                         task.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {checkInModal.keyResult && (
        <CheckInModal
          keyResultId={checkInModal.keyResult.id}
          keyResultTitle={checkInModal.keyResult.title}
          currentValue={checkInModal.keyResult.currentValue}
          targetValue={checkInModal.keyResult.targetValue}
          unit={checkInModal.keyResult.unit}
          keyResultType={checkInModal.keyResult.keyResultType}
        />
      )}

      <EditKeyResultModal
        open={editKeyResultModal.open}
        onOpenChange={(open) => setEditKeyResultModal({ open })}
        keyResult={editKeyResultModal.keyResult}
      />
    </div>
  );
}