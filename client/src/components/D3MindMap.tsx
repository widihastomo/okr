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

    // Create container group with better positioning for cards
    const container = svg.append('g')
      .attr('transform', 'translate(100, 75)');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', `translate(100, 75) ${event.transform}`);
      });

    svg.call(zoom);

    // Create tree layout (vertical orientation) with increased spacing for cards
    const treeLayout = d3.tree<TreeNode>()
      .size([width - 200, height - 150])
      .separation((a, b) => (a.parent === b.parent ? 2.5 : 3) / a.depth);

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

    // Function to get card dimensions based on type
    const getCardDimensions = (type: string) => {
      switch (type) {
        case 'goal': return { width: 200, height: 80 };
        case 'keyResult': return { width: 170, height: 70 };
        case 'initiative': return { width: 150, height: 60 };
        case 'task': return { width: 130, height: 50 };
        default: return { width: 100, height: 40 };
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

    // Add card backgrounds
    nodeGroups.append('rect')
      .attr('x', (d: any) => -getCardDimensions(d.data.type).width / 2)
      .attr('y', (d: any) => -getCardDimensions(d.data.type).height / 2)
      .attr('width', (d: any) => getCardDimensions(d.data.type).width)
      .attr('height', (d: any) => getCardDimensions(d.data.type).height)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d: any) => getNodeFill(d.data.type))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

    // Add card title
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.8em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d: any) => {
        const words = d.data.name.split(/\s+/);
        return words.length > 4 ? words.slice(0, 4).join(' ') + '...' : d.data.name;
      });

    // Add card description
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.8em')
      .style('fill', 'rgba(255,255,255,0.9)')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .text((d: any) => {
        const words = d.data.description.split(/\s+/);
        return words.length > 3 ? words.slice(0, 3).join(' ') + '...' : d.data.description;
      });

    // Add card icon
    nodeGroups.append('text')
      .attr('text-anchor', 'start')
      .attr('dx', (d: any) => -getCardDimensions(d.data.type).width / 2 + 8)
      .attr('dy', '-0.5em')
      .style('font-size', '16px')
      .style('pointer-events', 'none')
      .text((d: any) => d.data.icon);

    // Add hover effects
    nodeGroups
      .on('mouseover', function(event, d: any) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 4)
          .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))');
        
        // Show detailed tooltip - vertical layout
        const tooltip = container.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${d.x - 80}, ${d.y + getCardDimensions(d.data.type).height / 2 + 20})`);
        
        const rect = tooltip.append('rect')
          .attr('fill', 'rgba(0,0,0,0.9)')
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
        
        const text = tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('dx', 80)
          .attr('dy', '1.2em')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${d.data.name} - ${d.data.description}`);
        
        const bbox = (text.node() as any).getBBox();
        rect.attr('x', bbox.x - 8)
          .attr('y', bbox.y - 4)
          .attr('width', bbox.width + 16)
          .attr('height', bbox.height + 8);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
        
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