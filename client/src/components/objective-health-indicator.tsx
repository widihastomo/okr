
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Target
} from "lucide-react";

interface HealthIndicatorProps {
  overallProgress: number;
  daysRemaining?: number;
  totalDays?: number;
  keyResultsCompleted: number;
  totalKeyResults: number;
  tasksCompleted: number;
  totalTasks: number;
}

export default function ObjectiveHealthIndicator({
  overallProgress,
  daysRemaining,
  totalDays = 90,
  keyResultsCompleted,
  totalKeyResults,
  tasksCompleted,
  totalTasks
}: HealthIndicatorProps) {
  
  // Calculate health score
  const calculateHealthScore = (): number => {
    let score = 0;
    
    // Progress component (40% weight)
    score += (overallProgress * 0.4);
    
    // Time component (30% weight)
    if (daysRemaining !== undefined && totalDays > 0) {
      const timeProgress = ((totalDays - daysRemaining) / totalDays) * 100;
      const timeHealthRatio = overallProgress / Math.max(timeProgress, 1);
      score += Math.min(30, timeHealthRatio * 30);
    } else {
      score += 30; // Default if no time constraint
    }
    
    // Completion component (30% weight)
    const completionRate = totalKeyResults > 0 ? (keyResultsCompleted / totalKeyResults) * 100 : 0;
    score += (completionRate * 0.3);
    
    return Math.min(100, Math.max(0, score));
  };

  const healthScore = calculateHealthScore();
  
  const getHealthStatus = (score: number) => {
    if (score >= 85) return { 
      label: 'Sangat Sehat', 
      color: 'text-green-700 bg-green-100', 
      icon: CheckCircle2,
      description: 'Objective berjalan sangat baik dan sesuai target'
    };
    if (score >= 70) return { 
      label: 'Sehat', 
      color: 'text-blue-700 bg-blue-100', 
      icon: TrendingUp,
      description: 'Progress baik, perlu sedikit perhatian'
    };
    if (score >= 50) return { 
      label: 'Perlu Perhatian', 
      color: 'text-yellow-700 bg-yellow-100', 
      icon: AlertTriangle,
      description: 'Ada beberapa area yang perlu diperbaiki'
    };
    if (score >= 30) return { 
      label: 'Berisiko', 
      color: 'text-orange-700 bg-orange-100', 
      icon: TrendingDown,
      description: 'Memerlukan tindakan segera untuk mencapai target'
    };
    return { 
      label: 'Kritis', 
      color: 'text-red-700 bg-red-100', 
      icon: AlertTriangle,
      description: 'Perlu intervensi mendesak dan perubahan strategi'
    };
  };

  const status = getHealthStatus(healthScore);
  const IconComponent = status.icon;

  // Calculate ideal vs actual progress
  const timeElapsed = totalDays && daysRemaining !== undefined ? totalDays - daysRemaining : 0;
  const idealProgress = totalDays > 0 ? (timeElapsed / totalDays) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Health Score Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${status.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Health Score</h3>
                <p className="text-sm text-gray-600">{status.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{Math.round(healthScore)}</div>
              <Badge className={status.color}>
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Visual Health Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Kesehatan Objective</span>
              <span className="text-sm text-gray-500">{Math.round(healthScore)}/100</span>
            </div>
            <div className="relative">
              <Progress value={healthScore} className="h-4" />
              {/* Health zones */}
              <div className="absolute top-0 left-0 w-full h-4 rounded-full overflow-hidden pointer-events-none">
                <div className="absolute left-0 top-0 w-1/5 h-full bg-red-200 opacity-30"></div>
                <div className="absolute left-1/5 top-0 w-1/5 h-full bg-orange-200 opacity-30"></div>
                <div className="absolute left-2/5 top-0 w-1/5 h-full bg-yellow-200 opacity-30"></div>
                <div className="absolute left-3/5 top-0 w-1/5 h-full bg-blue-200 opacity-30"></div>
                <div className="absolute left-4/5 top-0 w-1/5 h-full bg-green-200 opacity-30"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Kritis</span>
              <span>Berisiko</span>
              <span>Perhatian</span>
              <span>Sehat</span>
              <span>Sangat Sehat</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-gray-600">Progress Aktual</div>
              {idealProgress > 0 && (
                <div className="text-xs text-gray-400">
                  Target: {Math.round(idealProgress)}%
                </div>
              )}
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {keyResultsCompleted}/{totalKeyResults}
              </div>
              <div className="text-xs text-gray-600">Key Results</div>
              <div className="text-xs text-gray-400">Selesai</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {tasksCompleted}/{totalTasks}
              </div>
              <div className="text-xs text-gray-600">Tugas</div>
              <div className="text-xs text-gray-400">Selesai</div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Insight Cepat
            </h4>
            <div className="space-y-1 text-sm text-blue-800">
              {overallProgress > idealProgress && (
                <p>✅ Objective berjalan lebih cepat dari jadwal yang direncanakan</p>
              )}
              {overallProgress < idealProgress - 10 && (
                <p>⚠️ Objective tertinggal dari jadwal, perlu percepatan</p>
              )}
              {keyResultsCompleted === totalKeyResults && (
                <p>🎉 Semua Key Results telah tercapai!</p>
              )}
              {daysRemaining && daysRemaining < 7 && overallProgress < 90 && (
                <p>🚨 Waktu tinggal sedikit, fokus pada prioritas utama</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
