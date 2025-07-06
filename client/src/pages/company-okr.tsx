import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Users, TrendingUp, ChevronDown, ChevronRight, Building2, Filter } from "lucide-react";
import { OKRWithKeyResults } from "@shared/schema";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import OKRFormModal from "@/components/okr-form-modal";
import CompanyOKRD3Tree from "@/components/company-okr-d3-tree";
import { useLocation } from "wouter";

interface TreeNode {
  okr: OKRWithKeyResults;
  children: TreeNode[];
  level: number;
  isExpanded: boolean;
}

export default function CompanyOKRPage() {
  const [, navigate] = useLocation();
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const { data: okrs = [], isLoading } = useQuery({
    queryKey: ["/api/okrs"],
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["/api/cycles"],
  });

  // Set default cycle to active cycle with shortest duration when cycles are loaded
  const activeCycles = (cycles as any[]).filter(cycle => cycle.status === 'active');
  const defaultCycle = activeCycles.length > 0 
    ? activeCycles.reduce((shortest, current) => {
        const shortestDuration = new Date(shortest.endDate).getTime() - new Date(shortest.startDate).getTime();
        const currentDuration = new Date(current.endDate).getTime() - new Date(current.startDate).getTime();
        return currentDuration < shortestDuration ? current : shortest;
      })
    : null;
  
  // Initialize cycle filter with shortest active cycle on first load only
  useEffect(() => {
    if (defaultCycle && selectedCycle === 'all' && cycles.length > 0 && !hasAutoSelected) {
      setSelectedCycle(defaultCycle.id);
      setHasAutoSelected(true);
    }
  }, [defaultCycle?.id, hasAutoSelected]);

  // Filter OKRs by selected cycle
  const filteredOKRs = selectedCycle === 'all' 
    ? okrs 
    : (okrs as any[]).filter((okr: any) => okr.cycleId === selectedCycle);

  // Auto-expand root nodes that have children on first load only
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  
  useEffect(() => {
    if ((filteredOKRs as any[]).length > 0 && !hasAutoExpanded) {
      const rootNodesWithChildren = (filteredOKRs as any[])
        .filter((okr: any) => !okr.parentId) // root nodes
        .filter((okr: any) => (filteredOKRs as any[]).some((child: any) => child.parentId === okr.id)) // that have children
        .map((okr: any) => okr.id);
      
      if (rootNodesWithChildren.length > 0) {
        setExpandedNodes(new Set(rootNodesWithChildren));
        setHasAutoExpanded(true);
      }
    }
  }, [(filteredOKRs as any[]).length]);

  // Reset auto-expand flag when cycle changes
  useEffect(() => {
    setHasAutoExpanded(false);
    setExpandedNodes(new Set());
  }, [selectedCycle]);

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

  const treeData = buildTree(filteredOKRs);

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
            {/* Cycle Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pilih Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cycle</SelectItem>
                  {(cycles as any[]).map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="flex items-center gap-1"
              >
                <ChevronDown className="w-3 h-3" />
                Buka Semua
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3" />
                Tutup Semua
              </Button>
            </div>
            
            <Button 
              onClick={() => setIsOKRModalOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat OKR
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-x-auto overflow-y-hidden min-h-[calc(100vh-12rem)]">
        {treeData.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada OKR</h3>
            <p className="text-gray-600 mb-4">Mulai dengan membuat objective pertama untuk perusahaan</p>
            <Button 
              onClick={() => setIsOKRModalOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat OKR Pertama
            </Button>
          </div>
        ) : (
          <div className="h-[calc(100vh-16rem)]">
            <CompanyOKRD3Tree 
              okrs={filteredOKRs}
              expandedNodes={expandedNodes}
              onToggleExpand={toggleExpand}
              onNodeClick={(okr) => navigate(`/objectives/${okr.id}`)}
            />
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