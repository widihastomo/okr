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
import Sidebar from "@/components/sidebar";

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
    if (unit === "currency") {
      return `Rp ${numValue.toLocaleString('id-ID')}`;
    }
    if (unit === "percentage") {
      return `${numValue}%`;
    }
    return numValue.toLocaleString('id-ID');
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null) => {
    const currentVal = parseFloat(current);
    const targetVal = parseFloat(target);
    const baseVal = baseValue ? parseFloat(baseValue) : 0;

    if (keyResultType === "increase_to") {
      return baseVal !== targetVal ? ((currentVal - baseVal) / (targetVal - baseVal)) * 100 : 0;
    } else if (keyResultType === "decrease_to") {
      return baseVal !== targetVal ? ((baseVal - currentVal) / (baseVal - targetVal)) * 100 : 0;
    } else if (keyResultType === "achieve_or_not") {
      return currentVal >= targetVal ? 100 : 0;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={true} />
        <div className="flex-1 flex flex-col">
          <div className="h-20"></div>
          <div className="flex-1 overflow-auto p-6">
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
        </div>
      </div>
    );
  }

  if (!keyResult) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={true} />
        <div className="flex-1 flex flex-col">
          <div className="h-20"></div>
          <div className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Key Result tidak ditemukan</h2>
              <p className="text-gray-600 mb-4">Key Result yang Anda cari tidak dapat ditemukan.</p>
              <Button onClick={() => setLocation("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={true} />
      <div className="flex-1 flex flex-col">
        {/* Header spacer for global header */}
        <div className="h-20"></div>
        
        <div className="flex-1 overflow-auto p-6">
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
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {initiatives.map((initiative) => (
                          <TableRow key={initiative.id}>
                            <TableCell className="font-medium">{initiative.title}</TableCell>
                            <TableCell className="text-gray-600">{initiative.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {initiative.status || "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">
                              {initiative.createdAt ? format(new Date(initiative.createdAt), "MMM dd, yyyy") : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No initiatives yet</h3>
                      <p className="text-sm mb-4">Create your first initiative to start working towards this key result.</p>
                      <InitiativeModal keyResultId={keyResult.id} onSuccess={handleInitiativeSuccess} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Progress History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {keyResult.checkIns && keyResult.checkIns.length > 0 ? (
                    <div className="space-y-3">
                      {keyResult.checkIns.slice(0, 5).map((checkIn) => (
                        <div key={checkIn.id} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {formatValue(checkIn.value, keyResult.unit)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {checkIn.createdAt ? format(new Date(checkIn.createdAt), "MMM dd") : "N/A"}
                            </span>
                          </div>
                          {checkIn.notes && (
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {checkIn.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Confidence: {checkIn.confidence}/10
                            </span>
                          </div>
                        </div>
                      ))}
                      {keyResult.checkIns.length > 5 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          +{keyResult.checkIns.length - 5} more check-ins
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <Badge variant="outline" className="text-xs">
                      {keyResult.keyResultType === "increase_to" && "Increase To"}
                      {keyResult.keyResultType === "decrease_to" && "Decrease To"}
                      {keyResult.keyResultType === "achieve_or_not" && "Achieve or Not"}
                    </Badge>
                  </div>
                  {keyResult.dueDate && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Due Date</span>
                        <span className="text-sm font-medium">
                          {keyResult.dueDate ? format(new Date(keyResult.dueDate), "MMM dd, yyyy") : "No due date"}
                        </span>
                      </div>
                    </>
                  )}
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
                  <CardTitle className="text-lg">Actions</CardTitle>
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
                    View Calendar
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
      </div>
    </div>
  );
}