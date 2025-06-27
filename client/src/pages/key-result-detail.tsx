import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Target, TrendingUp, Users, Clock, BarChart3, Edit, Trash2 } from "lucide-react";
import { CheckInModal } from "@/components/check-in-modal";
import InitiativeModal from "@/components/initiative-modal";
import { ProgressStatus } from "@/components/progress-status";
import { format } from "date-fns";
import type { KeyResultWithDetails } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function KeyResultDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const keyResultId = params.id as string;
  const queryClient = useQueryClient();
  
  const { data: keyResult, isLoading } = useQuery<KeyResultWithDetails>({
    queryKey: [`/api/key-results/${keyResultId}`],
    enabled: !!keyResultId,
  });

  const { data: initiatives, isLoading: initiativesLoading } = useQuery<any[]>({
    queryKey: [`/api/key-results/${keyResultId}/initiatives`],
    enabled: !!keyResultId,
  });

  const handleInitiativeSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/key-results/${keyResultId}/initiatives`]
    });
  };

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "currency":
        return "Rp";
      case "number":
        return "";
      default:
        return unit;
    }
  };

  const formatValue = (value: string, unit: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (unit === "currency") {
      return `Rp ${numValue.toLocaleString('id-ID')}`;
    } else if (unit === "percentage") {
      return `${numValue.toFixed(1)}%`;
    } else {
      return numValue.toLocaleString('id-ID');
    }
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    const baseNum = baseValue ? parseFloat(baseValue) : 0;
    
    if (isNaN(currentNum) || isNaN(targetNum)) return 0;
    
    if (keyResultType === "achieve_or_not") {
      return currentNum >= targetNum ? 100 : 0;
    } else if (keyResultType === "decrease_to") {
      if (baseNum === 0) return 0;
      return Math.max(0, Math.min(100, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
    } else {
      return Math.max(0, Math.min(100, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!keyResult) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Key Result tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Key Result yang Anda cari tidak dapat ditemukan.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(
    keyResult.currentValue,
    keyResult.targetValue,
    keyResult.keyResultType,
    keyResult.baseValue
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      on_track: "bg-green-100 text-green-800 border-green-200",
      at_risk: "bg-yellow-100 text-yellow-800 border-yellow-200",
      behind: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      ahead: "bg-purple-100 text-purple-800 border-purple-200"
    };

    const statusLabels = {
      on_track: "On Track",
      at_risk: "At Risk", 
      behind: "Behind",
      completed: "Completed",
      ahead: "Ahead"
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{keyResult.title}</h1>
          <p className="text-gray-600 mt-1">{keyResult.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Result Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Result Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="font-semibold text-blue-600">
                    {formatValue(keyResult.currentValue, keyResult.unit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Target</p>
                  <p className="font-semibold text-green-600">
                    {formatValue(keyResult.targetValue, keyResult.unit)}
                  </p>
                </div>
                {keyResult.baseValue && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Base</p>
                    <p className="font-semibold text-gray-600">
                      {formatValue(keyResult.baseValue, keyResult.unit)}
                    </p>
                  </div>
                )}
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="font-semibold text-purple-600">{progress.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-3" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                {keyResult.status && getStatusBadge(keyResult.status)}
              </div>
            </CardContent>
          </Card>

          {/* Initiatives Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Initiatives
                  </CardTitle>
                  <CardDescription>
                    Strategic actions and projects to achieve this key result
                  </CardDescription>
                </div>
                <InitiativeModal keyResultId={keyResult.id} onSuccess={handleInitiativeSuccess} />
              </div>
            </CardHeader>
            <CardContent>
              {initiativesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : initiatives && initiatives.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initiatives.map((initiative) => (
                      <TableRow key={initiative.id}>
                        <TableCell className="font-medium">{initiative.title}</TableCell>
                        <TableCell>{initiative.description}</TableCell>
                        <TableCell>
                          <Badge variant={initiative.status === "completed" ? "default" : "secondary"}>
                            {initiative.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No initiatives yet</p>
                  <p className="text-sm">Create your first initiative to start working towards this key result.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keyResult.checkIns && keyResult.checkIns.length > 0 ? (
                keyResult.checkIns.map((checkIn, index) => (
                  <div key={checkIn.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-blue-600">
                          {formatValue(checkIn.value, keyResult.unit)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {checkIn.date ? format(new Date(checkIn.date), "MMM dd") : "Unknown"}
                        </p>
                      </div>
                      {checkIn.note && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{checkIn.note}</p>
                      )}
                      {checkIn.confidence && (
                        <p className="text-xs text-gray-500 mt-1">Confidence: {checkIn.confidence}/10</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No check-ins yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-sm">{keyResult.keyResultType.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unit</p>
                <p className="text-sm">{keyResult.unit}</p>
              </div>
              {keyResult.lastUpdated && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm">{format(new Date(keyResult.lastUpdated), "MMM dd, yyyy")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CheckInModal keyResultId={keyResult.id} />
              <Button variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit Key Result
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