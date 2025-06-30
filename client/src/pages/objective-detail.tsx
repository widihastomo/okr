
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Calendar, User, Clock, Plus, Target, BarChart3, CheckCircle, AlertCircle, Users, FileText, Timer } from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import { EditObjectiveModal } from "@/components/edit-objective-modal";
import { InitiativeModal } from "@/components/initiative-modal";
import type { OKRWithKeyResults, KeyResult, Initiative, User as UserType } from "@shared/schema";

export default function ObjectiveDetail() {
  const { id } = useParams();
  const [checkInModal, setCheckInModal] = useState<{ open: boolean; keyResult?: KeyResult }>({
    open: false
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [selectedKeyResultId, setSelectedKeyResultId] = useState<string | null>(null);
  
  const { data: objective, isLoading } = useQuery<OKRWithKeyResults>({
    queryKey: [`/api/okrs/${id}`],
    enabled: !!id,
  });

  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: [`/api/initiatives/objective/${id}`],
    enabled: !!id,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['/api/teams'],
  });

  // Get owner information
  const getOwnerInfo = () => {
    if (!objective) return { name: "Unknown", type: "user" };
    
    if (objective.ownerType === "team") {
      const team = teams.find(t => t.id === objective.ownerId);
      return { name: team?.name || "Unknown Team", type: "team" };
    } else {
      const user = users.find(u => u.id === objective.ownerId);
      return { 
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown User", 
        type: "user" 
      };
    }
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
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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
      default:
        return status;
    }
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    
    switch (keyResultType) {
      case "increase_to":
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        const baseNum = baseValue && baseValue !== null ? parseFloat(baseValue) : targetNum * 2;
        if (baseNum <= targetNum) return currentNum <= targetNum ? 100 : 0;
        const decreaseProgress = ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
      case "achieve_or_not":
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
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

  const handleCheckIn = (keyResult: KeyResult) => {
    setCheckInModal({ open: true, keyResult });
  };

  const handleAddInitiative = (keyResultId: string) => {
    setSelectedKeyResultId(keyResultId);
    setShowInitiativeModal(true);
  };

  const getInitiativeStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Timer className="w-4 h-4 text-blue-600" />;
      case "at_risk":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "behind":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInitiativesByKeyResult = (keyResultId: string) => {
    return initiatives.filter(initiative => initiative.keyResultId === keyResultId);
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
        <p className="text-center text-gray-500">Objective not found</p>
      </div>
    );
  }

  const ownerInfo = getOwnerInfo();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{objective.title}</h1>
                <Badge className={`${getStatusColor(objective.status)} text-white`}>
                  {getStatusLabel(objective.status)}
                </Badge>
              </div>
              <p className="text-gray-600">{objective.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Objective Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Period</span>
            </div>
            <p className="font-medium mt-1">{objective.timeframe || "Not set"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {ownerInfo.type === "team" ? <Users className="w-4 h-4 text-gray-500" /> : <User className="w-4 h-4 text-gray-500" />}
              <span className="text-sm text-gray-500">Owner</span>
            </div>
            <p className="font-medium mt-1">{ownerInfo.name}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Key Results</span>
            </div>
            <p className="font-medium mt-1">{objective.keyResults.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Overall Progress</span>
            </div>
            <p className="font-medium mt-1">{Math.round(objective.progress || 0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {/* Key Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Key Results</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Key Result
              </Button>
            </div>
            
            {objective.keyResults.length > 0 ? (
              <div className="space-y-4">
                {objective.keyResults.map((keyResult) => {
                  const progress = calculateProgress(
                    keyResult.currentValue,
                    keyResult.targetValue,
                    keyResult.keyResultType,
                    keyResult.baseValue
                  );
                  
                  return (
                    <Card key={keyResult.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium">{keyResult.title}</h3>
                              <Badge variant="outline">
                                {getKeyResultTypeLabel(keyResult.keyResultType)}
                              </Badge>
                              <Badge className={`${getStatusColor(keyResult.status)} text-white`}>
                                {getStatusLabel(keyResult.status)}
                              </Badge>
                            </div>
                            {keyResult.description && (
                              <p className="text-sm text-gray-600 mb-3">{keyResult.description}</p>
                            )}
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress: {keyResult.currentValue} / {keyResult.targetValue} {keyResult.unit}</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                            
                            <div className="mt-3">
                              <SimpleProgressStatus 
                                keyResult={keyResult}
                                startDate={new Date(objective.createdAt || Date.now())}
                                endDate={new Date(objective.createdAt || Date.now())}
                              />
                            </div>

                            {/* Initiatives for this Key Result */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Initiatives</span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAddInitiative(keyResult.id)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Initiative
                                </Button>
                              </div>
                              
                              {getInitiativesByKeyResult(keyResult.id).length > 0 ? (
                                <div className="space-y-2">
                                  {getInitiativesByKeyResult(keyResult.id).map((initiative) => (
                                    <div key={initiative.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div className="flex items-center space-x-2">
                                        {getInitiativeStatusIcon(initiative.status)}
                                        <span className="text-sm">{initiative.title}</span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {initiative.status.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No initiatives yet</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4 flex flex-col space-y-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleCheckIn(keyResult)}
                            >
                              Check In
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No key results yet</h3>
                  <p className="text-gray-500 mb-4">Start by adding key results to measure progress toward this objective.</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Key Result
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Initiatives</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Initiative
              </Button>
            </div>
            
            {initiatives.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Initiative</TableHead>
                      <TableHead>Key Result</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initiatives.map((initiative) => {
                      const keyResult = objective.keyResults.find(kr => kr.id === initiative.keyResultId);
                      return (
                        <TableRow key={initiative.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{initiative.title}</div>
                              {initiative.description && (
                                <div className="text-sm text-gray-500">{initiative.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{keyResult?.title || "Unknown"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getInitiativeStatusIcon(initiative.status)}
                              <Badge variant="outline">
                                {initiative.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={initiative.priority === "high" ? "destructive" : initiative.priority === "medium" ? "default" : "secondary"}>
                              {initiative.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {initiative.dueDate ? new Date(initiative.dueDate).toLocaleDateString() : "No due date"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={initiative.progressPercentage || 0} className="w-16 h-2" />
                              <span className="text-sm">{initiative.progressPercentage || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No initiatives yet</h3>
                  <p className="text-gray-500 mb-4">Create initiatives to break down your key results into actionable projects.</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Initiative
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">No activity history available</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CheckInModal
        open={checkInModal.open}
        onOpenChange={(open) => setCheckInModal({ open, keyResult: open ? checkInModal.keyResult : undefined })}
        keyResult={checkInModal.keyResult}
      />

      {showEditModal && (
        <EditObjectiveModal
          objective={objective}
          trigger={null}
        />
      )}

      {showInitiativeModal && selectedKeyResultId && (
        <InitiativeModal
          keyResultId={selectedKeyResultId}
          onClose={() => {
            setShowInitiativeModal(false);
            setSelectedKeyResultId(null);
          }}
        />
      )}
    </div>
  );
}
