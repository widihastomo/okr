
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

  // Create timeline items
  const timelineItems: TimelineItem[] = [
    // Objective
    {
      id: objective.id,
      title: objective.title,
      type: 'objective',
      status: objective.status,
      progress: Math.round(objective.keyResults.reduce((sum, kr) => {
        return sum + calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      }, 0) / (objective.keyResults.length || 1)),
    },
    // Key Results
    ...objective.keyResults.map(kr => ({
      id: kr.id,
      title: kr.title,
      type: 'key_result' as const,
      status: kr.status || 'in_progress',
      progress: Math.round(calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue)),
    })),
    // Initiatives
    ...initiatives.map(initiative => ({
      id: initiative.id,
      title: initiative.title,
      type: 'initiative' as const,
      status: initiative.status || 'not_started',
      progress: initiative.progressPercentage || 0,
      dueDate: initiative.dueDate,
    })),
    // Tasks
    ...tasks.slice(0, 5).map(task => ({
      id: task.id,
      title: task.title,
      type: 'task' as const,
      status: task.status || 'not_started',
      progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
    }))
  ];

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
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Progress Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineItems.map((item, index) => (
            <div key={item.id} className="flex items-start gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                {index < timelineItems.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-1">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(item.status, item.progress || 0)}`}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-900">
                      {item.progress || 0}%
                    </div>
                    {item.dueDate && (
                      <div className="text-xs text-gray-500">
                        Due: {new Date(item.dueDate).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full">
                  <Progress value={item.progress || 0} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
