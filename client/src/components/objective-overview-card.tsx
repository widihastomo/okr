
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp,
  FileText,
  CheckSquare,
  AlertTriangle,
  Calendar
} from "lucide-react";
import type { OKRWithKeyResults, Initiative, Task } from "@shared/schema";

interface ObjectiveOverviewCardProps {
  objective: OKRWithKeyResults;
  initiatives?: Initiative[];
  tasks?: Task[];
  daysRemaining?: number;
}

export default function ObjectiveOverviewCard({ 
  objective, 
  initiatives = [], 
  tasks = [],
  daysRemaining 
}: ObjectiveOverviewCardProps) {
  // Calculate statistics
  const totalKeyResults = objective.keyResults.length;
  const completedKeyResults = objective.keyResults.filter(kr => {
    const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
    return progress >= 100;
  }).length;

  const totalInitiatives = initiatives.length;
  const completedInitiatives = initiatives.filter(i => i.status === 'completed').length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const overallProgress = calculateOverallProgress(objective.keyResults);

  // Visual indicators
  const getHealthColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 60) return 'text-yellow-600 bg-yellow-100';
    if (progress >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = baseValue ? parseFloat(baseValue) : 0;
    
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
        return 0;
    }
  };

  const calculateOverallProgress = (keyResults: any[]): number => {
    if (!keyResults || keyResults.length === 0) return 0;
    const progressSum = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      return sum + progress;
    }, 0);
    return Math.round(progressSum / keyResults.length);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getHealthColor(overallProgress)}`}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-2">{objective.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{objective.description}</p>
            </div>
          </div>
          <Badge className={getHealthColor(overallProgress)}>
            {overallProgress}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar with Visual Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progress Keseluruhan</span>
            <span className="text-sm text-gray-500">{overallProgress}%</span>
          </div>
          <div className="relative">
            <Progress value={overallProgress} className="h-3" />
            {/* Add milestone markers */}
            <div className="absolute top-0 left-1/4 w-0.5 h-3 bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-gray-300 opacity-50"></div>
            <div className="absolute top-0 left-3/4 w-0.5 h-3 bg-gray-300 opacity-50"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Key Results */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">
              {completedKeyResults}/{totalKeyResults}
            </div>
            <div className="text-xs text-blue-700">Key Results</div>
          </div>

          {/* Initiatives */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {completedInitiatives}/{totalInitiatives}
            </div>
            <div className="text-xs text-green-700">Rencana</div>
          </div>

          {/* Tasks */}
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">
              {completedTasks}/{totalTasks}
            </div>
            <div className="text-xs text-purple-700">Tugas</div>
          </div>
        </div>

        {/* Time & Status Indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              {daysRemaining !== undefined ? (
                daysRemaining > 0 ? `${daysRemaining} hari tersisa` : 'Berakhir'
              ) : 'Tidak ada deadline'}
            </span>
          </div>
          {overallProgress < 50 && daysRemaining && daysRemaining < 30 && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Perlu perhatian</span>
            </div>
          )}
        </div>

        {/* Key Results Mini Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Results Teratas
          </h4>
          <div className="space-y-1">
            {objective.keyResults.slice(0, 2).map((kr) => {
              const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
              return (
                <div key={kr.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 mr-2">{kr.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <span className="text-gray-500 min-w-8">{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })}
            {objective.keyResults.length > 2 && (
              <div className="text-xs text-gray-400 text-center pt-1">
                +{objective.keyResults.length - 2} key results lainnya
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
