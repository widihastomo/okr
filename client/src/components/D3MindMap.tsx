import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  label: string;
  type: 'goal' | 'keyResult' | 'initiative' | 'task';
  icon: string;
  description: string;
  color: string;
  size: number;
}

interface Link {
  source: string;
  target: string;
}

interface D3MindMapProps {
  width?: number;
  height?: number;
}

const D3MindMap: React.FC<D3MindMapProps> = ({ width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const nodes: Node[] = [
    {
      id: 'goal',
      label: 'GOAL',
      type: 'goal',
      icon: '🎯',
      description: 'Meningkatkan pendapatan perusahaan 35%',
      color: '#f97316', // Orange
      size: 80
    },
    {
      id: 'kr1',
      label: 'Penjualan 500M',
      type: 'keyResult',
      icon: '📊',
      description: 'Penjualan Rp 500 juta/bulan',
      color: '#3b82f6', // Blue
      size: 60
    },
    {
      id: 'kr2',
      label: '100 Pelanggan',
      type: 'keyResult',
      icon: '🎯',
      description: '100 pelanggan baru',
      color: '#3b82f6',
      size: 60
    },
    {
      id: 'kr3',
      label: 'Konversi 25%',
      type: 'keyResult',
      icon: '📈',
      description: 'Conversion rate 25%',
      color: '#3b82f6',
      size: 60
    },
    {
      id: 'init1',
      label: 'Kampanye Digital',
      type: 'initiative',
      icon: '🚀',
      description: 'Kampanye digital marketing',
      color: '#10b981', // Green
      size: 50
    },
    {
      id: 'init2',
      label: 'Program Loyalitas',
      type: 'initiative',
      icon: '💎',
      description: 'Program loyalitas pelanggan',
      color: '#10b981',
      size: 50
    },
    {
      id: 'task1',
      label: 'Konten Instagram',
      type: 'task',
      icon: '✅',
      description: 'Buat konten Instagram',
      color: '#8b5cf6', // Purple
      size: 40
    },
    {
      id: 'task2',
      label: 'Telepon Prospek',
      type: 'task',
      icon: '📞',
      description: 'Telepon 5 prospek',
      color: '#8b5cf6',
      size: 40
    },
    {
      id: 'task3',
      label: 'Analisis Kompetitor',
      type: 'task',
      icon: '📊',
      description: 'Analisis kompetitor',
      color: '#8b5cf6',
      size: 40
    }
  ];

  const links: Link[] = [
    { source: 'goal', target: 'kr1' },
    { source: 'goal', target: 'kr2' },
    { source: 'goal', target: 'kr3' },
    { source: 'goal', target: 'init1' },
    { source: 'goal', target: 'init2' },
    { source: 'goal', target: 'task1' },
    { source: 'goal', target: 'task2' },
    { source: 'goal', target: 'task3' }
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create container group
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size / 2 + 10));

    // Create gradient definitions
    const defs = container.append('defs');
    
    // Goal gradient
    const goalGradient = defs.append('linearGradient')
      .attr('id', 'goalGradient')
      .attr('gradientUnits', 'objectBoundingBox');
    goalGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f97316');
    goalGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c');

    // Other gradients
    const blueGradient = defs.append('linearGradient')
      .attr('id', 'blueGradient')
      .attr('gradientUnits', 'objectBoundingBox');
    blueGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
    blueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#1d4ed8');

    // Create links
    const link = container.selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('stroke-width', 3)
      .attr('opacity', 0.7);

    // Create node groups
    const nodeGroup = container.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Add node circles with gradients
    nodeGroup.append('circle')
      .attr('r', (d: Node) => d.size / 2)
      .attr('fill', (d: Node) => {
        if (d.type === 'goal') return 'url(#goalGradient)';
        if (d.type === 'keyResult') return 'url(#blueGradient)';
        return d.color;
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');

    // Add node labels (icons)
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', (d: Node) => `${d.size / 3}px`)
      .style('pointer-events', 'none')
      .text((d: Node) => d.icon);

    // Add text labels below nodes
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: Node) => d.size / 2 + 20)
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d: Node) => d.label);

    // Add hover effects
    nodeGroup
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', (d as Node).size / 2 * 1.2);
        
        // Show tooltip
        const tooltip = container.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${(d as any).x}, ${(d as any).y - d.size / 2 - 20})`);
        
        const rect = tooltip.append('rect')
          .attr('fill', 'rgba(0,0,0,0.8)')
          .attr('rx', 4)
          .attr('ry', 4);
        
        const text = tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .style('font-size', '10px')
          .text(d.description);
        
        const bbox = (text.node() as any).getBBox();
        rect.attr('x', bbox.x - 4)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', (d as Node).size / 2);
        
        container.select('.tooltip').remove();
      });

    // Add drag behavior
    const drag = d3.drag<any, any>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(drag);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add animated pulse to connections
    const animateLinks = () => {
      link.style('opacity', 0.3)
        .transition()
        .duration(1500)
        .style('opacity', 0.7)
        .transition()
        .duration(1500)
        .style('opacity', 0.3);
    };

    animateLinks();
    setInterval(animateLinks, 3000);

  }, [width, height]);

  return (
    <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl p-4 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">OKR Interactive Mindmap</h3>
        <p className="text-gray-300 text-sm">Drag nodes to explore • Hover for details • Zoom with mouse wheel</p>
      </div>
      
      {/* D3 SVG */}
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          className="border border-white/20 rounded-lg bg-black/20"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-4 text-xs text-white/70">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Goal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Key Results</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Initiatives</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default D3MindMap;