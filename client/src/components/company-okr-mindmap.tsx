import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Target,
  Users,
  Zap,
  Maximize2,
  Eye,
  Layers,
  GitBranch
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
  type: 'company' | 'department' | 'objective' | 'key_result' | 'initiative';
  status: string;
  progress?: number;
  owner?: string;
  department?: string;
  value?: string;
  priority?: string;
  children?: MindmapNode[];
  _children?: MindmapNode[];
  x0?: number;
  y0?: number;
}

export default function CompanyOKRMindmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [currentTransform, setCurrentTransform] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'radial'>('tree');

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

    return 0;
  };

  const buildCompanyOKRData = (): MindmapNode => {
    const userMap = new Map((users as any[]).map(u => [u.id, `${u.firstName} ${u.lastName}`]));
    const teamMap = new Map((teams as any[]).map(t => [t.id, t.name]));
    
    // Group objectives by team/department
    const objectivesByTeam = new Map<string, any[]>();
    
    (objectives as any[]).forEach(obj => {
      const teamId = obj.teamId || 'individual';
      if (!objectivesByTeam.has(teamId)) {
        objectivesByTeam.set(teamId, []);
      }
      objectivesByTeam.get(teamId)?.push(obj);
    });

    // Build company root node
    const companyNode: MindmapNode = {
      id: 'company',
      name: 'Company OKRs',
      type: 'company',
      status: 'active',
      progress: 0,
      children: []
    };

    // Create department nodes
    Array.from(objectivesByTeam.entries()).forEach(([teamId, teamObjectives]) => {
      const teamName = teamId === 'individual' ? 'Individual Goals' : teamMap.get(teamId) || 'Unknown Team';
      
      const departmentNode: MindmapNode = {
        id: `dept-${teamId}`,
        name: teamName,
        type: 'department',
        status: 'active',
        department: teamName,
        children: []
      };

      // Add objectives to department
      teamObjectives.forEach((obj: any) => {
        const objectiveProgress = (keyResults as any[])
          .filter((kr: any) => kr.objectiveId === obj.id)
          .reduce((sum: number, kr: any) => sum + calculateKeyResultProgress(kr), 0) /
          Math.max(1, (keyResults as any[]).filter((kr: any) => kr.objectiveId === obj.id).length);

        const objectiveNode: MindmapNode = {
          id: obj.id,
          name: obj.title,
          type: 'objective',
          status: obj.status || 'active',
          progress: objectiveProgress,
          owner: userMap.get(obj.ownerId) || 'Unknown',
          department: teamName,
          children: []
        };

        // Add key results
        (keyResults as any[])
          .filter((kr: any) => kr.objectiveId === obj.id)
          .forEach((kr: any) => {
            const krProgress = calculateKeyResultProgress(kr);
            
            const krNode: MindmapNode = {
              id: kr.id,
              name: kr.title,
              type: 'key_result',
              status: kr.status || 'active',
              progress: krProgress,
              owner: userMap.get(kr.assignedTo) || userMap.get(obj.ownerId) || 'Unknown',
              value: `${kr.currentValue}/${kr.targetValue} ${kr.unit}`,
              children: []
            };

            // Add initiatives
            (initiatives as any[])
              .filter((init: any) => init.keyResultId === kr.id)
              .forEach((init: any) => {
                const initNode: MindmapNode = {
                  id: init.id,
                  name: init.title,
                  type: 'initiative',
                  status: init.status || 'draft',
                  progress: init.progress || 0,
                  owner: userMap.get(init.pic) || 'Unknown',
                  priority: init.priorityLevel || 'medium'
                };
                
                krNode.children?.push(initNode);
              });

            objectiveNode.children?.push(krNode);
          });

        departmentNode.children?.push(objectiveNode);
      });

      // Calculate department progress
      const deptChildren = departmentNode.children || [];
      const deptTotalProgress = deptChildren.reduce((sum, obj) => sum + (obj.progress || 0), 0);
      departmentNode.progress = deptChildren.length > 0 ? deptTotalProgress / deptChildren.length : 0;

      companyNode.children?.push(departmentNode);
    });

    // Calculate company progress
    const totalProgress = companyNode.children?.reduce((sum, dept) => sum + (dept.progress || 0), 0) || 0;
    const childCount = companyNode.children?.length || 0;
    companyNode.progress = childCount > 0 ? totalProgress / childCount : 0;

    return companyNode;
  };

  const renderCompanyMindmap = () => {
    if (!svgRef.current) return;

    const width = 1400;
    const height = 800;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll("*").remove();

    // Add modern gradients and filters
    const defs = svg.append("defs");
    
    // Create gradients for each level
    const createGradient = (id: string, color1: string, color2: string) => {
      const gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", color1);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", color2);
    };

    createGradient("companyGradient", "#1e40af", "#3730a3");
    createGradient("departmentGradient", "#2563eb", "#4f46e5");
    createGradient("objectiveGradient", "#3b82f6", "#6366f1");
    createGradient("keyResultGradient", "#10b981", "#06b6d4");
    createGradient("initiativeGradient", "#8b5cf6", "#ec4899");

    // Add shadow filter
    const filter = defs.append("filter")
      .attr("id", "dropShadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3);
    
    filter.append("feOffset")
      .attr("dx", 0)
      .attr("dy", 2)
      .attr("result", "offsetblur");
    
    filter.append("feFlood")
      .attr("flood-color", "#000000")
      .attr("flood-opacity", "0.1");
    
    filter.append("feComposite")
      .attr("in2", "offsetblur")
      .attr("operator", "in");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentTransform(event.transform);
      });
    
    svg.call(zoom);

    const data = buildCompanyOKRData();
    
    // Create hierarchy
    const root = d3.hierarchy(data);
    
    let layout: any;
    if (viewMode === 'radial') {
      // Radial layout
      layout = d3.tree<MindmapNode>()
        .size([2 * Math.PI, Math.min(width, height) / 2 - 200])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
      
      layout(root);
      
      // Transform for radial
      g.attr("transform", `translate(${width / 2},${height / 2})`);
    } else {
      // Horizontal tree layout
      layout = d3.tree<MindmapNode>()
        .size([height - 100, width - 300]);
      
      layout(root);
      
      g.attr("transform", "translate(150, 50)");
    }

    // Draw links
    const linkGenerator = viewMode === 'radial' 
      ? d3.linkRadial<any, any>()
          .angle(d => d.x)
          .radius(d => d.y)
      : d3.linkHorizontal<any, any>()
          .x(d => d.y)
          .y(d => d.x);

    const link = g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator)
      .style("fill", "none")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", d => Math.max(1, 5 - d.source.depth))
      .style("opacity", 0.6);

    // Create node groups
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => {
        if (viewMode === 'radial') {
          const angle = (d.x || 0) - Math.PI / 2;
          const radius = d.y || 0;
          return `translate(${radius * Math.cos(angle)},${radius * Math.sin(angle)})`;
        } else {
          return `translate(${d.y || 0},${d.x || 0})`;
        }
      })
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d.data);
        event.stopPropagation();
      });

    // Node styling based on type
    const getNodeStyle = (d: any) => {
      switch (d.data.type) {
        case 'company':
          return { fill: "url(#companyGradient)", size: 60 };
        case 'department':
          return { fill: "url(#departmentGradient)", size: 50 };
        case 'objective':
          return { fill: "url(#objectiveGradient)", size: 40 };
        case 'key_result':
          return { fill: "url(#keyResultGradient)", size: 35 };
        case 'initiative':
          return { fill: "url(#initiativeGradient)", size: 30 };
        default:
          return { fill: "#6b7280", size: 25 };
      }
    };

    // Add rectangular nodes with rounded corners
    node.append("rect")
      .attr("width", d => {
        const style = getNodeStyle(d);
        return style.size * 3;
      })
      .attr("height", d => {
        const style = getNodeStyle(d);
        return style.size;
      })
      .attr("x", d => {
        const style = getNodeStyle(d);
        return -style.size * 1.5;
      })
      .attr("y", d => {
        const style = getNodeStyle(d);
        return -style.size / 2;
      })
      .attr("rx", 8)
      .style("fill", d => getNodeStyle(d).fill)
      .style("stroke", "#fff")
      .style("stroke-width", 2)
      .style("filter", "url(#dropShadow)")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("stroke-width", 3)
          .style("stroke", "#3b82f6");
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("stroke-width", 2)
          .style("stroke", "#fff");
      });

    // Add progress bars
    node.filter(d => d.data.progress !== undefined)
      .append("rect")
      .attr("width", d => {
        const style = getNodeStyle(d);
        const width = style.size * 3 - 8;
        return width * (d.data.progress || 0) / 100;
      })
      .attr("height", 4)
      .attr("x", d => {
        const style = getNodeStyle(d);
        return -style.size * 1.5 + 4;
      })
      .attr("y", d => {
        const style = getNodeStyle(d);
        return style.size / 2 - 8;
      })
      .attr("rx", 2)
      .style("fill", d => {
        const progress = d.data.progress || 0;
        if (progress >= 80) return "#10b981";
        if (progress >= 60) return "#3b82f6";
        if (progress >= 40) return "#f59e0b";
        return "#ef4444";
      })
      .style("opacity", 0.8);

    // Add icons
    const icons: Record<string, string> = {
      company: "🏢",
      department: "🏗️",
      objective: "🎯",
      key_result: "📊",
      initiative: "🚀"
    };

    node.append("text")
      .attr("x", d => {
        const style = getNodeStyle(d);
        return -style.size * 1.3;
      })
      .attr("dy", "0.35em")
      .style("font-size", d => {
        const style = getNodeStyle(d);
        return style.size * 0.5;
      })
      .style("text-anchor", "start")
      .text(d => icons[d.data.type] || "");

    // Add labels
    node.append("text")
      .attr("x", d => {
        const style = getNodeStyle(d);
        return -style.size * 0.8;
      })
      .attr("dy", "0.35em")
      .style("font-size", d => {
        switch (d.data.type) {
          case 'company': return "16px";
          case 'department': return "14px";
          case 'objective': return "12px";
          case 'key_result': return "11px";
          case 'initiative': return "10px";
          default: return "10px";
        }
      })
      .style("font-weight", d => d.data.type === 'company' || d.data.type === 'department' ? "600" : "400")
      .style("fill", "white")
      .text(d => {
        const maxLength = 20;
        return d.data.name.length > maxLength ? 
               d.data.name.substring(0, maxLength) + "..." : 
               d.data.name;
      });

    // Add progress text
    node.filter(d => d.data.progress !== undefined)
      .append("text")
      .attr("x", d => {
        const style = getNodeStyle(d);
        return style.size * 1.3;
      })
      .attr("dy", "0.35em")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "white")
      .style("text-anchor", "end")
      .text(d => `${Math.round(d.data.progress || 0)}%`);

    // Center the view initially
    if (!currentTransform) {
      const bounds = g.node() as SVGGElement;
      if (bounds) {
        try {
          const bbox = bounds.getBBox();
          const fullWidth = width;
          const fullHeight = height;
          const midX = bbox.x + bbox.width / 2;
          const midY = bbox.y + bbox.height / 2;
          const scale = 0.9 / Math.max(bbox.width / fullWidth, bbox.height / fullHeight);
          const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
          
          svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        } catch (e) {
          // Ignore getBBox errors
        }
      }
    }
  };

  useEffect(() => {
    if (objectives && Array.isArray(objectives) && objectives.length > 0) {
      renderCompanyMindmap();
    }
  }, [objectives, keyResults, initiatives, users, teams, viewMode]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7
      );
    }
  };

  const handleReset = () => {
    renderCompanyMindmap();
  };

  const handleFitToScreen = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const gNode = svg.select("g").node() as SVGGElement;
      if (gNode) {
        try {
          const bounds = gNode.getBBox();
          if (bounds) {
            const fullWidth = 1400;
            const fullHeight = 800;
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
          // Ignore getBBox errors
        }
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      completed: { label: "Selesai", className: "bg-green-100 text-green-800" },
      on_track: { label: "On Track", className: "bg-blue-100 text-blue-800" },
      at_risk: { label: "At Risk", className: "bg-yellow-100 text-yellow-800" },
      behind: { label: "Terlambat", className: "bg-red-100 text-red-800" },
      active: { label: "Aktif", className: "bg-blue-100 text-blue-800" },
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Company OKR Mindmap</h2>
          <Select value={viewMode} onValueChange={(value: 'tree' | 'radial') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Tree View
                </div>
              </SelectItem>
              <SelectItem value="radial">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Radial View
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleFitToScreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="bg-gray-50">
            <CardContent className="p-0">
              <svg
                ref={svgRef}
                width="100%"
                height="800"
                viewBox="0 0 1400 800"
                className="w-full h-full bg-white rounded-lg"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Selected Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detail Node</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedNode.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Tipe</p>
                  <p className="font-medium capitalize">{selectedNode.type.replace('_', ' ')}</p>
                </div>

                {selectedNode.status && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(selectedNode.status)}
                  </div>
                )}

                {selectedNode.progress !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progress</p>
                    <Progress value={selectedNode.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(selectedNode.progress)}%</p>
                  </div>
                )}

                {selectedNode.owner && (
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{selectedNode.owner}</p>
                  </div>
                )}

                {selectedNode.department && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedNode.department}</p>
                  </div>
                )}

                {selectedNode.value && (
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-medium">{selectedNode.value}</p>
                  </div>
                )}

                {selectedNode.priority && (
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={
                      selectedNode.priority === 'critical' ? 'destructive' :
                      selectedNode.priority === 'high' ? 'default' :
                      'secondary'
                    }>
                      {selectedNode.priority}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(to right, #1e40af, #3730a3)" }} />
                <span className="text-sm">Company Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(to right, #2563eb, #4f46e5)" }} />
                <span className="text-sm">Department</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(to right, #3b82f6, #6366f1)" }} />
                <span className="text-sm">Objective</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(to right, #10b981, #06b6d4)" }} />
                <span className="text-sm">Key Result</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(to right, #8b5cf6, #ec4899)" }} />
                <span className="text-sm">Initiative</span>
              </div>
            </CardContent>
          </Card>

          {/* View Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">View Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <Eye className="inline h-3 w-3 mr-1" />
                Click nodes to view details
              </p>
              <p className="text-sm text-muted-foreground">
                <ZoomIn className="inline h-3 w-3 mr-1" />
                Zoom in/out for navigation
              </p>
              <p className="text-sm text-muted-foreground">
                <Maximize2 className="inline h-3 w-3 mr-1" />
                Fit to screen to see all
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}