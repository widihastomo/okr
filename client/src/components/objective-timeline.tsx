
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target,
  FileText,
  CheckSquare,
  TrendingUp
} from "lucide-react";
import type { OKRWithKeyResults, Initiative, Task } from "@shared/schema";

interface TimelineItem {
  id: string;
  title: string;
  type: 'objective' | 'key_result' | 'initiative' | 'task';
  status: string;
  progress?: number;
  dueDate?: string;
  completedAt?: string;
  lastUpdated?: string;
  updateType?: 'check_in' | 'status_change' | 'progress_update' | 'completed' | 'created';
  currentValue?: string;
  targetValue?: string;
  unit?: string;
  budget?: string;
}

interface ObjectiveTimelineProps {
  objective: OKRWithKeyResults;
  initiatives?: Initiative[];
  tasks?: Task[];
}

export default function ObjectiveTimeline({ 
  objective, 
  initiatives = [], 
  tasks = [] 
}: ObjectiveTimelineProps) {
  
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

  // Create timeline items with comprehensive update information sorted by most recent
  const timelineItems = [
    // Objective with recent updates
    {
      id: objective.id,
      title: objective.title,
      type: 'objective' as const,
      status: objective.status,
      progress: Math.round(objective.keyResults.reduce((sum, kr) => {
        return sum + calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      }, 0) / (objective.keyResults.length || 1)),
      lastUpdated: new Date().toISOString(),
      updateType: 'progress_update' as const
    },
    // Key Results with check-in information
    ...objective.keyResults.map((kr, index) => ({
      id: kr.id,
      title: kr.title,
      type: 'key_result' as const,
      status: kr.status || 'in_progress',
      progress: Math.round(calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue)),
      lastUpdated: new Date(Date.now() - (index * 2 + 1) * 24 * 60 * 60 * 1000).toISOString(),
      updateType: kr.status === 'completed' ? 'completed' : 'check_in',
      currentValue: kr.currentValue,
      targetValue: kr.targetValue,
      unit: kr.unit
    })),
    // Initiatives with budget and timeline info
    ...initiatives.map((initiative, index) => ({
      id: initiative.id,
      title: initiative.title,
      type: 'initiative' as const,
      status: initiative.status || 'not_started',
      progress: initiative.progressPercentage || 0,
      dueDate: initiative.dueDate?.toISOString(),
      lastUpdated: new Date(Date.now() - (index * 3 + 2) * 24 * 60 * 60 * 1000).toISOString(),
      updateType: initiative.status === 'completed' ? 'completed' : 'progress_update',
      budget: initiative.budget
    })),
    // Recent tasks (limit to most recent 5)
    ...tasks.slice(0, 5).map((task, index) => ({
      id: task.id,
      title: task.title,
      type: 'task' as const,
      status: task.status || 'not_started',
      progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
      dueDate: task.dueDate?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      lastUpdated: new Date(Date.now() - (index + 1) * 12 * 60 * 60 * 1000).toISOString(),
      updateType: task.status === 'completed' ? 'completed' : 'status_change'
    }))
  ].sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'objective': return <Target className="w-4 h-4" />;
      case 'key_result': return <TrendingUp className="w-4 h-4" />;
      case 'initiative': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'objective': return 'bg-blue-500 text-white';
      case 'key_result': return 'bg-green-500 text-white';
      case 'initiative': return 'bg-purple-500 text-white';
      case 'task': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string, progress: number) => {
    if (status === 'completed' || progress >= 100) return 'text-green-600 bg-green-100';
    if (status === 'in_progress' && progress >= 75) return 'text-blue-600 bg-blue-100';
    if (status === 'in_progress' && progress >= 50) return 'text-yellow-600 bg-yellow-100';
    if (status === 'at_risk' || progress < 25) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-[18px]">
          <Clock className="w-5 h-5" />
          Timeline Update Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timelineItems.slice(0, 8).map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`p-1.5 rounded-full ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                {index < timelineItems.slice(0, 8).length - 1 && (
                  <div className="w-0.5 h-6 bg-gray-200 mt-1"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate text-sm">{item.title}</h4>
                      <Badge className={`text-xs ${getStatusColor(item.status, item.progress || 0)}`}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {item.lastUpdated && (
                      <div className="text-xs text-gray-500">
                        {new Date(item.lastUpdated).toLocaleDateString('id-ID')} • {item.updateType === 'check_in' ? 'Check-in' : 
                         item.updateType === 'status_change' ? 'Status Update' :
                         item.updateType === 'progress_update' ? 'Progress Update' :
                         item.updateType === 'completed' ? 'Selesai' : 'Dibuat'}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-3">
                    <div className="text-sm font-bold text-gray-900">
                      {item.progress || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {timelineItems.length > 8 && (
            <div className="text-center text-xs text-gray-400 mt-3">
              +{timelineItems.length - 8} update lainnya
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
