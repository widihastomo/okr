import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { GoalWithKeyResults } from "@shared/schema";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Users, 
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw
} from "lucide-react";

interface TreeNode {
  id: string;
  data: GoalWithKeyResults;
  children: TreeNode[];
  parent?: TreeNode;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface DashboardD3TreeProps {
  goals: GoalWithKeyResults[];
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onNodeClick?: (goal: GoalWithKeyResults) => void;
}

export default function DashboardD3Tree({ 
  goals, 
  expandedNodes, 
  onToggleExpand,
  onNodeClick 
}: DashboardD3TreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Suppress ResizeObserver warnings
  useEffect(() => {
    const handleResizeObserverError = (e: ErrorEvent) => {
      if (e.message.includes('ResizeObserver loop')) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('error', handleResizeObserverError);
    return () => window.removeEventListener('error', handleResizeObserverError);
  }, []);

  const buildTree = (goals: GoalWithKeyResults[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes for all Goals
    goals.forEach(goal => {
      nodeMap.set(goal.id, {
        id: goal.id,
        data: goal,
        children: []
      });
    });

    // Build parent-child relationships
    goals.forEach(goal => {
      const node = nodeMap.get(goal.id)!;
      
      // Check if goal has parentId and if parent exists in nodeMap
      if (goal.parentId && nodeMap.has(goal.parentId)) {
        const parent = nodeMap.get(goal.parentId)!;
        parent.children.push(node);
        node.parent = parent;
      } else {
        // Goal without parent or with non-existent parent becomes root
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const calculateKeyResultProgress = (kr: any): number => {
    const currentNum = parseFloat(kr.currentValue) || 0;
    const targetNum = parseFloat(kr.targetValue) || 0;
    const baseNum = parseFloat(kr.baseValue || "0") || 0;

    switch (kr.keyResultType) {
      case "increase_to":
        if (targetNum <= baseNum) return 0;
        return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
      
      case "decrease_to":
        if (baseNum <= targetNum) return 0;
        return Math.min(100, Math.max(0, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
      
      case "achieve_or_not":
        return currentNum >= targetNum ? 100 : 0;
      
      default:
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || goals.length === 0) return;

    // Debounce to prevent ResizeObserver issues
    const timer = setTimeout(() => {
      try {
        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;
        const nodeWidth = 320;
        const nodeHeight = 140;
        const horizontalSpacing = 400;
        const verticalSpacing = 200;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add shadow filter definition
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 2)
      .attr("stdDeviation", 3)
      .attr("flood-color", "#000000")
      .attr("flood-opacity", 0.2);

    // Add zoom behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Build tree data
    const treeData = buildTree(goals);
    if (treeData.length === 0) return;

    // Create hierarchy and tree layout - handle multiple roots or single root
    let root;
    if (treeData.length === 1) {
      // Single root node
      root = d3.hierarchy(treeData[0], d => {
        const isExpanded = expandedNodes.has(d.id);
        return isExpanded ? d.children : [];
      });
    } else {
      // Multiple root nodes - create artificial root
      const artificialRoot: TreeNode = {
        id: 'artificial-root',
        data: { id: 'root', title: 'Dashboard Goals', keyResults: [] } as any,
        children: treeData
      };
      root = d3.hierarchy(artificialRoot, d => 
        d.id === 'artificial-root' ? d.children : (expandedNodes.has(d.id) ? d.children : [])
      );
    }

    const treeLayout = d3.tree<TreeNode>()
      .nodeSize([verticalSpacing, horizontalSpacing]);

    treeLayout(root);
    
    // Center the tree
    const bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity
    };

    root.descendants().forEach(d => {
      bounds.minX = Math.min(bounds.minX, d.y || 0);
      bounds.maxX = Math.max(bounds.maxX, d.y || 0);
      bounds.minY = Math.min(bounds.minY, d.x || 0);
      bounds.maxY = Math.max(bounds.maxY, d.x || 0);
    });

    const treeWidth = bounds.maxX - bounds.minX + nodeWidth;
    const treeHeight = bounds.maxY - bounds.minY + nodeHeight;
    
    // Initial transform to center the tree
    const initialScale = Math.min(
      width / (treeWidth + 100),
      height / (treeHeight + 100),
      1
    );
    
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initialScale)
      .translate(-bounds.minX - nodeWidth / 2, -bounds.minY);

    svg.call(zoom.transform, initialTransform);

    // Create links
    const link = g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("g")
      .attr("class", "link");

    // Draw curved paths
    link.append("path")
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2)
      .attr("d", d => {
        const source = d.source;
        const target = d.target;
        
        // Create a curved path
        const startX = (source.y || 0) + nodeWidth;
        const startY = (source.x || 0) + nodeHeight / 2;
        const endX = target.y || 0;
        const endY = (target.x || 0) + nodeHeight / 2;
        
        const midX = (startX + endX) / 2;
        
        return `M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`;
      });

    // Create node groups
    const descendants = root.descendants();
    
    const node = g.selectAll(".node")
      .data(descendants)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add node backgrounds
    node.append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "#ffffff")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .attr("filter", "url(#shadow)")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        if (d.data.id !== 'artificial-root') {
          onNodeClick?.(d.data.data);
        }
      });

    // Add expand/collapse buttons for nodes with children
    node.filter(d => d.data.children.length > 0 && d.data.id !== 'artificial-root')
      .append("circle")
      .attr("cx", nodeWidth - 20)
      .attr("cy", 20)
      .attr("r", 12)
      .attr("fill", "#f97316")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        onToggleExpand(d.data.id);
      });

    // Add expand/collapse icons
    node.filter(d => d.data.children.length > 0 && d.data.id !== 'artificial-root')
      .append("text")
      .attr("x", nodeWidth - 20)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "12px")
      .style("cursor", "pointer")
      .text(d => expandedNodes.has(d.data.id) ? "−" : "+")
      .on("click", function(event, d) {
        event.stopPropagation();
        onToggleExpand(d.data.id);
      });

    // Add node content (only for non-artificial nodes)
    const contentNodes = node.filter(d => d.data.id !== 'artificial-root');

    // Add goal icon
    contentNodes.append("text")
      .attr("x", 16)
      .attr("y", 30)
      .attr("fill", "#3b82f6")
      .attr("font-size", "18px")
      .text("🎯");

    // Add title
    contentNodes.append("text")
      .attr("x", 40)
      .attr("y", 25)
      .attr("fill", "#1f2937")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text(d => {
        const title = d.data.data.title;
        return title.length > 35 ? title.substring(0, 35) + "..." : title;
      });

    // Add status badge
    contentNodes.append("rect")
      .attr("x", 40)
      .attr("y", 35)
      .attr("width", 60)
      .attr("height", 20)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", d => {
        switch (d.data.data.status) {
          case "not_started": return "#f3f4f6";
          case "in_progress": return "#fef3c7";
          case "completed": return "#d1fae5";
          case "at_risk": return "#fef2f2";
          default: return "#f3f4f6";
        }
      })
      .attr("stroke", d => {
        switch (d.data.data.status) {
          case "not_started": return "#9ca3af";
          case "in_progress": return "#f59e0b";
          case "completed": return "#10b981";
          case "at_risk": return "#ef4444";
          default: return "#9ca3af";
        }
      })
      .attr("stroke-width", 1);

    // Add status text
    contentNodes.append("text")
      .attr("x", 70)
      .attr("y", 48)
      .attr("text-anchor", "middle")
      .attr("fill", d => {
        switch (d.data.data.status) {
          case "not_started": return "#6b7280";
          case "in_progress": return "#92400e";
          case "completed": return "#065f46";
          case "at_risk": return "#dc2626";
          default: return "#6b7280";
        }
      })
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text(d => {
        switch (d.data.data.status) {
          case "not_started": return "Belum";
          case "in_progress": return "Progress";
          case "completed": return "Selesai";
          case "at_risk": return "Risiko";
          default: return "Belum";
        }
      });

    // Add key results count
    contentNodes.append("text")
      .attr("x", 16)
      .attr("y", 75)
      .attr("fill", "#6b7280")
      .attr("font-size", "12px")
      .text(d => `${d.data.data.keyResults.length} Angka Target`);

    // Add progress bar background
    contentNodes.append("rect")
      .attr("x", 16)
      .attr("y", 85)
      .attr("width", nodeWidth - 32)
      .attr("height", 6)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", "#f3f4f6");

    // Add progress bar fill
    contentNodes.append("rect")
      .attr("x", 16)
      .attr("y", 85)
      .attr("width", d => {
        const progress = d.data.data.keyResults.length > 0 
          ? d.data.data.keyResults.reduce((sum: number, kr: any) => sum + calculateKeyResultProgress(kr), 0) / d.data.data.keyResults.length
          : 0;
        return Math.max(0, (progress / 100) * (nodeWidth - 32));
      })
      .attr("height", 6)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", "#3b82f6");

    // Add progress percentage
    contentNodes.append("text")
      .attr("x", 16)
      .attr("y", 110)
      .attr("fill", "#6b7280")
      .attr("font-size", "12px")
      .text(d => {
        const progress = d.data.data.keyResults.length > 0 
          ? d.data.data.keyResults.reduce((sum: number, kr: any) => sum + calculateKeyResultProgress(kr), 0) / d.data.data.keyResults.length
          : 0;
        return `${Math.round(progress)}% Progress`;
      });

    // Add owner info
    contentNodes.append("text")
      .attr("x", 16)
      .attr("y", 125)
      .attr("fill", "#6b7280")
      .attr("font-size", "11px")
      .text(d => d.data.data.ownerName || "Tidak ada pemilik");
      
      } catch (error) {
        console.error('Error rendering D3 tree:', error);
      }
    }, 50); // 50ms debounce

    return () => clearTimeout(timer);
  }, [goals, expandedNodes, onToggleExpand, onNodeClick]);

  return (
    <Card className="w-full h-full">
      <div ref={containerRef} className="w-full h-[600px] relative">
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const svg = d3.select(svgRef.current!);
              const currentTransform = d3.zoomTransform(svg.node()!);
              const newTransform = currentTransform.scale(1.2);
              svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform, newTransform);
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const svg = d3.select(svgRef.current!);
              const currentTransform = d3.zoomTransform(svg.node()!);
              const newTransform = currentTransform.scale(0.8);
              svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform, newTransform);
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const svg = d3.select(svgRef.current!);
              const resetTransform = d3.zoomIdentity.translate(containerRef.current!.clientWidth / 2, containerRef.current!.clientHeight / 2);
              svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform, resetTransform);
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Klik untuk expand/collapse</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Klik node untuk detail</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}