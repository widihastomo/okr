import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TreeNode {
  name: string;
  type: 'goal' | 'keyResult' | 'initiative' | 'task';
  icon: string;
  description: string;
  color: string;
  children?: TreeNode[];
}

interface D3MindMapProps {
  width?: number;
  height?: number;
}

const D3MindMap: React.FC<D3MindMapProps> = ({ width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Hierarchical data structure
  const treeData: TreeNode = {
    name: 'Meningkatkan Pendapatan 35%',
    type: 'goal',
    icon: '🎯',
    description: 'Goal utama perusahaan',
    color: '#f97316',
    children: [
      {
        name: 'Penjualan 500M/bulan',
        type: 'keyResult',
        icon: '📊',
        description: 'Target penjualan bulanan',
        color: '#3b82f6',
        children: [
          {
            name: 'Kampanye Digital Marketing',
            type: 'initiative',
            icon: '🚀',
            description: 'Strategi pemasaran digital',
            color: '#10b981',
            children: [
              {
                name: 'Buat konten Instagram',
                type: 'task',
                icon: '✅',
                description: 'Konten sosial media',
                color: '#8b5cf6'
              },
              {
                name: 'Setup Facebook Ads',
                type: 'task',
                icon: '📱',
                description: 'Kampanye iklan Facebook',
                color: '#8b5cf6'
              }
            ]
          },
          {
            name: 'Program Referral',
            type: 'initiative',
            icon: '💎',
            description: 'Sistem rujukan pelanggan',
            color: '#10b981',
            children: [
              {
                name: 'Design reward system',
                type: 'task',
                icon: '🎁',
                description: 'Sistem hadiah rujukan',
                color: '#8b5cf6'
              },
              {
                name: 'Launch referral campaign',
                type: 'task',
                icon: '📢',
                description: 'Peluncuran kampanye',
                color: '#8b5cf6'
              }
            ]
          }
        ]
      },
      {
        name: '100 Pelanggan Baru',
        type: 'keyResult',
        icon: '🎯',
        description: 'Target akuisisi pelanggan',
        color: '#3b82f6',
        children: [
          {
            name: 'Outreach Program',
            type: 'initiative',
            icon: '📞',
            description: 'Program penjangkauan pelanggan',
            color: '#10b981',
            children: [
              {
                name: 'Cold calling prospects',
                type: 'task',
                icon: '☎️',
                description: 'Telepon prospek baru',
                color: '#8b5cf6'
              },
              {
                name: 'Email marketing campaign',
                type: 'task',
                icon: '📧',
                description: 'Kampanye email marketing',
                color: '#8b5cf6'
              }
            ]
          },
          {
            name: 'Partnership Building',
            type: 'initiative',
            icon: '🤝',
            description: 'Membangun kemitraan strategis',
            color: '#10b981',
            children: [
              {
                name: 'Identifikasi partner potensial',
                type: 'task',
                icon: '🔍',
                description: 'Riset partner bisnis',
                color: '#8b5cf6'
              },
              {
                name: 'Negosiasi partnership deals',
                type: 'task',
                icon: '📝',
                description: 'Negosiasi kontrak kemitraan',
                color: '#8b5cf6'
              }
            ]
          }
        ]
      }
    ]
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create container group
    const container = svg.append('g')
      .attr('transform', 'translate(50, 50)');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', `translate(50, 50) ${event.transform}`);
      });

    svg.call(zoom);

    // Create tree layout (vertical orientation)
    const treeLayout = d3.tree<TreeNode>()
      .size([width - 100, height - 100])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Convert data to hierarchy
    const root = d3.hierarchy(treeData);
    const treeNodes = treeLayout(root);

    // Create gradient definitions
    const defs = container.append('defs');
    
    // Goal gradient
    const goalGradient = defs.append('linearGradient')
      .attr('id', 'goalGradient')
      .attr('gradientUnits', 'objectBoundingBox');
    goalGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f97316');
    goalGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c');

    // Key Result gradient
    const keyResultGradient = defs.append('linearGradient')
      .attr('id', 'keyResultGradient')
      .attr('gradientUnits', 'objectBoundingBox');
    keyResultGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
    keyResultGradient.append('stop').attr('offset', '100%').attr('stop-color', '#1d4ed8');

    // Initiative gradient
    const initiativeGradient = defs.append('linearGradient')
      .attr('id', 'initiativeGradient')
      .attr('gradientUnits', 'objectBoundingBox');
    initiativeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    initiativeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Task gradient
    const taskGradient = defs.append('linearGradient')
      .attr('id', 'taskGradient')
      .attr('gradientUnits', 'objectBoundingBox');
    taskGradient.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6');
    taskGradient.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed');

    // Create links (connections between nodes) - vertical layout
    const links = container.selectAll('.link')
      .data(treeNodes.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical<any, any>()
        .x((d: any) => d.x)
        .y((d: any) => d.y)
      )
      .attr('stroke', 'rgba(255,255,255,0.4)')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .style('opacity', 0.8);

    // Create node groups - vertical layout
    const nodeGroups = container.selectAll('.node')
      .data(treeNodes.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer');

    // Function to get node size based on type
    const getNodeSize = (type: string) => {
      switch (type) {
        case 'goal': return 25;
        case 'keyResult': return 20;
        case 'initiative': return 15;
        case 'task': return 12;
        default: return 10;
      }
    };

    // Function to get node fill
    const getNodeFill = (type: string) => {
      switch (type) {
        case 'goal': return 'url(#goalGradient)';
        case 'keyResult': return 'url(#keyResultGradient)';
        case 'initiative': return 'url(#initiativeGradient)';
        case 'task': return 'url(#taskGradient)';
        default: return '#gray';
      }
    };

    // Add node circles
    nodeGroups.append('circle')
      .attr('r', (d: any) => getNodeSize(d.data.type))
      .attr('fill', (d: any) => getNodeFill(d.data.type))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

    // Add node icons
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', (d: any) => `${getNodeSize(d.data.type) * 0.8}px`)
      .style('pointer-events', 'none')
      .text((d: any) => d.data.icon);

    // Add node labels - vertical layout
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dx', 0)
      .attr('dy', (d: any) => getNodeSize(d.data.type) + 18)
      .style('fill', 'white')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d: any) => d.data.name)
      .each(function(d: any) {
        const text = d3.select(this);
        const words = d.data.name.split(/\s+/);
        if (words.length > 3) {
          text.text(words.slice(0, 3).join(' ') + '...');
        }
      });

    // Add hover effects
    nodeGroups
      .on('mouseover', function(event, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', getNodeSize(d.data.type) * 1.3);
        
        // Show tooltip - vertical layout
        const tooltip = container.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${d.x - 60}, ${d.y + getNodeSize(d.data.type) + 30})`);
        
        const rect = tooltip.append('rect')
          .attr('fill', 'rgba(0,0,0,0.9)')
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
        
        const text = tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('dx', 60)
          .attr('dy', '1.2em')
          .style('font-size', '10px')
          .text(d.data.description);
        
        const bbox = (text.node() as any).getBBox();
        rect.attr('x', bbox.x - 8)
          .attr('y', bbox.y - 4)
          .attr('width', bbox.width + 16)
          .attr('height', bbox.height + 8);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', getNodeSize(d.data.type));
        
        container.select('.tooltip').remove();
      });

    // Animate links
    links.style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 0.8);

    // Animate nodes
    nodeGroups.style('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d: any, i: number) => i * 100)
      .style('opacity', 1);

  }, [width, height, treeData]);

  return (
    <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl p-4 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">OKR Tree Structure</h3>
        <p className="text-gray-300 text-sm">Hover nodes for details • Zoom with mouse wheel • Hierarchical goal breakdown</p>
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
      
      {/* Hierarchy Info */}
      <div className="mt-4 text-center">
        <p className="text-white/60 text-xs">
          Goal → Key Results → Initiatives → Tasks | Struktur hierarkis yang saling terhubung
        </p>
      </div>
    </div>
  );
};

export default D3MindMap;