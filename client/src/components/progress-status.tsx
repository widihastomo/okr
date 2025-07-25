import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  Zap
} from "lucide-react";

interface ProgressStatusProps {
  status: string;
  progressPercentage: number;
  timeProgressPercentage: number;
  recommendation: string;
  lastUpdated?: string;
}

export function ProgressStatus({ 
  status, 
  progressPercentage, 
  timeProgressPercentage, 
  recommendation,
  lastUpdated 
}: ProgressStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'Selesai'
        };
      case 'ahead':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Zap,
          label: 'Lebih Cepat'
        };
      case 'on_track':
        return {
          color: 'bg-green-400',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: Target,
          label: 'Sesuai Target'
        };
      case 'at_risk':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: AlertTriangle,
          label: 'Berisiko'
        };
      case 'behind':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertCircle,
          label: 'Tertinggal'
        };
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: TrendingUp,
          label: 'Dalam Progress'
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.textColor}`} />
            <Badge 
              variant="secondary" 
              className={`${config.color} text-white border-0`}
            >
              {config.label}
            </Badge>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {new Date(lastUpdated).toLocaleDateString('id-ID')}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Progress Capaian</span>
              <span>{(progressPercentage || 0)}%</span>
            </div>
            <Progress 
              value={progressPercentage || 0} 
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Progress Waktu</span>
              <span>{timeProgressPercentage}%</span>
            </div>
            <Progress 
              value={timeProgressPercentage} 
              className="h-2 opacity-60"
            />
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className={`text-sm ${config.textColor} font-medium`}>
              {recommendation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleProgressStatusProps {
  status: string;
  progressPercentage: number;
  timeProgressPercentage?: number;
  compact?: boolean;
  dueDate?: string | null;
  startDate?: string;
  keyResultType?: string;
}

// Calculate ideal progress based on current date and timeline
function calculateIdealProgress(startDate?: string, dueDate?: string | null): number {
  if (!startDate || !dueDate) return 0;
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(dueDate);
  
  if (now <= start) return 0;
  if (now >= end) return 100;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / totalDuration) * 100);
}

export function SimpleProgressStatus({ 
  status, 
  progressPercentage, 
  timeProgressPercentage = 0,
  compact = false,
  dueDate,
  startDate = "2025-07-01", // Q3 2025 start date
  keyResultType = "increase_to"
}: SimpleProgressStatusProps) {
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  
  // Calculate ideal progress based on cycle dates
  const now = new Date();
  const cycleStart = new Date(startDate);
  const cycleEnd = dueDate ? new Date(dueDate) : new Date();
  
  let idealProgress = timeProgressPercentage;
  
  // Adjust ideal progress calculation based on key result type
  switch (keyResultType) {
    case "achieve_or_not":
      // For binary achievements, ideal progress should be 100% only at the end
      if (now > cycleEnd) {
        idealProgress = 100;
      } else {
        idealProgress = 0; // No gradual progress for binary achievements
      }
      break;
      
    case "should_stay_above":
    case "should_stay_below":
      // For threshold types, target is to maintain the level throughout
      // Ideal progress should always be 100% if we're maintaining the threshold
      idealProgress = 100;
      break;
      
    case "increase_to":
    case "decrease_to":
    default:
      // For gradual improvement types, use time-based ideal progress
      if (now > cycleEnd) {
        idealProgress = 100;
      }
      else if (Number(timeProgressPercentage) < 0) {
        idealProgress = 0;
      }
      else {
        idealProgress = Number(timeProgressPercentage) || 0;
      }
      break;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
        {/* Mini progress bar for compact mode */}
        <div className="flex-1 min-w-[60px] relative">
          <div className="w-full bg-gray-200 rounded-full h-2 relative">
            <div 
              className={`h-2 transition-all duration-300 ${
                (progressPercentage || 0) >= 100 ? 'rounded-full' : 'rounded-l-full'
              } ${(() => {
                switch (status) {
                  case 'completed': return 'bg-green-500';
                  case 'ahead': return 'bg-blue-500';
                  case 'on_track': return 'bg-green-400';
                  case 'at_risk': return 'bg-orange-500';
                  case 'behind': return 'bg-red-500';
                  default: return 'bg-gray-400';
                }
              })()}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage || 0))}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-600 font-medium min-w-[2.5rem] text-right">
          {(progressPercentage || 0).toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge 
          variant="secondary" 
          className={`${config.color} text-white border-0 flex items-center gap-1 shrink-0`}
        >
          <StatusIcon className="h-3 w-3" />
          <span className="hidden sm:inline">{config.label}</span>
          <span className="sm:hidden text-xs">{config.label.slice(0, 4)}</span>
        </Badge>
        <div 
          className="flex-1 min-w-0 relative group cursor-pointer"
          title={`Progress: ${(progressPercentage || 0).toFixed(1)}% | ${(() => {
            switch (keyResultType) {
              case "achieve_or_not":
                return now > cycleEnd 
                  ? "Target capaian: 100%"
                  : "Target ideal: 0% (capai di akhir periode)";
              case "should_stay_above":
                return "Target ideal: 100% (pertahankan di atas ambang)";
              case "should_stay_below":
                return "Target ideal: 100% (pertahankan di bawah ambang)";
              default:
                return `Target ideal: ${Number(idealProgress).toFixed(1)}%`;
            }
          })()}`}
        >
          <div className="w-full bg-gray-200 rounded-full h-3 relative">
            <div 
              className={`h-3 transition-all duration-300 ${
                (progressPercentage || 0) >= 100 ? 'rounded-full' : 'rounded-l-full'
              } ${(() => {
                switch (status) {
                  case 'completed': return 'bg-green-500';
                  case 'ahead': return 'bg-blue-500';
                  case 'on_track': return 'bg-green-400';
                  case 'at_risk': return 'bg-orange-500';
                  case 'behind': return 'bg-red-500';
                  default: return 'bg-gray-400';
                }
              })()}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage || 0))}%` }}
            />
            {/* Threshold indicator for ideal progress */}
            <div 
              className="absolute top-0 h-3 w-0.5 bg-gray-400 opacity-70 hover:opacity-100 transition-opacity"
              style={{ left: `${Math.min(idealProgress, 100)}%` }}
            />
          </div>
          {/* Enhanced tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Progress: {(progressPercentage || 0).toFixed(1)}% | {(() => {
              switch (keyResultType) {
                case "achieve_or_not":
                  return now > cycleEnd 
                    ? "Target capaian: 100%"
                    : "Target ideal: 0% (capai di akhir periode)";
                case "should_stay_above":
                  return "Target ideal: 100% (pertahankan di atas ambang)";
                case "should_stay_below":
                  return "Target ideal: 100% (pertahankan di bawah ambang)";
                default:
                  return `Target ideal: ${Number(idealProgress).toFixed(1)}%`;
              }
            })()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
        <span className="text-sm font-medium shrink-0 min-w-[3rem] text-right">{(progressPercentage || 0).toFixed(1)}%</span>
      </div>
      {/* Progress explanation */}
      <div className="mt-2 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <div className={`w-3 h-1 rounded ${(() => {
            switch (status) {
              case 'completed': return 'bg-green-500';
              case 'ahead': return 'bg-blue-500';
              case 'on_track': return 'bg-green-400';
              case 'at_risk': return 'bg-orange-500';
              case 'behind': return 'bg-red-500';
              default: return 'bg-gray-400';
            }
          })()}`}></div>
          <span>Progress saat ini</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-3 bg-gray-400 opacity-70"></div>
          <span className="text-xs">
            {(() => {
              switch (keyResultType) {
                case "achieve_or_not":
                  return now > cycleEnd 
                    ? "Target capaian (100%)"
                    : "Target ideal (0% - capai di akhir periode)";
                    
                case "should_stay_above":
                  return "Target ideal (100% - pertahankan di atas ambang)";
                  
                case "should_stay_below":
                  return "Target ideal (100% - pertahankan di bawah ambang)";
                  
                default:
                  return now > cycleEnd 
                    ? "Target capaian (100%)" 
                    : Number(timeProgressPercentage) < 0 
                      ? "Target ideal (0% - belum dimulai)"
                      : `Target ideal (${Number(idealProgress).toFixed(1)}%)`;
              }
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return {
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        label: 'Selesai'
      };
    case 'ahead':
      return {
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Zap,
        label: 'Lebih Cepat'
      };
    case 'on_track':
      return {
        color: 'bg-green-400',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: Target,
        label: 'Sesuai Target'
      };
    case 'at_risk':
      return {
        color: 'bg-orange-500',
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: AlertTriangle,
        label: 'Berisiko'
      };
    case 'behind':
      return {
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertCircle,
        label: 'Tertinggal'
      };
    default:
      return {
        color: 'bg-gray-400',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: TrendingUp,
        label: 'Dalam Progress'
      };
  }
}