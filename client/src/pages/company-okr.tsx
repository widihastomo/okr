import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Target, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import OKRFormModal from "@/components/okr-form-modal";
import type { OKRWithKeyResults, Cycle } from "@shared/schema";

interface TreeNode {
  okr: OKRWithKeyResults;
  children: TreeNode[];
  isExpanded: boolean;
}

export default function CompanyOKRPage() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);

  const { data: okrs = [], isLoading: okrsLoading } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs"]
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"]
  });

  // Build tree structure based on parent_id
  const buildTree = (okrs: OKRWithKeyResults[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    okrs.forEach(okr => {
      nodeMap.set(okr.id, {
        okr,
        children: [],
        isExpanded: expandedNodes.has(okr.id)
      });
    });

    // Second pass: build parent-child relationships
    okrs.forEach(okr => {
      const node = nodeMap.get(okr.id)!;
      
      if (okr.parentId && nodeMap.has(okr.parentId)) {
        // Has parent - add to parent's children
        const parentNode = nodeMap.get(okr.parentId)!;
        parentNode.children.push(node);
      } else {
        // No parent or parent not found - add to root
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  // Filter OKRs based on cycle and status
  const filteredOKRs = okrs.filter(okr => {
    const cycleMatch = cycleFilter === "all" || okr.cycleId === cycleFilter;
    const statusMatch = statusFilter === "all" || okr.status === statusFilter;
    return cycleMatch && statusMatch;
  });

  const treeData = buildTree(filteredOKRs);

  const toggleNode = (nodeId: string) => {
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

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const { okr, children } = node;
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(okr.id);
    const paddingLeft = level * 24; // 24px per level

    return (
      <div key={okr.id} className="border-l-2 border-gray-100">
        {/* OKR Header */}
        <div 
          className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={() => toggleNode(okr.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>

          {/* OKR Icon */}
          <div className="flex-shrink-0">
            <Target className="h-5 w-5 text-blue-600" />
          </div>

          {/* OKR Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-medium text-gray-900 truncate">{okr.title}</h3>
              <ObjectiveStatusBadge status={okr.status} />
            </div>
            
            {okr.description && (
              <p className="text-sm text-gray-600 truncate">{okr.description}</p>
            )}

            {/* Owner and Cycle Info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{okr.owner}</span>
              </div>
              <span>Progress: {okr.overallProgress.toFixed(1)}%</span>
            </div>

            {/* Key Results Summary */}
            {okr.keyResults.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  {okr.keyResults.length} Key Result{okr.keyResults.length > 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {okr.keyResults.map(kr => (
                    <div key={kr.id} className="bg-gray-50 rounded px-2 py-1">
                      <div className="text-xs font-medium text-gray-700 truncate">
                        {kr.title}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-600">
                          {kr.currentValue}/{kr.targetValue} {kr.unit}
                        </div>
                        <div className="text-xs font-medium text-blue-600">
                          {(kr as any).progress?.toFixed(1) || '0.0'}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-blue-200 ml-6">
            {children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (okrsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Company OKRs</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Hierarchical view of all objectives and key results
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partially_achieved">Partially Achieved</SelectItem>
                <SelectItem value="not_achieved">Not Achieved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            {/* Cycle Filter */}
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cycle</SelectItem>
                {cycles.map(cycle => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Expand/Collapse Controls */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
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

      {/* Tree View */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {treeData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Target className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>Tidak ada OKR yang ditemukan</p>
            <p className="text-sm mt-2">Coba ubah filter atau buat OKR baru</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {treeData.map(node => renderTreeNode(node))}
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