import React from 'react';
import { Clock, Cpu, HardDrive, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { PipelineStage } from '../types/pipeline';

interface PipelineTimelineProps {
  stages: PipelineStage[];
  title?: string;
  subtitle?: string;
}

// Parse string durations like "18s", "1m 14s", "2m 15s" into total seconds
export function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 0;
  let totalSec = 0;
  const minMatch = durationStr.match(/(\d+)\s*m/);
  const secMatch = durationStr.match(/(\d+)\s*s/);
  if (minMatch) {
    totalSec += parseInt(minMatch[1], 10) * 60;
  }
  if (secMatch) {
    totalSec += parseInt(secMatch[1], 10);
  }
  if (!minMatch && !secMatch) {
    const rawNum = parseInt(durationStr, 10);
    if (!isNaN(rawNum)) totalSec = rawNum;
  }
  return totalSec;
}

// Stage-specific color palette for timeline visualization
const STAGE_COLORS: Record<string, { bg: string; text: string; ring: string; hex: string }> = {
  fastqc_raw: { bg: 'bg-sky-500', text: 'text-sky-700', ring: 'ring-sky-200', hex: '#0284c7' },
  trimming: { bg: 'bg-indigo-500', text: 'text-indigo-700', ring: 'ring-indigo-200', hex: '#6366f1' },
  denoising: { bg: 'bg-blue-600', text: 'text-blue-700', ring: 'ring-blue-200', hex: '#2563eb' },
  chimera: { bg: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200', hex: '#d97706' },
  otu_clustering: { bg: 'bg-teal-500', text: 'text-teal-700', ring: 'ring-teal-200', hex: '#0d9488' },
  taxonomy: { bg: 'bg-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-200', hex: '#059669' },
  diversity: { bg: 'bg-purple-600', text: 'text-purple-700', ring: 'ring-purple-200', hex: '#9333ea' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-500', text: 'text-slate-700', ring: 'ring-slate-200', hex: '#64748b' };

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ 
  stages, 
  title = "Pipeline Execution Timeline", 
  subtitle = "Horizontal stacked duration breakdown across bioinformatic tools" 
}) => {
  // Compute stage durations and total
  const stageStats = stages.map(stage => {
    const seconds = parseDurationToSeconds(stage.duration);
    const color = STAGE_COLORS[stage.id] || DEFAULT_COLOR;
    return {
      ...stage,
      seconds,
      color,
    };
  });

  const totalSeconds = stageStats.reduce((acc, s) => acc + s.seconds, 0);

  const formatTotalTime = (sec: number) => {
    if (sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Runtime:</span>
          <span className="font-mono text-xs font-bold text-slate-900">{formatTotalTime(totalSeconds)}</span>
        </div>
      </div>

      {totalSeconds === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <span>No duration logs recorded yet. Run the pipeline to view the execution timeline.</span>
        </div>
      ) : (
        <>
          {/* Horizontal Stacked Bar Chart */}
          <div className="space-y-2">
            <div className="h-8 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner p-1 gap-1">
              {stageStats.map(stage => {
                if (stage.seconds <= 0) return null;
                const pct = ((stage.seconds / totalSeconds) * 100);
                return (
                  <div
                    key={stage.id}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    className={`${stage.color.bg} h-full rounded-lg relative group transition-all hover:opacity-90 hover:brightness-105 cursor-pointer flex items-center justify-center`}
                    title={`${stage.name} (${stage.tool}): ${stage.duration || `${stage.seconds}s`} (${pct.toFixed(1)}%)`}
                  >
                    {pct >= 8 && (
                      <span className="text-[11px] font-bold text-white tracking-wider truncate px-1 drop-shadow-xs">
                        {stage.tool}
                      </span>
                    )}

                    {/* Hover Floating Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[11px] font-sans rounded-xl py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-800">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${stage.color.bg}`} />
                          <span>{stage.name} ({stage.tool})</span>
                        </div>
                        <div className="text-slate-300 font-mono text-[10px] mt-0.5">
                          Duration: {stage.duration || `${stage.seconds}s`} • {pct.toFixed(1)}% of total run
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Timeline Tick Labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>0s</span>
              <span>{formatTotalTime(Math.round(totalSeconds / 2))}</span>
              <span>{formatTotalTime(totalSeconds)}</span>
            </div>
          </div>

          {/* Breakdown Stage Cards / Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
            {stageStats.map(stage => {
              const pct = totalSeconds > 0 ? ((stage.seconds / totalSeconds) * 100).toFixed(1) : '0';
              return (
                <div 
                  key={stage.id} 
                  className="bg-slate-50/80 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color.bg} shrink-0`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate" title={stage.name}>
                        {stage.tool}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {stage.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {stage.duration || `${stage.seconds}s`}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400">
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
