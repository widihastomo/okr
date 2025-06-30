import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, User, Clock, Plus, Target, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { CheckInModal } from "@/components/check-in-modal";
import { SimpleProgressStatus } from "@/components/progress-status";
import type { OKRWithKeyResults, KeyResult, Initiative } from "@shared/schema";

export default function ObjectiveDetail() {
  const { id } = useParams();
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

  return (
    <div className="p-6">
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
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Objective Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Period</span>
            </div>
            <p className="font-medium mt-1">{objective.timeframe}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Owner</span>
            </div>
            <p className="font-medium mt-1">{objective.ownerId || "Unassigned"}</p>
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
            <p className="font-medium mt-1">{Math.round(objective.progress)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
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

          {/* Initiatives */}
          {initiatives.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Initiatives</h2>
              <div className="grid gap-4">
                {initiatives.map((initiative) => (
                  <Card key={initiative.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{initiative.title}</h3>
                          {initiative.description && (
                            <p className="text-sm text-gray-600 mt-1">{initiative.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {initiative.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
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

      {/* Check-in Modal */}
      <CheckInModal
        open={checkInModal.open}
        onOpenChange={(open) => setCheckInModal({ open, keyResult: open ? checkInModal.keyResult : undefined })}
        keyResult={checkInModal.keyResult}
      />
    </div>
  );
}