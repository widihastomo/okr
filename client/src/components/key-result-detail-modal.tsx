import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { X, Calendar, Target, TrendingUp, Users, Clock, BarChart3 } from "lucide-react";
import { CheckInModal } from "@/components/check-in-modal";
import InitiativeModal from "@/components/initiative-modal";
import { ProgressStatus } from "@/components/progress-status";
import { format } from "date-fns";
import type { KeyResultWithDetails } from "@shared/schema";

interface KeyResultDetailModalProps {
  keyResultId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function KeyResultDetailModal({ keyResultId, isOpen, onClose }: KeyResultDetailModalProps) {
  const queryClient = useQueryClient();
  
  const { data: keyResult, isLoading } = useQuery<KeyResultWithDetails>({
    queryKey: [`/api/key-results/${keyResultId}`],
    enabled: !!keyResultId && isOpen,
  });

  const { data: initiatives, isLoading: initiativesLoading } = useQuery<any[]>({
    queryKey: [`/api/key-results/${keyResultId}/initiatives`],
    enabled: !!keyResultId && isOpen,
  });

  const handleInitiativeSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/key-results/${keyResultId}/initiatives`]
    });
  };

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "currency":
        return "$";
      case "number":
        return "";
      default:
        return "";
    }
  };

  const calculateProgress = () => {
    if (!keyResult) return 0;
    
    const current = parseFloat(keyResult.currentValue);
    const target = parseFloat(keyResult.targetValue);
    const base = keyResult.baseValue ? parseFloat(keyResult.baseValue) : 0;

    let progress = 0;

    switch (keyResult.keyResultType) {
      case "increase_to":
        // Formula: (Current - Base) / (Target - Base) * 100%
        if (target <= base) {
          progress = 0; // Invalid configuration
        } else {
          progress = ((current - base) / (target - base)) * 100;
          progress = Math.min(100, Math.max(0, progress));
        }
        break;
        
      case "decrease_to":
        // Formula: (Base - Current) / (Base - Target) * 100%
        if (base <= target) {
          progress = 0; // Invalid configuration
        } else {
          progress = ((base - current) / (base - target)) * 100;
          progress = Math.min(100, Math.max(0, progress));
        }
        break;
        
      case "should_stay_above":
        // Binary: 100% if current >= target, 0% otherwise
        progress = current >= target ? 100 : 0;
        break;
        
      case "should_stay_below":
        // Binary: 100% if current <= target, 0% otherwise
        progress = current <= target ? 100 : 0;
        break;
        
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        progress = current >= target ? 100 : 0;
        break;
        
      default:
        progress = 0;
        break;
    }
    
    return progress;
  };

  const getKeyResultTypeLabel = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Naik ke (Increase to)";
      case "decrease_to":
        return "Turun ke (Decrease to)";
      case "should_stay_above":
        return "Harus tetap di atas (Stay Above)";
      case "should_stay_below":
        return "Harus tetap di bawah (Stay Below)";
      case "achieve_or_not":
        return "Ya/Tidak (Achieve or not)";
      default:
        return type;
    }
  };

  if (!isOpen) return null;

  const progress = calculateProgress();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-xl z-[70] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? "Loading..." : keyResult?.title || "Key Result Detail"}
            </h2>
            {keyResult?.description && (
              <p className="text-gray-600 mt-1">{keyResult.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-4"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-full overflow-auto pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading key result details...</p>
              </div>
            </div>
          ) : !keyResult ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Key Result Not Found</h3>
                <p className="text-gray-600">The key result you're looking for doesn't exist.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Action Button */}
              <div className="flex justify-end">
                <CheckInModal
                  keyResultId={keyResult.id}
                  keyResultTitle={keyResult.title}
                  currentValue={keyResult.currentValue}
                  targetValue={keyResult.targetValue}
                  unit={keyResult.unit}
                  keyResultType={keyResult.keyResultType}
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Key Result Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      {/* Values */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {keyResult.baseValue && (
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-700">
                              {keyResult.baseValue}{getUnitDisplay(keyResult.unit)}
                            </div>
                            <div className="text-sm text-gray-600">Base Value</div>
                          </div>
                        )}
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {keyResult.currentValue}{getUnitDisplay(keyResult.unit)}
                          </div>
                          <div className="text-sm text-blue-600">Current Value</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {keyResult.targetValue}{getUnitDisplay(keyResult.unit)}
                          </div>
                          <div className="text-sm text-green-600">Target</div>
                        </div>
                      </div>

                      {/* Type & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Type:</span>
                            <Badge variant="outline" className="ml-2">
                              {getKeyResultTypeLabel(keyResult.keyResultType)}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Unit:</span>
                            <Badge variant="outline" className="ml-2">
                              {keyResult.unit}
                            </Badge>
                          </div>
                        </div>
                        <ProgressStatus 
                          status={keyResult.status}
                          progressPercentage={progress}
                          timeProgressPercentage={50}
                          recommendation=""
                          lastUpdated={keyResult.lastUpdated ? format(new Date(keyResult.lastUpdated), "dd MMM yyyy") : undefined}
                        />
                      </div>


                    </CardContent>
                  </Card>

                  {/* Progress History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Progress History
                      </CardTitle>
                      <CardDescription>
                        Update history and value changes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {keyResult.progressHistory && keyResult.progressHistory.length > 0 ? (
                        <div className="space-y-4">
                          {keyResult.progressHistory.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {entry.value}{getUnitDisplay(keyResult.unit)}
                                  </div>
                                  {entry.notes && (
                                    <div className="text-sm text-gray-600">{entry.notes}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">
                                  {format(new Date(entry.date), "dd MMM yyyy")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(entry.date), "HH:mm")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No update history yet</p>
                          <p className="text-sm">Make your first update to see progress</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Updates</span>
                        <span className="font-medium">
                          {keyResult.progressHistory?.length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <Badge variant={progress >= 100 ? "default" : progress >= 70 ? "secondary" : "destructive"}>
                          {progress >= 100 ? "Completed" : progress >= 70 ? "On Track" : "At Risk"}
                        </Badge>
                      </div>
                      {keyResult.confidence !== null && (
                        <>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Confidence</span>
                            <span className="font-medium">{keyResult.confidence}/10</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Initiatives */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Initiatives
                      </CardTitle>
                      <CardDescription>
                        Strategic actions and projects to achieve this key result
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InitiativeModal keyResultId={keyResult.id} onSuccess={handleInitiativeSuccess} />
                      
                      {initiativesLoading && (
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                      )}
                      
                      {initiatives && initiatives.length > 0 ? (
                        <div className="space-y-3">
                          {initiatives.map((initiative: any) => (
                            <div key={initiative.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{initiative.title}</h4>
                                <Badge 
                                  variant={
                                    initiative.status === 'completed' ? 'default' :
                                    initiative.status === 'in_progress' ? 'secondary' :
                                    initiative.status === 'on_hold' ? 'outline' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {initiative.status === 'not_started' && 'Not Started'}
                                  {initiative.status === 'in_progress' && 'In Progress'}
                                  {initiative.status === 'completed' && 'Completed'}
                                  {initiative.status === 'on_hold' && 'On Hold'}
                                </Badge>
                              </div>
                              {initiative.description && (
                                <p className="text-xs text-gray-600 mb-2">{initiative.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  Priority: {(() => {
                                    // Calculate priority level from score
                                    const score = parseFloat(initiative.priorityScore || "0");
                                    let level: string;
                                    let color: string;
                                    let label: string;
                                    
                                    if (score >= 4.5) {
                                      level = "critical";
                                      color = "bg-red-100 text-red-800";
                                      label = "Kritis";
                                    } else if (score >= 3.5) {
                                      level = "high";
                                      color = "bg-orange-100 text-orange-800";
                                      label = "Tinggi";
                                    } else if (score >= 2.5) {
                                      level = "medium";
                                      color = "bg-yellow-100 text-yellow-800";
                                      label = "Sedang";
                                    } else {
                                      level = "low";
                                      color = "bg-green-100 text-green-800";
                                      label = "Rendah";
                                    }
                                    
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Badge className={`${color} text-xs px-1 py-0`}>
                                          {label}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {score.toFixed(1)}/5.0
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </span>
                                {initiative.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Due: {format(new Date(initiative.dueDate), 'MMM dd, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !initiativesLoading && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No initiatives created yet. Create your first initiative to drive progress on this key result.
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CheckInModal
                        keyResultId={keyResult.id}
                        keyResultTitle={keyResult.title}
                        currentValue={keyResult.currentValue}
                        targetValue={keyResult.targetValue}
                        unit={keyResult.unit}
                        keyResultType={keyResult.keyResultType}
                      />
                      <Button variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Calendar
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Share Progress
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}