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
  Filter,
  Target,
  Users,
  Zap
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'objective' | 'key_result' | 'initiative' | 'user';
  label: string;
  group: string;
  status: string;
  progress?: number;
  ownerId?: string;
  teamId?: string;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  type: 'owns' | 'contributes' | 'supports' | 'depends';
  strength: number;
}

export default function GoalNetworkVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [simulation, setSimulation] = useState<any>(null);

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

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
  });

  // Transform data into network format
  const buildNetworkData = () => {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // Add objective nodes
    (objectives as any[]).forEach((obj: any) => {
      nodes.push({
        id: obj.id,
        type: 'objective',
        label: obj.title,
        group: obj.teamId || obj.ownerId || 'individual',
        status: obj.status,
        progress: obj.progress || 0,
        ownerId: obj.ownerId,
        teamId: obj.teamId,
      });

      // Link to owner
      if (obj.ownerId) {
        links.push({
          source: obj.ownerId,
          target: obj.id,
          type: 'owns',
          strength: 1.0,
        });
      }
    });

    // Add key result nodes and links
    (keyResults as any[]).forEach((kr: any) => {
      nodes.push({
        id: kr.id,
        type: 'key_result',
        label: kr.title,
        group: kr.objectiveId,
        status: kr.status,
        progress: calculateKeyResultProgress(kr),
        ownerId: kr.assignedTo,
      });

      // Link to objective
      if (kr.objectiveId) {
        links.push({
          source: kr.objectiveId,
          target: kr.id,
          type: 'supports',
          strength: 0.8,
        });
      }

      // Link to assignee
      if (kr.assignedTo) {
        links.push({
          source: kr.assignedTo,
          target: kr.id,
          type: 'contributes',
          strength: 0.6,
        });
      }
    });

    // Add initiative nodes and links
    (initiatives as any[]).forEach((init: any) => {
      nodes.push({
        id: init.id,
        type: 'initiative',
        label: init.title,
        group: init.keyResultId || init.picId || 'standalone',
        status: init.status,
        progress: init.progress || 0,
        ownerId: init.picId,
      });

      // Link to key result
      if (init.keyResultId) {
        links.push({
          source: init.keyResultId,
          target: init.id,
          type: 'supports',
          strength: 0.7,
        });
      }

      // Link to PIC
      if (init.picId) {
        links.push({
          source: init.picId,
          target: init.id,
          type: 'owns',
          strength: 0.9,
        });
      }
    });

    // Add user nodes
    (users as any[]).forEach((user: any) => {
      nodes.push({
        id: user.id,
        type: 'user',
        label: `${user.firstName} ${user.lastName}`,
        group: user.teamId || 'individual',
        status: 'active',
      });
    });

    return { nodes, links };
  };

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

  const getNodeColor = (node: NetworkNode) => {
    switch (node.type) {
      case 'objective':
        return node.status === 'on_track' ? '#10b981' : 
               node.status === 'at_risk' ? '#f59e0b' : 
               node.status === 'behind' ? '#ef4444' : '#6b7280';
      case 'key_result':
        return (node.progress || 0) >= 100 ? '#10b981' :
               (node.progress || 0) >= 70 ? '#3b82f6' :
               (node.progress || 0) >= 40 ? '#f59e0b' : '#ef4444';
      case 'initiative':
        return node.status === 'sedang_berjalan' ? '#8b5cf6' :
               node.status === 'selesai' ? '#10b981' :
               node.status === 'dibatalkan' ? '#ef4444' : '#6b7280';
      case 'user':
        return '#1f2937';
      default:
        return '#6b7280';
    }
  };

  const getNodeSize = (node: NetworkNode) => {
    switch (node.type) {
      case 'objective': return 12;
      case 'key_result': return 8;
      case 'initiative': return 6;
      case 'user': return 10;
      default: return 6;
    }
  };

  const renderNetwork = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const { nodes, links } = buildNetworkData();

    // Filter nodes and links based on selected filter
    let filteredNodes = nodes;
    let filteredLinks = links;

    if (selectedFilter !== "all") {
      if (selectedFilter === "objectives") {
        filteredNodes = nodes.filter(n => n.type === 'objective' || n.type === 'user');
      } else if (selectedFilter === "key_results") {
        filteredNodes = nodes.filter(n => ['objective', 'key_result', 'user'].includes(n.type));
      } else if (selectedFilter === "initiatives") {
        filteredNodes = nodes.filter(n => ['key_result', 'initiative', 'user'].includes(n.type));
      }

      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = links.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });
    }

    // Create simulation
    const sim = d3.forceSimulation(filteredNodes as any)
      .force("link", d3.forceLink(filteredLinks as any)
        .id((d: any) => d.id)
        .distance((d: any) => 50 + (1 - d.strength) * 50))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => getNodeSize(d) + 2));

    setSimulation(sim);

    // Create container with zoom
    const container = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter().append("line")
      .attr("stroke", d => {
        switch (d.type) {
          case 'owns': return "#ef4444";
          case 'contributes': return "#3b82f6";
          case 'supports': return "#10b981";
          case 'depends': return "#f59e0b";
          default: return "#6b7280";
        }
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.strength * 3));

    // Create nodes
    const node = container.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .enter().append("g")
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", (event, d: NetworkNode) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d: NetworkNode) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d: NetworkNode) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => getNodeSize(d))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("click", (event, d) => {
        setSelectedNode(d);
      })
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 3);
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("stroke-width", 1.5);
      });

    // Add labels to nodes
    node.append("text")
      .text(d => d.label.length > 20 ? d.label.substring(0, 20) + "..." : d.label)
      .attr("font-size", "10px")
      .attr("dx", d => getNodeSize(d) + 5)
      .attr("dy", "0.35em")
      .attr("fill", "#374151");

    // Update positions on simulation tick
    sim.on("tick", () => {
      link
        .attr("x1", d => (d.source as NetworkNode).x!)
        .attr("y1", d => (d.source as NetworkNode).y!)
        .attr("x2", d => (d.target as NetworkNode).x!)
        .attr("y2", d => (d.target as NetworkNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
  };

  useEffect(() => {
    if ((objectives as any[]).length > 0 && (keyResults as any[]).length > 0) {
      renderNetwork();
    }
  }, [objectives, keyResults, initiatives, users, selectedFilter]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.67
      );
    }
  };

  const handleReset = () => {
    if (simulation) {
      simulation.alpha(1).restart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collaborative Goal Network</h2>
          <p className="text-gray-600">Visualisasi koneksi antara objective, angka target, dan inisiatif</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter tampilan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Koneksi</SelectItem>
              <SelectItem value="objectives">Objective Focus</SelectItem>
              <SelectItem value="key_results">Angka Target Focus</SelectItem>
              <SelectItem value="initiatives">Inisiatif Focus</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Network Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <svg
                ref={svgRef}
                width="100%"
                height="600"
                viewBox="0 0 800 600"
                className="border rounded-lg bg-gray-50"
              />
            </CardContent>
          </Card>
        </div>

        {/* Legend and Node Details */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Objective</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm">Angka Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-sm">Inisiatif</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-gray-800 rounded-full"></div>
                  <span className="text-sm">User</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-500"></div>
                  <span className="text-sm">Owns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span className="text-sm">Contributes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-sm">Supports</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {selectedNode.type === 'objective' && <Target className="h-4 w-4" />}
                  {selectedNode.type === 'key_result' && <Zap className="h-4 w-4" />}
                  {selectedNode.type === 'initiative' && <Users className="h-4 w-4" />}
                  {selectedNode.type === 'user' && <Users className="h-4 w-4" />}
                  Detail Node
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedNode.label}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedNode.type === 'objective' ? 'Objective' :
                     selectedNode.type === 'key_result' ? 'Angka Target' :
                     selectedNode.type === 'initiative' ? 'Inisiatif' : 'User'}
                  </Badge>
                </div>

                {selectedNode.progress !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{selectedNode.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${selectedNode.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}