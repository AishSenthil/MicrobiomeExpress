import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ASVRecord } from '../types/pipeline';
import { GitBranch } from 'lucide-react';

interface PhylogeneticTreeProps {
  asvs: ASVRecord[];
}

export const PhylogeneticTree: React.FC<PhylogeneticTreeProps> = ({ asvs }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || asvs.length === 0) return;

    // 1. Build hierarchy
    const root = {
      name: 'root',
      children: [] as any[]
    };

    asvs.forEach(asv => {
      let currentLevel = root.children;
      const ranks = [asv.kingdom, asv.phylum, asv.classTaxa, asv.order, asv.family, asv.genus, asv.species];
      
      ranks.forEach((rank, i) => {
        if (!rank) return;
        let node = currentLevel.find(n => n.name === rank);
        if (!node) {
          node = { name: rank, children: [] };
          currentLevel.push(node);
        }
        if (i === ranks.length - 1) {
            // Leaf node
            node.isLeaf = true;
            node.reads = asv.totalReads;
        }
        currentLevel = node.children;
      });
    });

    // 2. Setup D3
    const width = 900;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', 'translate(50, 0)');

    const tree = d3.tree<any>().size([height - 50, width - 200]);
    const d3Root = d3.hierarchy<any>(root);
    
    // Sort
    d3Root.sort((a, b) => (a.data.name || '').localeCompare(b.data.name || ''));
    tree(d3Root);

    // Links
    g.selectAll('.link')
      .data(d3Root.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('d', (d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any));

    // Nodes
    const node = g.selectAll('.node')
      .data(d3Root.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

    node.append('circle')
      .attr('r', 3)
      .attr('fill', (d: any) => d.data.isLeaf ? '#0284c7' : '#94a3b8');

    node.append('text')
      .attr('dy', 3)
      .attr('x', (d: any) => d.children ? -8 : 8)
      .style('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .style('font-size', '10px')
      .text((d: any) => d.data.name === 'root' ? '' : d.data.name);

  }, [asvs]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <GitBranch className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Phylogenetic Relationships</h2>
        </div>
        <svg ref={svgRef} width="100%" height="600" viewBox="0 0 950 600" />
    </div>
  );
};
