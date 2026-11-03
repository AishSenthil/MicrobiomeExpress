import React, { useState } from 'react';
import { 
  Upload, 
  X, 
  FileUp, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileSpreadsheet,
  Dna,
  Layers,
  FileCode,
  Info,
  Play,
  ArrowRight,
  Cloud,
  Zap,
  Server,
  HardDrive
} from 'lucide-react';
import { SampleMetadata, SequencingType } from '../types/pipeline';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: SampleMetadata[];
  sequencingType: SequencingType;
  onUpdateSamples: (samples: SampleMetadata[], newType?: SequencingType, executionMode?: 'cloud_batch' | 'interactive') => void;
  onSaveAndRun?: (samples: SampleMetadata[], newType?: SequencingType, executionMode?: 'cloud_batch' | 'interactive') => void;
  onLoadMockFiles: () => void;
  onLoadSingleEndMockFiles: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  samples,
  sequencingType,
  onUpdateSamples,
  onSaveAndRun,
  onLoadMockFiles,
  onLoadSingleEndMockFiles,
}) => {
  const [selectedLayout, setSelectedLayout] = useState<SequencingType>(sequencingType || 'paired');
  const [executionMode, setExecutionMode] = useState<'cloud_batch' | 'interactive'>('cloud_batch');
  const [batchChunkSize, setBatchChunkSize] = useState<number>(2);
  const [sampleList, setSampleList] = useState<SampleMetadata[]>(samples);
  const [dragOver, setDragOver] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSingleEnd = selectedLayout === 'single';

  const handleLayoutSwitch = (layout: SequencingType) => {
    setSelectedLayout(layout);
    // If switching to single-end, clear fileR2 or adjust layout
    setSampleList(prev => prev.map(s => ({
      ...s,
      layout,
      fileR2: layout === 'single' ? undefined : (s.fileR2 || s.fileR1.replace('_R1', '_R2').replace('_1.fastq', '_2.fastq')),
    })));
  };

  const handleAddSample = () => {
    const nextIdx = sampleList.length + 1;
    const newSample: SampleMetadata = {
      id: `S${nextIdx.toString().padStart(2, '0')}`,
      name: `Sample_${nextIdx}`,
      group: 'Treatment',
      layout: selectedLayout,
      fileR1: isSingleEnd 
        ? `Sample_${nextIdx}_single.fastq.gz`
        : `Sample_${nextIdx}_R1.fastq.gz`,
      fileR2: isSingleEnd 
        ? undefined 
        : `Sample_${nextIdx}_R2.fastq.gz`,
      rawReads: 85000,
      trimmedReads: 78000,
      denoisedReads: 72000,
      nonChimericReads: 69000,
      retainedPercent: 81.2,
    };
    setSampleList([...sampleList, newSample]);
  };

  const handleRemoveSample = (id: string) => {
    setSampleList(sampleList.filter(s => s.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof SampleMetadata, value: any) => {
    setSampleList(sampleList.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleSaveManifest = () => {
    onUpdateSamples(sampleList, selectedLayout, executionMode);
    onClose();
  };

  const handleSaveAndRun = () => {
    onUpdateSamples(sampleList, selectedLayout, executionMode);
    if (onSaveAndRun) {
      onSaveAndRun(sampleList, selectedLayout, executionMode);
    }
    onClose();
  };

  const handleSimulateDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const addedNames: string[] = [];
    let detectedPaired = false;

    for (let i = 0; i < files.length; i++) {
      const name = files[i].name;
      addedNames.push(name);
      if (name.includes('_R2') || name.includes('_2.fastq') || name.includes('_2.fq')) {
        detectedPaired = true;
      }
    }

    if (detectedPaired && selectedLayout !== 'paired') {
      setSelectedLayout('paired');
    }

    setUploadNotice(
      `Staged ${files.length} FASTQ file(s) (${detectedPaired ? 'Paired-End detected' : selectedLayout === 'single' ? 'Single-End mode' : 'Paired-End mode'}): ${addedNames.slice(0, 3).join(', ')}${addedNames.length > 3 ? '...' : ''}`
    );
    setTimeout(() => setUploadNotice(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Upload FASTQ Files & Sample Manifest</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  isSingleEnd 
                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {isSingleEnd ? 'Single-End Mode' : 'Paired-End Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Register raw sequencing files (both Single-End and Paired-End are fully supported) and configure experiment metadata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Sequencing Layout Selector Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Sequencing Read Layout:
              </span>
              <span className="text-xs text-slate-500">Choose between paired reads or single-end runs</span>
            </div>

            <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleLayoutSwitch('paired')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  !isSingleEnd
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Paired-End (R1 + R2)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLayoutSwitch('single')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  isSingleEnd
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Single-End (R1 only)</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Staging Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleSimulateDrop(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3 border border-blue-100">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isSingleEnd 
                ? 'Drag & Drop Single-End FASTQ Files (*.fastq.gz, *.fq, *.fasta)'
                : 'Drag & Drop Paired FASTQ Files (*_R1.fastq.gz, *_R2.fastq.gz)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Supports single-end runs (Illumina single read, Ion Torrent, 454, PacBio/Nanopore) as well as standard paired-end libraries. Files are staged in server backend volumes.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs">
                <span>Browse Files</span>
                <input
                  type="file"
                  multiple
                  accept=".fastq,.fq,.gz,.fasta,.fa"
                  className="hidden"
                  onChange={(e) => handleSimulateDrop(e.target.files)}
                />
              </label>

              {/* Mock Loaders for Both Layouts */}
              <button
                type="button"
                onClick={() => {
                  setSelectedLayout('paired');
                  onLoadMockFiles();
                }}
                className={`px-3 py-1.5 font-semibold rounded-lg text-xs border transition-colors flex items-center gap-1.5 ${
                  !isSingleEnd
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title="Load 6 Paired-End FASTQ demo samples"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Load 6 Mock FASTQ Pairs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedLayout('single');
                  onLoadSingleEndMockFiles();
                }}
                className={`px-3 py-1.5 font-semibold rounded-lg text-xs border transition-colors flex items-center gap-1.5 ${
                  isSingleEnd
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title="Load 6 Single-End FASTQ demo samples"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Load 6 Mock Single-End Reads</span>
              </button>
            </div>
          </div>

          {uploadNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
          )}

          {/* Large Files & Production Best Practice Architecture Card */}
          <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-sky-600 text-white rounded-lg">
                  <Cloud className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-xs text-sky-950">Large FASTQ Files Strategy (Production Best Practice)</h4>
                  <p className="text-[11px] text-sky-800/80">
                    Avoid upfront browser blocking on huge sequencing cohorts. Stream directly to cloud bucket and process chunk-by-chunk in background workers.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
                Zero Memory Crash
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setExecutionMode('cloud_batch')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  executionMode === 'cloud_batch'
                    ? 'bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-sky-900 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-sky-600" />
                    Asynchronous Cloud Batch Queue
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    Best Practice
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Stages files to <code className="text-sky-700 font-mono text-[10px]">gs://microbiome-runs-staging/</code>. Dispatches in <strong>2-sample batch chunks</strong> via Celery/Nextflow workers. No waiting on active browser session!
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExecutionMode('interactive')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  executionMode === 'interactive'
                    ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Interactive Quick Preview
                  </span>
                  <span className="text-[10px] text-slate-400">Small Subsets</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Synchronous in-browser step-by-step preview. Recommended for small test subsets (&lt;100 MB) or testing primer settings.
                </p>
              </button>
            </div>
          </div>

          {/* Why do I see a sample table? Explainer Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                <span>Why is a Sample Manifest Table needed?</span>
                <span className="text-[10px] font-semibold bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full">
                  Experimental Metadata Mapping
                </span>
              </div>
              <p className="text-[11px] text-blue-900/90 leading-relaxed">
                Raw FASTQ files only contain nucleotide sequences and Phred quality scores. They do <strong>not</strong> contain your experimental groups. The Sample Manifest binds each FASTQ file to a biological condition (e.g. <em>Healthy Control</em> vs <em>Ulcerative Colitis</em>). This metadata is required to calculate <strong>comparative Alpha diversity</strong>, color <strong>PCoA ordination clusters</strong>, and group <strong>Taxa abundance bar plots</strong>.
              </p>
            </div>
          </div>

          {/* Sample Manifest Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Sample Manifest ({sampleList.length} Samples)</span>
                <span className="text-[11px] font-normal text-slate-500 font-mono">
                  • Layout: {isSingleEnd ? 'Single-End (R1 Only)' : 'Paired-End (R1 + R2)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddSample}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Sample Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Sample ID</th>
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">Group / Condition</th>
                    <th className="py-2.5 px-3">Read Layout</th>
                    <th className="py-2.5 px-3">{isSingleEnd ? 'FASTQ Read File' : 'Forward File (R1)'}</th>
                    {!isSingleEnd && <th className="py-2.5 px-3">Reverse File (R2)</th>}
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleList.map((sample) => (
                    <tr key={sample.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">
                        {sample.id}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={sample.name}
                          onChange={(e) => handleFieldChange(sample.id, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={sample.group}
                          onChange={(e) => handleFieldChange(sample.id, 'group', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isSingleEnd 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {isSingleEnd ? 'Single-End' : 'Paired-End'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                        <input
                          type="text"
                          value={sample.fileR1}
                          onChange={(e) => handleFieldChange(sample.id, 'fileR1', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px] text-slate-700"
                        />
                      </td>
                      {!isSingleEnd && (
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          <input
                            type="text"
                            value={sample.fileR2 || ''}
                            placeholder="Reverse R2 file..."
                            onChange={(e) => handleFieldChange(sample.id, 'fileR2', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px] text-slate-700"
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSample(sample.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove sample from run"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
          <div className="text-xs text-slate-500">
            Selected Layout: <strong className="text-slate-800">{isSingleEnd ? 'Single-End Reads (R1 only)' : 'Paired-End Reads (R1 + R2)'}</strong>
            <span className="text-slate-400 ml-1.5">• {sampleList.length} samples in manifest</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveManifest}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
              title="Save manifest without running immediately"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Manifest Only</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndRun}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 transform active:scale-95 ${
                executionMode === 'cloud_batch'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
              title={
                executionMode === 'cloud_batch'
                  ? 'Stage files to cloud and launch asynchronous batch queue'
                  : 'Save manifest and immediately trigger pipeline execution'
              }
            >
              {executionMode === 'cloud_batch' ? (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Stage to Cloud & Launch Batch Queue 🚀</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Save & Run Pipeline Now 🚀</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
