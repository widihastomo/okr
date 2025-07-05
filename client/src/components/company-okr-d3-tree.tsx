import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { OKRWithKeyResults } from "@shared/schema";
import { ObjectiveStatusBadge } from "@/components/objective-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
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
  data: OKRWithKeyResults;
  children: TreeNode[];
  parent?: TreeNode;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface CompanyOKRD3TreeProps {
  okrs: OKRWithKeyResults[];
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onNodeClick?: (okr: OKRWithKeyResults) => void;
}

export default function CompanyOKRD3Tree({ 
  okrs, 
  expandedNodes, 
  onToggleExpand,
  onNodeClick 
}: CompanyOKRD3TreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const buildTree = (okrs: OKRWithKeyResults[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];



    // Create nodes for all OKRs
    okrs.forEach(okr => {
      nodeMap.set(okr.id, {
        id: okr.id,
        data: okr,
        children: []
      });
    });

    // Build parent-child relationships
    okrs.forEach(okr => {
      const node = nodeMap.get(okr.id)!;
      
      if (okr.parentId && nodeMap.has(okr.parentId)) {
        const parent = nodeMap.get(okr.parentId)!;
        parent.children.push(node);
        node.parent = parent;
      } else {
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
    if (!svgRef.current || !containerRef.current || okrs.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
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
    const treeData = buildTree(okrs);
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
        data: { id: 'root', title: 'Company OKRs', keyResults: [] } as any,
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
      .attr("rx", 8)
      .attr("fill", "white")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .style("filter", "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))");

    // Add gradient background for header
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "headerGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .style("stop-color", "#3b82f6");

    gradient.append("stop")
      .attr("offset", "100%")
      .style("stop-color", "#2563eb");

    // Add header background
    node.append("rect")
      .attr("width", nodeWidth)
      .attr("height", 40)
      .attr("rx", 8)
      .attr("fill", d => d.depth === 0 ? "url(#headerGradient)" : "#f9fafb");

    // Add icon
    node.append("foreignObject")
      .attr("x", 12)
      .attr("y", 8)
      .attr("width", 24)
      .attr("height", 24)
      .append("xhtml:div")
      .style("width", "24px")
      .style("height", "24px")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .html(d => {
        if (d.depth === 0) {
          return '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
        } else {
          return '<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>';
        }
      });

    // Add title
    node.append("text")
      .attr("x", 44)
      .attr("y", 25)
      .attr("font-size", "14px")
      .attr("font-weight", d => d.depth === 0 ? "600" : "500")
      .attr("fill", d => d.depth === 0 ? "white" : "#111827")
      .text(d => {
        const title = d.data.data.title;
        return title.length > 30 ? title.substring(0, 30) + "..." : title;
      });

    // Add owner info
    node.append("circle")
      .attr("cx", nodeWidth - 80)
      .attr("cy", 20)
      .attr("r", 12)
      .attr("fill", d => d.depth === 0 ? "#ffffff33" : "#f3f4f6");

    node.append("text")
      .attr("x", nodeWidth - 80)
      .attr("y", 24)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", d => d.depth === 0 ? "white" : "#6b7280")
      .text(d => d.data.data.owner ? d.data.data.owner.charAt(0).toUpperCase() : "U");

    // Add progress
    const progressGroup = node.append("g")
      .attr("transform", `translate(${nodeWidth - 45}, 8)`);

    progressGroup.append("rect")
      .attr("width", 36)
      .attr("height", 24)
      .attr("rx", 12)
      .attr("fill", d => {
        const progress = d.data.data.overallProgress;
        if (progress >= 90) return "#10b981";
        if (progress >= 70) return "#3b82f6";
        if (progress >= 50) return "#f59e0b";
        return "#ef4444";
      });

    progressGroup.append("text")
      .attr("x", 18)
      .attr("y", 17)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "white")
      .text(d => `${Math.round(d.data.data.overallProgress)}%`);

    // Add expand/collapse button if has children - positioned at middle right edge
    const expandButton = node.filter(d => d.data.children.length > 0)
      .append("g")
      .attr("transform", `translate(${nodeWidth - 16}, ${nodeHeight / 2 - 10})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onToggleExpand(d.data.id);
      });

    // Floating button background with shadow effect
    expandButton.append("circle")
      .attr("cx", 0)
      .attr("cy", 10)
      .attr("r", 16)
      .attr("fill", "#ffffff")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2)
      .attr("filter", "url(#shadow)");

    // Inner circle with color based on state
    expandButton.append("circle")
      .attr("cx", 0)
      .attr("cy", 10)
      .attr("r", 12)
      .attr("fill", d => expandedNodes.has(d.data.id) ? "#3b82f6" : "#f3f4f6")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 1);

    // Plus/minus icon
    expandButton.append("text")
      .attr("x", -6)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", d => expandedNodes.has(d.data.id) ? "white" : "#3b82f6")
      .text(d => expandedNodes.has(d.data.id) ? "−" : "+");

    // Children count in small badge
    expandButton.append("circle")
      .attr("cx", 8)
      .attr("cy", 2)
      .attr("r", 6)
      .attr("fill", "#ef4444")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    expandButton.append("text")
      .attr("x", 8)
      .attr("y", 6)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text(d => d.data.children.length);

    // Add hover effect with smooth transitions for floating button
    expandButton.on("mouseenter", function(event, d) {
      d3.select(this).selectAll("circle:nth-child(2)")
        .transition()
        .duration(200)
        .attr("fill", expandedNodes.has(d.data.id) ? "#2563eb" : "#ddd6fe")
        .attr("r", 13);
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", d => `translate(${nodeWidth - 16}, ${nodeHeight / 2 - 10}) scale(1.1)`);
    }).on("mouseleave", function(event, d) {
      d3.select(this).selectAll("circle:nth-child(2)")
        .transition()
        .duration(200)
        .attr("fill", expandedNodes.has(d.data.id) ? "#3b82f6" : "#f3f4f6")
        .attr("r", 12);
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", d => `translate(${nodeWidth - 16}, ${nodeHeight / 2 - 10}) scale(1)`);
    });

    // Add subtle pulse animation for collapsed nodes
    expandButton.filter(d => !expandedNodes.has(d.data.id))
      .selectAll("circle:nth-child(2)")
      .style("animation", "pulse 3s ease-in-out infinite");

    // Add tooltip-like label for floating button
    expandButton.append("rect")
      .attr("x", -58)
      .attr("y", 4)
      .attr("width", 76)
      .attr("height", 16)
      .attr("rx", 8)
      .attr("fill", "#1f2937")
      .attr("opacity", 0)
      .style("pointer-events", "none");

    expandButton.append("text")
      .attr("x", -20)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "white")
      .attr("opacity", 0)
      .style("pointer-events", "none")
      .text(d => expandedNodes.has(d.data.id) ? "Tutup child" : "Buka child");

    // Show/hide tooltip on hover
    expandButton.on("mouseenter.tooltip", function() {
      d3.select(this).selectAll("rect:last-child, text:last-child")
        .transition()
        .duration(200)
        .attr("opacity", 1);
    }).on("mouseleave.tooltip", function() {
      d3.select(this).selectAll("rect:last-child, text:last-child")
        .transition()
        .duration(200)
        .attr("opacity", 0);
    });

    // Add Key Results
    const krGroup = node.append("g")
      .attr("transform", "translate(12, 50)");

    node.each(function(d) {
      const krData = d.data.data.keyResults.slice(0, 2); // Show max 2 KRs
      const group = d3.select(this).select("g:last-child");

      krData.forEach((kr, index) => {
        const krY = index * 25;
        
        // KR icon
        group.append("circle")
          .attr("cx", 8)
          .attr("cy", krY + 12)
          .attr("r", 8)
          .attr("fill", "#e0e7ff");

        group.append("text")
          .attr("x", 8)
          .attr("y", krY + 16)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#4f46e5")
          .text("KR");

        // KR title
        group.append("text")
          .attr("x", 24)
          .attr("y", krY + 16)
          .attr("font-size", "12px")
          .attr("fill", "#4b5563")
          .text(() => {
            const title = kr.title;
            return title.length > 30 ? title.substring(0, 30) + "..." : title;
          });

        // KR progress
        group.append("text")
          .attr("x", nodeWidth - 24)
          .attr("y", krY + 16)
          .attr("text-anchor", "end")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .attr("fill", "#111827")
          .text(`${calculateKeyResultProgress(kr).toFixed(0)}%`);
      });

      if (d.data.data.keyResults.length > 2) {
        group.append("text")
          .attr("x", 24)
          .attr("y", 65)
          .attr("font-size", "11px")
          .attr("fill", "#6b7280")
          .text(`+${d.data.data.keyResults.length - 2} more`);
      }
    });

    // Add click handler for nodes
    node.style("cursor", "pointer")
      .on("click", (event, d) => {
        if (onNodeClick) {
          onNodeClick(d.data.data);
        }
      });

    // Zoom controls
    const handleZoomIn = () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.2);
    };

    const handleZoomOut = () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.8);
    };

    const handleReset = () => {
      svg.transition().duration(750).call(zoom.transform, initialTransform);
    };

    // Store handlers for cleanup
    (window as any).d3ZoomHandlers = {
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      reset: handleReset
    };

  }, [okrs, expandedNodes, onToggleExpand, onNodeClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => (window as any).d3ZoomHandlers?.zoomIn()}
          className="bg-white"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => (window as any).d3ZoomHandlers?.zoomOut()}
          className="bg-white"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => (window as any).d3ZoomHandlers?.reset()}
          className="bg-white"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}