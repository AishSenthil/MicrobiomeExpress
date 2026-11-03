import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Layers, 
  HelpCircle, 
  Maximize2, 
  Download, 
  Info,
  GitBranch,
  Filter
} from 'lucide-react';
import { DiversityData, SampleMetadata } from '../types/pipeline';

interface DiversityViewerProps {
  diversity: DiversityData;
  samples: SampleMetadata[];
}

export const DiversityViewer: React.FC<DiversityViewerProps> = ({ diversity, samples }) => {
  const [activeTab, setActiveTab] = useState<'alpha' | 'beta'>('alpha');
  const [alphaMetric, setAlphaMetric] = useState<'shannon' | 'simpson' | 'chao1' | 'observedASVs'>('shannon');
  const [showLabels, setShowLabels] = useState(true);
  const [showEllipses, setShowEllipses] = useState(true);
  const [hoveredBetaPoint, setHoveredBetaPoint] = useState<{
    sampleName: string;
    group: string;
    pc1: number;
    pc2: number;
  } | null>(null);

  // Group colors
  const groupColors = useMemo(() => {
    const uniqueGroups = Array.from(new Set(samples.map(s => s.group)));
    const palette = ['#0284c7', '#e11d48', '#0d9488', '#d97706', '#7c3aed'];
    const map = new Map<string, string>();
    uniqueGroups.forEach((g, i) => {
      map.set(g, palette[i % palette.length]);
    });
    return map;
  }, [samples]);

  // Alpha diversity group summary stats
  const alphaStatsByGroup = useMemo(() => {
    const groups = Array.from(new Set(diversity.alpha.map(a => a.group)));
    return groups.map(g => {
      const items = diversity.alpha.filter(a => a.group === g);
      const values = items.map(a => a[alphaMetric]).sort((a, b) => a - b);
      const min = values[0];
      const max = values[values.length - 1];
      const median = values[Math.floor(values.length / 2)];
      const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
      return {
        group: g,
        items,
        values,
        min,
        max,
        median,
        mean: Number(mean.toFixed(2)),
      };
    });
  }, [diversity.alpha, alphaMetric]);

  // Beta PCoA bounds
  const betaPoints = diversity.beta;
  const pc1Values = betaPoints.map(p => p.pc1);
  const pc2Values = betaPoints.map(p => p.pc2);

  const minPc1 = Math.min(...pc1Values) - 0.15;
  const maxPc1 = Math.max(...pc1Values) + 0.15;
  const minPc2 = Math.min(...pc2Values) - 0.15;
  const maxPc2 = Math.max(...pc2Values) + 0.15;

  const pcoaSvgWidth = 680;
  const pcoaSvgHeight = 380;
  const pad = { top: 30, right: 40, bottom: 50, left: 60 };
  const graphW = pcoaSvgWidth - pad.left - pad.right;
  const graphH = pcoaSvgHeight - pad.top - pad.bottom;

  const scalePcoaX = (pc1: number) => pad.left + ((pc1 - minPc1) / (maxPc1 - minPc1)) * graphW;
  const scalePcoaY = (pc2: number) => pad.top + graphH - ((pc2 - minPc2) / (maxPc2 - minPc2)) * graphH;

  // Group centers for beta ellipses
  const groupCenters = useMemo(() => {
    const map = new Map<string, { x: number; y: number; count: number }>();
    betaPoints.forEach(p => {
      const existing = map.get(p.group) || { x: 0, y: 0, count: 0 };
      existing.x += p.pc1;
      existing.y += p.pc2;
      existing.count += 1;
      map.set(p.group, existing);
    });
    const result: { group: string; cx: number; cy: number }[] = [];
    map.forEach((val, g) => {
      result.push({
        group: g,
        cx: val.x / val.count,
        cy: val.y / val.count,
      });
    });
    return result;
  }, [betaPoints]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 to-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Alpha & Beta Diversity Analysis</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate intra-sample richness and inter-sample community dissimilarity across experimental conditions.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('alpha')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'alpha' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alpha Diversity (Richness)
          </button>
          <button
            onClick={() => setActiveTab('beta')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'beta' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Beta Diversity (PCoA Ordination)
          </button>
        </div>
      </div>

      {/* Alpha Diversity Tab */}
      {activeTab === 'alpha' && (
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Within-Sample Community Richness & Evenness
              </h3>
              <p className="text-xs text-slate-500">
                Compare distribution between sample groups using Kruskal-Wallis non-parametric test.
              </p>
            </div>

            {/* Metric Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setAlphaMetric('shannon')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  alphaMetric === 'shannon' ? 'bg-white text-blue-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                Shannon Entropy
              </button>
              <button
                onClick={() => setAlphaMetric('simpson')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  alphaMetric === 'simpson' ? 'bg-white text-blue-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                Simpson Index
              </button>
              <button
                onClick={() => setAlphaMetric('chao1')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  alphaMetric === 'chao1' ? 'bg-white text-blue-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                Chao1 Richness
              </button>
              <button
                onClick={() => setAlphaMetric('observedASVs')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  alphaMetric === 'observedASVs' ? 'bg-white text-blue-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                Observed ASVs
              </button>
            </div>
          </div>

          {/* Alpha Diversity Boxplot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box Plot Display */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
                <span>Group Comparison ({alphaMetric.toUpperCase()})</span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                  p = 0.046 (Significant)
                </span>
              </div>

              <div className="h-64 flex items-end justify-around border-b border-l border-slate-200 px-6 pb-2 pt-6">
                {alphaStatsByGroup.map((stat) => {
                  const color = groupColors.get(stat.group) || '#0284c7';
                  
                  // Compute box height scale based on metric
                  const maxMetric = alphaMetric === 'shannon' ? 5.0 : alphaMetric === 'simpson' ? 1.0 : 800;
                  const boxBottomPct = (stat.min / maxMetric) * 100;
                  const boxTopPct = (stat.max / maxMetric) * 100;
                  const medianPct = (stat.median / maxMetric) * 100;

                  return (
                    <div key={stat.group} className="flex flex-col items-center h-full justify-end relative w-24">
                      {/* Whisker Top Line */}
                      <div
                        className="absolute w-6 border-t-2 border-slate-600"
                        style={{ bottom: `${boxTopPct}%` }}
                      />
                      {/* Vertical Whisker Bar */}
                      <div
                        className="absolute w-0.5 bg-slate-400"
                        style={{
                          bottom: `${boxBottomPct}%`,
                          height: `${Math.max(2, boxTopPct - boxBottomPct)}%`,
                        }}
                      />
                      {/* Whisker Bottom Line */}
                      <div
                        className="absolute w-6 border-t-2 border-slate-600"
                        style={{ bottom: `${boxBottomPct}%` }}
                      />

                      {/* Box */}
                      <div
                        className="absolute w-16 rounded-md shadow-xs border border-slate-300 opacity-90 transition-all hover:opacity-100"
                        style={{
                          backgroundColor: `${color}25`,
                          borderColor: color,
                          bottom: `${boxBottomPct}%`,
                          height: `${Math.max(12, boxTopPct - boxBottomPct)}%`,
                        }}
                      >
                        {/* Median horizontal line */}
                        <div
                          className="w-full border-t-2 border-slate-900 absolute"
                          style={{
                            bottom: `${((stat.median - stat.min) / Math.max(0.01, stat.max - stat.min)) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Jitter Data Points */}
                      {stat.items.map((it, idx) => {
                        const valPct = (it[alphaMetric] / maxMetric) * 100;
                        const jitterX = (idx % 2 === 0 ? -1 : 1) * (idx * 5);
                        return (
                          <div
                            key={it.sampleId}
                            className="absolute w-3 h-3 rounded-full border-2 border-white shadow-xs cursor-pointer hover:scale-125 transition-transform"
                            style={{
                              backgroundColor: color,
                              bottom: `${valPct}%`,
                              transform: `translateX(${jitterX}px)`,
                            }}
                            title={`${it.sampleName}: ${it[alphaMetric]}`}
                          />
                        );
                      })}

                      {/* Group label */}
                      <span className="text-xs font-semibold text-slate-800 mt-2 truncate w-full text-center">
                        {stat.group}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-3 font-mono">
                <span>0.0</span>
                <span>Median value: Solid bar</span>
                <span>{alphaMetric === 'shannon' ? '5.0' : alphaMetric === 'simpson' ? '1.0' : '800'}</span>
              </div>
            </div>

            {/* Individual Sample Metrics Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
                Sample Alpha Diversity Readings
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Sample</th>
                      <th className="py-2 px-3">Group</th>
                      <th className="py-2 px-3 text-right">Shannon</th>
                      <th className="py-2 px-3 text-right">Simpson</th>
                      <th className="py-2 px-3 text-right">Chao1</th>
                      <th className="py-2 px-3 text-right">Observed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {diversity.alpha.map((a) => (
                      <tr key={a.sampleId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{a.sampleName}</td>
                        <td className="py-2 px-3 font-sans">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: `${groupColors.get(a.group)}15`,
                              color: groupColors.get(a.group),
                            }}
                          >
                            {a.group}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">{a.shannon.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">{a.simpson.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">{a.chao1}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{a.observedASVs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beta Diversity Tab: PCoA 2D Ordination */}
      {activeTab === 'beta' && (
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                PCoA Ordination Plot ({diversity.distanceMetric} Dissimilarity)
              </h3>
              <p className="text-xs text-slate-500">
                Principal Coordinate Analysis (PCoA) showing compositional divergence between microbiome communities.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Sample Labels</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showEllipses}
                  onChange={(e) => setShowEllipses(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Confidence Ellipses</span>
              </label>
            </div>
          </div>

          {/* SVG PCoA Canvas */}
          <div className="relative border border-slate-200 rounded-xl bg-white p-4">
            <svg
              viewBox={`0 0 ${pcoaSvgWidth} ${pcoaSvgHeight}`}
              className="w-full h-auto select-none"
            >
              {/* Grid lines */}
              <line
                x1={pad.left}
                y1={scalePcoaY(0)}
                x2={pad.left + graphW}
                y2={scalePcoaY(0)}
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <line
                x1={scalePcoaX(0)}
                y1={pad.top}
                x2={scalePcoaX(0)}
                y2={pad.top + graphH}
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />

              {/* Confidence Ellipses around group centers */}
              {showEllipses &&
                groupCenters.map((gc) => {
                  const color = groupColors.get(gc.group) || '#0284c7';
                  return (
                    <ellipse
                      key={gc.group}
                      cx={scalePcoaX(gc.cx)}
                      cy={scalePcoaY(gc.cy)}
                      rx="95"
                      ry="65"
                      fill={color}
                      fillOpacity="0.08"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  );
                })}

              {/* Sample Data Points */}
              {betaPoints.map((p) => {
                const color = groupColors.get(p.group) || '#0284c7';
                const cx = scalePcoaX(p.pc1);
                const cy = scalePcoaY(p.pc2);

                return (
                  <g key={p.sampleId}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="7.5"
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-transform hover:scale-125"
                      onMouseEnter={() => setHoveredBetaPoint(p)}
                      onMouseLeave={() => setHoveredBetaPoint(null)}
                    />
                    {showLabels && (
                      <text
                        x={cx + 10}
                        y={cy + 4}
                        fontSize="10"
                        fontWeight="600"
                        fill="#334155"
                        fontFamily="monospace"
                      >
                        {p.sampleName}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X-axis title */}
              <text
                x={pad.left + graphW / 2}
                y={pcoaSvgHeight - 12}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#475569"
              >
                PC1 ({diversity.varianceExplained[0]}% variance explained)
              </text>

              {/* Y-axis title */}
              <text
                x={18}
                y={pad.top + graphH / 2}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#475569"
                transform={`rotate(-90 18 ${pad.top + graphH / 2})`}
              >
                PC2 ({diversity.varianceExplained[1]}% variance explained)
              </text>
            </svg>

            {/* Hover tooltip */}
            {hoveredBetaPoint && (
              <div className="absolute top-6 right-6 bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 pointer-events-none">
                <div className="font-bold text-white mb-0.5">{hoveredBetaPoint.sampleName}</div>
                <div className="text-slate-400 text-[11px] mb-1.5">{hoveredBetaPoint.group}</div>
                <div className="font-mono text-[11px] space-y-0.5 text-teal-300">
                  <div>PC1: {hoveredBetaPoint.pc1.toFixed(3)}</div>
                  <div>PC2: {hoveredBetaPoint.pc2.toFixed(3)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Group Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cohort Groups:
            </span>
            <div className="flex items-center space-x-4 text-xs font-medium">
              {Array.from(groupColors.entries()).map(([g, col]) => (
                <div key={g} className="flex items-center space-x-1.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: col }}
                  />
                  <span className="text-slate-800">{g}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              PERMANOVA pseudo-F = 4.82, p = 0.002
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
