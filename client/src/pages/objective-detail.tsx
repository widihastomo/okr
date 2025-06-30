
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Edit, Calendar, User, Clock, Plus, Target, BarChart3, Users, AlertCircle, CheckCircle, TrendingUp, Activity } from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { EditOKRButton } from "@/components/okr-form-modal";
import type { OKRWithKeyResults, KeyResult, Initiative } from "@shared/schema";

export default function ObjectiveDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [checkInModal, setCheckInModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });
  
  const { data: objective, isLoading } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/okrs/${id}`],
    enabled: !!id,
  });

  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: [`/api/initiatives/objective/${id}`],
    enabled: !!id,
  });

  // Fetch cycle data for better context
  const { data: cycle } = useQuery<any>({
    queryKey: [`/api/cycles/${objective?.cycleId}`],
    enabled: !!objective?.cycleId,
  });

  // Fetch users for name lookup
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const getUserName = (userId: string) => {
    if (!userId || !users) return 'Unknown User';
    const user = users.find((u: any) => u.id === userId);
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserInitials = (userId: string) => {
    if (!userId || !users) return 'U';
    const user = users.find((u: any) => u.id === userId);
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-500";
      case "at_risk":
        return "bg-yellow-500";
      case "behind":
        return "bg-red-500";
      case "completed":
        return "bg-purple-500";
      case "in_progress":
        return "bg-blue-500";
      case "not_started":
        return "bg-gray-500";
      case "paused":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_track":
        return "On Track";
      case "at_risk":
        return "At Risk";
      case "behind":
        return "Behind";
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "not_started":
        return "Not Started";
      case "paused":
        return "Paused";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "on_track":
        return <TrendingUp className="w-4 h-4" />;
      case "at_risk":
        return <AlertCircle className="w-4 h-4" />;
      case "behind":
        return <AlertCircle className="w-4 h-4" />;
      case "in_progress":
        return <Activity className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = parseFloat(baseValue || "0") || 0;

    switch (keyResultType) {
      case "increase_to":
        if (targetNum <= baseNum) return 0;
        return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
      
      case "decrease_to":
        if (baseNum <= targetNum) return 0;
        return Math.min(100, Math.max(0, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
      
      case "achieve_or_not":
        return currentNum >= targetNum ? 100 : 0;
      
      default:
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
    }
  };

  const getKeyResultTypeLabel = (type: string) => {
    switch (type) {
      case "increase_to": return "↗ Increase to";
      case "decrease_to": return "↘ Decrease to";
      case "achieve_or_not": return "✓ Achieve";
      default: return type;
    }
  };

  // Calculate overall progress as average of key results
  const calculateOverallProgress = (keyResults: typeof objective?.keyResults): number => {
    if (!keyResults || keyResults.length === 0) return 0;
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      return sum + progress;
    }, 0);
    
    return totalProgress / keyResults.length;
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!cycle) return null;
    
    const today = new Date();
    const endDate = new Date(cycle.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCheckIn = (keyResult: KeyResult) => {
    setCheckInModal({ open: true, keyResult });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center text-gray-500 mt-2">Loading objective...</p>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="p-6">
        <Card className="text-center p-8">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Objective tidak ditemukan</h3>
            <p className="text-gray-500">Objective yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress(objective.keyResults);
  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard?tab=objectives" className="hover:text-gray-700">Objectives</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{objective.title}</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center gap-2 px-3 py-1 ${
                  objective.status === 'on_track' ? 'bg-green-100 text-green-800' :
                  objective.status === 'at_risk' ? 'bg-orange-100 text-orange-800' :
                  objective.status === 'behind' ? 'bg-red-100 text-red-800' :
                  objective.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  objective.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                } rounded-full text-sm font-medium`}>
                  {getStatusIcon(objective.status)}
                  {getStatusLabel(objective.status)}
                </div>
                <span className="text-2xl font-bold text-gray-900">{overallProgress.toFixed(1)}%</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{objective.title}</h1>
            {objective.description && (
              <p className="text-lg text-gray-600 mb-4">{objective.description}</p>
            )}
            
            {/* Progress Bar */}
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium">{overallProgress.toFixed(1)}%</span>
              </div>
              <div className="relative">
                <Progress value={overallProgress} className="h-3" />
                {cycle && (() => {
                  const now = new Date();
                  const cycleStart = new Date(cycle.startDate);
                  const cycleEnd = new Date(cycle.endDate);
                  const totalTime = cycleEnd.getTime() - cycleStart.getTime();
                  const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
                  const idealProgress = Math.min(100, (timePassed / totalTime) * 100);
                  
                  return idealProgress > 0 && idealProgress < 100 && (
                    <div 
                      className="absolute top-0 w-0.5 h-3 bg-gray-600 opacity-70"
                      style={{ left: `${idealProgress}%` }}
                      title={`Target ideal: ${idealProgress.toFixed(1)}%`}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <EditOKRButton okr={objective} />
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Period</p>
                <p className="text-lg font-semibold">{cycle?.name || objective.timeframe}</p>
                {daysRemaining !== null && (
                  <p className="text-sm text-gray-500">
                    {daysRemaining > 0 ? `${daysRemaining} hari tersisa` : 'Berakhir'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                {objective.ownerType === 'team' ? (
                  <Users className="w-5 h-5 text-green-600" />
                ) : (
                  <User className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Owner</p>
                <div className="flex items-center space-x-2">
                  {objective.ownerType === 'individual' && objective.ownerId && (
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-blue-600 text-white">
                        {getUserInitials(objective.ownerId)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <p className="text-lg font-semibold">
                    {objective.ownerType === 'individual' && objective.ownerId 
                      ? getUserName(objective.ownerId)
                      : objective.owner || "Unassigned"
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Key Results</p>
                <p className="text-lg font-semibold">{objective.keyResults.length}</p>
                <p className="text-sm text-gray-500">
                  {objective.keyResults.filter(kr => {
                    const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
                    return progress >= 100;
                  }).length} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Initiatives</p>
                <p className="text-lg font-semibold">{initiatives.length}</p>
                <p className="text-sm text-gray-500">
                  {initiatives.filter(i => i.status === 'completed').length} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progress & Key Results</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
          <TabsTrigger value="history">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {/* Key Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Key Results</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Key Result
              </Button>
            </div>
            
            {objective.keyResults.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Key Results</h3>
                  <p className="text-gray-500 mb-4">Add key results to track progress towards this objective.</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Key Result
                  </Button>
                </CardContent>
              </Card>
            ) : (
              objective.keyResults.map((keyResult) => {
                const progress = calculateProgress(
                  keyResult.currentValue,
                  keyResult.targetValue,
                  keyResult.keyResultType,
                  keyResult.baseValue
                );
                
                return (
                  <Card key={keyResult.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Link 
                              href={`/key-results/${keyResult.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                            >
                              {keyResult.title}
                            </Link>
                            <Badge variant="outline" className="text-xs">
                              {getKeyResultTypeLabel(keyResult.keyResultType)}
                            </Badge>
                          </div>
                          {keyResult.description && (
                            <p className="text-sm text-gray-600 mb-3">{keyResult.description}</p>
                          )}
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Progress: {keyResult.unit === "currency" ? 
                                  `Rp ${parseFloat(keyResult.currentValue).toLocaleString('id-ID')} / Rp ${parseFloat(keyResult.targetValue).toLocaleString('id-ID')}` : 
                                 keyResult.unit === "percentage" ? `${keyResult.currentValue}% / ${keyResult.targetValue}%` :
                                 `${keyResult.currentValue} / ${keyResult.targetValue} ${keyResult.unit}`}
                              </span>
                              <span className="font-semibold">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          
                          <div className="mt-4">
                            <SimpleProgressStatus
                              status={keyResult.status}
                              progressPercentage={progress}
                              timeProgressPercentage={keyResult.timeProgressPercentage || 0}
                              dueDate={keyResult.dueDate ? (typeof keyResult.dueDate === 'string' ? keyResult.dueDate : keyResult.dueDate.toISOString()) : null}
                              startDate={cycle?.startDate}
                            />
                          </div>

                          {keyResult.lastCheckIn && (
                            <div className="mt-3 text-sm text-gray-500">
                              <span className="font-medium">Last update:</span> {new Date(keyResult.lastCheckIn.createdAt || '').toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                              {keyResult.lastCheckIn.notes && (
                                <div className="text-xs text-gray-400 italic mt-1">
                                  "{keyResult.lastCheckIn.notes}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6 flex flex-col space-y-2">
                          <CheckInModal
                            keyResultId={keyResult.id}
                            keyResultTitle={keyResult.title}
                            currentValue={keyResult.currentValue}
                            targetValue={keyResult.targetValue}
                            unit={keyResult.unit}
                            keyResultType={keyResult.keyResultType}
                          />
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Initiatives</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Initiative
              </Button>
            </div>
            
            {initiatives.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Initiatives</h3>
                  <p className="text-gray-500 mb-4">Create initiatives to track the specific actions needed to achieve your key results.</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Initiative
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {initiatives.map((initiative) => (
                  <Card key={initiative.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Link 
                              href={`/initiatives/${initiative.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                            >
                              {initiative.title}
                            </Link>
                            <Badge variant="outline" className={`text-xs ${
                              initiative.status === 'completed' ? 'bg-green-100 text-green-800' :
                              initiative.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              initiative.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {initiative.status}
                            </Badge>
                          </div>
                          {initiative.description && (
                            <p className="text-sm text-gray-600 mb-3">{initiative.description}</p>
                          )}
                          
                          {initiative.dueDate && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {new Date(initiative.dueDate).toLocaleDateString('id-ID')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Activity History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                <p className="text-gray-500">Activity history will appear here as you and your team make progress on this objective.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Check-in Modal */}
      <CheckInModal
        open={checkInModal.open}
        onOpenChange={(open) => setCheckInModal({ open, keyResult: open ? checkInModal.keyResult : undefined })}
        keyResult={checkInModal.keyResult}
      />
    </div>
  );
}
