import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Target,
  Users,
  Zap,
  Maximize2
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MindmapNode {
  id: string;
  name: string;
  type: 'root' | 'objective' | 'key_result' | 'initiative';
  status: string;
  progress?: number;
  owner?: string;
  children?: MindmapNode[];
  x?: number;
  y?: number;
  _children?: MindmapNode[];
}

export default function GoalMindmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [currentTransform, setCurrentTransform] = useState<any>(null);

  // Fetch data
  const { data: objectives = [] } = useQuery({
    queryKey: ["/api/objectives"],
  });

  const { data: keyResults = [] } = useQuery({
    queryKey: ["/api/key-results"],
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const calculateKeyResultProgress = (keyResult: any): number => {
    const current = Number(keyResult.currentValue) || 0;
    const target = Number(keyResult.targetValue) || 0;
    const base = Number(keyResult.baseValue) || 0;

    if (keyResult.keyResultType === "achieve_or_not") {
      return keyResult.achieved ? 100 : 0;
    }

    if (keyResult.keyResultType === "increase_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((current - base) / (target - base)) * 100));
    }

    if (keyResult.keyResultType === "decrease_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((base - current) / (base - target)) * 100));
    }

    if (keyResult.keyResultType === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (keyResult.keyResultType === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  const buildMindmapData = (): MindmapNode => {
    const userMap = new Map((users as any[]).map(u => [u.id, `${u.firstName} ${u.lastName}`]));
    
    const rootNode: MindmapNode = {
      id: 'root',
      name: 'Goal System',
      type: 'root',
      status: 'active',
      children: []
    };

    // Build tree structure
    (objectives as any[]).forEach((obj: any) => {
      const objNode: MindmapNode = {
        id: obj.id,
        name: obj.title,
        type: 'objective',
        status: obj.status,
        progress: obj.progress || 0,
        owner: userMap.get(obj.ownerId) || 'Unknown',
        children: []
      };

      // Add key results to objective
      (keyResults as any[]).forEach((kr: any) => {
        if (kr.objectiveId === obj.id) {
          const krNode: MindmapNode = {
            id: kr.id,
            name: kr.title,
            type: 'key_result',
            status: kr.status,
            progress: calculateKeyResultProgress(kr),
            owner: userMap.get(kr.assignedTo) || 'Belum ditentukan',
            children: []
          };

          // Add initiatives to key result
          (initiatives as any[]).forEach((init: any) => {
            if (init.keyResultId === kr.id) {
              const initNode: MindmapNode = {
                id: init.id,
                name: init.title,
                type: 'initiative',
                status: init.status,
                progress: init.progress || 0,
                owner: userMap.get(init.picId) || 'Belum ditentukan'
              };

              krNode.children!.push(initNode);
            }
          });

          objNode.children!.push(krNode);
        }
      });

      // Only add objectives that have key results or show all based on filter
      if (selectedFilter === "all" || objNode.children!.length > 0) {
        rootNode.children!.push(objNode);
      }
    });

    return rootNode;
  };

  const getNodeColor = (node: MindmapNode) => {
    switch (node.type) {
      case 'root':
        return '#1f2937';
      case 'objective':
        return node.status === 'on_track' ? '#10b981' : 
               node.status === 'at_risk' ? '#f59e0b' : 
               node.status === 'behind' ? '#ef4444' : '#3b82f6';
      case 'key_result':
        return (node.progress || 0) >= 100 ? '#10b981' :
               (node.progress || 0) >= 70 ? '#3b82f6' :
               (node.progress || 0) >= 40 ? '#f59e0b' : '#ef4444';
      case 'initiative':
        return node.status === 'sedang_berjalan' ? '#8b5cf6' :
               node.status === 'selesai' ? '#10b981' :
               node.status === 'dibatalkan' ? '#ef4444' : '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getNodeSize = (node: MindmapNode) => {
    switch (node.type) {
      case 'root': return 20;
      case 'objective': return 16;
      case 'key_result': return 12;
      case 'initiative': return 8;
      default: return 8;
    }
  };

  const renderMindmap = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 700;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    // Create main group
    const g = svg.append("g");

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentTransform(event.transform);
      });

    svg.call(zoom);

    // Build tree layout
    const root = d3.hierarchy(buildMindmapData());
    const treeLayout = d3.tree<MindmapNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
      .separation((a, b) => a.parent === b.parent ? 1 : 2);

    treeLayout(root);

    // Create links
    const link = g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y + margin.left)
        .y(d => d.x + margin.top))
      .style("fill", "none")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", 2);

    // Create nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${(d.y || 0) + margin.left},${(d.x || 0) + margin.top})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d.data);
        event.stopPropagation();
      });

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => getNodeSize(d.data))
      .style("fill", d => getNodeColor(d.data))
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Add progress rings for nodes with progress
    node.filter(d => d.data.progress !== undefined)
      .append("circle")
      .attr("r", d => getNodeSize(d.data) + 3)
      .style("fill", "none")
      .style("stroke", d => getNodeColor(d.data))
      .style("stroke-width", 2)
      .style("stroke-dasharray", d => {
        const radius = getNodeSize(d.data) + 3;
        const circumference = 2 * Math.PI * radius;
        const progress = (d.data.progress || 0) / 100;
        return `${circumference * progress} ${circumference * (1 - progress)}`;
      })
      .style("stroke-dashoffset", d => {
        const radius = getNodeSize(d.data) + 3;
        const circumference = 2 * Math.PI * radius;
        return -circumference / 4; // Start from top
      });

    // Add labels
    node.append("text")
      .attr("dy", ".35em")
      .attr("x", d => (d.children && d.children.length > 0) ? -getNodeSize(d.data) - 10 : getNodeSize(d.data) + 10)
      .style("text-anchor", d => (d.children && d.children.length > 0) ? "end" : "start")
      .style("font-size", d => {
        switch (d.data.type) {
          case 'root': return "16px";
          case 'objective': return "14px";
          case 'key_result': return "12px";
          case 'initiative': return "10px";
          default: return "10px";
        }
      })
      .style("font-weight", d => d.data.type === 'root' || d.data.type === 'objective' ? "bold" : "normal")
      .style("fill", "#374151")
      .text(d => {
        const maxLength = d.data.type === 'root' ? 20 : 
                         d.data.type === 'objective' ? 30 : 25;
        return d.data.name.length > maxLength ? 
               d.data.name.substring(0, maxLength) + "..." : 
               d.data.name;
      });

    // Add progress text for nodes with progress
    node.filter(d => d.data.progress !== undefined && d.data.type !== 'root')
      .append("text")
      .attr("dy", "1.5em")
      .attr("x", d => (d.children && d.children.length > 0) ? -getNodeSize(d.data) - 10 : getNodeSize(d.data) + 10)
      .style("text-anchor", d => (d.children && d.children.length > 0) ? "end" : "start")
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .text(d => `${(d.data.progress || 0).toFixed(0)}%`);

    // Add owner text
    node.filter(d => Boolean(d.data.owner) && d.data.type !== 'root')
      .append("text")
      .attr("dy", d => d.data.progress !== undefined ? "2.7em" : "1.5em")
      .attr("x", d => (d.children && d.children.length > 0) ? -getNodeSize(d.data) - 10 : getNodeSize(d.data) + 10)
      .style("text-anchor", d => (d.children && d.children.length > 0) ? "end" : "start")
      .style("font-size", "9px")
      .style("fill", "#9ca3af")
      .text(d => `👤 ${d.data.owner}`);

    // Add hover effects
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle")
        .style("stroke-width", 4)
        .style("filter", "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).select("circle")
        .style("stroke-width", 2)
        .style("filter", "none");
    });

    // Center the view initially
    if (!currentTransform) {
      const gNode = g.node() as SVGGElement;
      if (gNode) {
        try {
          const bounds = gNode.getBBox();
          if (bounds) {
            const fullWidth = width;
            const fullHeight = height;
            const midX = bounds.x + bounds.width / 2;
            const midY = bounds.y + bounds.height / 2;
            const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
            
            svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
          }
        } catch (e) {
          // getBBox might fail in some cases, just ignore
        }
      }
    }
  };

  useEffect(() => {
    if ((objectives as any[]).length > 0) {
      renderMindmap();
    }
  }, [objectives, keyResults, initiatives, users, selectedFilter]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.67
      );
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      renderMindmap();
    }
  };

  const handleFitToScreen = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const gNode = svg.select("g").node() as SVGGElement;
      if (gNode) {
        try {
          const bounds = gNode.getBBox();
          if (bounds) {
            const fullWidth = 1000;
            const fullHeight = 700;
            const width = bounds.width;
            const height = bounds.height;
            const midX = bounds.x + width / 2;
            const midY = bounds.y + height / 2;
            const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
            
            svg.transition().duration(750).call(
              d3.zoom<SVGSVGElement, unknown>().transform as any,
              d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
          }
        } catch (e) {
          // getBBox might fail in some cases, just ignore
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goal Mindmap</h2>
          <p className="text-gray-600">Visualisasi hierarkis tujuan organisasi dalam bentuk mindmap</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter tampilan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tampilkan Semua</SelectItem>
              <SelectItem value="active">Hanya Aktif</SelectItem>
              <SelectItem value="progress">Dengan Progress</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleFitToScreen} title="Fit to Screen">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} title="Reset View">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mindmap Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <svg
                ref={svgRef}
                width="100%"
                height="700"
                viewBox="0 0 1000 700"
                className="border rounded-lg bg-gradient-to-br from-blue-50 to-white"
              />
            </CardContent>
          </Card>
        </div>

        {/* Controls and Node Details */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                  <span className="text-sm">Root System</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Objective</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-sm">Angka Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-sm">Inisiatif</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 mb-2">Indikator Progress:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-green-500 rounded-full relative">
                      <div className="absolute inset-0 border-2 border-green-500 rounded-full" 
                           style={{clipPath: "polygon(0 0, 75% 0, 75% 100%, 0 100%)"}}></div>
                    </div>
                    <span className="text-xs">Ring menunjukkan % progress</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 mb-1">Kontrol:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Klik node untuk detail</p>
                  <p>• Scroll untuk zoom</p>
                  <p>• Drag untuk pan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {selectedNode.type === 'root' && <Target className="h-4 w-4" />}
                  {selectedNode.type === 'objective' && <Target className="h-4 w-4" />}
                  {selectedNode.type === 'key_result' && <Zap className="h-4 w-4" />}
                  {selectedNode.type === 'initiative' && <Users className="h-4 w-4" />}
                  Detail Node
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedNode.name}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedNode.type === 'root' ? 'Root' :
                     selectedNode.type === 'objective' ? 'Objective' :
                     selectedNode.type === 'key_result' ? 'Angka Target' : 'Inisiatif'}
                  </Badge>
                </div>

                {selectedNode.progress !== undefined && selectedNode.type !== 'root' && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{selectedNode.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${selectedNode.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {selectedNode.status && selectedNode.type !== 'root' && (
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge 
                      variant="outline"
                      className={
                        selectedNode.status === 'on_track' || selectedNode.status === 'sedang_berjalan' ? 'border-green-300 text-green-700' :
                        selectedNode.status === 'at_risk' ? 'border-yellow-300 text-yellow-700' :
                        selectedNode.status === 'behind' || selectedNode.status === 'dibatalkan' ? 'border-red-300 text-red-700' :
                        'border-gray-300 text-gray-700'
                      }
                    >
                      {selectedNode.status}
                    </Badge>
                  </div>
                )}

                {selectedNode.owner && (
                  <div>
                    <p className="text-sm text-gray-600">Owner</p>
                    <p className="text-sm">{selectedNode.owner}</p>
                  </div>
                )}

                {selectedNode.children && (
                  <div>
                    <p className="text-sm text-gray-600">Sub Items</p>
                    <p className="text-sm">{selectedNode.children.length} item terhubung</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}