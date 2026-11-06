import React, { useState, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Sliders, 
  Maximize2, 
  Info, 
  Sparkles,
  Layers,
  Dna,
  Filter,
  Check,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Table as TableIcon,
  LayoutGrid,
  ExternalLink,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { MAGRecord } from '../types/mag';

interface CheckmQuadrantChartProps {
  bins: MAGRecord[];
  onSelectBin?: (bin: MAGRecord) => void;
  selectedBinId?: string | null;
}

export type TableSortField = 'completeness' | 'contamination' | 'genomeSizeMb' | 'n50' | 'binId' | 'qualityTier' | 'assignedName';
export type TableSortOrder = 'asc' | 'desc';

export const CheckmQuadrantChart: React.FC<CheckmQuadrantChartProps> = ({
  bins,
  onSelectBin,
  selectedBinId,
}) => {
  const [hoveredBin, setHoveredBin] = useState<MAGRecord | null>(null);
  const [filterTier, setFilterTier] = useState<'all' | 'High Quality' | 'Medium Quality' | 'Low Quality'>('all');
  const [sizeMode, setSizeMode] = useState<'uniform' | 'genomeSize' | 'contigs'>('genomeSize');
  const [showThresholds, setShowThresholds] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatView, setFormatView] = useState<'table' | 'pills' | 'both'>('table');
  const [sortField, setSortField] = useState<TableSortField>('completeness');
  const [sortOrder, setSortOrder] = useState<TableSortOrder>('desc');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filtered bins
  const visibleBins = useMemo(() => {
    return bins.filter((bin) => {
      const matchesTier = filterTier === 'all' || bin.qualityTier === filterTier;
      const matchesSearch = searchQuery === '' || 
        bin.binId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bin.assignedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bin.gtdbTaxonomy.family.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTier && matchesSearch;
    });
  }, [bins, filterTier, searchQuery]);

  // Sorted bins for table
  const sortedBins = useMemo(() => {
    return [...visibleBins].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'binId') {
        comparison = a.binId.localeCompare(b.binId);
      } else if (sortField === 'assignedName') {
        comparison = a.assignedName.localeCompare(b.assignedName);
      } else if (sortField === 'completeness') {
        comparison = a.completeness - b.completeness;
      } else if (sortField === 'contamination') {
        comparison = a.contamination - b.contamination;
      } else if (sortField === 'genomeSizeMb') {
        comparison = a.genomeSizeMb - b.genomeSizeMb;
      } else if (sortField === 'n50') {
        comparison = a.n50 - b.n50;
      } else if (sortField === 'qualityTier') {
        const rank = { 'High Quality': 3, 'Medium Quality': 2, 'Low Quality': 1 };
        comparison = (rank[a.qualityTier] || 0) - (rank[b.qualityTier] || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [visibleBins, sortField, sortOrder]);

  const handleSort = (field: TableSortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Bin ID',
      'Assigned Species',
      'Quality Tier',
      'Completeness (%)',
      'Contamination (%)',
      'Genome Size (Mb)',
      'GC Content (%)',
      'Contigs',
      'N50 (bp)',
      'GTDB Phylum',
      'GTDB Family',
      'GTDB Genus'
    ];
    const rows = sortedBins.map(b => [
      b.binId,
      `"${b.assignedName}"`,
      b.qualityTier,
      b.completeness,
      b.contamination,
      b.genomeSizeMb,
      b.gcContent,
      b.contigCount,
      b.n50,
      `"${b.gtdbTaxonomy.phylum}"`,
      `"${b.gtdbTaxonomy.family}"`,
      `"${b.gtdbTaxonomy.genus}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkm2_quadrant_bins_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Statistics breakdown
  const stats = useMemo(() => {
    const total = bins.length;
    const high = bins.filter(b => b.qualityTier === 'High Quality').length;
    const medium = bins.filter(b => b.qualityTier === 'Medium Quality').length;
    const low = bins.filter(b => b.qualityTier === 'Low Quality').length;
    return {
      total,
      high,
      medium,
      low,
      highPct: total > 0 ? ((high / total) * 100).toFixed(1) : '0',
      mediumPct: total > 0 ? ((medium / total) * 100).toFixed(1) : '0',
      lowPct: total > 0 ? ((low / total) * 100).toFixed(1) : '0',
    };
  }, [bins]);

  // Chart dimensions
  const svgWidth = 840;
  const svgHeight = 500;
  const margin = { top: 36, right: 40, bottom: 65, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Domain calculations
  const xMin = useMemo(() => {
    const minComp = bins.length > 0 ? Math.min(...bins.map(b => b.completeness)) : 40;
    return Math.max(30, Math.floor(Math.min(40, minComp - 5) / 10) * 10);
  }, [bins]);
  const xMax = 100;

  const yMax = useMemo(() => {
    const maxContam = bins.length > 0 ? Math.max(...bins.map(b => b.contamination)) : 10;
    return Math.max(12, Math.ceil((maxContam + 2) / 2) * 2);
  }, [bins]);
  const yMin = 0;

  // Coordinate mappers
  const getX = (completeness: number) => {
    const clamped = Math.max(xMin, Math.min(xMax, completeness));
    return margin.left + ((clamped - xMin) / (xMax - xMin)) * plotWidth;
  };

  const getY = (contamination: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, contamination));
    // Y=0 at bottom of plot, Y=yMax at top
    return margin.top + plotHeight - ((clamped - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Point radius mapper
  const getRadius = (bin: MAGRecord) => {
    if (sizeMode === 'uniform') return 7.5;
    if (sizeMode === 'genomeSize') {
      // 2.0 to 6.0 Mb -> radius 6 to 13
      const norm = Math.max(0, Math.min(1, (bin.genomeSizeMb - 2) / 4));
      return 6 + norm * 7;
    }
    // contig count: 20 to 120 -> radius 6 to 12
    const norm = Math.max(0, Math.min(1, (bin.contigCount - 20) / 100));
    return 6 + norm * 6;
  };

  // Quality thresholds coordinates
  const hqX = getX(90);
  const mqX = getX(50);
  const hqY = getY(5);
  const mqY = getY(10);
  const bottomY = getY(0);
  const rightX = getX(100);

  // X ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let c = xMin; c <= 100; c += (xMin <= 40 ? 10 : 5)) {
      ticks.push(c);
    }
    if (!ticks.includes(90)) ticks.push(90);
    if (!ticks.includes(50) && xMin <= 50) ticks.push(50);
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [xMin]);

  // Y ticks
  const yTicks = useMemo(() => {
    const step = yMax > 15 ? 3 : 2;
    const ticks: number[] = [];
    for (let c = 0; c <= yMax; c += step) {
      ticks.push(c);
    }
    if (!ticks.includes(5)) ticks.push(5);
    if (!ticks.includes(10) && yMax >= 10) ticks.push(10);
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [yMax]);

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quality Tier Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTier === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Bins ({stats.total})
            </button>
            <button
              onClick={() => setFilterTier('High Quality')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTier === 'High Quality'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>High Quality ({stats.high})</span>
            </button>
            <button
              onClick={() => setFilterTier('Medium Quality')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTier === 'Medium Quality'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Medium Quality ({stats.medium})</span>
            </button>
            {stats.low > 0 && (
              <button
                onClick={() => setFilterTier('Low Quality')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  filterTier === 'Low Quality'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Low Quality ({stats.low})</span>
              </button>
            )}
          </div>

          {/* Quick Settings & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Size by Switcher */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Size:</span>
              <button
                onClick={() => setSizeMode('genomeSize')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  sizeMode === 'genomeSize' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Scale points by assembled genome size (Mb)"
              >
                Genome Size
              </button>
              <button
                onClick={() => setSizeMode('uniform')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  sizeMode === 'uniform' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Uniform
              </button>
            </div>

            {/* Threshold toggle */}
            <button
              onClick={() => setShowThresholds(!showThresholds)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showThresholds
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Toggle MIMAG standard boundary guide lines"
            >
              <Check className={`w-3.5 h-3.5 ${showThresholds ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>MIMAG Guidelines</span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Highlight bin or taxon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44 sm:w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Quadrant Legend & MIMAG Standard Definitions Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-xs">High Quality Quadrant</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200/80 text-emerald-900 rounded font-mono">
                  {stats.high} bins ({stats.highPct}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 truncate">
                Completeness ≥ 90% • Contamination &lt; 5%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 text-xs">Medium Quality Quadrant</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded font-mono">
                  {stats.medium} bins ({stats.mediumPct}%)
                </span>
              </div>
              <p className="text-[11px] text-amber-700 truncate">
                Completeness ≥ 50% • Contamination &lt; 10%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-rose-50/60 border border-rose-200/70 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-950 text-xs">Low Quality Quadrant</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200/80 text-rose-900 rounded font-mono">
                  {stats.low} bins ({stats.lowPct}%)
                </span>
              </div>
              <p className="text-[11px] text-rose-700 truncate">
                Completeness &lt; 50% or Contamination ≥ 10%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quadrant SVG Chart Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>CheckM2 Genome Quality Scatter (MIMAG Quadrants)</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">
                Showing {visibleBins.length} of {bins.length} bins
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive visualization of CheckM2 neural-net completeness vs lineage marker contamination
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> High Quality
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Medium Quality
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Low Quality
            </span>
          </div>
        </div>

        {/* SVG Visualization Canvas */}
        <div className="relative w-full overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none font-sans"
            style={{ minWidth: '650px', maxHeight: '560px' }}
          >
            <defs>
              {/* Gradients for Quadrants */}
              <linearGradient id="hqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.07" />
              </linearGradient>

              <linearGradient id="mqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.05" />
              </linearGradient>

              <linearGradient id="lqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.03" />
              </linearGradient>

              {/* Point shadow filter */}
              <filter id="pointShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.25" />
              </filter>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* 1. Low Quality Zone (Full chart background fallback) */}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="url(#lqGradient)"
              rx={8}
            />

            {/* 2. Medium Quality Zone (Completeness >= 50% AND Contamination <= 10%) */}
            {mqX < rightX && mqY < bottomY && (
              <rect
                x={mqX}
                y={mqY}
                width={rightX - mqX}
                height={bottomY - mqY}
                fill="url(#mqGradient)"
              />
            )}

            {/* 3. High Quality Zone (Completeness >= 90% AND Contamination <= 5%) */}
            {hqX < rightX && hqY < bottomY && (
              <rect
                x={hqX}
                y={hqY}
                width={rightX - hqX}
                height={bottomY - hqY}
                fill="url(#hqGradient)"
                stroke="#10b981"
                strokeWidth={showThresholds ? 1.5 : 0}
                strokeDasharray="4 3"
              />
            )}

            {/* Grid Lines - X (Vertical) */}
            {xTicks.map((tick) => {
              const xPos = getX(tick);
              return (
                <g key={`x-grid-${tick}`}>
                  <line
                    x1={xPos}
                    y1={margin.top}
                    x2={xPos}
                    y2={margin.top + plotHeight}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                    strokeDasharray={tick === 90 || tick === 50 ? 'none' : '3 3'}
                  />
                  {/* Axis Label */}
                  <text
                    x={xPos}
                    y={margin.top + plotHeight + 20}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-500 font-semibold"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Grid Lines - Y (Horizontal) */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              return (
                <g key={`y-grid-${tick}`}>
                  <line
                    x1={margin.left}
                    y1={yPos}
                    x2={margin.left + plotWidth}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                    strokeDasharray={tick === 5 || tick === 10 ? 'none' : '3 3'}
                  />
                  {/* Axis Label */}
                  <text
                    x={margin.left - 12}
                    y={yPos + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-slate-500 font-semibold"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Threshold Reference Lines and Watermarks */}
            {showThresholds && (
              <>
                {/* 90% Completeness Vertical Line */}
                <line
                  x1={hqX}
                  y1={margin.top}
                  x2={hqX}
                  y2={margin.top + plotHeight}
                  stroke="#10b981"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                />
                <text
                  x={hqX + 6}
                  y={margin.top + 18}
                  className="text-[10px] font-bold fill-emerald-800 tracking-wider font-mono uppercase"
                >
                  90% Cutoff (High Quality)
                </text>

                {/* 50% Completeness Vertical Line */}
                {mqX > margin.left && (
                  <>
                    <line
                      x1={mqX}
                      y1={margin.top}
                      x2={mqX}
                      y2={margin.top + plotHeight}
                      stroke="#f59e0b"
                      strokeWidth={1.4}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={mqX + 6}
                      y={margin.top + 34}
                      className="text-[9px] font-bold fill-amber-800 tracking-wider font-mono uppercase"
                    >
                      50% Cutoff (Medium Quality)
                    </text>
                  </>
                )}

                {/* 5% Contamination Horizontal Line */}
                <line
                  x1={margin.left}
                  y1={hqY}
                  x2={margin.left + plotWidth}
                  y2={hqY}
                  stroke="#10b981"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                />
                <text
                  x={margin.left + plotWidth - 10}
                  y={hqY - 6}
                  textAnchor="end"
                  className="text-[10px] font-bold fill-emerald-800 tracking-wider font-mono uppercase"
                >
                  &lt; 5% Contamination (High Quality)
                </text>

                {/* 10% Contamination Horizontal Line */}
                <line
                  x1={margin.left}
                  y1={mqY}
                  x2={margin.left + plotWidth}
                  y2={mqY}
                  stroke="#f59e0b"
                  strokeWidth={1.4}
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left + plotWidth - 10}
                  y={mqY - 6}
                  textAnchor="end"
                  className="text-[9px] font-bold fill-amber-800 tracking-wider font-mono uppercase"
                >
                  &lt; 10% Contamination (Medium Quality)
                </text>
              </>
            )}

            {/* Quadrant Watermark Badges in SVG */}
            <g opacity={0.85}>
              {/* High Quality Banner Badge */}
              <rect
                x={rightX - 165}
                y={bottomY - 34}
                width={155}
                height={26}
                rx={6}
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth={1}
              />
              <text
                x={rightX - 88}
                y={bottomY - 17}
                textAnchor="middle"
                className="text-[10px] font-extrabold fill-emerald-700 tracking-wider uppercase font-mono"
              >
                ★ HIGH QUALITY ZONE
              </text>

              {/* Medium Quality Banner Badge */}
              {mqX < hqX && (
                <>
                  <rect
                    x={mqX + 15}
                    y={bottomY - 34}
                    width={170}
                    height={26}
                    rx={6}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={1}
                  />
                  <text
                    x={mqX + 100}
                    y={bottomY - 17}
                    textAnchor="middle"
                    className="text-[10px] font-extrabold fill-amber-700 tracking-wider uppercase font-mono"
                  >
                    MEDIUM QUALITY ZONE
                  </text>
                </>
              )}

              {/* Low Quality Zone Tag */}
              <text
                x={margin.left + 16}
                y={margin.top + 24}
                className="text-[10px] font-extrabold fill-rose-600/70 tracking-wider uppercase font-mono"
              >
                LOW QUALITY ZONE (Contam ≥ 10% or Comp &lt; 50%)
              </text>
            </g>

            {/* Plot Border */}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              rx={4}
            />

            {/* Axis Titles */}
            {/* X-Axis Title */}
            <text
              x={margin.left + plotWidth / 2}
              y={margin.top + plotHeight + 48}
              textAnchor="middle"
              className="text-xs font-bold fill-slate-700 uppercase tracking-wider"
            >
              CheckM2 Estimated Completeness (%) → Higher is Better
            </text>

            {/* Y-Axis Title */}
            <text
              transform={`rotate(-90 ${margin.left - 42} ${margin.top + plotHeight / 2})`}
              x={margin.left - 42}
              y={margin.top + plotHeight / 2}
              textAnchor="middle"
              className="text-xs font-bold fill-slate-700 uppercase tracking-wider"
            >
              CheckM2 Contamination (%) → Lower is Better
            </text>

            {/* Crosshairs when a point is hovered */}
            {hoveredBin && (
              <g pointerEvents="none">
                {/* Horizontal crosshair to Y-axis */}
                <line
                  x1={margin.left}
                  y1={getY(hoveredBin.contamination)}
                  x2={getX(hoveredBin.completeness)}
                  y2={getY(hoveredBin.contamination)}
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                {/* Vertical crosshair to X-axis */}
                <line
                  x1={getX(hoveredBin.completeness)}
                  y1={getY(hoveredBin.contamination)}
                  x2={getX(hoveredBin.completeness)}
                  y2={margin.top + plotHeight}
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                {/* Values on axis */}
                <rect
                  x={getX(hoveredBin.completeness) - 24}
                  y={margin.top + plotHeight + 2}
                  width={48}
                  height={18}
                  rx={4}
                  fill="#1e293b"
                />
                <text
                  x={getX(hoveredBin.completeness)}
                  y={margin.top + plotHeight + 14}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-white"
                >
                  {hoveredBin.completeness}%
                </text>

                <rect
                  x={margin.left - 48}
                  y={getY(hoveredBin.contamination) - 9}
                  width={42}
                  height={18}
                  rx={4}
                  fill="#1e293b"
                />
                <text
                  x={margin.left - 27}
                  y={getY(hoveredBin.contamination) + 3}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-white"
                >
                  {hoveredBin.contamination}%
                </text>
              </g>
            )}

            {/* Plotted Bin Points */}
            {visibleBins.map((bin) => {
              const cx = getX(bin.completeness);
              const cy = getY(bin.contamination);
              const r = getRadius(bin);
              const isSelected = selectedBinId === bin.binId;
              const isHovered = hoveredBin?.binId === bin.binId;
              const isHigh = bin.qualityTier === 'High Quality';
              const isMed = bin.qualityTier === 'Medium Quality';

              // Colors
              const fillColor = isHigh ? '#10b981' : isMed ? '#f59e0b' : '#f43f5e';
              const strokeColor = isHigh ? '#065f46' : isMed ? '#92400e' : '#9f1239';

              return (
                <g 
                  key={bin.binId} 
                  className="cursor-pointer transition-transform duration-150"
                  onMouseEnter={() => setHoveredBin(bin)}
                  onMouseLeave={() => setHoveredBin(null)}
                  onClick={() => onSelectBin && onSelectBin(bin)}
                >
                  {/* Outer pulse ring on hover or selection */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r + 6}
                      fill="none"
                      stroke={isSelected ? '#2563eb' : fillColor}
                      strokeWidth={2}
                      className="animate-pulse opacity-80"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? r + 2.5 : r}
                    fill={fillColor}
                    stroke={isSelected ? '#1e3a8a' : strokeColor}
                    strokeWidth={isSelected ? 3 : 1.8}
                    filter="url(#pointShadow)"
                    className="transition-all duration-150"
                  />

                  {/* Bin ID small label inside or beside point */}
                  <text
                    x={cx}
                    y={cy - r - 4}
                    textAnchor="middle"
                    className={`text-[9px] font-mono font-bold pointer-events-none transition-all ${
                      isHovered || isSelected 
                        ? 'fill-slate-900 font-extrabold text-[11px]' 
                        : 'fill-slate-600 opacity-80'
                    }`}
                  >
                    {bin.binId}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Tooltip Card (Rendered outside SVG for perfect HTML styling) */}
        {hoveredBin && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-2 backdrop-blur-md max-w-xs animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${Math.min(68, Math.max(10, (getX(hoveredBin.completeness) / svgWidth) * 100))}%`,
              top: '60px',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{
                  backgroundColor: hoveredBin.qualityTier === 'High Quality' ? '#10b981' : hoveredBin.qualityTier === 'Medium Quality' ? '#f59e0b' : '#f43f5e'
                }} />
                <span className="font-mono font-bold text-cyan-300 text-xs">{hoveredBin.binId}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hoveredBin.qualityTier === 'High Quality' 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                  : hoveredBin.qualityTier === 'Medium Quality'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
              }`}>
                {hoveredBin.qualityTier}
              </span>
            </div>

            <div>
              <div className="font-bold text-white text-xs">{hoveredBin.assignedName}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {hoveredBin.gtdbTaxonomy.phylum} &gt; {hoveredBin.gtdbTaxonomy.family}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] bg-slate-800/80 p-2 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Completeness:</span>
                <span className="text-cyan-300 font-bold">{hoveredBin.completeness}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Contamination:</span>
                <span className="text-amber-400 font-bold">{hoveredBin.contamination}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Genome Size:</span>
                <span className="text-slate-200">{hoveredBin.genomeSizeMb} Mb</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">N50 Length:</span>
                <span className="text-slate-200">{(hoveredBin.n50 / 1000).toFixed(1)} kb</span>
              </div>
            </div>

            <div className="text-[10px] text-cyan-400 text-center font-sans font-medium pt-0.5">
              Click point to open full bin inspector ↗
            </div>
          </div>
        )}
      </div>

      {/* Interactive CheckM2 Results: Table Format & Matrix Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-0">
        {/* Table & Matrix Header Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">CheckM2 Quality Assessment Table</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-mono font-bold">
                  {sortedBins.length} visible
                </span>
                {filterTier !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                    Tier: {filterTier}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Detailed CheckM2 neural-net completeness, marker duplication, and assembly metrics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Format Switcher */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFormatView('table')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  formatView === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View detailed CheckM2 metrics in table format"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table Format</span>
              </button>
              <button
                onClick={() => setFormatView('pills')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  formatView === 'pills'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View compact pill matrix"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Matrix Pills</span>
              </button>
              <button
                onClick={() => setFormatView('both')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  formatView === 'both'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show both table format and pill matrix"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Both</span>
              </button>
            </div>

            {/* Export CSV for visible bins */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title="Download visible bins as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Compact Pill Matrix (Rendered when formatView === 'pills' or 'both') */}
        {(formatView === 'pills' || formatView === 'both') && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                Interactive Bin Matrix:
              </span>
              <span className="text-[11px] text-slate-400">
                Hover or click any bin to link with scatter plot above
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {sortedBins.map((bin) => {
                const isHigh = bin.qualityTier === 'High Quality';
                const isMed = bin.qualityTier === 'Medium Quality';
                const isSelected = selectedBinId === bin.binId;
                const isHovered = hoveredBin?.binId === bin.binId;

                return (
                  <button
                    key={bin.binId}
                    onClick={() => onSelectBin && onSelectBin(bin)}
                    onMouseEnter={() => setHoveredBin(bin)}
                    onMouseLeave={() => setHoveredBin(null)}
                    className={`px-2.5 py-1.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                      isSelected || isHovered
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-400 shadow-xs'
                        : isHigh
                        ? 'bg-white border-emerald-200 hover:bg-emerald-50/50 hover:border-emerald-300'
                        : isMed
                        ? 'bg-white border-amber-200 hover:bg-amber-50/50 hover:border-amber-300'
                        : 'bg-white border-rose-200 hover:bg-rose-50/50 hover:border-rose-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{bin.binId}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[130px]">{bin.assignedName}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {bin.completeness}% / {bin.contamination}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Table Format (Rendered when formatView === 'table' or 'both') */}
        {(formatView === 'table' || formatView === 'both') && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th 
                    onClick={() => handleSort('binId')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Bin ID</span>
                      {sortField === 'binId' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('assignedName')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>GTDB-Tk Taxonomic Lineage</span>
                      {sortField === 'assignedName' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('qualityTier')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>MIMAG Quality Tier</span>
                      {sortField === 'qualityTier' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('completeness')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>CheckM2 Completeness</span>
                      {sortField === 'completeness' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('contamination')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>CheckM2 Contamination</span>
                      {sortField === 'contamination' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('genomeSizeMb')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Genome Size</span>
                      {sortField === 'genomeSizeMb' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('n50')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Assembly (N50 / Ctgs)</span>
                      {sortField === 'n50' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedBins.map((bin) => {
                  const isHigh = bin.qualityTier === 'High Quality';
                  const isMed = bin.qualityTier === 'Medium Quality';
                  const isHovered = hoveredBin?.binId === bin.binId;
                  const isSelected = selectedBinId === bin.binId;

                  return (
                    <tr
                      key={bin.binId}
                      onClick={() => onSelectBin && onSelectBin(bin)}
                      onMouseEnter={() => setHoveredBin(bin)}
                      onMouseLeave={() => setHoveredBin(null)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/90 font-medium'
                          : isHovered
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Bin ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isHigh ? 'bg-emerald-500 ring-2 ring-emerald-200' : isMed ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-rose-500 ring-2 ring-rose-200'
                          }`} />
                          <span className="text-blue-900">{bin.binId}</span>
                        </div>
                      </td>

                      {/* Lineage */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {bin.assignedName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                          {bin.gtdbTaxonomy.phylum} &gt; {bin.gtdbTaxonomy.family}
                        </div>
                      </td>

                      {/* MIMAG Quality Tier */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isHigh 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : isMed 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {isHigh ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isMed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{bin.qualityTier}</span>
                        </span>
                      </td>

                      {/* Completeness with visual gauge */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-bold ${
                            bin.completeness >= 90 ? 'text-emerald-700' : bin.completeness >= 50 ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {bin.completeness}%
                          </span>
                          <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                bin.completeness >= 90 ? 'bg-emerald-500' : bin.completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, bin.completeness))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Contamination */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`font-bold ${
                            bin.contamination < 5 ? 'text-emerald-700' : bin.contamination < 10 ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {bin.contamination}%
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                            bin.contamination < 5 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : bin.contamination < 10 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {bin.contamination < 5 ? '<5% Low' : bin.contamination < 10 ? '<10% Tolerated' : '≥10% High'}
                          </span>
                        </div>
                      </td>

                      {/* Genome Size & GC */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <div className="font-semibold text-slate-800">{bin.genomeSizeMb} Mb</div>
                        <div className="text-[10px] text-slate-400">{bin.gcContent}% GC</div>
                      </td>

                      {/* Assembly (N50 / Contigs) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <div className="font-semibold text-slate-800">{(bin.n50 / 1000).toFixed(1)} kb N50</div>
                        <div className="text-[10px] text-slate-400">{bin.contigCount} contigs</div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectBin && onSelectBin(bin)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all border border-blue-200 flex items-center gap-1 mx-auto"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {sortedBins.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No MAG bins match the current quality filter or search query.
          </div>
        )}
      </div>
    </div>
  );
};
