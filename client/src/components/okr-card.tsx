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
  // Calculate days remaining based on cycle end date
  const calculateDaysRemaining = () => {
    const today = new Date();
    
    // Use cycle end date if available
    if (cycleEndDate) {
      const endDate = new Date(cycleEndDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        return "Due today";
      } else {
        return `${diffDays} days remaining`;
      }
    }
    
    // Fallback: if no cycle end date, return message
    return "No cycle end date";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'on_track':
        return 'bg-green-400';
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

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    
    switch (keyResultType) {
      case "increase_to":
        // Progress = (current / target) * 100, capped at 100%
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        // Progress = ((Base Value - Current) / (Base Value - Target)) * 100%
        const baseNum = baseValue && baseValue !== null ? parseFloat(baseValue) : targetNum * 2; // Default base value if not provided
        if (baseNum <= targetNum) return currentNum <= targetNum ? 100 : 0; // Invalid base value case
        const decreaseProgress = ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
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
              <Link href={`/objectives/${okr.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer">
                  {okr.title}
                </h3>
              </Link>
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
                <span>{calculateDaysRemaining()}</span>
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
