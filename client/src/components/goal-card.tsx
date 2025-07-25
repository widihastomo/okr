import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, User, Users, Clock, Edit, MoreVertical, Copy, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, Settings, MoveUp, MoveDown, Eye } from "lucide-react";
import type { GoalWithKeyResults, KeyResult } from "@shared/schema";
import { Link } from "wouter";
import { CheckInModal } from "./check-in-modal";
import { SimpleProgressStatus } from "./progress-status";
import { useState } from "react";



interface GoalCardProps {
  goal: GoalWithKeyResults;
  onEditProgress: (keyResult: KeyResult) => void;
  onEditKeyResult?: (keyResult: KeyResult) => void;
  onDeleteKeyResult?: (keyResult: KeyResult) => void;
  onRefresh: () => void;
  onDuplicate?: (goal: GoalWithKeyResults) => void;
  onDelete?: (goalId: string) => void;
  onEdit?: (goal: GoalWithKeyResults) => void;
  cycleStartDate?: string;
  cycleEndDate?: string;
  cycle?: { id: string; name: string; type: string; startDate: string; endDate: string; status: string; description: string | null; };
  index?: number;
  users?: any[];
}

export default function GoalCard({ goal, onEditProgress, onEditKeyResult, onDeleteKeyResult, onDuplicate, onDelete, onEdit, cycleStartDate, cycleEndDate, cycle, index = 0, users = [] }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  // Helper function to get user name
  const getUserName = (userId: string): string => {
    if (!users) return userId;
    const user = users.find((u: any) => u.id === userId);
    if (!user) return userId;
    
    // Use consolidated name field
    if (user.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return userId;
  };

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (userId: string): string => {
    if (!users) return userId.charAt(0).toUpperCase();
    const user = users.find((u: any) => u.id === userId);
    if (!user) return userId.charAt(0).toUpperCase();
    
    // Use consolidated name field
    if (user.name && user.name.trim() !== '') {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return userId.charAt(0).toUpperCase();
  };

  // Helper function to get user profile image URL
  const getUserProfileImage = (userId: string): string | undefined => {
    if (!users) return undefined;
    const user = users.find((u: any) => u.id === userId);
    return user?.profileImageUrl || undefined;
  };

  // Helper function to truncate text with character limit (responsive)
  const truncateText = (text: string, maxLength: number, mobileLength?: number) => {
    // Use shorter length for mobile if provided
    const effectiveLength = window.innerWidth < 768 && mobileLength ? mobileLength : maxLength;
    if (text.length <= effectiveLength) return text;
    return text.substring(0, effectiveLength) + "...";
  };
  
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
  const calculateOverallProgress = (keyResults: typeof goal.keyResults): number => {
    if (keyResults.length === 0) return 0;
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      const progress = calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
      return sum + progress;
    }, 0);
    
    return totalProgress / keyResults.length;
  };
  
  const overallProgress = calculateOverallProgress(goal.keyResults);

  // Calculate ideal progress based on key result types and time
  const calculateIdealProgress = (keyResults: typeof goal.keyResults): number => {
    if (keyResults.length === 0) return 0;
    
    const now = new Date();
    const cycleStart = cycleStartDate ? new Date(cycleStartDate) : new Date();
    const cycleEnd = cycleEndDate ? new Date(cycleEndDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const totalTime = cycleEnd.getTime() - cycleStart.getTime();
    const timePassed = Math.max(0, now.getTime() - cycleStart.getTime());
    const timeProgressRatio = Math.min(1, timePassed / totalTime);
    
    const totalIdealProgress = keyResults.reduce((sum, kr) => {
      switch (kr.keyResultType) {
        case "increase_to":
        case "decrease_to":
          // Linear progress based on time: 0% at start, 100% at end
          return sum + (timeProgressRatio * 100);
        
        case "achieve_or_not":
          // Binary achievement: 0% until near end (last 20% of time), then 100%
          return sum + (timeProgressRatio > 0.8 ? 100 : 0);
        
        case "should_stay_above":
        case "should_stay_below":
          // Consistency target: should be 100% throughout the entire period
          return sum + 100;
        
        default:
          return sum + (timeProgressRatio * 100);
      }
    }, 0);
    
    return totalIdealProgress / keyResults.length;
  };

  const idealProgress = calculateIdealProgress(goal.keyResults);

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
      <div className="bg-white text-gray-900 p-3 sm:p-6 rounded-t-lg border-b relative">
        {/* Three-dot menu positioned at top right corner on desktop */}
        <div className="hidden sm:block absolute top-3 right-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/objectives/${goal.id}`} className="flex items-center w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(goal)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplikat
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(goal.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                data-tour="goals-expand-card"
              >
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/objectives/${goal.id}`}>
                            <h3 className="text-lg sm:text-xl font-bold hover:underline cursor-pointer leading-tight truncate max-w-full cursor-help">
                              {truncateText(goal.title, 50, 30)}
                            </h3>
                          </Link>
                        </TooltipTrigger>
                        {goal.title.length > (window.innerWidth < 768 ? 30 : 50) && (
                          <TooltipContent className="max-w-xs">
                            <p>{goal.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {goal.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate max-w-full cursor-help">
                              {truncateText(goal.description, 60, 40)}
                            </p>
                          </TooltipTrigger>
                          {goal.description.length > (window.innerWidth < 768 ? 40 : 60) && (
                            <TooltipContent className="max-w-sm">
                              <p>{goal.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {/* Three-dot menu positioned next to title - Mobile only */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/objectives/${goal.id}`} className="flex items-center w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Goal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate?.(goal)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplikat
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(goal.id)}
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
            </div>
          </div>
          
          {/* Progress and Menu - Desktop */}
          <div className="hidden sm:flex items-start gap-2 sm:gap-3 pr-10">
            <div className="flex flex-col items-end min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap justify-end">
                {(() => {
                  const getProgressConfig = (status: string) => {
                    switch (status) {
                      case 'on_track':
                        return { bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-500', label: 'Sesuai Target' };
                      case 'at_risk':
                        return { bgColor: 'bg-orange-100', textColor: 'text-orange-800', dotColor: 'bg-orange-500', label: 'Berisiko' };
                      case 'behind':
                        return { bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-500', label: 'Tertinggal' };
                      case 'completed':
                        return { bgColor: 'bg-purple-100', textColor: 'text-purple-800', dotColor: 'bg-purple-500', label: 'Selesai' };
                      case 'in_progress':
                        return { bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-500', label: 'Sedang Berjalan' };
                      case 'not_started':
                        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500', label: 'Belum Mulai' };
                      case 'paused':
                        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', dotColor: 'bg-yellow-500', label: 'Ditunda' };
                      default:
                        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500', label: 'Tidak Diketahui' };
                    }
                  };
                  const config = getProgressConfig(goal.status);
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
                title={`Progres: ${overallProgress.toFixed(1)}% | Target ideal: ${idealProgress.toFixed(1)}%`}
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
                  
                  // Use pre-calculated ideal progress
                  
                  return (
                    <>
                      <div 
                        className={`${getProgressBarColor(goal.status)} h-2 transition-all duration-300 ${
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
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Progres: {overallProgress.toFixed(1)}% | Target ideal: {idealProgress.toFixed(1)}%
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-black"></div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Full width container for owner, date, and remaining days on all screens */}
        <div className="w-full flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-2">
          <span className="flex items-center gap-2">
            {goal.ownerType === 'team' ? (
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 text-blue-600" />
              </div>
            ) : (
              <Avatar className="w-6 h-6">
                <AvatarImage src={getUserProfileImage(goal.ownerId || goal.owner)} alt={goal.owner} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                  {getUserInitials(goal.ownerId || goal.owner)}
                </AvatarFallback>
              </Avatar>
            )}
            {goal.ownerType === 'team' ? goal.owner : getUserName(goal.ownerId || goal.owner)}
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
        
        {/* Mobile Progress and Menu */}
        <div className="sm:hidden flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {(() => {
              const getProgressConfig = (status: string) => {
                switch (status) {
                  case 'on_track':
                    return { bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-500', label: 'Sesuai Target' };
                  case 'at_risk':
                    return { bgColor: 'bg-orange-100', textColor: 'text-orange-800', dotColor: 'bg-orange-500', label: 'Berisiko' };
                  case 'behind':
                    return { bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-500', label: 'Tertinggal' };
                  case 'completed':
                    return { bgColor: 'bg-purple-100', textColor: 'text-purple-800', dotColor: 'bg-purple-500', label: 'Selesai' };
                  case 'in_progress':
                    return { bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-500', label: 'Sedang Berjalan' };
                  case 'not_started':
                    return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500', label: 'Belum Mulai' };
                  case 'paused':
                    return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', dotColor: 'bg-yellow-500', label: 'Ditunda' };
                  default:
                    return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500', label: 'Tidak Diketahui' };
                }
              };
              const config = getProgressConfig(goal.status);
              return (
                <div className={`flex items-center gap-1 px-2 py-0.5 ${config.bgColor} ${config.textColor} rounded-full text-xs font-medium whitespace-nowrap`}>
                  <div className={`w-1.5 h-1.5 ${config.dotColor} rounded-full flex-shrink-0`}></div>
                  <span className="truncate">{config.label}</span>
                </div>
              );
            })()}
            <span className="text-base font-semibold text-gray-900">{overallProgress.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-24 bg-gray-200 rounded-full h-2 relative group cursor-pointer"
              title={`Progres: ${overallProgress.toFixed(1)}% | Target ideal: ${idealProgress.toFixed(1)}%`}
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
                
                return (
                  <>
                    <div 
                      className={`${getProgressBarColor(goal.status)} h-2 transition-all duration-300 ${
                        overallProgress >= 100 ? 'rounded-full' : 'rounded-l-full'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                    ></div>
                    {/* Threshold indicator for ideal progress */}
                    {idealProgress > 0 && idealProgress < 100 && (
                      <div 
                        className="absolute top-0 w-0.5 h-2 bg-gray-600 opacity-70"
                        style={{ left: `${idealProgress}%` }}
                      ></div>
                    )}
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      </div>

      {/* Angka Target */}
      {isExpanded && (
        <CardContent className="p-3 sm:p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-4">Angka Target</h4>
        <div className="space-y-3 sm:space-y-4">
          {goal.keyResults.map((kr) => {
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
                case "should_stay_above":
                  return {
                    icon: MoveUp,
                    tooltip: "Tetap Di Atas - Nilai harus tetap berada di atas ambang batas target"
                  };
                case "should_stay_below":
                  return {
                    icon: MoveDown,
                    tooltip: "Tetap Di Bawah - Nilai harus tetap berada di bawah ambang batas target"
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
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                          {typeConfig.tooltip}
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-black"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{kr.description}</p>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        // Handle achieve_or_not type
                        if (kr.keyResultType === 'achieve_or_not') {
                          return progress >= 100 ? 'Status: Tercapai' : 'Status: Belum tercapai';
                        }
                        
                        // Handle should_stay types  
                        if (kr.keyResultType === 'should_stay_above' || kr.keyResultType === 'should_stay_below') {
                          const currentVal = parseFloat(kr.currentValue);
                          const targetVal = parseFloat(kr.targetValue);
                          const unitDisplay = kr.unit === 'Rp' ? 'Rp ' : kr.unit === '%' ? '' : '';
                          const unitSuffix = kr.unit === '%' ? '%' : '';
                          
                          return `Saat ini: ${unitDisplay}${currentVal.toLocaleString('id-ID')}${unitSuffix} | Threshold: ${unitDisplay}${targetVal.toLocaleString('id-ID')}${unitSuffix}`;
                        }
                        
                        // Handle increase_to and decrease_to types
                        const currentVal = parseFloat(kr.currentValue);
                        const targetVal = parseFloat(kr.targetValue);
                        const baseVal = kr.baseValue ? parseFloat(kr.baseValue) : 0;
                        
                        // For decrease_to, show baseline → target (achievement: current)
                        // For increase_to, show current → target (dari baseline)
                        if (kr.keyResultType === 'decrease_to') {
                          if (kr.unit === 'Rp') {
                            return `Rp ${baseVal.toLocaleString('id-ID')} → Rp ${targetVal.toLocaleString('id-ID')} (capaian: Rp ${currentVal.toLocaleString('id-ID')})`;
                          } else if (kr.unit === '%') {
                            return `${baseVal.toLocaleString('id-ID')}% → ${targetVal.toLocaleString('id-ID')}% (capaian: ${currentVal.toLocaleString('id-ID')}%)`;
                          } else {
                            return `${baseVal.toLocaleString('id-ID')} → ${targetVal.toLocaleString('id-ID')} ${kr.unit || ''} (capaian: ${currentVal.toLocaleString('id-ID')})`;
                          }
                        } else {
                          // increase_to type
                          if (kr.unit === 'Rp') {
                            return `Rp ${baseVal.toLocaleString('id-ID')} → Rp ${targetVal.toLocaleString('id-ID')} (capaian: Rp ${currentVal.toLocaleString('id-ID')})`;
                          } else if (kr.unit === '%') {
                            return `${baseVal.toLocaleString('id-ID')}% → ${targetVal.toLocaleString('id-ID')}% (capaian: ${currentVal.toLocaleString('id-ID')}%)`;
                          } else {
                            return `${baseVal.toLocaleString('id-ID')} → ${targetVal.toLocaleString('id-ID')} ${kr.unit || ''} (capaian: ${currentVal.toLocaleString('id-ID')})`;
                          }
                        }
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckInModal
                      keyResultId={kr.id}
                      keyResultTitle={kr.title}
                      currentValue={kr.currentValue}
                      targetValue={kr.targetValue}
                      unit={kr.unit}
                      keyResultType={kr.keyResultType}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => window.location.href = `/key-results/${kr.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        {onEditKeyResult && (
                          <DropdownMenuItem onClick={() => onEditKeyResult(kr)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Angka Target
                          </DropdownMenuItem>
                        )}
                        {onDeleteKeyResult && (
                          <DropdownMenuItem 
                            onClick={() => onDeleteKeyResult(kr)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Angka Target
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Mobile: Vertical layout, Desktop: Horizontal layout */}
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                  <div className="w-full sm:flex-1 sm:mr-4">
                    {/* Mobile: Use compact mode, Desktop: Use full progress bar */}
                    <div className="block sm:hidden">
                      <SimpleProgressStatus
                        status={kr.status}
                        progressPercentage={progress}
                        timeProgressPercentage={kr.timeProgressPercentage || 0}
                        dueDate={null}
                        startDate={cycleStartDate}
                        compact={true}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <SimpleProgressStatus
                        status={kr.status}
                        progressPercentage={progress}
                        timeProgressPercentage={kr.timeProgressPercentage || 0}
                        dueDate={null}
                        startDate={cycleStartDate}
                        compact={false}
                      />
                    </div>
                  </div>
                  {kr.lastCheckIn && (
                    <div className="text-xs text-gray-500 sm:text-right sm:ml-4 sm:shrink-0">
                      <div className="flex items-center gap-1 sm:justify-end">
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
                        <div className="relative group mt-1">
                          <div 
                            className="text-gray-400 italic text-xs max-w-xs truncate sm:text-right cursor-help"
                          >
                            "{kr.lastCheckIn.notes}"
                          </div>
                          {/* Custom tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-sm min-w-0 break-words">
                            {kr.lastCheckIn.notes}
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Assignee information - Bottom of key result */}
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  {/* Assignee - Left */}
                  <div className="relative group text-xs text-gray-600 flex items-center gap-2">
                    {kr.assignedTo ? (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarImage 
                            src={getUserProfileImage(kr.assignedTo)} 
                            alt={getUserName(kr.assignedTo)}
                          />
                          <AvatarFallback className="bg-blue-500 text-white text-xs font-medium cursor-help">
                            {getUserInitials(kr.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-800">
                          {getUserName(kr.assignedTo)}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center cursor-help">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-gray-500 italic">Belum ditentukan</span>
                      </>
                    )}
                    
                    {/* Tooltip for assignee info */}
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      {kr.assignedTo 
                        ? `Penanggung jawab: ${getUserName(kr.assignedTo)} - Bertanggung jawab untuk memantau dan melaporkan progress angka target ini`
                        : "Belum ada penanggung jawab - Assign seseorang untuk memantau progress angka target ini"
                      }
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                    </div>
                  </div>

                  {/* Initiative count - Right */}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{kr.relatedInitiatives?.length || 0} rencana</span>
                  </div>
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