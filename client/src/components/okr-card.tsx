import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, Users, Clock, Edit, MoreVertical, Copy, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, Settings } from "lucide-react";
import type { OKRWithKeyResults, KeyResult } from "@shared/schema";
import { Link } from "wouter";
import { CheckInModal } from "./check-in-modal";
import { SimpleProgressStatus } from "./progress-status";
import { useState } from "react";

import { EditOKRButton } from "./okr-form-modal";

interface OKRCardProps {
  okr: OKRWithKeyResults;
  onEditProgress: (keyResult: KeyResult) => void;
  onEditKeyResult?: (keyResult: KeyResult) => void;
  onRefresh: () => void;
  onDuplicate?: (okr: OKRWithKeyResults) => void;
  onDelete?: (okrId: string) => void;
  cycleStartDate?: string;
  cycleEndDate?: string;
  cycle?: { id: string; name: string; type: string; startDate: string; endDate: string; status: string; description: string | null; };
  index?: number;
}

export default function OKRCard({ okr, onEditProgress, onEditKeyResult, onDuplicate, onDelete, cycleStartDate, cycleEndDate, cycle, index = 0 }: OKRCardProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  
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
    <Card className="mb-3 sm:mb-6 shadow-lg border-0">
      <div className="bg-white text-gray-900 p-3 sm:p-6 rounded-t-lg border-b">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-blue-100 rounded-md transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <Link href={`/objectives/${okr.id}`}>
                  <h3 className="text-lg sm:text-xl font-bold hover:underline cursor-pointer leading-tight">
                    {okr.title}
                  </h3>
                </Link>
                {okr.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{okr.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                {okr.ownerType === 'team' ? (
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-blue-600" />
                  </div>
                ) : (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="" alt={okr.owner} />
                    <AvatarFallback className="text-xs bg-blue-600 text-white">
                      {okr.owner.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {okr.owner}
              </span>
              
              {cycle && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {cycle.name}
                </span>
              )}
              
              {daysRemaining !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {daysRemaining > 0 ? `${daysRemaining} hari tersisa` : 'Berakhir'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex flex-col items-end min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap justify-end">
                {(() => {
                  const getProgressConfig = (status: string) => {
                    switch (status) {
                      case 'on_track':
                        return { bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-500', label: 'On track' };
                      case 'at_risk':
                        return { bgColor: 'bg-orange-100', textColor: 'text-orange-800', dotColor: 'bg-orange-500', label: 'At risk' };
                      case 'behind':
                        return { bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-500', label: 'Behind' };
                      case 'completed':
                        return { bgColor: 'bg-purple-100', textColor: 'text-purple-800', dotColor: 'bg-purple-500', label: 'Completed' };
                      case 'in_progress':
                        return { bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-500', label: 'In progress' };
                      case 'not_started':
                        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500', label: 'Not started' };
                      case 'paused':
                        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', dotColor: 'bg-yellow-500', label: 'Paused' };
                      default:
                        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500', label: 'Unknown' };
                    }
                  };
                  const config = getProgressConfig(okr.status);
                  return (
                    <div className={`flex items-center gap-1 px-2 py-0.5 ${config.bgColor} ${config.textColor} rounded-full text-xs sm:text-sm font-medium whitespace-nowrap`}>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${config.dotColor} rounded-full flex-shrink-0`}></div>
                      <span className="truncate">{config.label}</span>
                    </div>
                  );
                })()}
                <span className="text-base sm:text-lg font-semibold text-gray-900">{overallProgress.toFixed(1)}%</span>
              </div>
              <div 
                className="w-24 sm:w-32 lg:w-40 bg-gray-200 rounded-full h-2 mb-1 relative group cursor-pointer"
                title={(() => {
                  const now = new Date();
                  const cycleStart = cycleStartDate ? new Date(cycleStartDate) : new Date();
                  const cycleEnd = cycleEndDate ? new Date(cycleEndDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  const totalTime = cycleEnd.getTime() - cycleStart.getTime();
                  const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
                  const idealProgress = Math.min(100, (timePassed / totalTime) * 100);
                  return `Progress: ${overallProgress.toFixed(1)}% | Target ideal: ${idealProgress.toFixed(1)}%`;
                })()}
              >
                {(() => {
                  const getProgressBarColor = (status: string) => {
                    switch (status) {
                      case 'on_track': return 'bg-green-500';
                      case 'at_risk': return 'bg-orange-500';
                      case 'behind': return 'bg-red-500';
                      case 'completed': return 'bg-purple-500';
                      case 'in_progress': return 'bg-blue-500';
                      case 'not_started': return 'bg-gray-400';
                      case 'paused': return 'bg-yellow-500';
                      default: return 'bg-gray-400';
                    }
                  };
                  
                  // Calculate ideal progress based on time passed
                  const now = new Date();
                  const cycleStart = cycleStartDate ? new Date(cycleStartDate) : new Date();
                  const cycleEnd = cycleEndDate ? new Date(cycleEndDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  const totalTime = cycleEnd.getTime() - cycleStart.getTime();
                  const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
                  const idealProgress = Math.min(100, (timePassed / totalTime) * 100);
                  
                  return (
                    <>
                      <div 
                        className={`${getProgressBarColor(okr.status)} h-2 transition-all duration-300 ${
                          overallProgress >= 100 ? 'rounded-full' : 'rounded-l-full'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                      ></div>
                      {/* Threshold indicator for ideal progress */}
                      {idealProgress > 0 && idealProgress < 100 && (
                        <div 
                          className="absolute top-0 w-0.5 h-2 bg-gray-600 opacity-70 hover:opacity-100 transition-opacity"
                          style={{ left: `${idealProgress}%` }}
                        ></div>
                      )}
                      {/* Enhanced tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Progress: {overallProgress.toFixed(1)}% | Target ideal: {idealProgress.toFixed(1)}%
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-sm text-gray-500 text-right">Overall Progress</p>
            </div>
            <EditOKRButton okr={okr} />
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
      {isExpanded && (
        <CardContent className="p-3 sm:p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-4">Key Results</h4>
        <div className="space-y-3 sm:space-y-4">
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

            const getKeyResultTypeIcon = (type: string) => {
              switch (type) {
                case "increase_to":
                  return {
                    icon: TrendingUp,
                    tooltip: "Target Peningkatan - Progress dihitung dari nilai awal ke target"
                  };
                case "decrease_to":
                  return {
                    icon: TrendingDown,
                    tooltip: "Target Penurunan - Progress dihitung mundur dari nilai awal ke target"
                  };
                case "achieve_or_not":
                  return {
                    icon: Target,
                    tooltip: "Target Binary - 100% jika tercapai, 0% jika tidak"
                  };
                default:
                  return {
                    icon: Target,
                    tooltip: "Tipe target tidak diketahui"
                  };
              }
            };

            const typeConfig = getKeyResultTypeIcon(kr.keyResultType);
            const IconComponent = typeConfig.icon;
            
            return (
              <div key={kr.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        href={`/key-results/${kr.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                      >
                        {kr.title}
                      </Link>
                      <div className="relative group">
                        <IconComponent 
                          className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help" 
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
                          {typeConfig.tooltip}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{kr.description}</p>
                    <div className="text-xs text-gray-500">
                      {kr.unit === "currency" ? 
                        `Rp ${parseFloat(kr.currentValue).toLocaleString('id-ID')} / Rp ${parseFloat(kr.targetValue).toLocaleString('id-ID')}` : 
                       kr.unit === "percentage" ? `${kr.currentValue}% / ${kr.targetValue}%` :
                       `${kr.currentValue} / ${kr.targetValue}`}
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditProgress(kr)}
                        className="text-primary hover:text-blue-700"
                        title="Edit Progress"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {onEditKeyResult && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditKeyResult(kr)}
                          className="text-gray-600 hover:text-blue-700"
                          title="Edit Key Result"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <SimpleProgressStatus
                    status={kr.status}
                    progressPercentage={progress}
                    timeProgressPercentage={kr.timeProgressPercentage || 0}
                    dueDate={kr.dueDate ? (typeof kr.dueDate === 'string' ? kr.dueDate : kr.dueDate.toISOString()) : null}
                    startDate={cycleStartDate}
                  />
                  {kr.lastCheckIn && (
                    <div className="text-xs text-gray-500 text-right ml-4">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-gray-400">Terakhir update:</span>
                        <span className="text-gray-600">
                          {kr.lastCheckIn.createdAt && new Date(kr.lastCheckIn.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {kr.lastCheckIn.notes && (
                        <div className="relative group">
                          <div 
                            className="text-gray-400 italic text-xs max-w-xs truncate text-right cursor-help"
                          >
                            "{kr.lastCheckIn.notes}"
                          </div>
                          {/* Custom tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 max-w-sm min-w-0 break-words">
                            {kr.lastCheckIn.notes}
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      )}
    </Card>
  );
}