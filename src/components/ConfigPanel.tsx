import React, { useState } from 'react';
import { 
  Sliders, 
  X, 
  RotateCcw, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Dna,
  Save,
  Cloud,
  HardDrive,
  Mail,
  Zap,
  Server
} from 'lucide-react';
import { PipelineConfig } from '../types/pipeline';
import { DEFAULT_PIPELINE_CONFIG } from '../data/mockDatasets';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: PipelineConfig;
  onSaveConfig: (newConfig: PipelineConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<PipelineConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: '16S-V4' | '16S-V3-V4' | 'ITS1') => {
    if (preset === '16S-V4') {
      setFormData(prev => ({
        ...prev,
        targetRegion: '16S-V4',
        forwardPrimer: 'GTGCCAGCMGCCGCGGTAA', // 515F
        reversePrimer: 'GGACTACHVGGGTWTCTAAT', // 806R
        truncLenF: 240,
        truncLenR: 190,
      }));
    } else if (preset === '16S-V3-V4') {
      setFormData(prev => ({
        ...prev,
        targetRegion: '16S-V3-V4',
        forwardPrimer: 'CCTACGGGNGGCWGCAG', // 341F
        reversePrimer: 'GACTACHVGGGTATCTAATCC', // 805R
        truncLenF: 280,
        truncLenR: 220,
      }));
    } else if (preset === 'ITS1') {
      setFormData(prev => ({
        ...prev,
        targetRegion: 'ITS1',
        forwardPrimer: 'CTTGGTCATTTAGAGGAAGTAA', // ITS1F
        reversePrimer: 'GCTGCGTTCTTCATCGATGC', // ITS2
        truncLenF: 0, // ITS has variable length, no truncate
        truncLenR: 0,
      }));
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setFormData(DEFAULT_PIPELINE_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pipeline Parameters & Tool Configuration</h2>
              <p className="text-xs text-slate-500">Fine-tune Cutadapt trimming, DADA2 error inference, and SILVA taxonomy filters.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Presets */}
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Target Amplicon Presets</span>
              <button
                onClick={handleReset}
                className="text-[11px] font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Recommended Defaults
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handlePresetSelect('16S-V4')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.targetRegion === '16S-V4'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <div className="font-bold text-slate-900">16S V4 Region</div>
                <div className="text-[11px] text-slate-500 mt-0.5">515F / 806R Primers (~250 bp)</div>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('16S-V3-V4')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.targetRegion === '16S-V3-V4'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <div className="font-bold text-slate-900">16S V3-V4 Region</div>
                <div className="text-[11px] text-slate-500 mt-0.5">341F / 805R Primers (~460 bp)</div>
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('ITS1')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.targetRegion === 'ITS1'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <div className="font-bold text-slate-900">Fungal ITS1</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ITS1F / ITS2 (Variable Length)</div>
              </button>
            </div>
          </div>

          {/* Section 1: Primers & Trimming (Cutadapt) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-blue-600" />
                Step 2: Sequencing Layout & Primer Trimming (Cutadapt v4.4)
              </span>

              {/* Sequencing Layout Toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sequencingType: 'paired' })}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    formData.sequencingType === 'paired'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paired-End
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sequencingType: 'single', truncLenR: 0, maxEER: 0 })}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    formData.sequencingType === 'single'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single-End
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Forward Primer (5' → 3')
                </label>
                <input
                  type="text"
                  value={formData.forwardPrimer}
                  onChange={(e) => setFormData({ ...formData, forwardPrimer: e.target.value.toUpperCase() })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5 uppercase focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Reverse Primer (5' → 3')
                  {formData.sequencingType === 'single' && (
                    <span className="text-[10px] text-amber-600 font-normal ml-1">(Optional / None for Single-End)</span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={formData.sequencingType === 'single'}
                  placeholder={formData.sequencingType === 'single' ? 'N/A for Single-End' : 'e.g. GGACTACHVGGGTWTCTAAT'}
                  value={formData.reversePrimer}
                  onChange={(e) => setFormData({ ...formData, reversePrimer: e.target.value.toUpperCase() })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5 uppercase focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Phred Cutoff (Q)
                </label>
                <input
                  type="number"
                  min="15"
                  max="35"
                  value={formData.phredCutoff}
                  onChange={(e) => setFormData({ ...formData, phredCutoff: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                />
                <span className="text-[10px] text-slate-400">Default: Q25</span>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Min Read Length
                </label>
                <input
                  type="number"
                  min="100"
                  max="300"
                  value={formData.minReadLength}
                  onChange={(e) => setFormData({ ...formData, minReadLength: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                />
                <span className="text-[10px] text-slate-400">Default: 180 bp</span>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Truncate Forward (F)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={formData.truncLenF}
                  onChange={(e) => setFormData({ ...formData, truncLenF: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                />
                <span className="text-[10px] text-slate-400">0 to disable</span>
              </div>
              <div className={formData.sequencingType === 'single' ? 'opacity-50' : ''}>
                <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>Truncate Reverse (R)</span>
                  {formData.sequencingType === 'single' && (
                    <span className="text-[10px] text-amber-600 font-semibold">Single-End (N/A)</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  disabled={formData.sequencingType === 'single'}
                  value={formData.truncLenR}
                  onChange={(e) => setFormData({ ...formData, truncLenR: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">
                  {formData.sequencingType === 'single' ? 'Disabled in single-end mode' : '0 to disable'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: DADA2 & Chimera Removal */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-200 pb-2">
              <span>Step 3 & 4: Denoising & Chimera Detection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Denoising Algorithm
                </label>
                <select
                  value={formData.denoisingTool}
                  onChange={(e) => setFormData({ ...formData, denoisingTool: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
                >
                  <option value="DADA2">DADA2 (Error-rate learning)</option>
                  <option value="Deblur">Deblur (Static error profile)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chimera Detection
                </label>
                <select
                  value={formData.chimeraMethod}
                  onChange={(e) => setFormData({ ...formData, chimeraMethod: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
                >
                  <option value="consensus">DADA2 removeBimeraDenovo (consensus)</option>
                  <option value="pooled">DADA2 removeBimeraDenovo (pooled)</option>
                  <option value="vsearch">VSEARCH uchime_denovo</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>Max Expected Errors (maxEE)</span>
                  <span className="text-[10px] text-slate-400">
                    {formData.sequencingType === 'single' ? 'Forward only' : 'Fwd / Rev'}
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.maxEEF}
                      onChange={(e) => setFormData({ ...formData, maxEEF: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center text-xs"
                      placeholder="Fwd"
                    />
                    <span className="block text-[9px] text-center text-slate-400 mt-0.5">Fwd (e.g. 2.0)</span>
                  </div>
                  <div className={`w-1/2 ${formData.sequencingType === 'single' ? 'opacity-50' : ''}`}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      disabled={formData.sequencingType === 'single'}
                      value={formData.maxEER}
                      onChange={(e) => setFormData({ ...formData, maxEER: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center text-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      placeholder={formData.sequencingType === 'single' ? 'N/A' : 'Rev'}
                    />
                    <span className="block text-[9px] text-center text-slate-400 mt-0.5">
                      {formData.sequencingType === 'single' ? 'Rev (N/A)' : 'Rev (e.g. 2.0)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2b: OTU Clustering Options */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 space-y-4">
            <div className="font-bold text-teal-900 text-xs flex items-center justify-between border-b border-teal-200 pb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                Step 4b: OTU Clustering & Centroid Discovery (VSEARCH v2.22.1)
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-teal-800">
                <input
                  type="checkbox"
                  checked={formData.enableOtuClustering}
                  onChange={(e) => setFormData({ ...formData, enableOtuClustering: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Generate 97% OTU Outputs</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  OTU Clustering Tool
                </label>
                <select
                  value={formData.otuClusteringTool}
                  disabled={!formData.enableOtuClustering}
                  onChange={(e) => setFormData({ ...formData, otuClusteringTool: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium disabled:opacity-50"
                >
                  <option value="VSEARCH">VSEARCH (vsearch --cluster_fast)</option>
                  <option value="Swarm">Swarm (Single-linkage d=1)</option>
                  <option value="QIIME2_vsearch">QIIME 2 (q2-vsearch de-novo)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Clustering Identity Cutoff
                </label>
                <select
                  value={formData.otuIdentity}
                  disabled={!formData.enableOtuClustering}
                  onChange={(e) => setFormData({ ...formData, otuIdentity: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium disabled:opacity-50"
                >
                  <option value={0.97}>97% Similarity (Standard Species OTU)</option>
                  <option value={0.99}>99% Similarity (Fine Strain Cluster)</option>
                  <option value={0.95}>95% Similarity (Genus-Level Cluster)</option>
                </select>
                <span className="text-[10px] text-slate-400">Canonical standard: 97% similarity</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Centroid Selection Method
                </label>
                <div className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 font-mono">
                  Abundance-sorted greedy
                </div>
                <span className="text-[10px] text-slate-400">Highest-abundance ASV becomes centroid</span>
              </div>
            </div>
          </div>

          {/* Section 3: Taxonomy & Workflow Manager */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-200 pb-2">
              <span>Step 5: Reference Taxonomy Database & Orchestration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Taxonomy Reference DB
                </label>
                <select
                  value={formData.taxonomyDb}
                  onChange={(e) => setFormData({ ...formData, taxonomyDb: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
                >
                  <option value="SILVA_138.1">SILVA 138.1 (NR99 with Species)</option>
                  <option value="Greengenes2_2022.10">Greengenes2 2022.10</option>
                  <option value="RefSeq_16S">NCBI RefSeq Targeted 16S</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Confidence Threshold
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={formData.confidenceThreshold}
                  onChange={(e) => setFormData({ ...formData, confidenceThreshold: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                />
                <span className="text-[10px] text-slate-400">Default: 0.80 (80% Bootstrap)</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Workflow Orchestrator
                </label>
                <select
                  value={formData.workflowManager}
                  onChange={(e) => setFormData({ ...formData, workflowManager: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
                >
                  <option value="Nextflow">Nextflow (DSL2 Cloud/SLURM)</option>
                  <option value="Snakemake">Snakemake (Rule Engine)</option>
                  <option value="Celery">Celery (Async Python Tasks)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Cloud Storage Offload & Asynchronous Batch Processing */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/30 space-y-4">
            <div className="font-bold text-sky-950 text-xs flex items-center justify-between border-b border-sky-200/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-sky-600" />
                Step 6: Cloud Storage Offloading & Asynchronous Batch Chunking
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Recommended for Large Files (&gt;1 GB)
              </span>
            </div>

            <p className="text-[11px] text-sky-900/80">
              When working with high-throughput FASTQ files, running synchronously in the browser causes timeouts. Best practice streams files directly to cloud object storage and dispatches work chunk-by-chunk to asynchronous background workers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Execution Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, executionMode: 'cloud_batch' })}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formData.executionMode === 'cloud_batch'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cloud Batch Queue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, executionMode: 'interactive' })}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formData.executionMode === 'interactive'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Quick Preview</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">
                  {formData.executionMode === 'cloud_batch' 
                    ? 'Runs async in background; browser will not block' 
                    : 'Fast in-memory simulation for test subsets'}
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Cloud Storage Provider & Bucket
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.cloudStorageProvider || 'gcs'}
                    onChange={(e) => setFormData({ ...formData, cloudStorageProvider: e.target.value as any })}
                    className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-xs"
                  >
                    <option value="gcs">GCS (gs://)</option>
                    <option value="s3">AWS S3 (s3://)</option>
                    <option value="local_volume">POSIX Volume</option>
                  </select>
                  <input
                    type="text"
                    value={formData.cloudBucketUri || 'gs://microbiome-runs-staging/cohort-2026'}
                    onChange={(e) => setFormData({ ...formData, cloudBucketUri: e.target.value })}
                    className="w-2/3 font-mono text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                    placeholder="gs://bucket/path"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Direct chunked multipart upload destination</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Batch Chunk Size (Samples per Task)
                </label>
                <select
                  value={formData.batchChunkSize || 2}
                  onChange={(e) => setFormData({ ...formData, batchChunkSize: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-xs"
                >
                  <option value={2}>2 Samples / Batch (Low Memory &lt;8GB, Safe)</option>
                  <option value={4}>4 Samples / Batch (Standard Cluster Node)</option>
                  <option value={8}>8 Samples / Batch (High-Throughput Node)</option>
                </select>
                <span className="text-[10px] text-slate-400">Processes cohort in chunks to prevent DADA2 OOM crashes</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Async Job Notification Email
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={formData.notifyEmail || 'lakshmibiotech2003@gmail.com'}
                    onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                    className="w-full font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                    placeholder="you@domain.com"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Sends alert with download link upon batch completion</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                <div>
                  <label className="block font-medium text-slate-700">Auto-run pipeline on upload</label>
                  <span className="text-[10px] text-slate-500">Automatically start processing after file staging</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoRunOnUpload}
                  onChange={(e) => setFormData({ ...formData, autoRunOnUpload: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Saved Parameters!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Apply Parameters</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
