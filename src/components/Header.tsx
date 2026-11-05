import React, { useState } from 'react';
import { 
  Dna, 
  Play, 
  RotateCcw, 
  Download, 
  FileCode2, 
  Sliders, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Database,
  ChevronDown,
  HelpCircle,
  Search,
  Trash2,
  History
} from 'lucide-react';
import { PipelineRunResults } from '../types/pipeline';
import { AVAILABLE_DATASETS, CLEAN_USER_DATASET } from '../data/mockDatasets';
import { fetchPersistentPipelineRuns, PersistentPipelineRun } from '../services/pipelineStorageService';

interface HeaderProps {
  currentDataset: PipelineRunResults;
  onSelectDataset: (dataset: PipelineRunResults) => void;
  isRunning: boolean;
  onRunPipeline: () => void;
  onOpenConfig: () => void;
  onOpenUpload: () => void;
  onOpenCodeHub?: () => void;
  onOpenReport: () => void;
  onOpenBatchHistory?: () => void;
  onDownloadAsset: (assetType: 'asv_tsv' | 'asv_biom' | 'fasta' | 'otu_tsv' | 'otu_biom' | 'otu_fasta' | 'asv_otu_map' | 'params' | 'html_report') => void;
  recentRuns: PersistentPipelineRun[];
  onSelectRunId: (runId: string) => void;
  onDeleteRun: (runId: string) => void;
  onReturnToLanding?: () => void;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDataset,
  onSelectDataset,
  isRunning,
  onRunPipeline,
  onOpenConfig,
  onOpenUpload,
  onOpenCodeHub,
  onOpenReport,
  onDownloadAsset,
  recentRuns,
  onSelectRunId,
  onDeleteRun,
  onReturnToLanding,
  onStartTour,
  onOpenBatchHistory,
}) => {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [runSearch, setRunProjectSearch] = useState('');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="tour-header-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={onReturnToLanding}
            title="Return to Landing Page & Overview"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-lg ring-2 ring-blue-50">
              <Dna className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">MicrobiomeXpress</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full uppercase tracking-wide">
                  SILVA 138.1
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                <span className="font-bold text-blue-700">From FASTQ to Insights — in One Click.</span>
                <span className="text-slate-400 mx-1">|</span>
                <span className="italic text-slate-500">One Dashboard. One Click. Complete Workflow.</span>
              </p>
            </div>
          </div>

          {/* Center: Project / Dataset Switcher */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setProjectSwitcherOpen(!projectSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Active Project</span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                      {currentDataset.datasetName || 'Unnamed Project'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${projectSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {projectSwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProjectSwitcherOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search pipelines by name..."
                          value={runSearch}
                          onChange={(e) => setRunProjectSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto py-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace</div>
                      <button
                        onClick={() => { onSelectDataset(CLEAN_USER_DATASET); setProjectSwitcherOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          currentDataset.runId === CLEAN_USER_DATASET.runId ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Start New Project (Fresh)</span>
                        </div>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${currentDataset.runId === CLEAN_USER_DATASET.runId ? 'opacity-100' : 'opacity-0'}`} />
                      </button>

                      {recentRuns.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border-t border-slate-50 mt-1">Recent Executed Runs</div>
                          {recentRuns
                            .filter(run => 
                              run.datasetName.toLowerCase().includes(runSearch.toLowerCase()) || 
                              run.runId.toLowerCase().includes(runSearch.toLowerCase())
                            )
                            .map(run => (
                              <div
                                key={run.runId}
                                onClick={() => { onSelectRunId(run.runId); setProjectSwitcherOpen(false); }}
                                className={`w-full text-left px-3 py-2 transition-colors border-l-2 flex items-center justify-between group/run cursor-pointer ${
                                  currentDataset.runId === run.runId 
                                    ? 'bg-blue-50 border-blue-600 text-blue-800' 
                                    : 'hover:bg-slate-50 border-transparent text-slate-700'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold truncate pr-2">{run.datasetName}</span>
                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{run.runId}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400">{new Date(run.createdAt).toLocaleDateString()}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] text-slate-400">{run.sampleCount} Samples</span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isRunning) return;
                                    onDeleteRun(run.runId);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ml-2 ${
                                    isRunning ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/run:opacity-100'
                                  }`}
                                  title={isRunning ? "Cannot delete while pipeline is running" : "Delete this run"}
                                  disabled={isRunning}
                                  data-run-id={run.runId}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          }
                        </>
                      )}

                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 mt-1">Demos</div>
                      {AVAILABLE_DATASETS.map((ds: { id: string; name: string; data: PipelineRunResults }) => {
                        const active = currentDataset.runId === ds.data.runId;
                        return (
                          <button
                            key={ds.id}
                            onClick={() => { onSelectDataset(ds.data); setProjectSwitcherOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              active ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="font-medium">{ds.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {currentDataset.runId !== CLEAN_USER_DATASET.runId && (
              <button
                onClick={() => onSelectDataset(CLEAN_USER_DATASET)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-2xs group"
                title="Start New Project (Clear Current Data)"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-90deg] transition-transform" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2" id="tour-action-buttons">
            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 text-xs font-bold text-blue-950 bg-gradient-to-r from-blue-50 to-sky-100 hover:from-blue-100 hover:to-sky-200 border border-blue-200/90 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Upload FASTQ/FASTA files and edit metadata manifest"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Uploads</span>
            </button>

            {/* Config Button */}
            <button
              onClick={onOpenConfig}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-gradient-to-r from-slate-50 to-indigo-50 hover:from-slate-100 hover:to-indigo-100 border border-slate-300/90 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Pipeline parameter settings (Phred, Primers, Truncation, DADA2)"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Parameters</span>
            </button>

            {/* Batch History Manager (Moved out of pipeline data tabs) */}
            {onOpenBatchHistory && (
              <button
                onClick={onOpenBatchHistory}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border border-slate-300/90 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                title="View previous pipeline run checkpoints and execution logs"
              >
                <History className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Batch History</span>
                {recentRuns && recentRuns.length > 0 && (
                  <span className="text-[10px] bg-slate-800 text-white font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {recentRuns.length}
                  </span>
                )}
              </button>
            )}

            {/* Report Button */}
            <button
              onClick={onOpenReport}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-950 bg-gradient-to-r from-indigo-50 to-teal-50 hover:from-indigo-100 hover:to-teal-100 border border-indigo-200/90 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Generate and view HTML/PDF publication-grade report"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Generate Report</span>
            </button>

            {/* Tour Help Button */}
            {onStartTour && (
              <button
                onClick={onStartTour}
                className="p-2 text-slate-700 hover:text-blue-600 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-300 rounded-xl transition-all shadow-2xs active:scale-95"
                title="Start Interactive Studio Tour"
              >
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </button>
            )}

            {/* Run Pipeline Button */}
            <button
              onClick={onRunPipeline}
              disabled={isRunning}
              className={`px-4 py-1.5 text-xs font-black tracking-tight rounded-xl flex items-center gap-2 shadow-md transition-all transform active:scale-95 text-white ${
                isRunning
                  ? 'bg-amber-500 cursor-not-allowed animate-pulse shadow-amber-500/20'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 shadow-blue-600/30 ring-2 ring-blue-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Pipeline</span>
                </>
              )}
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDownloadOpen(!downloadOpen)}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-emerald-700" />
              </button>

              {downloadOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDownloadOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold text-blue-700 bg-blue-50/70 uppercase tracking-wider flex items-center justify-between">
                      <span>ASV Outputs (100% exact)</span>
                      <span className="font-mono">DADA2</span>
                    </div>
                    <button
                      onClick={() => { onDownloadAsset('asv_tsv'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">ASV Abundance Table (.tsv)</span>
                      <span className="text-[10px] text-slate-400 font-mono">TSV</span>
                    </button>
                    <button
                      onClick={() => { onDownloadAsset('asv_biom'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">ASV BIOM Matrix (.biom)</span>
                      <span className="text-[10px] text-slate-400 font-mono">JSON</span>
                    </button>
                    <button
                      onClick={() => { onDownloadAsset('fasta'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">ASV Sequences (.fasta)</span>
                      <span className="text-[10px] text-slate-400 font-mono">FASTA</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <div className="px-3 py-1 text-[10px] font-bold text-teal-700 bg-teal-50/70 uppercase tracking-wider flex items-center justify-between">
                      <span>OTU Outputs (97% Cluster)</span>
                      <span className="font-mono">VSEARCH</span>
                    </div>
                    <button
                      onClick={() => { onDownloadAsset('otu_tsv'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">OTU Abundance Table (.tsv)</span>
                      <span className="text-[10px] text-slate-400 font-mono">TSV</span>
                    </button>
                    <button
                      onClick={() => { onDownloadAsset('otu_biom'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">OTU BIOM Matrix (.biom)</span>
                      <span className="text-[10px] text-slate-400 font-mono">JSON</span>
                    </button>
                    <button
                      onClick={() => { onDownloadAsset('otu_fasta'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">OTU Centroids (.fasta)</span>
                      <span className="text-[10px] text-slate-400 font-mono">FASTA</span>
                    </button>
                    <button
                      onClick={() => { onDownloadAsset('asv_otu_map'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">ASV-to-OTU Map (.tsv)</span>
                      <span className="text-[10px] text-teal-600 font-mono">MAP</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => { onDownloadAsset('params'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                    >
                      <span className="font-medium">Parameters (params.yaml)</span>
                      <span className="text-[10px] text-slate-400 font-mono">YAML</span>
                    </button>
                    <button
                      onClick={() => { onDownloadAsset('html_report'); setDownloadOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 flex items-center justify-between font-medium"
                    >
                      <span>Interactive Report (.html)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">HTML</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
