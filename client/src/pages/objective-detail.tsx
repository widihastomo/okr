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
import Sidebar from "@/components/sidebar";

export default function ObjectiveDetail() {
  const { id } = useParams();
  
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
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      case "in_progress":
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
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 pt-16 lg:pt-0">
          <div className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-center text-gray-500 mt-2">Loading objective...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 pt-16 lg:pt-0">
          <div className="p-6">
            <p className="text-center text-gray-500">Objective not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
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
                <p className="text-gray-600 text-sm lg:text-base">{objective.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
          
          {/* Objective Info */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{objective.owner}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{objective.timeframe}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Overall Progress {objective.overallProgress}%</span>
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="progress" className="space-y-6">
              {/* Key Results Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Key Results</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Overall Progress</span>
                    <span className="font-semibold text-lg">{objective.overallProgress}%</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {objective.keyResults.map((kr, index) => {
                    const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
                    return (
                      <div key={kr.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">Key Result {index + 1}</span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                {getKeyResultTypeLabel(kr.keyResultType)}
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{kr.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{kr.description}</p>
                            <div className="text-sm text-gray-500 mb-2">
                              Current progress at {kr.currentValue}%, current progress at {progress.toFixed(0)}%
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>7 days ago</span>
                              <span className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>{progress.toFixed(0)}%</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckInModal
                              keyResultId={kr.id}
                              keyResultTitle={kr.title}
                              currentValue={kr.currentValue}
                              targetValue={kr.targetValue}
                              unit={kr.unit}
                              keyResultType={kr.keyResultType}
                            />
                          </div>
                        </div>
                        <SimpleProgressStatus
                          status={kr.status}
                          progressPercentage={progress}
                        />
                      </div>
                    );
                  })}
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Key Result
                  </Button>
                </CardContent>
              </Card>

              {/* Projects/Initiatives Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Projects</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Overall Progress</span>
                    <span className="font-semibold text-lg">{objective.overallProgress}%</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                          <th className="pb-2">Project Name</th>
                          <th className="pb-2">Relation</th>
                          <th className="pb-2">Leader</th>
                          <th className="pb-2">Deadline</th>
                          <th className="pb-2">Progress</th>
                          <th className="pb-2">Achievement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {initiatives.length > 0 ? initiatives.map((initiative) => (
                          <tr key={initiative.id} className="border-b">
                            <td className="py-3 font-medium">{initiative.title}</td>
                            <td className="py-3 text-sm text-gray-600">Key Result 1</td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                                <span className="text-sm">Taufiq</span>
                              </div>
                            </td>
                            <td className="py-3 text-sm text-red-500">5 Januari 2022</td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm">20%</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm">20%</span>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center space-y-2">
                                <p>No projects found</p>
                                <Button variant="outline" size="sm">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Project
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">History functionality will be implemented here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}