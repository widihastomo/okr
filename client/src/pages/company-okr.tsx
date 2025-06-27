import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Target, Users, TrendingUp, ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { OKRWithKeyResults } from "@shared/schema";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import OKRFormModal from "@/components/okr-form-modal";

interface TreeNode {
  okr: OKRWithKeyResults;
  children: TreeNode[];
  level: number;
  isExpanded: boolean;
}

export default function CompanyOKRPage() {
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
        level: 0,
        isExpanded: expandedNodes.has(okr.id)
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

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set(okrs.map((okr: OKRWithKeyResults) => okr.id));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

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

  const renderCompactCard = (node: TreeNode) => {
    const { okr, level, children, isExpanded } = node;
    const progressColor = getProgressColor(okr.overallProgress);
    const hasChildren = children.length > 0;
    
    return (
      <div className={`relative ${level > 0 ? 'ml-6' : ''}`}>
        {/* Connecting line for child nodes */}
        {level > 0 && (
          <>
            <div className="absolute -left-4 top-4 w-3 h-px bg-gray-300"></div>
            <div className="absolute -left-4 top-0 w-px h-4 bg-gray-300"></div>
          </>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            {/* Left side - Icon, Title, Progress */}
            <div className="flex items-center gap-3 flex-1">
              {/* Expand/Collapse button */}
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(okr.id)}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              ) : (
                <div className="w-6 h-6"></div>
              )}
              
              {/* Icon */}
              <div className={`w-8 h-8 rounded-full ${level === 0 ? 'bg-blue-100' : 'bg-purple-100'} flex items-center justify-center`}>
                {level === 0 ? (
                  <Building2 className="w-4 h-4 text-blue-600" />
                ) : (
                  <Target className="w-4 h-4 text-purple-600" />
                )}
              </div>
              
              {/* Title and Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{okr.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full shrink-0">
                    {level === 0 ? 'Company' : 'Department'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{okr.owner}</span>
                  <span>•</span>
                  <span>{okr.keyResults.length} KR</span>
                  {hasChildren && (
                    <>
                      <span>•</span>
                      <span>{children.length} sub-objectives</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side - Progress and Status */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium ${progressColor}`}>
                <TrendingUp className="w-3 h-3" />
                {okr.overallProgress.toFixed(0)}%
              </div>
              <ObjectiveStatusBadge status={okr.status} />
            </div>
          </div>
          
          {/* Key Results preview - only show if expanded or no children */}
          {(isExpanded || !hasChildren) && okr.keyResults.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 gap-2">
                {okr.keyResults.slice(0, 3).map((kr) => (
                  <div key={kr.id} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 truncate flex-1">{kr.title}</span>
                    <span className="text-gray-500 shrink-0">
                      {(kr as any).progress?.toFixed(0) || '0'}%
                    </span>
                  </div>
                ))}
                {okr.keyResults.length > 3 && (
                  <div className="text-xs text-gray-500 ml-4">
                    +{okr.keyResults.length - 3} more key results
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTree = (nodes: TreeNode[]) => {
    return nodes.map((node) => (
      <div key={node.okr.id}>
        {renderCompactCard(node)}
        {node.isExpanded && node.children.length > 0 && (
          <div className="ml-2">
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
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={expandAll}
              >
                Expand All
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={collapseAll}
              >
                Collapse All
              </Button>
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