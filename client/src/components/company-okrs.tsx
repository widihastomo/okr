import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronDown, ChevronRight, Building2, Users, User } from "lucide-react";
import CreateOKRModal from "./create-okr-modal";
import EditProgressModal from "./edit-progress-modal";
import type { OKRWithKeyResults, KeyResult } from "@shared/schema";

interface CompanyOKRsProps {
  onRefresh: () => void;
}

export default function CompanyOKRs({ onRefresh }: CompanyOKRsProps) {
  const [createModal, setCreateModal] = useState(false);
  const [editProgressModal, setEditProgressModal] = useState<{ open: boolean; keyResult?: KeyResult }>({ open: false });
  const [expandedOKRs, setExpandedOKRs] = useState<Set<number>>(new Set());

  const { data: okrs = [], isLoading } = useQuery<OKRWithKeyResults[]>({
    queryKey: ['/api/okrs']
  });

  // Group OKRs by level and hierarchy
  const companyOKRs = okrs.filter(okr => okr.level === 'company');
  const teamOKRs = okrs.filter(okr => okr.level === 'team');
  const individualOKRs = okrs.filter(okr => okr.level === 'individual');

  const getChildOKRs = (parentId: number) => {
    return [...teamOKRs, ...individualOKRs].filter(okr => okr.parentId === parentId);
  };

  const toggleExpanded = (okrId: number) => {
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
      case 'on_track': return 'bg-green-100 text-green-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'company': return <Building2 className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'individual': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const renderOKR = (okr: OKRWithKeyResults, level: number = 0) => {
    const hasChildren = getChildOKRs(okr.id).length > 0;
    const isExpanded = expandedOKRs.has(okr.id);
    const children = getChildOKRs(okr.id);

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
                {getLevelIcon(okr.level)}
                <CardTitle className="text-lg">{okr.title}</CardTitle>
                <Badge className={getStatusColor(okr.status)}>
                  {okr.status.replace('_', ' ')}
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
                      <h4 className="font-medium text-sm">{kr.title}</h4>
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
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create OKR
        </Button>
      </div>

      {companyOKRs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Company OKRs</h3>
            <p className="text-gray-500 text-center mb-4">
              Start by creating a company-level objective to align your organization
            </p>
            <Button onClick={() => setCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Company OKR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {companyOKRs.map(okr => renderOKR(okr))}
          
          {/* Show orphaned team and individual OKRs */}
          {teamOKRs.filter(okr => !okr.parentId).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Independent Team OKRs
              </h3>
              {teamOKRs.filter(okr => !okr.parentId).map(okr => renderOKR(okr))}
            </div>
          )}
          
          {individualOKRs.filter(okr => !okr.parentId).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Independent Individual OKRs
              </h3>
              {individualOKRs.filter(okr => !okr.parentId).map(okr => renderOKR(okr))}
            </div>
          )}
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