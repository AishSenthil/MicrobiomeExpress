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
  ChevronDown
} from 'lucide-react';
import { PipelineRunResults } from '../types/pipeline';
import { AVAILABLE_DATASETS } from '../data/mockDatasets';

interface HeaderProps {
  currentDataset: PipelineRunResults;
  onSelectDataset: (dataset: PipelineRunResults) => void;
  isRunning: boolean;
  onRunPipeline: () => void;
  onOpenConfig: () => void;
  onOpenUpload: () => void;
  onOpenCodeHub: () => void;
  onOpenReport: () => void;
  onDownloadAsset: (assetType: 'asv_tsv' | 'asv_biom' | 'fasta' | 'otu_tsv' | 'otu_biom' | 'otu_fasta' | 'asv_otu_map' | 'params' | 'html_report') => void;
  onReturnToLanding?: () => void;
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
  onReturnToLanding,
}) => {
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
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

          {/* Center: Dataset quick switch */}
          <div className="hidden lg:flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-500 px-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" /> Cohort:
            </span>
            {AVAILABLE_DATASETS.map((ds) => {
              const active = currentDataset.runId === ds.data.runId;
              return (
                <button
                  key={ds.id}
                  onClick={() => onSelectDataset(ds.data)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    active
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {ds.id === 'gut' 
                    ? 'Gut (Paired-End)' 
                    : ds.id === 'gut_single' 
                    ? 'Gut (Single-End)' 
                    : 'Soil Rhizosphere'}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Upload FASTQ/FASTA files and edit metadata manifest"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Uploads</span>
            </button>

            {/* Config Button */}
            <button
              onClick={onOpenConfig}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Pipeline parameter settings (Phred, Primers, Truncation, DADA2)"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Parameters</span>
            </button>

            {/* Pipeline Scripts & Code */}
            <button
              onClick={onOpenCodeHub}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Inspect Python wrappers, Snakemake, Nextflow, and Dockerfile"
            >
              <FileCode2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Repo & Scripts</span>
            </button>

            {/* Report Button */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors border border-blue-200"
              title="Generate and view HTML/PDF publication-grade report"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Generate Report</span>
            </button>

            {/* Run Pipeline Button */}
            <button
              onClick={onRunPipeline}
              disabled={isRunning}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-all ${
                isRunning
                  ? 'bg-amber-500 text-white cursor-not-allowed animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
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
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
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
