import React, { useState } from 'react';
import { 
  CheckCircle2, 
  CircleDashed, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Cpu, 
  AlertCircle,
  Copy,
  Check,
  Cloud,
  HardDrive,
  Layers,
  Server,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { PipelineStage, PipelineConfig, BatchJobState } from '../types/pipeline';

interface PipelineStepperProps {
  stages: PipelineStage[];
  currentStageIndex: number;
  isRunning: boolean;
  activeStageId: string;
  onSelectStage: (stageId: string) => void;
  config?: PipelineConfig;
  batchJobState?: BatchJobState | null;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  stages,
  isRunning,
  activeStageId,
  onSelectStage,
  config,
  batchJobState,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  // Selected stage for logs
  const selectedStage = stages.find(s => s.id === activeStageId) || stages[0];

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(selectedStage.logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Stages progress row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isCurrent = stage.status === 'running';
            const isSelected = stage.id === activeStageId;

            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/40'
                    : isCompleted
                    ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    : isCurrent
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-slate-100 bg-slate-50/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Step 0{idx + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <CircleDashed className="w-4 h-4 text-amber-500 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>

                <div className="font-semibold text-xs text-slate-800 leading-tight truncate">
                  {stage.name}
                </div>
                
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span className="truncate font-mono text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                    {stage.tool}
                  </span>
                  {stage.duration && (
                    <span className="text-[10px] text-slate-400">{stage.duration}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Cloud Batch & Asynchronous Queue Monitor (when cloud_batch is active) */}
        {config?.executionMode === 'cloud_batch' && (
          <div className="mt-3 p-3 bg-sky-50/70 border border-sky-200/90 rounded-xl space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-sky-600 text-white rounded-md">
                  <Cloud className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-sky-950 text-xs">
                  Asynchronous Cloud Storage & Chunked Batch Queue
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {config.workflowManager || 'Celery'} Daemon
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-sky-800">
                <span className="flex items-center gap-1 font-mono">
                  <HardDrive className="w-3 h-3 text-sky-600" />
                  {config.cloudBucketUri || 'gs://microbiome-runs-staging/cohort-2026'}
                </span>
                <span className="text-sky-300">•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Non-blocking (Safe to close/navigate)
                </span>
              </div>
            </div>

            {/* Batch Chunks Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Sample Batch Chunks:</span>
                {batchJobState?.chunks ? (
                  batchJobState.chunks.map((chk, i) => (
                    <div
                      key={i}
                      className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 ${
                        chk.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : chk.status === 'processing'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400 animate-pulse'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      <span className="font-bold">Chunk {chk.chunkIndex}/{chk.totalChunks}</span>
                      <span className="text-[10px] text-slate-500">({chk.sampleIds.join(', ')})</span>
                      {chk.status === 'completed' && <Check className="w-3 h-3 text-emerald-600" />}
                      {chk.status === 'processing' && <CircleDashed className="w-3 h-3 text-amber-600 animate-spin" />}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="px-2 py-0.5 rounded-lg border text-[11px] font-mono bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                      <span>Chunk 1/3 (S01, S02)</span>
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="px-2 py-0.5 rounded-lg border text-[11px] font-mono bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                      <span>Chunk 2/3 (S03, S04)</span>
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="px-2 py-0.5 rounded-lg border text-[11px] font-mono bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                      <span>Chunk 3/3 (S05, S06)</span>
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  Peak RAM: <strong>4.8 GB</strong> / {config.maxMemoryPerWorkerGb || 16} GB Cap
                </span>
                <span className="text-slate-300">|</span>
                <span>Workers: <strong>{config.maxParallelWorkers || 4} parallel</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Status bar & log toggle */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              {isRunning 
                ? config?.executionMode === 'cloud_batch' 
                  ? 'Batch workers executing chunk tasks in cloud...' 
                  : 'Workflow executing tasks...' 
                : 'Workflow idle / ready'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 hidden sm:inline flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" /> Multi-threaded (8 CPU cores, 16GB RAM)
            </span>
          </div>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Logs ({selectedStage.name})</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live Terminal Log Drawer */}
        {showLogs && (
          <div className="mt-3 bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span className="text-slate-400 text-xs ml-2">
                  [stdout/stderr] - {selectedStage.tool} ({selectedStage.version}) - {selectedStage.name}
                </span>
              </div>
              <button
                onClick={handleCopyLogs}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy output'}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] leading-relaxed">
              {selectedStage.logs.map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-slate-600 select-none w-8 text-right pr-3">{i + 1}</span>
                  <span className={line.startsWith('ERROR') ? 'text-rose-400' : line.startsWith('INFO') ? 'text-emerald-300' : line.startsWith('WARN') ? 'text-amber-300' : 'text-slate-300'}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
