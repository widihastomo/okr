import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, Clock, Edit, MoreVertical, Copy, Trash2 } from "lucide-react";
import type { OKRWithKeyResults, KeyResult } from "@shared/schema";
import { Link } from "wouter";
import { CheckInModal } from "./check-in-modal";
import { SimpleProgressStatus } from "./progress-status";
import { ObjectiveStatusBadge } from "./objective-status-badge";

interface OKRCardProps {
  okr: OKRWithKeyResults;
  onEditProgress: (keyResult: KeyResult) => void;
  onRefresh: () => void;
  onKeyResultClick: (keyResultId: string) => void;
  onDuplicate?: (okr: OKRWithKeyResults) => void;
  onDelete?: (okrId: string) => void;
  cycleStartDate?: string;
  cycleEndDate?: string;
}

export default function OKRCard({ okr, onEditProgress, onKeyResultClick, onDuplicate, onDelete, cycleStartDate, cycleEndDate }: OKRCardProps) {
  
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
  
  // Calculate overall progress as average of key results
  const calculateOverallProgress = (keyResults: typeof okr.keyResults): number => {
    if (keyResults.length === 0) return 0;
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      return sum + progress;
    }, 0);
    
    return totalProgress / keyResults.length;
  };
  
  const overallProgress = calculateOverallProgress(okr.keyResults);

  // Calculate days remaining based on cycle end date
  const calculateDaysRemaining = () => {
    const today = new Date();
    
    if (cycleEndDate) {
      const endDate = new Date(cycleEndDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    return null;
  };

  const daysRemaining = calculateDaysRemaining();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'on_track':
        return 'bg-green-500';
      case 'ahead':
        return 'bg-blue-500';
      case 'at_risk':
        return 'bg-yellow-500';
      case 'behind':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'behind':
        return 'Behind';
      default:
        return 'In Progress';
    }
  };

  return (
    <Card className="mb-6 shadow-lg border-0">
      <div className="bg-white text-gray-900 p-6 rounded-t-lg border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link href={`/objective/${okr.id}`}>
              <h3 className="text-xl font-bold mb-2 hover:underline cursor-pointer">
                {okr.title}
              </h3>
            </Link>
            <p className="text-gray-600 mb-4">{okr.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <ObjectiveStatusBadge status={okr.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {okr.owner}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {okr.timeframe}
              </span>
              {daysRemaining !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {daysRemaining > 0 ? `${daysRemaining} hari tersisa` : 'Berakhir'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right mr-4">
              <p className="text-2xl font-semibold text-gray-900">{overallProgress.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Overall Progress</p>
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onDuplicate?.(okr)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplikat
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(okr.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Key Results */}
      <CardContent className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Key Results</h4>
        <div className="space-y-4">
          {okr.keyResults.map((kr) => {
            const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
            const getKeyResultTypeLabel = (type: string) => {
              switch (type) {
                case "increase_to": return "↗ Increase to";
                case "decrease_to": return "↘ Decrease to";
                case "achieve_or_not": return "✓ Achieve";
                default: return type;
              }
            };
            
            return (
              <div key={kr.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button 
                        onClick={() => onKeyResultClick(kr.id)}
                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                      >
                        {kr.title}
                      </button>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {getKeyResultTypeLabel(kr.keyResultType)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{kr.description}</p>
                    <div className="text-xs text-gray-500">
                      {kr.currentValue} / {kr.targetValue} {kr.unit === "percentage" ? "%" : kr.unit === "currency" ? "Rp" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckInModal
                      keyResultId={kr.id}
                      keyResultTitle={kr.title}
                      currentValue={kr.currentValue}
                      targetValue={kr.targetValue}
                      unit={kr.unit}
                      keyResultType={kr.keyResultType}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditProgress(kr)}
                      className="text-primary hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <SimpleProgressStatus
                  status={kr.status}
                  progressPercentage={progress}
                  timeProgressPercentage={kr.timeProgressPercentage || 0}
                  dueDate={kr.dueDate ? (typeof kr.dueDate === 'string' ? kr.dueDate : kr.dueDate.toISOString()) : null}
                  startDate={cycleStartDate}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}