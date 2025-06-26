import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Target, TrendingUp, Users, Clock, BarChart3 } from "lucide-react";
import { CheckInModal } from "@/components/check-in-modal";
import { ProgressStatus } from "@/components/progress-status";
import { format } from "date-fns";
import type { KeyResultWithDetails } from "@shared/schema";

export default function KeyResultDetail() {
  const { id } = useParams();
  const keyResultId = parseInt(id || "0");

  const { data: keyResult, isLoading } = useQuery<KeyResultWithDetails>({
    queryKey: [`/api/key-results/${keyResultId}`],
    enabled: !!keyResultId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!keyResult) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Key Result Tidak Ditemukan</h1>
          <p className="text-gray-600">Key result yang Anda cari tidak dapat ditemukan.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const calculateProgress = () => {
    const current = parseFloat(keyResult.currentValue);
    const target = parseFloat(keyResult.targetValue);
    const base = keyResult.baseValue ? parseFloat(keyResult.baseValue) : 0;
    
    switch (keyResult.keyResultType) {
      case "increase_to":
        if (target === 0) return 0;
        return Math.min(100, Math.max(0, (current / target) * 100));
        
      case "decrease_to":
        const baseNum = base || target * 2;
        if (baseNum <= target) return current <= target ? 100 : 0;
        const decreaseProgress = ((baseNum - current) / (baseNum - target)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
      case "achieve_or_not":
        return current >= target ? 100 : 0;
        
      default:
        return 0;
    }
  };

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "currency":
        return "Rp";
      case "number":
      default:
        return "";
    }
  };

  const getKeyResultTypeLabel = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Tingkatkan ke";
      case "decrease_to":
        return "Turunkan ke";
      case "achieve_or_not":
        return "Capai atau tidak";
      default:
        return type;
    }
  };

  const progress = calculateProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{keyResult.title}</h1>
            <p className="text-gray-600 mt-1">{keyResult.description}</p>
          </div>
        </div>
        <CheckInModal
          keyResultId={keyResult.id}
          keyResultTitle={keyResult.title}
          currentValue={keyResult.currentValue}
          targetValue={keyResult.targetValue}
          unit={keyResult.unit}
          keyResultType={keyResult.keyResultType}
        />
      </div>

      {/* Key Result Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Informasi Key Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {keyResult.baseValue && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">
                      {keyResult.baseValue}{getUnitDisplay(keyResult.unit)}
                    </div>
                    <div className="text-sm text-gray-600">Nilai Awal</div>
                  </div>
                )}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {keyResult.currentValue}{getUnitDisplay(keyResult.unit)}
                  </div>
                  <div className="text-sm text-blue-600">Nilai Saat Ini</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {keyResult.targetValue}{getUnitDisplay(keyResult.unit)}
                  </div>
                  <div className="text-sm text-green-600">Target</div>
                </div>
              </div>

              {/* Type & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Tipe:</span>
                    <Badge variant="outline" className="ml-2">
                      {getKeyResultTypeLabel(keyResult.keyResultType)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Unit:</span>
                    <Badge variant="outline" className="ml-2">
                      {keyResult.unit}
                    </Badge>
                  </div>
                </div>
                <ProgressStatus 
                  status={keyResult.status}
                  progressPercentage={progress}
                  timeProgressPercentage={50}
                  recommendation=""
                  lastUpdated={keyResult.lastUpdated ? format(new Date(keyResult.lastUpdated), "dd MMM yyyy") : undefined}
                />
              </div>

              {/* Due Date */}
              {keyResult.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Deadline: {format(new Date(keyResult.dueDate), "dd MMM yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Riwayat Progress
              </CardTitle>
              <CardDescription>
                Histori check-in dan perubahan nilai
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keyResult.progressHistory && keyResult.progressHistory.length > 0 ? (
                <div className="space-y-4">
                  {keyResult.progressHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {entry.value}{getUnitDisplay(keyResult.unit)}
                          </div>
                          {entry.notes && (
                            <div className="text-sm text-gray-600">{entry.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {format(new Date(entry.date), "dd MMM yyyy")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(entry.date), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada riwayat check-in</p>
                  <p className="text-sm">Lakukan check-in pertama untuk melihat progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Check-ins</span>
                <span className="font-medium">
                  {keyResult.progressHistory?.length || 0}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={progress >= 100 ? "default" : progress >= 70 ? "secondary" : "destructive"}>
                  {progress >= 100 ? "Selesai" : progress >= 70 ? "On Track" : "At Risk"}
                </Badge>
              </div>
              {keyResult.confidence !== null && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="font-medium">{keyResult.confidence}/10</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CheckInModal
                keyResultId={keyResult.id}
                keyResultTitle={keyResult.title}
                currentValue={keyResult.currentValue}
                targetValue={keyResult.targetValue}
                unit={keyResult.unit}
                keyResultType={keyResult.keyResultType}
              />
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Lihat Kalender
              </Button>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Share Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}