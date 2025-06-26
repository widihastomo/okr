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
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
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
              <span>{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
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
  compact?: boolean;
}

export function SimpleProgressStatus({ 
  status, 
  progressPercentage, 
  compact = false 
}: SimpleProgressStatusProps) {
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
        <span className="text-xs text-gray-500">
          {progressPercentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge 
        variant="secondary" 
        className={`${config.color} text-white border-0 flex items-center gap-1`}
      >
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
      <div className="flex-1">
        <Progress value={progressPercentage} className="h-2" />
      </div>
      <span className="text-sm font-medium">{progressPercentage}%</span>
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
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
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