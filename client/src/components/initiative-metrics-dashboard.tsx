import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  MoveUp, 
  MoveDown, 
  Plus,
  Edit,
  Activity,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumberInput } from "@/lib/number-utils";
import type { SuccessMetricWithUpdates } from "@shared/schema";
import { format } from "date-fns";

interface InitiativeMetricsDashboardProps {
  metrics: SuccessMetricWithUpdates[];
  onAddMetric?: () => void;
  onEditMetric?: (metric: SuccessMetricWithUpdates) => void;
  onUpdateMetric?: (metricId: string) => void;
  className?: string;
}

export function InitiativeMetricsDashboard({
  metrics,
  onAddMetric,
  onEditMetric,
  onUpdateMetric,
  className
}: InitiativeMetricsDashboardProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  const getMetricTypeIcon = (type: string) => {
    switch (type) {
      case "increase_to":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "decrease_to":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "achieve_or_not":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "should_stay_above":
        return <MoveUp className="w-4 h-4 text-orange-600" />;
      case "should_stay_below":
        return <MoveDown className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
      case "on_track":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Sesuai Target</Badge>;
      case "ahead":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Unggul</Badge>;
      case "at_risk":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Berisiko</Badge>;
      case "behind":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Tertinggal</Badge>;
      default:
        return <Badge variant="outline">Belum Dimulai</Badge>;
    }
  };

  const calculateProgress = (metric: SuccessMetricWithUpdates): number => {
    const current = Number(metric.currentValue) || 0;
    const target = Number(metric.targetValue) || 0;
    const base = Number(metric.baseValue) || 0;

    if (metric.type === "achieve_or_not") {
      return current >= target ? 100 : 0;
    }

    if (metric.type === "increase_to" && target > base) {
      return Math.min(Math.max(((current - base) / (target - base)) * 100, 0), 100);
    }

    if (metric.type === "decrease_to" && base > target) {
      return Math.min(Math.max(((base - current) / (base - target)) * 100, 0), 100);
    }

    if (metric.type === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (metric.type === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  const formatValue = (value: string | number, unit: string): string => {
    const numValue = Number(value);
    if (unit === "currency") {
      return `Rp ${formatNumberInput(numValue.toString())}`;
    }
    if (unit === "percentage") {
      return `${numValue}%`;
    }
    return formatNumberInput(numValue.toString());
  };

  const getOverallScore = (): { score: number; status: string } => {
    if (metrics.length === 0) return { score: 0, status: "no_metrics" };
    
    const totalProgress = metrics.reduce((sum, metric) => sum + calculateProgress(metric), 0);
    const avgProgress = totalProgress / metrics.length;
    
    let status = "not_started";
    if (avgProgress >= 100) status = "completed";
    else if (avgProgress >= 80) status = "on_track";
    else if (avgProgress >= 60) status = "at_risk";
    else if (avgProgress > 0) status = "behind";
    
    return { score: avgProgress, status };
  };

  const overallScore = getOverallScore();

  const toggleMetricExpansion = (metricId: string) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(metricId)) {
      newExpanded.delete(metricId);
    } else {
      newExpanded.add(metricId);
    }
    setExpandedMetrics(newExpanded);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Metrik Kesuksesan Inisiatif
            </CardTitle>
            {onAddMetric && (
              <Button onClick={onAddMetric} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Metrik
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{metrics.length}</div>
              <div className="text-sm text-gray-600">Total Metrik</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{overallScore.score.toFixed(1)}%</div>
              <div className="text-sm text-blue-600">Skor Keseluruhan</div>
            </div>
            <div className="flex items-center justify-center">
              {getStatusBadge(overallScore.status)}
            </div>
          </div>
          
          {metrics.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress Keseluruhan</span>
                <span>{overallScore.score.toFixed(1)}%</span>
              </div>
              <Progress value={overallScore.score} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Metrics */}
      {metrics.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Metrik</h3>
            <p className="text-gray-600 mb-4">
              Tambahkan metrik kesuksesan untuk mengukur dampak dan kemajuan inisiatif ini.
            </p>
            {onAddMetric && (
              <Button onClick={onAddMetric} className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Metrik Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {metrics.map((metric) => {
            const progress = calculateProgress(metric);
            const isExpanded = expandedMetrics.has(metric.id);
            
            return (
              <Card key={metric.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getMetricTypeIcon(metric.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{metric.title}</h3>
                          {getStatusBadge(metric.status)}
                        </div>
                        {metric.description && (
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onEditMetric && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditMetric(metric)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {onUpdateMetric && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateMetric(metric.id)}
                        >
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Section */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Values Section */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {metric.baseValue !== null && (
                        <div>
                          <div className="text-gray-600">Nilai Awal</div>
                          <div className="font-medium">{formatValue(metric.baseValue || 0, metric.unit)}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-600">Nilai Saat Ini</div>
                        <div className="font-medium text-blue-600">{formatValue(metric.currentValue || 0, metric.unit)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Target</div>
                        <div className="font-medium text-green-600">{formatValue(metric.targetValue, metric.unit)}</div>
                      </div>
                    </div>

                    {/* Due Date */}
                    {metric.dueDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Target: {metric.dueDate ? format(new Date(metric.dueDate), "dd MMM yyyy") : "Tidak ada"}</span>
                      </div>
                    )}

                    {/* Recent Updates */}
                    {metric.updates && metric.updates.length > 0 && (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMetricExpansion(metric.id)}
                          className="text-gray-600 hover:text-gray-900 p-0 h-auto"
                        >
                          {isExpanded ? "Sembunyikan" : "Lihat"} Riwayat Update ({metric.updates.length})
                        </Button>
                        
                        {isExpanded && (
                          <div className="mt-3 space-y-2 border-t pt-3">
                            {metric.updates.slice(0, 5).map((update) => (
                              <div key={update.id} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="font-medium">{formatValue(update.value, metric.unit)}</span>
                                  {update.notes && (
                                    <span className="text-gray-600 ml-2">• {update.notes}</span>
                                  )}
                                </div>
                                <span className="text-gray-500">
                                  {update.createdAt ? format(new Date(update.createdAt), "dd/MM/yy") : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}