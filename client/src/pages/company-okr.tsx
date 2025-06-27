import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Target, Calendar, Users, TrendingUp } from "lucide-react";
import { OKRWithKeyResults } from "@shared/schema";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import OKRFormModal from "@/components/okr-form-modal";

interface TreeNode {
  okr: OKRWithKeyResults;
  children: TreeNode[];
  level: number;
}

export default function CompanyOKRPage() {
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);

  const { data: okrs = [], isLoading } = useQuery({
    queryKey: ["/api/okrs"],
  });

  // Build tree structure
  const buildTree = (okrs: OKRWithKeyResults[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes for all OKRs
    okrs.forEach(okr => {
      nodeMap.set(okr.id, {
        okr,
        children: [],
        level: 0
      });
    });

    // Build parent-child relationships and assign levels
    okrs.forEach(okr => {
      const node = nodeMap.get(okr.id)!;
      
      if (okr.parentId && nodeMap.has(okr.parentId)) {
        const parent = nodeMap.get(okr.parentId)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const treeData = buildTree(okrs);

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'on_track': 'text-green-600',
      'at_risk': 'text-yellow-600',
      'behind': 'text-red-600',
      'completed': 'text-green-700',
      'not_started': 'text-gray-500',
      'in_progress': 'text-blue-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-500';
  };

  const renderObjectiveCard = (node: TreeNode, hasChildren: boolean) => {
    const { okr, level } = node;
    const progressColor = getProgressColor(okr.overallProgress);
    
    return (
      <div className={`relative ${level > 0 ? 'ml-8' : ''}`}>
        {/* Connecting line for child nodes */}
        {level > 0 && (
          <>
            <div className="absolute -left-6 top-6 w-4 h-px bg-gray-300"></div>
            <div className="absolute -left-6 top-0 w-px h-6 bg-gray-300"></div>
          </>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 shadow-sm hover:shadow-md transition-shadow">
          {/* Header with department tag */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${level === 0 ? 'bg-blue-100' : 'bg-purple-100'} flex items-center justify-center`}>
                <Target className={`w-6 h-6 ${level === 0 ? 'text-blue-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {okr.teamId ? 'Team' : 'Individual'}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">Q1 2025</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{okr.title}</h3>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium ${progressColor}`}>
                <TrendingUp className="w-4 h-4" />
                {okr.overallProgress.toFixed(0)}%
              </div>
              <ObjectiveStatusBadge status={okr.status} />
            </div>
          </div>

          {/* Description */}
          {okr.description && (
            <p className="text-gray-600 text-sm mb-4">{okr.description}</p>
          )}

          {/* Key Results */}
          <div className="space-y-3">
            {okr.keyResults.map((kr) => (
              <div key={kr.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{kr.title}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-600">
                      {kr.unit === 'currency' ? `Rp ${parseFloat(kr.currentValue || '0').toLocaleString('id-ID')}` : kr.currentValue} / 
                      {kr.unit === 'currency' ? ` Rp ${parseFloat(kr.targetValue).toLocaleString('id-ID')}` : ` ${kr.targetValue}`} {kr.unit !== 'currency' ? kr.unit : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">{(kr as any).progress?.toFixed(0) || '0'}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Owner info */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{okr.owner}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTree = (nodes: TreeNode[]) => {
    return nodes.map((node, index) => (
      <div key={node.okr.id} className="relative">
        {renderObjectiveCard(node, node.children.length > 0)}
        {node.children.length > 0 && (
          <div className="relative">
            {/* Vertical connecting line for children */}
            {node.children.length > 1 && (
              <div 
                className="absolute left-4 w-px bg-gray-300"
                style={{ 
                  top: '0px',
                  height: `${(node.children.length - 1) * 200}px`
                }}
              ></div>
            )}
            {renderTree(node.children)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company OKRs</h1>
            <p className="text-sm text-gray-600 mt-1">Hierarchical view of organizational objectives</p>
          </div>
          
          <Button 
            onClick={() => setIsOKRModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat OKR
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {treeData.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada OKR</h3>
            <p className="text-gray-600 mb-4">Mulai dengan membuat objective pertama untuk perusahaan</p>
            <Button 
              onClick={() => setIsOKRModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat OKR Pertama
            </Button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {renderTree(treeData)}
          </div>
        )}
      </div>

      {/* OKR Form Modal */}
      <OKRFormModal 
        open={isOKRModalOpen} 
        onOpenChange={setIsOKRModalOpen} 
      />
    </div>
  );
}