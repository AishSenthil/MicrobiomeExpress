export type SequencingType = 'paired' | 'single';

export interface SampleMetadata {
  id: string;
  name: string;
  group: string;
  layout?: 'paired' | 'single';
  fileR1: string;
  fileR2?: string;
  rawReads: number;
  trimmedReads: number;
  denoisedReads: number;
  nonChimericReads: number;
  retainedPercent: number;
}

export interface PipelineConfig {
  sequencingType: SequencingType;
  targetRegion: string;
  forwardPrimer: string;
  reversePrimer: string;
  phredCutoff: number;
  minReadLength: number;
  truncLenF: number;
  truncLenR: number;
  maxEEF: number;
  maxEER: number;
  denoisingTool: 'DADA2' | 'Deblur';
  chimeraMethod: 'consensus' | 'pooled' | 'vsearch';
  taxonomyDb: 'SILVA_138.1' | 'Greengenes2_2022.10' | 'RefSeq_16S';
  confidenceThreshold: number;
  minAbundanceFilter: number;
  workflowManager: 'Snakemake' | 'Nextflow' | 'Celery';
  enableOtuClustering: boolean;
  otuIdentity: number; // e.g. 0.97 for 97%
  otuClusteringTool: 'VSEARCH' | 'Swarm' | 'QIIME2_vsearch';
  // Asynchronous Cloud Storage & Batch Processing for Large Cohorts
  executionMode: 'cloud_batch' | 'interactive';
  cloudStorageProvider: 'gcs' | 's3' | 'local_volume';
  cloudBucketUri: string;
  batchChunkSize: number; // e.g. 2, 4, 8 samples per batch
  maxMemoryPerWorkerGb: number;
  maxParallelWorkers: number;
  notifyEmail?: string;
  autoRunOnUpload: boolean;
}

export interface BatchChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  sampleIds: string[];
  status: 'pending' | 'staging' | 'processing' | 'completed' | 'failed';
  readCount: number;
  memoryMb: number;
  duration?: string;
  workerId: string;
}

export interface BatchJobState {
  jobId: string;
  active: boolean;
  mode: 'cloud_batch' | 'interactive';
  status: 'idle' | 'staging_cloud' | 'queued' | 'batch_processing' | 'aggregating' | 'completed';
  cloudUri: string;
  totalSamples: number;
  processedSamples: number;
  totalChunks: number;
  currentChunkIndex: number;
  chunks: BatchChunkInfo[];
  estimatedRemainingSec: number;
  currentStageName: string;
}

export type PipelineStageId = 
  | 'upload'
  | 'fastqc_raw'
  | 'trimming'
  | 'denoising'
  | 'chimera'
  | 'otu_clustering'
  | 'taxonomy'
  | 'diversity';

export interface PipelineStage {
  id: PipelineStageId;
  name: string;
  tool: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: string;
  summary?: string;
  logs: string[];
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface PerBaseQuality {
  position: number;
  mean: number;
  median: number;
  q25: number;
  q75: number;
  q10: number;
  q90: number;
}

export interface GcDistribution {
  gc: number;
  count: number;
  theoretical: number;
}

export interface AdapterContent {
  position: number;
  illuminaUniversal: number;
  nexteraTransposase: number;
  smallRnaAdapter: number;
}

export interface QCReportData {
  rawQuality: PerBaseQuality[];
  trimmedQuality: PerBaseQuality[];
  gcDistribution: GcDistribution[];
  adapterBefore: AdapterContent[];
  adapterAfter: AdapterContent[];
  totalRawReads: number;
  totalCleanReads: number;
  meanPhredBefore: number;
  meanPhredAfter: number;
  duplicationRate: number;
}

export interface ASVRecord {
  asvId: string;
  sequence: string;
  length: number;
  gcPercent: number;
  kingdom: string;
  phylum: string;
  classTaxa: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  confidence: number;
  totalReads: number;
  sampleCounts: Record<string, number>;
  relativeAbundance: number; // percentage
}

export interface OTURecord {
  otuId: string;
  centroidSequence: string;
  length: number;
  gcPercent: number;
  identityCutoff: number; // e.g. 0.97
  kingdom: string;
  phylum: string;
  classTaxa: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  confidence: number;
  totalReads: number;
  memberAsvs: string[]; // list of ASV IDs that clustered into this OTU
  sampleCounts: Record<string, number>;
  relativeAbundance: number; // percentage
}

export interface AlphaMetric {
  sampleId: string;
  sampleName: string;
  group: string;
  shannon: number;
  simpson: number;
  chao1: number;
  observedASVs: number;
  faithPD: number;
}

export interface BetaCoordinate {
  sampleId: string;
  sampleName: string;
  group: string;
  pc1: number;
  pc2: number;
  pc3: number;
}

export interface DiversityData {
  alpha: AlphaMetric[];
  beta: BetaCoordinate[];
  varianceExplained: [number, number, number];
  distanceMetric: 'Bray-Curtis' | 'Jaccard' | 'Weighted UniFrac';
}

export interface PipelineRunResults {
  runId: string;
  timestamp: string;
  samples: SampleMetadata[];
  config: PipelineConfig;
  qc: QCReportData;
  asvs: ASVRecord[];
  otus: OTURecord[];
  diversity: DiversityData;
  otuDiversity: DiversityData;
}

