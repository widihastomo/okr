import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronDown, ChevronRight, Building2, Users, User, Target, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateOKRModal from "./create-okr-modal";
import EditProgressModal from "./edit-progress-modal";
import type { OKRWithKeyResults, KeyResult } from "@shared/schema";

interface CompanyOKRsProps {
  onRefresh: () => void;
}

export default function CompanyOKRs({ onRefresh }: CompanyOKRsProps) {
  const [createModal, setCreateModal] = useState(false);
  const [editProgressModal, setEditProgressModal] = useState<{ open: boolean; keyResult?: KeyResult }>({ open: false });
  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: okrs = [], isLoading } = useQuery<OKRWithKeyResults[]>({
    queryKey: ['/api/okrs']
  });

  const updateAllStatusMutation = useMutation({
    mutationFn: () => apiRequest('/api/update-all-status', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Status Updated",
        description: `Updated status for ${data.updatedCount} key results based on progress tracking`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/okrs'] });
      onRefresh();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update status calculations",
        variant: "destructive",
      });
    },
  });

  // Build flexible hierarchy structure
  const buildHierarchy = (parentId: string | null = null): (OKRWithKeyResults & { children: any[] })[] => {
    return okrs
      .filter(okr => okr.parentId === parentId)
      .map(okr => ({
        ...okr,
        children: buildHierarchy(okr.id)
      }));
  };

  const hierarchicalOKRs = buildHierarchy();

  const getChildOKRs = (parentId: string) => {
    return okrs.filter(okr => okr.parentId === parentId);
  };

  const toggleExpanded = (okrId: string) => {
    const newExpanded = new Set(expandedOKRs);
    if (newExpanded.has(okrId)) {
      newExpanded.delete(okrId);
    } else {
      newExpanded.add(okrId);
    }
    setExpandedOKRs(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'on_track':
        return 'bg-green-400 text-white';
      case 'at_risk':
        return 'bg-yellow-500 text-white';
      case 'behind':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
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

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 0: return <Building2 className="w-4 h-4" />; // Root level
      case 1: return <Users className="w-4 h-4" />; // Second level
      case 2: return <User className="w-4 h-4" />; // Third level
      default: return <Target className="w-4 h-4" />; // Deeper levels
    }
  };

  const renderOKR = (okr: OKRWithKeyResults & { children?: any[] }, level: number = 0) => {
    const children = okr.children || getChildOKRs(okr.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedOKRs.has(okr.id);

    return (
      <div key={okr.id} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="mb-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(okr.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}
                {getLevelIcon(level)}
                <CardTitle className="text-lg">{okr.title}</CardTitle>
                <Badge className={getStatusColor(okr.status)}>
                  {getStatusLabel(okr.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(okr.overallProgress)}% Complete
              </div>
            </div>
            {okr.description && (
              <p className="text-gray-600 text-sm mt-2">{okr.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Overall Progress</span>
                <span>{Math.round(okr.overallProgress)}%</span>
              </div>
              <Progress value={okr.overallProgress} className="h-2" />
              
              <div className="space-y-2">
                {okr.keyResults.map((kr) => (
                  <div key={kr.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{kr.title}</h4>
                        <Badge className={getStatusColor(kr.status || 'in_progress')}>
                          {getStatusLabel(kr.status || 'in_progress')}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/key-results/${kr.id}`}
                          className="text-xs"
                        >
                          Detail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditProgressModal({ open: true, keyResult: kr })}
                          className="text-xs"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {kr.currentValue} / {kr.targetValue} {kr.unit}
                    </div>
                    <Progress 
                      value={Math.max(0, Math.min(100, 
                        kr.keyResultType === 'increase_to' 
                          ? ((parseFloat(kr.currentValue) - parseFloat(kr.baseValue || '0')) / 
                             (parseFloat(kr.targetValue) - parseFloat(kr.baseValue || '0'))) * 100
                          : kr.keyResultType === 'decrease_to'
                          ? ((parseFloat(kr.baseValue || '0') - parseFloat(kr.currentValue)) / 
                             (parseFloat(kr.baseValue || '0') - parseFloat(kr.targetValue))) * 100
                          : parseFloat(kr.currentValue) >= parseFloat(kr.targetValue) ? 100 : 0
                      ))} 
                      className="h-1.5" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render child OKRs if expanded */}
        {isExpanded && children.length > 0 && (
          <div className="space-y-2">
            {children.map(childOKR => renderOKR(childOKR, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company OKRs</h2>
          <p className="text-gray-600">Hierarchical view of company, team, and individual objectives</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => updateAllStatusMutation.mutate()}
            disabled={updateAllStatusMutation.isPending}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${updateAllStatusMutation.isPending ? 'animate-spin' : ''}`} />
            Update Status
          </Button>
          <Button onClick={() => setCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Create OKR
          </Button>
        </div>
      </div>

      {hierarchicalOKRs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No OKRs Found</h3>
            <p className="text-gray-500 text-center mb-4">
              Start by creating your first objective to track progress
            </p>
            <Button onClick={() => setCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First OKR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hierarchicalOKRs.map(okr => renderOKR(okr, 0))}
        </div>
      )}

      <CreateOKRModal
        open={createModal}
        onOpenChange={setCreateModal}
        onSuccess={() => {
          setCreateModal(false);
          onRefresh();
        }}
      />

      <EditProgressModal
        open={editProgressModal.open}
        keyResult={editProgressModal.keyResult}
        onOpenChange={(open) => setEditProgressModal({ open, keyResult: undefined })}
        onSuccess={() => {
          setEditProgressModal({ open: false, keyResult: undefined });
          onRefresh();
        }}
      />
    </div>
  );
}