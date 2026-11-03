import React, { useState } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Info, 
  Layers, 
  Percent, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { QCReportData, SampleMetadata } from '../types/pipeline';

interface QcViewerProps {
  qc: QCReportData;
  samples: SampleMetadata[];
}

export const QcViewer: React.FC<QcViewerProps> = ({ qc, samples }) => {
  const [activeTab, setActiveTab] = useState<'phred' | 'gc' | 'adapter' | 'retention'>('phred');
  const [phredViewMode, setPhredViewMode] = useState<'both' | 'raw' | 'trimmed'>('both');
  const [hoveredPoint, setHoveredPoint] = useState<{ pos: number; rawMean?: number; trimMean?: number } | null>(null);

  // SVG dimensions for Phred chart
  const phredWidth = 840;
  const phredHeight = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const graphWidth = phredWidth - padding.left - padding.right;
  const graphHeight = phredHeight - padding.top - padding.bottom;

  // Scales: X is 1 to 250 bp, Y is 0 to 42 Phred score
  const maxPos = 250;
  const maxPhred = 42;

  const scaleX = (pos: number) => padding.left + (pos / maxPos) * graphWidth;
  const scaleY = (phred: number) => padding.top + graphHeight - (phred / maxPhred) * graphHeight;

  // Build SVG path for raw and trimmed mean lines
  const rawPath = qc.rawQuality.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.position)} ${scaleY(pt.mean)}`).join(' ');
  const trimmedPath = qc.trimmedQuality.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.position)} ${scaleY(pt.mean)}`).join(' ');

  // Area bounds for quality zones
  const yQ28 = scaleY(28);
  const yQ20 = scaleY(20);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Component Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Quality Control Analytics (FastQC & Trimming)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated quality assessment, adapter content detection, and read filtering metrics across samples.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('phred')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'phred' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Per-Base Phred Quality
          </button>
          <button
            onClick={() => setActiveTab('gc')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'gc' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GC Distribution
          </button>
          <button
            onClick={() => setActiveTab('adapter')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'adapter' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adapter Contamination
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'retention' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Read Retention Waterfall
          </button>
        </div>
      </div>

      {/* QC Summary Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/40 text-center py-3">
        <div className="px-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Raw Read Volume</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{qc.totalRawReads.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400">Total forward & reverse</div>
        </div>
        <div className="px-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Clean Retained Reads</div>
          <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">{qc.totalCleanReads.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700/80 font-medium">
            {((qc.totalCleanReads / qc.totalRawReads) * 100).toFixed(1)}% recovery
          </div>
        </div>
        <div className="px-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Mean Phred Score</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5 flex items-center justify-center gap-1.5">
            <span className="text-slate-400 text-sm line-through">Q{qc.meanPhredBefore}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 font-bold">Q{qc.meanPhredAfter}</span>
          </div>
          <div className="text-[11px] text-emerald-700/80 font-medium">Post-Cutadapt & DADA2</div>
        </div>
        <div className="px-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Duplication Rate</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{qc.duplicationRate}%</div>
          <div className="text-[11px] text-slate-400">Target amplicon normal</div>
        </div>
      </div>

      {/* Tab 1: Per-Base Sequence Quality Curve */}
      {activeTab === 'phred' && (
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                FastQC Quality Scores Across Read Positions (Phred Q Score)
              </h3>
              <p className="text-xs text-slate-500">
                Shows Illumina base call accuracy. Standard FastQC background bands: Green (Q28+, Very Good), Yellow (Q20-Q28, Acceptable), Red (&lt;Q20, Poor).
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setPhredViewMode('both')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  phredViewMode === 'both' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Before vs After Overlay
              </button>
              <button
                onClick={() => setPhredViewMode('raw')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  phredViewMode === 'raw' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Raw Reads Only
              </button>
              <button
                onClick={() => setPhredViewMode('trimmed')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  phredViewMode === 'trimmed' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Trimmed & Filtered
              </button>
            </div>
          </div>

          {/* SVG Quality Plot */}
          <div className="relative border border-slate-200 rounded-xl bg-white overflow-hidden p-2">
            <svg
              viewBox={`0 0 ${phredWidth} ${phredHeight}`}
              className="w-full h-auto select-none"
            >
              {/* Quality Zone Backgrounds */}
              {/* Very Good Quality Zone: Phred >= 28 */}
              <rect
                x={padding.left}
                y={padding.top}
                width={graphWidth}
                height={yQ28 - padding.top}
                fill="#ecfdf5"
                opacity="0.85"
              />
              {/* Reasonable Quality Zone: 20 <= Phred < 28 */}
              <rect
                x={padding.left}
                y={yQ28}
                width={graphWidth}
                height={yQ20 - yQ28}
                fill="#fefce8"
                opacity="0.85"
              />
              {/* Poor Quality Zone: Phred < 20 */}
              <rect
                x={padding.left}
                y={yQ20}
                width={graphWidth}
                height={padding.top + graphHeight - yQ20}
                fill="#fff1f2"
                opacity="0.85"
              />

              {/* Grid Lines */}
              {[10, 20, 28, 30, 40].map((phred) => (
                <g key={phred}>
                  <line
                    x1={padding.left}
                    y1={scaleY(phred)}
                    x2={padding.left + graphWidth}
                    y2={scaleY(phred)}
                    stroke={phred === 28 ? '#10b981' : phred === 20 ? '#f59e0b' : '#e2e8f0'}
                    strokeDasharray={phred === 28 || phred === 20 ? '4,4' : '2,2'}
                    strokeWidth={phred === 28 || phred === 20 ? '1.5' : '1'}
                  />
                  <text
                    x={padding.left - 10}
                    y={scaleY(phred) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="monospace"
                    fill={phred === 28 ? '#059669' : phred === 20 ? '#d97706' : '#64748b'}
                  >
                    Q{phred}
                  </text>
                </g>
              ))}

              {/* X-axis Position ticks */}
              {[1, 50, 100, 150, 200, 250].map((pos) => (
                <g key={pos}>
                  <line
                    x1={scaleX(pos)}
                    y1={padding.top + graphHeight}
                    x2={scaleX(pos)}
                    y2={padding.top + graphHeight + 6}
                    stroke="#94a3b8"
                  />
                  <text
                    x={scaleX(pos)}
                    y={padding.top + graphHeight + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fill="#64748b"
                  >
                    {pos} bp
                  </text>
                </g>
              ))}

              {/* Box and Whisker ranges for Raw (if shown) */}
              {(phredViewMode === 'both' || phredViewMode === 'raw') &&
                qc.rawQuality.map((pt, i) => (
                  <g key={`raw-box-${i}`} opacity="0.35">
                    <line
                      x1={scaleX(pt.position)}
                      y1={scaleY(pt.q10)}
                      x2={scaleX(pt.position)}
                      y2={scaleY(pt.q90)}
                      stroke="#ef4444"
                      strokeWidth="1"
                    />
                    <rect
                      x={scaleX(pt.position) - 3}
                      y={scaleY(pt.q75)}
                      width="6"
                      height={Math.max(2, scaleY(pt.q25) - scaleY(pt.q75))}
                      fill="#fca5a5"
                      stroke="#dc2626"
                      strokeWidth="0.8"
                    />
                  </g>
                ))}

              {/* Box and Whisker ranges for Trimmed (if shown) */}
              {(phredViewMode === 'both' || phredViewMode === 'trimmed') &&
                qc.trimmedQuality.map((pt, i) => (
                  <g key={`trim-box-${i}`} opacity="0.45">
                    <line
                      x1={scaleX(pt.position)}
                      y1={scaleY(pt.q10)}
                      x2={scaleX(pt.position)}
                      y2={scaleY(pt.q90)}
                      stroke="#059669"
                      strokeWidth="1"
                    />
                    <rect
                      x={scaleX(pt.position) - 2.5}
                      y={scaleY(pt.q75)}
                      width="5"
                      height={Math.max(2, scaleY(pt.q25) - scaleY(pt.q75))}
                      fill="#86efac"
                      stroke="#16a34a"
                      strokeWidth="0.8"
                    />
                  </g>
                ))}

              {/* Raw Quality Mean Line */}
              {(phredViewMode === 'both' || phredViewMode === 'raw') && (
                <path
                  d={rawPath}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Trimmed Quality Mean Line */}
              {(phredViewMode === 'both' || phredViewMode === 'trimmed') && (
                <path
                  d={trimmedPath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Hover Point Cursor */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={scaleX(hoveredPoint.pos)}
                    y1={padding.top}
                    x2={scaleX(hoveredPoint.pos)}
                    y2={padding.top + graphHeight}
                    stroke="#475569"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                  {hoveredPoint.rawMean !== undefined && (phredViewMode === 'both' || phredViewMode === 'raw') && (
                    <circle
                      cx={scaleX(hoveredPoint.pos)}
                      cy={scaleY(hoveredPoint.rawMean)}
                      r="5"
                      fill="#dc2626"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                  {hoveredPoint.trimMean !== undefined && (phredViewMode === 'both' || phredViewMode === 'trimmed') && (
                    <circle
                      cx={scaleX(hoveredPoint.pos)}
                      cy={scaleY(hoveredPoint.trimMean)}
                      r="5"
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}

              {/* Overlay hover rect to capture mouse movements */}
              <rect
                x={padding.left}
                y={padding.top}
                width={graphWidth}
                height={graphHeight}
                fill="transparent"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
                  const pos = Math.round(ratio * maxPos);
                  const closestRaw = qc.rawQuality.reduce((prev, curr) => 
                    Math.abs(curr.position - pos) < Math.abs(prev.position - pos) ? curr : prev
                  );
                  const closestTrim = qc.trimmedQuality.reduce((prev, curr) => 
                    Math.abs(curr.position - pos) < Math.abs(prev.position - pos) ? curr : prev
                  );
                  setHoveredPoint({
                    pos: closestRaw.position,
                    rawMean: closestRaw.mean,
                    trimMean: closestTrim.mean,
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredPoint && (
              <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-xs text-white p-2.5 rounded-lg text-xs shadow-lg font-mono border border-slate-700 pointer-events-none">
                <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1">
                  Position: {hoveredPoint.pos} bp
                </div>
                {hoveredPoint.rawMean !== undefined && (phredViewMode === 'both' || phredViewMode === 'raw') && (
                  <div className="flex items-center justify-between gap-4 text-rose-300">
                    <span>Raw Phred Mean:</span>
                    <span className="font-bold">Q{hoveredPoint.rawMean}</span>
                  </div>
                )}
                {hoveredPoint.trimMean !== undefined && (phredViewMode === 'both' || phredViewMode === 'trimmed') && (
                  <div className="flex items-center justify-between gap-4 text-sky-300">
                    <span>Trimmed Phred Mean:</span>
                    <span className="font-bold">Q{hoveredPoint.trimMean}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legend and explanation */}
          <div className="flex flex-wrap items-center justify-between mt-3 text-xs text-slate-600">
            <div className="flex items-center space-x-5">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3.5 h-1 bg-red-600 rounded-full inline-block" />
                Raw Reads Mean (Before Trimming)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3.5 h-1 bg-sky-600 rounded-full inline-block" />
                Cleaned Reads Mean (Cutadapt + DADA2)
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-sm" /> Q28+ (Very Good)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded-sm" /> Q20-Q28 (Acceptable)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-rose-100 border border-rose-300 rounded-sm" /> &lt;Q20 (Poor)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GC Distribution */}
      {activeTab === 'gc' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Per-Sequence GC Content Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Compares observed per-sequence GC% against a theoretical normal distribution. Deviations may indicate taxonomic contamination or primer dimer peaks.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3.5 h-1 bg-blue-600 rounded-full inline-block" /> Observed Metagenomic Reads (Peak: 52%)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span className="w-3.5 h-1 bg-slate-400 rounded-full inline-block stroke-dasharray" /> Theoretical Gaussian Model
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl bg-white p-4">
            <div className="h-64 flex items-end gap-1 pt-6 px-4">
              {qc.gcDistribution.map((pt) => {
                const heightPct = (pt.count / 19000) * 100;
                const theoPct = (pt.theoretical / 19000) * 100;
                return (
                  <div
                    key={pt.gc}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Theoretical line indicator */}
                    <div 
                      className="absolute w-full border-t border-slate-400 z-10 opacity-70"
                      style={{ bottom: `${theoPct}%` }}
                    />
                    {/* Observed bar */}
                    <div
                      className="w-full bg-blue-500 group-hover:bg-blue-600 rounded-t-xs transition-colors"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Hover tooltip */}
                    <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-md z-20 pointer-events-none whitespace-nowrap">
                      <div>GC Content: {pt.gc}%</div>
                      <div>Observed: {pt.count.toLocaleString()} reads</div>
                      <div>Theoretical: {pt.theoretical.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 px-2 border-t border-slate-100 pt-1">
              <span>0% GC</span>
              <span>25% GC</span>
              <span>50% GC (Community Peak)</span>
              <span>75% GC</span>
              <span>100% GC</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Adapter Contamination */}
      {activeTab === 'adapter' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Adapter Contamination Profile (Illumina Universal & Nextera)
              </h3>
              <p className="text-xs text-slate-500">
                Cutadapt adapter trimming effectively removes Illumina primer and adapter overhangs from the read ends.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Trimming */}
            <div className="border border-rose-200/80 rounded-xl p-4 bg-rose-50/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-rose-800">Raw FASTQ (Before Cutadapt)</span>
                <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono font-medium">
                  Peak: 7.8% Adapter
                </span>
              </div>
              <div className="h-44 flex items-end gap-1.5 px-2 pt-4">
                {qc.adapterBefore.map((pt) => {
                  const h = Math.min(100, (pt.illuminaUniversal / 8) * 100);
                  return (
                    <div key={pt.position} className="flex-1 flex flex-col justify-end h-full group relative">
                      <div
                        className="w-full bg-rose-400 group-hover:bg-rose-500 rounded-t-xs"
                        style={{ height: `${Math.max(2, h)}%` }}
                      />
                      <div className="hidden group-hover:block absolute bottom-full mb-1 bg-slate-900 text-white text-[10px] p-1.5 rounded z-20 whitespace-nowrap">
                        Pos {pt.position} bp: {pt.illuminaUniversal}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 border-t border-slate-200 pt-1">
                <span>1 bp</span>
                <span>125 bp</span>
                <span>250 bp (Adapter Read-through)</span>
              </div>
            </div>

            {/* After Trimming */}
            <div className="border border-emerald-200/80 rounded-xl p-4 bg-emerald-50/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-emerald-800">Trimmed FASTQ (Post Cutadapt)</span>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-medium">
                  &lt;0.01% Adapter (Clean)
                </span>
              </div>
              <div className="h-44 flex items-end gap-1.5 px-2 pt-4">
                {qc.adapterAfter.map((pt) => {
                  return (
                    <div key={pt.position} className="flex-1 flex flex-col justify-end h-full group relative">
                      <div
                        className="w-full bg-emerald-400 rounded-t-xs"
                        style={{ height: '3%' }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 border-t border-slate-200 pt-1">
                <span>1 bp</span>
                <span>125 bp</span>
                <span>240 bp (Filtered & Trimmed)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Read Retention Waterfall */}
      {activeTab === 'retention' && (
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Sample-by-Sample Pipeline Read Retention Tracking
            </h3>
            <p className="text-xs text-slate-500">
              Tracking read survival across Raw FASTQ → Cutadapt Primers Trimming → DADA2 Error Denoising → Chimera Removal.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Sample ID</th>
                  <th className="py-2.5 px-4">Condition / Group</th>
                  <th className="py-2.5 px-4 text-right">Raw Reads</th>
                  <th className="py-2.5 px-4 text-right">Trimmed (Cutadapt)</th>
                  <th className="py-2.5 px-4 text-right">Denoised (DADA2)</th>
                  <th className="py-2.5 px-4 text-right">Non-Chimeric ASVs</th>
                  <th className="py-2.5 px-4 text-right">Retention Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {s.group}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600">{s.rawReads.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-slate-600">{s.trimmedReads.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-slate-600">{s.denoisedReads.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                      {s.nonChimericReads.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {s.retainedPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
