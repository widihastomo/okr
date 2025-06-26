import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Clock, Edit, MoreVertical } from "lucide-react";
import type { OKRWithKeyResults, KeyResult } from "@shared/schema";

interface OKRCardProps {
  okr: OKRWithKeyResults;
  onEditProgress: (keyResult: KeyResult) => void;
  onRefresh: () => void;
}

export default function OKRCard({ okr, onEditProgress }: OKRCardProps) {
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

  const calculateProgress = (current: string, target: string, keyResultType: string, baseline?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    
    switch (keyResultType) {
      case "increase_to":
        // Progress = (current / target) * 100, capped at 100%
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        // Progress toward desired decrease from baseline to target
        const baselineNum = baseline && baseline !== null ? parseFloat(baseline) : targetNum * 2;
        if (baselineNum <= targetNum) return currentNum <= targetNum ? 100 : 0;
        if (currentNum >= baselineNum) return 0;
        if (currentNum <= targetNum) return 100;
        return Math.max(0, Math.min(100, ((baselineNum - currentNum) / (baselineNum - targetNum)) * 100));
        
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden">
      {/* Objective Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{okr.title}</h3>
              <Badge className={`${getStatusColor(okr.status)} text-white`}>
                {getStatusLabel(okr.status)}
              </Badge>
            </div>
            <p className="text-gray-600 mb-4">{okr.description}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{okr.timeframe}</span>
              </span>
              <span className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{okr.owner}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>45 days remaining</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right mr-4">
              <p className="text-2xl font-semibold text-gray-900">{okr.overallProgress}%</p>
              <p className="text-sm text-gray-500">Overall Progress</p>
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Key Results */}
      <CardContent className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Key Results</h4>
        <div className="space-y-4">
          {okr.keyResults.map((kr) => {
            const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baselineValue);
            const getKeyResultTypeLabel = (type: string) => {
              switch (type) {
                case "increase_to": return "↗ Increase to";
                case "decrease_to": return "↘ Decrease to";
                case "achieve_or_not": return "✓ Achieve";
                default: return type;
              }
            };
            
            return (
              <div key={kr.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{kr.title}</p>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {getKeyResultTypeLabel(kr.keyResultType)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{kr.description}</p>
                  <div className="flex items-center space-x-3">
                    <Progress value={progress} className="flex-1" />
                    <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditProgress(kr)}
                    className="text-primary hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Badge className={`${getStatusColor(kr.status)} text-white`}>
                    {getStatusLabel(kr.status)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
