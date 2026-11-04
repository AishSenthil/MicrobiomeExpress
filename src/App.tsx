import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Compass, 
  Table, 
  Sparkles, 
  Play, 
  Sliders, 
  Upload, 
  FileCode2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Dna,
  RefreshCw,
  FolderArchive,
  Workflow,
  Cloud,
  HardDrive,
  Zap,
  History,
  GitBranch
} from 'lucide-react';

import { 
  PipelineRunResults, 
  PipelineConfig, 
  PipelineStage, 
  SampleMetadata,
  ASVRecord,
  BatchJobState
} from './types/pipeline';
import { 
  GUT_MICROBIOME_DATASET, 
  GUT_SINGLE_END_DATASET,
  SOIL_MICROBIOME_DATASET, 
  DEFAULT_PIPELINE_CONFIG 
} from './data/mockDatasets';

import { Header } from './components/Header';
import { PipelineStepper } from './components/PipelineStepper';
import { ResourceMonitor } from './components/ResourceMonitor';
import { AnalyticsWidget } from './components/AnalyticsWidget';
import { QcViewer } from './components/QcViewer';
import { TaxaBarPlot } from './components/TaxaBarPlot';
import { DiversityViewer } from './components/DiversityViewer';
import { AsvTableViewer } from './components/AsvTableViewer';
import { ConfigPanel } from './components/ConfigPanel';
import { UploadModal } from './components/UploadModal';
import { ReportGeneratorModal } from './components/ReportGeneratorModal';
import { CodeHubModal } from './components/CodeHubModal';
import { BatchHistoryTab } from './components/BatchHistoryTab';
import { PhylogeneticTree } from './components/PhylogeneticTree';

// Initial pipeline stages setup
const INITIAL_STAGES: PipelineStage[] = [
  {
    id: 'fastqc_raw',
    name: 'Raw Quality Control',
    tool: 'FastQC',
    version: 'v0.12.1',
    status: 'completed',
    duration: '18s',
    summary: 'Analyzed 516,370 raw paired reads. Detected Illumina adapter read-through at 3-prime end.',
    logs: ['INFO: Started FastQC v0.12.1.'],
    cpuUsage: 85,
    memoryUsage: 4096,
  },
  {
    id: 'trimming',
    name: 'Primer & Adapter Trimming',
    tool: 'Cutadapt',
    version: 'v4.4',
    status: 'completed',
    duration: '26s',
    summary: 'Trimmed 515F/806R primers.',
    logs: ['INFO: Executing Cutadapt v4.4.'],
    cpuUsage: 92,
    memoryUsage: 8192,
  },
  {
    id: 'denoising',
    name: 'Error Inference & Denoising',
    tool: 'DADA2',
    version: 'v1.28.0',
    status: 'completed',
    duration: '1m 14s',
    summary: 'Learned error rates, resolved ASVs.',
    logs: ['INFO: Initializing DADA2.'],
    cpuUsage: 98,
    memoryUsage: 16384,
  },
  {
    id: 'chimera',
    name: 'Chimera Removal',
    tool: 'removeBimera',
    version: 'v1.28.0',
    status: 'completed',
    duration: '12s',
    summary: 'Identified and filtered bimeric PCR artifacts.',
    logs: ['INFO: Calling removeBimeraDenovo.'],
    cpuUsage: 75,
    memoryUsage: 2048,
  },
  {
    id: 'otu_clustering',
    name: 'OTU 97% Clustering',
    tool: 'VSEARCH',
    version: 'v2.22.1',
    status: 'completed',
    duration: '14s',
    summary: 'Clustered ASVs into OTU centroids.',
    logs: ['INFO: Running VSEARCH.'],
    cpuUsage: 60,
    memoryUsage: 4096,
  },
  {
    id: 'taxonomy',
    name: 'Taxonomy Assignment',
    tool: 'SILVA 138.1',
    version: 'NR99',
    status: 'completed',
    duration: '45s',
    summary: 'Classified ASVs against SILVA 138.1.',
    logs: ['INFO: Assigning taxonomy.'],
    cpuUsage: 88,
    memoryUsage: 12288,
  },
  {
    id: 'diversity',
    name: 'Diversity & Ordination',
    tool: 'scikit-bio',
    version: 'v0.5.8',
    status: 'completed',
    duration: '8s',
    summary: 'Calculated alpha diversity and Bray-Curtis PCoA.',
    logs: ['INFO: Computing Alpha diversity.'],
    cpuUsage: 40,
    memoryUsage: 2048,
  },
];

export default function App() {
  const [currentDataset, setCurrentDataset] = useState<PipelineRunResults>(GUT_MICROBIOME_DATASET);
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>(GUT_MICROBIOME_DATASET.config);
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStageId, setActiveStageId] = useState<string>('otu_clustering');
  const [activeTab, setActiveTab] = useState<'overview' | 'qc' | 'taxa' | 'diversity' | 'asv_table' | 'history' | 'phylogeny'>('overview');
  const [featureMode, setFeatureMode] = useState<'ASV' | 'OTU'>('ASV');
  const [view, setView] = useState<'landing' | 'app'>('landing');

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCodeHubOpen, setIsCodeHubOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [stagedNotification, setStagedNotification] = useState<{
    count: number;
    layout: string;
  } | null>(null);

  const [batchJobState, setBatchJobState] = useState<BatchJobState | null>({
    jobId: 'JOB-CELERY-BATCH-8419',
    active: false,
    mode: 'cloud_batch',
    status: 'completed',
    cloudUri: 'gs://microbiome-runs-staging/cohort-2026',
    totalSamples: 6,
    processedSamples: 6,
    totalChunks: 3,
    currentChunkIndex: 3,
    estimatedRemainingSec: 0,
    currentStageName: 'All Chunks Completed',
    chunks: [
      {
        chunkIndex: 1,
        totalChunks: 3,
        sampleIds: ['S01', 'S02'],
        status: 'completed',
        readCount: 168000,
        memoryMb: 3840,
        duration: '18s',
        workerId: 'celery-worker-01',
      },
      {
        chunkIndex: 2,
        totalChunks: 3,
        sampleIds: ['S03', 'S04'],
        status: 'completed',
        readCount: 172000,
        memoryMb: 4120,
        duration: '21s',
        workerId: 'celery-worker-02',
      },
      {
        chunkIndex: 3,
        totalChunks: 3,
        sampleIds: ['S05', 'S06'],
        status: 'completed',
        readCount: 164000,
        memoryMb: 3950,
        duration: '19s',
        workerId: 'celery-worker-03',
      },
    ],
  });

  // Sync config when dataset switches
  const handleSelectDataset = (dataset: PipelineRunResults) => {
    setCurrentDataset(dataset);
    setPipelineConfig(dataset.config);
  };

  // Run Pipeline Execution Simulation
  const handleRunPipeline = async () => {
    if (isRunning) return;
    setStagedNotification(null);
    setIsRunning(true);

    const isCloudBatch = pipelineConfig.executionMode === 'cloud_batch';
    if (isCloudBatch) {
      setBatchJobState({
        jobId: `JOB-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        active: true,
        mode: 'cloud_batch',
        status: 'batch_processing',
        cloudUri: pipelineConfig.cloudBucketUri || 'gs://microbiome-runs-staging/cohort-2026',
        totalSamples: currentDataset.samples.length,
        processedSamples: 0,
        totalChunks: 3,
        currentChunkIndex: 1,
        estimatedRemainingSec: 35,
        currentStageName: 'Processing Chunk 1 (S01, S02)',
        chunks: [
          {
            chunkIndex: 1,
            totalChunks: 3,
            sampleIds: [currentDataset.samples[0]?.id || 'S01', currentDataset.samples[1]?.id || 'S02'],
            status: 'processing',
            readCount: 168000,
            memoryMb: 3840,
            workerId: 'celery-worker-01',
          },
          {
            chunkIndex: 2,
            totalChunks: 3,
            sampleIds: [currentDataset.samples[2]?.id || 'S03', currentDataset.samples[3]?.id || 'S04'],
            status: 'pending',
            readCount: 172000,
            memoryMb: 0,
            workerId: 'celery-worker-02',
          },
          {
            chunkIndex: 3,
            totalChunks: 3,
            sampleIds: [currentDataset.samples[4]?.id || 'S05', currentDataset.samples[5]?.id || 'S06'],
            status: 'pending',
            readCount: 164000,
            memoryMb: 0,
            workerId: 'celery-worker-03',
          },
        ],
      });
    }

    // Reset stages to pending
    setStages(prev => prev.map(s => ({
      ...s,
      status: 'pending',
      duration: undefined,
    })));

    // Progress through stages one by one
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setActiveStageId(stage.id);

      // Set stage running
      setStages(prev => prev.map((s, idx) => {
        if (idx === i) return { ...s, status: 'running' };
        return s;
      }));

      // Update batch chunk progress dynamically as pipeline stages advance
      if (isCloudBatch) {
        if (i === 1) {
          // Trimming: chunk 1 done, chunk 2 processing
          setBatchJobState(prev => prev ? {
            ...prev,
            currentChunkIndex: 2,
            processedSamples: 2,
            currentStageName: 'Trimming Primer Adapters (Chunk 2)',
            chunks: prev.chunks.map(c => 
              c.chunkIndex === 1 ? { ...c, status: 'completed', duration: '14s' } :
              c.chunkIndex === 2 ? { ...c, status: 'processing', memoryMb: 4120 } : c
            )
          } : null);
        } else if (i === 2) {
          // Denoising: chunk 2 done, chunk 3 processing
          setBatchJobState(prev => prev ? {
            ...prev,
            currentChunkIndex: 3,
            processedSamples: 4,
            currentStageName: 'DADA2 Error Learning & Denoising (Chunk 3)',
            chunks: prev.chunks.map(c => 
              c.chunkIndex <= 2 ? { ...c, status: 'completed', duration: '20s' } :
              c.chunkIndex === 3 ? { ...c, status: 'processing', memoryMb: 4250 } : c
            )
          } : null);
        } else if (i === 3) {
          // Chimera: all 3 chunks completed, aggregating
          setBatchJobState(prev => prev ? {
            ...prev,
            currentChunkIndex: 3,
            processedSamples: 6,
            currentStageName: 'Consensus Chimera Removal (All Chunks Merged)',
            chunks: prev.chunks.map(c => ({ ...c, status: 'completed', duration: '18s' }))
          } : null);
        }
      }

      // Simulate realistic execution timing
      await new Promise(r => setTimeout(r, 1100));

      // Mark stage completed
      setStages(prev => prev.map((s, idx) => {
        if (idx === i) {
          return {
            ...s,
            status: 'completed',
            duration: idx === 0 ? '16s' : idx === 1 ? '24s' : idx === 2 ? '1m 10s' : idx === 3 ? '11s' : idx === 4 ? '14s' : idx === 5 ? '42s' : '7s',
          };
        }
        return s;
      }));
    }

    if (isCloudBatch) {
      setBatchJobState(prev => prev ? {
        ...prev,
        status: 'completed',
        active: false,
        processedSamples: currentDataset.samples.length,
        currentStageName: 'All Chunks Successfully Processed in Cloud',
        chunks: prev.chunks.map(c => ({ ...c, status: 'completed' }))
      } : null);
    }

    setIsRunning(false);
    setActiveTab('asv_table');
  };

  // File Download Handlers
  const handleDownloadAsset = (assetType: 'asv_tsv' | 'asv_biom' | 'fasta' | 'otu_tsv' | 'otu_biom' | 'otu_fasta' | 'asv_otu_map' | 'params' | 'html_report') => {
    if (assetType === 'html_report') {
      setIsReportOpen(true);
      return;
    }

    if (assetType === 'asv_tsv') {
      // Build ASV TSV
      const headers = ['ASV_ID', 'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species', 'TotalReads', ...currentDataset.samples.map(s => s.name)];
      const rows = currentDataset.asvs.map(a => [
        a.asvId,
        a.kingdom,
        a.phylum,
        a.classTaxa,
        a.order,
        a.family,
        a.genus,
        a.species,
        a.totalReads,
        ...currentDataset.samples.map(s => a.sampleCounts[s.id] || 0),
      ]);
      const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
      triggerDownload(tsvContent, `asv_table_${currentDataset.runId}.tsv`, 'text/tab-separated-values');
    } else if (assetType === 'asv_biom') {
      // Build ASV BIOM format
      const biomData = {
        id: currentDataset.runId,
        format: 'Biological Observation Matrix 1.0.0',
        format_url: 'http://biom-format.org',
        type: 'OTU table',
        generated_by: 'ASV Pipeline Studio v2.4 (DADA2)',
        date: currentDataset.timestamp,
        rows: currentDataset.asvs.map(a => ({
          id: a.asvId,
          metadata: {
            taxonomy: [a.kingdom, a.phylum, a.classTaxa, a.order, a.family, a.genus, a.species],
            confidence: a.confidence,
          },
        })),
        columns: currentDataset.samples.map(s => ({
          id: s.id,
          metadata: { sample_name: s.name, group: s.group },
        })),
        matrix_type: 'dense',
        matrix_element_type: 'int',
        shape: [currentDataset.asvs.length, currentDataset.samples.length],
        data: currentDataset.asvs.map(a => currentDataset.samples.map(s => a.sampleCounts[s.id] || 0)),
      };
      triggerDownload(JSON.stringify(biomData, null, 2), `asv_matrix_${currentDataset.runId}.biom`, 'application/json');
    } else if (assetType === 'fasta') {
      // Build ASV FASTA
      const fastaContent = currentDataset.asvs.map(a => `>${a.asvId} | ${a.genus} ${a.species} | length=${a.length}\n${a.sequence}`).join('\n');
      triggerDownload(fastaContent, `asv_sequences_${currentDataset.runId}.fasta`, 'text/plain');
    } else if (assetType === 'otu_tsv') {
      // Build OTU TSV
      const headers = ['OTU_ID', 'Identity', 'MemberASVsCount', 'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species', 'TotalReads', ...currentDataset.samples.map(s => s.name)];
      const rows = currentDataset.otus.map(o => [
        o.otuId,
        `${(o.identityCutoff * 100).toFixed(0)}%`,
        o.memberAsvs.length,
        o.kingdom,
        o.phylum,
        o.classTaxa,
        o.order,
        o.family,
        o.genus,
        o.species,
        o.totalReads,
        ...currentDataset.samples.map(s => o.sampleCounts[s.id] || 0),
      ]);
      const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
      triggerDownload(tsvContent, `otu_table_97pct_${currentDataset.runId}.tsv`, 'text/tab-separated-values');
    } else if (assetType === 'otu_biom') {
      // Build OTU BIOM
      const biomData = {
        id: currentDataset.runId,
        format: 'Biological Observation Matrix 1.0.0',
        format_url: 'http://biom-format.org',
        type: 'OTU table',
        generated_by: 'ASV Pipeline Studio v2.4 (VSEARCH 97%)',
        date: currentDataset.timestamp,
        rows: currentDataset.otus.map(o => ({
          id: o.otuId,
          metadata: {
            taxonomy: [o.kingdom, o.phylum, o.classTaxa, o.order, o.family, o.genus, o.species],
            member_asvs: o.memberAsvs,
            identity: o.identityCutoff,
          },
        })),
        columns: currentDataset.samples.map(s => ({
          id: s.id,
          metadata: { sample_name: s.name, group: s.group },
        })),
        matrix_type: 'dense',
        matrix_element_type: 'int',
        shape: [currentDataset.otus.length, currentDataset.samples.length],
        data: currentDataset.otus.map(o => currentDataset.samples.map(s => o.sampleCounts[s.id] || 0)),
      };
      triggerDownload(JSON.stringify(biomData, null, 2), `otu_matrix_97pct_${currentDataset.runId}.biom`, 'application/json');
    } else if (assetType === 'otu_fasta') {
      // Build OTU Centroids FASTA
      const fastaContent = currentDataset.otus.map(o => `>${o.otuId} | centroid | identity=97% | member_asvs=${o.memberAsvs.join(',')}\n${o.centroidSequence}`).join('\n');
      triggerDownload(fastaContent, `otu_centroids_97pct_${currentDataset.runId}.fasta`, 'text/plain');
    } else if (assetType === 'asv_otu_map') {
      // Build ASV to OTU membership map
      const headers = ['ASV_ID', 'OTU_ID', 'Taxonomy'];
      const rows: string[][] = [];
      currentDataset.otus.forEach(o => {
        o.memberAsvs.forEach(asvId => {
          rows.push([asvId, o.otuId, `${o.genus} ${o.species}`]);
        });
      });
      const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
      triggerDownload(tsvContent, `asv_to_otu_membership_map_${currentDataset.runId}.tsv`, 'text/tab-separated-values');
    } else if (assetType === 'params') {
      const yamlContent = `# ASV & OTU Pipeline Run Parameters
run_id: "${currentDataset.runId}"
target_region: "${pipelineConfig.targetRegion}"
forward_primer: "${pipelineConfig.forwardPrimer}"
reverse_primer: "${pipelineConfig.reversePrimer}"
phred_cutoff: ${pipelineConfig.phredCutoff}
min_read_length: ${pipelineConfig.minReadLength}
truncLenF: ${pipelineConfig.truncLenF}
truncLenR: ${pipelineConfig.truncLenR}
maxEE: [${pipelineConfig.maxEEF}, ${pipelineConfig.maxEER}]
denoising_tool: "${pipelineConfig.denoisingTool}"
chimera_method: "${pipelineConfig.chimeraMethod}"
otu_clustering:
  enabled: ${pipelineConfig.enableOtuClustering}
  tool: "${pipelineConfig.otuClusteringTool}"
  identity: ${pipelineConfig.otuIdentity}
taxonomy_database: "${pipelineConfig.taxonomyDb}"
confidence_threshold: ${pipelineConfig.confidenceThreshold}
workflow_manager: "${pipelineConfig.workflowManager}"
`;
      triggerDownload(yamlContent, `params_${currentDataset.runId}.yaml`, 'text/yaml');
    }
  };

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        {/* Landing Navigation */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Dna className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                  MicrobiomeXpress
                </span>
                <span className="block text-[11px] font-medium text-slate-400">
                  Enterprise ASV & OTU Pipeline Studio
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('app')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accelerated 16S/ITS Amplicon Sequencing Workflow</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
              Automated Microbiome ASV Pipelines, <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Simplified & Interactive
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Seamlessly wrap FastQC, Cutadapt, DADA2 error inference, VSEARCH OTU clustering, and SILVA 138.1 taxonomy with real-time QC, phylogenetic trees, and alpha/beta diversity analytics.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setView('app')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="w-5 h-5" />
                <span>Launch Pipeline Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  handleSelectDataset(GUT_MICROBIOME_DATASET);
                  setView('app');
                }}
                className="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
              >
                <FolderArchive className="w-5 h-5 text-emerald-400" />
                <span>Load Gut Microbiome Demo</span>
              </button>
            </div>

            {/* Quick stats / metrics */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-10 border-t border-slate-800/80">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-blue-400">FastQC</div>
                <div className="text-xs text-slate-400 mt-1">Raw Quality & Adapter Scan</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">DADA2</div>
                <div className="text-xs text-slate-400 mt-1">Exact ASV Denoising</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">SILVA 138.1</div>
                <div className="text-xs text-slate-400 mt-1">High-Precision Taxonomy</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl sm:text-3xl font-black text-purple-400">PCoA & PERMANOVA</div>
                <div className="text-xs text-slate-400 mt-1">Alpha & Beta Diversity</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-white">Complete End-to-End Microbiome Suite</h2>
              <p className="mt-3 text-slate-400 text-sm">
                Designed for computational biologists, microbiologists, and clinical researchers requiring publication-grade reproducibility and interactive visualization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-blue-500/50 transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Interactive Quality Control</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Inspect per-base sequence quality scores, GC content distributions, adapter contamination, and trim thresholds with interactive FastQC and Cutadapt metrics.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-800 text-xs font-semibold text-blue-400 flex items-center gap-2">
                  <span>Explore QC Inspector</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">DADA2 & OTU Clustering</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Resolve exact Amplicon Sequence Variants (ASVs) via parametric error learning and chimera filtering, alongside 97% VSEARCH operational taxonomic unit clustering.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-800 text-xs font-semibold text-indigo-400 flex items-center gap-2">
                  <span>Explore Denoising Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Taxonomy & Diversity Analytics</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Classify features against SILVA 138.1 database down to species level. Compute Shannon, Simpson, Chao1 alpha indices and Bray-Curtis beta diversity PCoA plots.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-2">
                  <span>Explore Diversity Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={() => setView('app')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-sm shadow-2xl shadow-blue-600/30 inline-flex items-center gap-3 transition-all"
              >
                <span>Enter MicrobiomeXpress Studio Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 4-Step Workflow Section */}
        <section className="py-20 bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Step-by-Step Guide
              </span>
              <h2 className="text-3xl font-black text-white mt-4">How to Process Real Data in 4 Simple Steps</h2>
              <p className="mt-3 text-slate-400 text-sm">
                Transition seamlessly from sample dataset demos to your own high-throughput amplicon sequencing runs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm mb-4 shadow-lg shadow-blue-600/30">
                  01
                </div>
                <h3 className="text-base font-bold text-white mb-2">Upload FASTQ & Manifest</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong>Uploads</strong> in the studio to upload raw paired-end or single-end FASTQ reads and define your sample group metadata manifest.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm mb-4 shadow-lg shadow-indigo-600/30">
                  02
                </div>
                <h3 className="text-base font-bold text-white mb-2">Configure Parameters</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong>Parameters</strong> to fine-tune Phred quality cutoffs, primer sequences (515F/806R), DADA2 error learning, and SILVA taxonomy.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm mb-4 shadow-lg shadow-emerald-600/30">
                  03
                </div>
                <h3 className="text-base font-bold text-white mb-2">Run Automated Pipeline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong>Run Pipeline Now</strong> to process reads through FastQC, Cutadapt, DADA2 denoising, removeBimera, and VSEARCH OTU clustering.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm mb-4 shadow-lg shadow-purple-600/30">
                  04
                </div>
                <h3 className="text-base font-bold text-white mb-2">Analyze & Export Reports</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explore interactive PCoA plots, generate publication-grade HTML reports, and export Python/R scripts from the Code Hub.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-800 py-8 bg-slate-950 text-center text-xs text-slate-500">
          <p>MicrobiomeXpress Studio • Automated ASV Pipeline & Multi-Omics Analytics Suite</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        currentDataset={currentDataset}
        onSelectDataset={handleSelectDataset}
        isRunning={isRunning}
        onRunPipeline={handleRunPipeline}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCodeHub={() => setIsCodeHubOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onDownloadAsset={handleDownloadAsset}
        onReturnToLanding={() => setView('landing')}
      />

      {/* Pipeline Stepper & Live Execution Status */}
      <PipelineStepper
        stages={stages}
        currentStageIndex={stages.findIndex(s => s.status === 'running')}
        isRunning={isRunning}
        activeStageId={activeStageId}
        onSelectStage={(id) => setActiveStageId(id)}
        config={pipelineConfig}
        batchJobState={batchJobState}
      />

      {/* Staged Manifest Notification Banner */}
      {stagedNotification && !isRunning && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Input Manifest Staged & Confirmed: {stagedNotification.count} Samples</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    {stagedNotification.layout === 'single' ? 'Single-End Mode' : 'Paired-End Mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Raw reads are staged on server volume and mapped to experimental conditions. Click <strong>Run Pipeline Now</strong> to process through FastQC, DADA2, VSEARCH OTU, and SILVA taxonomy.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunPipeline()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Pipeline Now</span>
              </button>
              <button
                onClick={() => setStagedNotification(null)}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl hover:bg-white/60 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Pipeline Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('qc')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'qc'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>FastQC & Trimming QC</span>
            </button>

            <button
              onClick={() => setActiveTab('taxa')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'taxa'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Taxa Bar Plots</span>
            </button>

            <button
              onClick={() => setActiveTab('diversity')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'diversity'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Alpha & Beta Diversity</span>
            </button>

            <button
              onClick={() => setActiveTab('asv_table')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'asv_table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>ASV & OTU Matrix</span>
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {featureMode === 'ASV' ? `${currentDataset.asvs.length} ASVs` : `${currentDataset.otus.length} OTUs`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Batch History</span>
            </button>
            <button
              onClick={() => setActiveTab('phylogeny')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'phylogeny'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Phylogeny</span>
            </button>
          </div>
        </div>

        {/* Active Resolution Switcher Pill */}
        <div className="flex items-center gap-2">

          {/* Active Resolution Switcher Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFeatureMode('ASV')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  featureMode === 'ASV'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Exact 100% resolution Amplicon Sequence Variants (DADA2)"
              >
                ASVs (100%)
              </button>
              <button
                onClick={() => setFeatureMode('OTU')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  featureMode === 'OTU'
                    ? 'bg-white text-teal-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="97% clustered Operational Taxonomic Units (VSEARCH)"
              >
                OTUs (97%)
              </button>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono">{currentDataset.runId}</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Overview Summary Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Summary Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Samples & Reads</span>
                  <Dna className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {currentDataset.samples.length} <span className="text-xs text-slate-400 font-sans font-normal">samples</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {currentDataset.qc.totalRawReads.toLocaleString()} raw paired FASTQ reads
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">QC & Retention</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 font-mono">
                  {((currentDataset.qc.totalCleanReads / currentDataset.qc.totalRawReads) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {currentDataset.qc.totalCleanReads.toLocaleString()} non-chimeric reads
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-2xs">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Exact ASVs</span>
                  <Table className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-700 font-mono">
                  {currentDataset.asvs.length} <span className="text-xs text-blue-600 font-sans font-semibold">ASVs</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  100% biological resolution (DADA2)
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-teal-200 bg-teal-50/20 shadow-2xs">
                <div className="flex items-center justify-between text-teal-600 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">97% OTUs</span>
                  <Layers className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-bold text-teal-700 font-mono">
                  {currentDataset.otus.length} <span className="text-xs text-teal-600 font-sans font-semibold">OTUs</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  VSEARCH cluster_fast identity
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Beta Ordination</span>
                  <Compass className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {currentDataset.diversity.varianceExplained[0]}% <span className="text-xs text-slate-400 font-sans font-normal">PC1</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  PERMANOVA p = 0.002
                </div>
              </div>
            </div>

            {/* Executive Summary & System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Pipeline Run Status Summary Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Workflow className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Pipeline Execution Summary</h3>
                        <p className="text-xs text-slate-500">Active run: <span className="font-mono text-slate-700">{currentDataset.runId}</span></p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Completed Successfully
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-500 font-medium">Pipeline Orchestrator</div>
                      <div className="font-bold text-slate-900 mt-0.5">{pipelineConfig.workflowManager} ({pipelineConfig.executionMode})</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-500 font-medium">Taxonomy Database</div>
                      <div className="font-bold text-slate-900 mt-0.5">{pipelineConfig.taxonomyDb}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-500 font-medium">Denoising Algorithm</div>
                      <div className="font-bold text-slate-900 mt-0.5">{pipelineConfig.denoisingTool} v1.28</div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <span>Use the navigation tabs above to explore detailed FastQC reports, Taxa Bar Plots, Alpha/Beta Diversity, and ASV/OTU matrices.</span>
                    <button
                      onClick={() => setActiveTab('taxa')}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>Explore Detailed Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <ResourceMonitor stages={stages} />
              </div>

              <div className="space-y-6">
                <AnalyticsWidget />

                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">MicrobiomeXpress Tips</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Switch between <strong>ASVs (100%)</strong> and <strong>OTUs (97%)</strong> resolution anytime using the header toggle to compare exact variant precision against clustered operational taxonomic units.
                  </p>
                  <div className="pt-2 border-t border-indigo-900/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Active Storage</span>
                    <span className="text-emerald-400">{pipelineConfig.cloudBucketUri}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: FastQC Quality Control */}
        {activeTab === 'qc' && (
          <QcViewer qc={currentDataset.qc} samples={currentDataset.samples} />
        )}

        {/* Tab 3: Taxa Bar Plots */}
        {activeTab === 'taxa' && (
          <TaxaBarPlot
            asvs={featureMode === 'OTU' ? currentDataset.otus as any : currentDataset.asvs}
            samples={currentDataset.samples}
          />
        )}

        {/* Tab 4: Diversity Analysis */}
        {activeTab === 'diversity' && (
          <DiversityViewer
            diversity={featureMode === 'OTU' ? currentDataset.otuDiversity : currentDataset.diversity}
            samples={currentDataset.samples}
          />
        )}

        {/* Tab 5: Feature Table (ASV & OTU) */}
        {activeTab === 'asv_table' && (
          <AsvTableViewer
            asvs={currentDataset.asvs}
            otus={currentDataset.otus}
            samples={currentDataset.samples}
            activeMode={featureMode}
            onChangeMode={(m) => setFeatureMode(m)}
            onDownloadTsv={(m) => handleDownloadAsset(m === 'OTU' ? 'otu_tsv' : 'asv_tsv')}
            onDownloadBiom={(m) => handleDownloadAsset(m === 'OTU' ? 'otu_biom' : 'asv_biom')}
            onDownloadFasta={(m) => handleDownloadAsset(m === 'OTU' ? 'otu_fasta' : 'fasta')}
            onDownloadMap={() => handleDownloadAsset('asv_otu_map')}
          />
        )}

        {/* Tab 6: Batch History */}
        {activeTab === 'history' && <BatchHistoryTab />}
        {/* Tab 7: Phylogeny */}
        {activeTab === 'phylogeny' && <PhylogeneticTree asvs={currentDataset.asvs} />}
      </main>

      {/* Modals */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={pipelineConfig}
        onSaveConfig={(newConfig) => setPipelineConfig(newConfig)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        samples={currentDataset.samples}
        sequencingType={pipelineConfig.sequencingType}
        onUpdateSamples={(newSamples, newType, newMode) => {
          const updatedType = newType || pipelineConfig.sequencingType;
          const updatedMode = newMode || pipelineConfig.executionMode;
          if (newType || newMode) {
            setPipelineConfig({ 
              ...pipelineConfig, 
              sequencingType: updatedType,
              executionMode: updatedMode,
            });
          }

          const updatedAsvs = currentDataset.asvs.map(asv => {
            const newCounts: Record<string, number> = {};
            const oldKeys = Object.keys(asv.sampleCounts);
            newSamples.forEach((s, idx) => {
              const countVal = asv.sampleCounts[s.id] ?? asv.sampleCounts[oldKeys[idx % Math.max(1, oldKeys.length)]] ?? 1000;
              newCounts[s.id] = countVal;
            });
            return { ...asv, sampleCounts: newCounts };
          });

          const updatedOtus = currentDataset.otus.map(otu => {
            const newCounts: Record<string, number> = {};
            const oldKeys = Object.keys(otu.sampleCounts);
            newSamples.forEach((s, idx) => {
              const countVal = otu.sampleCounts[s.id] ?? otu.sampleCounts[oldKeys[idx % Math.max(1, oldKeys.length)]] ?? 800;
              newCounts[s.id] = countVal;
            });
            return { ...otu, sampleCounts: newCounts };
          });

          const updatedDiversity = {
            ...currentDataset.diversity,
            alpha: newSamples.map((s, idx) => {
              const oldItem = currentDataset.diversity.alpha[idx % currentDataset.diversity.alpha.length] || currentDataset.diversity.alpha[0];
              return {
                ...oldItem,
                sampleId: s.id,
                sampleName: s.name,
                group: s.group,
              };
            }),
            beta: newSamples.map((s, idx) => {
              const oldItem = currentDataset.diversity.beta[idx % currentDataset.diversity.beta.length] || currentDataset.diversity.beta[0];
              return {
                ...oldItem,
                sampleId: s.id,
                sampleName: s.name,
                group: s.group,
              };
            }),
          };

          const updatedOtuDiversity = {
            ...currentDataset.otuDiversity,
            alpha: newSamples.map((s, idx) => {
              const oldItem = currentDataset.otuDiversity.alpha[idx % currentDataset.otuDiversity.alpha.length] || currentDataset.otuDiversity.alpha[0];
              return {
                ...oldItem,
                sampleId: s.id,
                sampleName: s.name,
                group: s.group,
              };
            }),
            beta: newSamples.map((s, idx) => {
              const oldItem = currentDataset.otuDiversity.beta[idx % currentDataset.otuDiversity.beta.length] || currentDataset.otuDiversity.beta[0];
              return {
                ...oldItem,
                sampleId: s.id,
                sampleName: s.name,
                group: s.group,
              };
            }),
          };

          setCurrentDataset({ 
            ...currentDataset, 
            samples: newSamples,
            asvs: updatedAsvs,
            otus: updatedOtus,
            diversity: updatedDiversity,
            otuDiversity: updatedOtuDiversity,
          });

          setStagedNotification({
            count: newSamples.length,
            layout: updatedType,
          });

          if (pipelineConfig.autoRunOnUpload) {
            setTimeout(() => {
              handleRunPipeline();
            }, 500);
          }
        }}
        onSaveAndRun={(newSamples, newType, newMode) => {
          const updatedType = newType || pipelineConfig.sequencingType;
          const updatedMode = newMode || pipelineConfig.executionMode;
          if (newType || newMode) {
            setPipelineConfig({ 
              ...pipelineConfig, 
              sequencingType: updatedType,
              executionMode: updatedMode,
            });
          }

          const updatedAsvs = currentDataset.asvs.map(asv => {
            const newCounts: Record<string, number> = {};
            const oldKeys = Object.keys(asv.sampleCounts);
            newSamples.forEach((s, idx) => {
              const countVal = asv.sampleCounts[s.id] ?? asv.sampleCounts[oldKeys[idx % Math.max(1, oldKeys.length)]] ?? 1000;
              newCounts[s.id] = countVal;
            });
            return { ...asv, sampleCounts: newCounts };
          });

          const updatedOtus = currentDataset.otus.map(otu => {
            const newCounts: Record<string, number> = {};
            const oldKeys = Object.keys(otu.sampleCounts);
            newSamples.forEach((s, idx) => {
              const countVal = otu.sampleCounts[s.id] ?? otu.sampleCounts[oldKeys[idx % Math.max(1, oldKeys.length)]] ?? 800;
              newCounts[s.id] = countVal;
            });
            return { ...otu, sampleCounts: newCounts };
          });

          setCurrentDataset({ 
            ...currentDataset, 
            samples: newSamples,
            asvs: updatedAsvs,
            otus: updatedOtus,
          });

          setTimeout(() => {
            handleRunPipeline();
          }, 150);
        }}
        onLoadMockFiles={() => {
          handleSelectDataset(GUT_MICROBIOME_DATASET);
        }}
        onLoadSingleEndMockFiles={() => {
          handleSelectDataset(GUT_SINGLE_END_DATASET);
        }}
      />

      <ReportGeneratorModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        dataset={currentDataset}
      />

      <CodeHubModal
        isOpen={isCodeHubOpen}
        onClose={() => setIsCodeHubOpen(false)}
      />
    </div>
  );
}
