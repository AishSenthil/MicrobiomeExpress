import { 
  SampleMetadata, 
  PipelineConfig, 
  QCReportData, 
  ASVRecord, 
  OTURecord,
  DiversityData,
  PipelineRunResults 
} from '../types/pipeline';

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  sequencingType: 'paired',
  targetRegion: '16S-V4',
  forwardPrimer: 'GTGCCAGCMGCCGCGGTAA', // 515F
  reversePrimer: 'GGACTACHVGGGTWTCTAAT', // 806R
  phredCutoff: 25,
  minReadLength: 180,
  truncLenF: 240,
  truncLenR: 190,
  maxEEF: 2.0,
  maxEER: 2.0,
  denoisingTool: 'DADA2',
  chimeraMethod: 'consensus',
  taxonomyDb: 'SILVA_138.1',
  confidenceThreshold: 0.8,
  minAbundanceFilter: 5,
  workflowManager: 'Nextflow',
  enableOtuClustering: true,
  otuIdentity: 0.97,
  otuClusteringTool: 'VSEARCH',
  executionMode: 'cloud_batch',
  cloudStorageProvider: 'gcs',
  cloudBucketUri: 'gs://microbiome-runs-staging/cohort-2026',
  batchChunkSize: 2,
  maxMemoryPerWorkerGb: 16,
  maxParallelWorkers: 4,
  notifyEmail: 'lakshmibiotech2003@gmail.com',
  autoRunOnUpload: false,
};

// Generate FastQC per-base quality curves
function generateQualityCurve(isTrimmed: boolean) {
  const curve = [];
  const length = isTrimmed ? 240 : 250;
  for (let i = 1; i <= length; i += 5) {
    let mean = isTrimmed
      ? 36 - (i / length) * 3 + (Math.sin(i / 15) * 0.8)
      : 36 - Math.pow(i / length, 2.4) * 19 + (Math.sin(i / 12) * 1.2);
    
    mean = Math.max(12, Math.min(38, mean));
    const median = Math.round(mean + 0.5);
    const q25 = Math.max(8, median - (isTrimmed ? 2 : 4 + Math.round(i / 60)));
    const q75 = Math.min(39, median + 2);
    const q10 = Math.max(4, q25 - (isTrimmed ? 2 : 5));
    const q90 = Math.min(40, q75 + 1);

    curve.push({
      position: i,
      mean: Number(mean.toFixed(1)),
      median,
      q25,
      q75,
      q10,
      q90,
    });
  }
  return curve;
}

// Generate GC distribution curves
function generateGcDistribution() {
  const data = [];
  for (let gc = 0; gc <= 100; gc += 2) {
    // Microbial metagenome peak around 52%
    const count = Math.round(18500 * Math.exp(-Math.pow(gc - 52, 2) / (2 * Math.pow(8.5, 2))));
    const theoretical = Math.round(18500 * Math.exp(-Math.pow(gc - 50, 2) / (2 * Math.pow(9, 2))));
    data.push({ gc, count, theoretical });
  }
  return data;
}

// Generate adapter contamination profile
function generateAdapterProfile(isTrimmed: boolean) {
  const data = [];
  for (let pos = 1; pos <= 250; pos += 10) {
    let illumina = 0;
    let nextera = 0;
    let smallRna = 0;
    if (!isTrimmed) {
      if (pos > 150) {
        illumina = Number((Math.pow((pos - 150) / 100, 2) * 7.8).toFixed(2));
        nextera = Number((Math.pow((pos - 160) / 90, 2) * 4.2).toFixed(2));
      }
      if (pos > 180) {
        smallRna = Number((Math.pow((pos - 180) / 70, 2) * 1.5).toFixed(2));
      }
    } else {
      illumina = 0.01;
      nextera = 0.0;
      smallRna = 0.0;
    }
    data.push({
      position: pos,
      illuminaUniversal: Math.max(0, illumina),
      nexteraTransposase: Math.max(0, nextera),
      smallRnaAdapter: Math.max(0, smallRna),
    });
  }
  return data;
}

// Dataset 1: Human Gut Microbiome (Healthy vs IBD Cohort)
export const GUT_MICROBIOME_DATASET: PipelineRunResults = {
  runId: 'RUN-GUT-2026-0881',
  timestamp: '2026-11-03 11:24:00 UTC',
  config: { ...DEFAULT_PIPELINE_CONFIG, targetRegion: '16S-V4' },
  samples: [
    {
      id: 'S01',
      name: 'Gut_Ctrl_1',
      group: 'Healthy Control',
      fileR1: 'S01_Ctrl_R1.fastq.gz',
      fileR2: 'S01_Ctrl_R2.fastq.gz',
      rawReads: 84320,
      trimmedReads: 78910,
      denoisedReads: 74210,
      nonChimericReads: 71850,
      retainedPercent: 85.2,
    },
    {
      id: 'S02',
      name: 'Gut_Ctrl_2',
      group: 'Healthy Control',
      fileR1: 'S02_Ctrl_R1.fastq.gz',
      fileR2: 'S02_Ctrl_R2.fastq.gz',
      rawReads: 92450,
      trimmedReads: 86700,
      denoisedReads: 81400,
      nonChimericReads: 78600,
      retainedPercent: 85.0,
    },
    {
      id: 'S03',
      name: 'Gut_Ctrl_3',
      group: 'Healthy Control',
      fileR1: 'S03_Ctrl_R1.fastq.gz',
      fileR2: 'S03_Ctrl_R2.fastq.gz',
      rawReads: 79100,
      trimmedReads: 74250,
      denoisedReads: 69800,
      nonChimericReads: 67320,
      retainedPercent: 85.1,
    },
    {
      id: 'S04',
      name: 'Gut_IBD_1',
      group: 'Ulcerative Colitis',
      fileR1: 'S04_IBD_R1.fastq.gz',
      fileR2: 'S04_IBD_R2.fastq.gz',
      rawReads: 88900,
      trimmedReads: 82140,
      denoisedReads: 75400,
      nonChimericReads: 72100,
      retainedPercent: 81.1,
    },
    {
      id: 'S05',
      name: 'Gut_IBD_2',
      group: 'Ulcerative Colitis',
      fileR1: 'S05_IBD_R1.fastq.gz',
      fileR2: 'S05_IBD_R2.fastq.gz',
      rawReads: 95400,
      trimmedReads: 87900,
      denoisedReads: 79800,
      nonChimericReads: 76300,
      retainedPercent: 80.0,
    },
    {
      id: 'S06',
      name: 'Gut_IBD_3',
      group: 'Ulcerative Colitis',
      fileR1: 'S06_IBD_R1.fastq.gz',
      fileR2: 'S06_IBD_R2.fastq.gz',
      rawReads: 76200,
      trimmedReads: 70100,
      denoisedReads: 63500,
      nonChimericReads: 60900,
      retainedPercent: 79.9,
    },
  ],
  qc: {
    rawQuality: generateQualityCurve(false),
    trimmedQuality: generateQualityCurve(true),
    gcDistribution: generateGcDistribution(),
    adapterBefore: generateAdapterProfile(false),
    adapterAfter: generateAdapterProfile(true),
    totalRawReads: 516370,
    totalCleanReads: 427070,
    meanPhredBefore: 28.4,
    meanPhredAfter: 35.8,
    duplicationRate: 14.8,
  },
  asvs: [
    {
      asvId: 'ASV_001',
      sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
      length: 253,
      gcPercent: 51.4,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Clostridia',
      order: 'Oscillospirales',
      family: 'Ruminococcaceae',
      genus: 'Faecalibacterium',
      species: 'Faecalibacterium prausnitzii',
      confidence: 0.99,
      totalReads: 54100,
      sampleCounts: { S01: 14200, S02: 15300, S03: 13800, S04: 3800, S05: 4100, S06: 2900 },
      relativeAbundance: 12.67,
    },
    {
      asvId: 'ASV_002',
      sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 47.8,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Bacteroidaceae',
      genus: 'Bacteroides',
      species: 'Bacteroides thetaiotaomicron',
      confidence: 0.98,
      totalReads: 48900,
      sampleCounts: { S01: 9100, S02: 8900, S03: 9400, S04: 7100, S05: 7500, S06: 6900 },
      relativeAbundance: 11.45,
    },
    {
      asvId: 'ASV_003',
      sequence: 'TACGTAGGGTGCGAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGTTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAAGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
      length: 253,
      gcPercent: 54.2,
      kingdom: 'Bacteria',
      phylum: 'Pseudomonadota',
      classTaxa: 'Gammaproteobacteria',
      order: 'Enterobacterales',
      family: 'Enterobacteriaceae',
      genus: 'Escherichia-Shigella',
      species: 'Escherichia coli',
      confidence: 0.96,
      totalReads: 46200,
      sampleCounts: { S01: 1200, S02: 1500, S03: 1100, S04: 14500, S05: 15100, S06: 12800 },
      relativeAbundance: 10.82,
    },
    {
      asvId: 'ASV_004',
      sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGATTGTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGACAATCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 46.2,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Bacteroidaceae',
      genus: 'Bacteroides',
      species: 'Bacteroides vulgatus',
      confidence: 0.97,
      totalReads: 39800,
      sampleCounts: { S01: 6400, S02: 6700, S03: 6100, S04: 7200, S05: 6900, S06: 6500 },
      relativeAbundance: 9.32,
    },
    {
      asvId: 'ASV_005',
      sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 52.6,
      kingdom: 'Bacteria',
      phylum: 'Verrucomicrobiota',
      classTaxa: 'Verrucomicrobiae',
      order: 'Verrucomicrobiales',
      family: 'Akkermansiaceae',
      genus: 'Akkermansia',
      species: 'Akkermansia muciniphila',
      confidence: 0.99,
      totalReads: 34500,
      sampleCounts: { S01: 8500, S02: 9200, S03: 8100, S04: 2800, S05: 3200, S06: 2700 },
      relativeAbundance: 8.08,
    },
    {
      asvId: 'ASV_006',
      sequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGGGCTCGTAGGCGGTTCGTCGCGTCCGGTGTGAAAGTCCATCGCTTAACGGTGGATCTGCGCCCGGTACGGGCGGGCTGGAGTGCGGTAGGGGAGACTGGAATTCCCGGTGTAACGGTGGAATGTGTAGATATCGGGAAGAACACCAACGGCGAAGGCAGGTCTCTGGGCCGTTACTGACGCTGA',
      length: 253,
      gcPercent: 57.7,
      kingdom: 'Bacteria',
      phylum: 'Actinomycetota',
      classTaxa: 'Actinomycetes',
      order: 'Bifidobacteriales',
      family: 'Bifidobacteriaceae',
      genus: 'Bifidobacterium',
      species: 'Bifidobacterium adolescentis',
      confidence: 0.98,
      totalReads: 31200,
      sampleCounts: { S01: 7600, S02: 7900, S03: 7200, S04: 2900, S05: 3100, S06: 2500 },
      relativeAbundance: 7.30,
    },
    {
      asvId: 'ASV_007',
      sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTCAAGTCTGATGTGAAAGCCCCCGGCTCAACCGGGGAGGGTCATTGGAAACTGGGAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 52.2,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Clostridia',
      order: 'Lachnospirales',
      family: 'Lachnospiraceae',
      genus: 'Roseburia',
      species: 'Roseburia intestinalis',
      confidence: 0.95,
      totalReads: 27800,
      sampleCounts: { S01: 6800, S02: 7100, S03: 6500, S04: 2400, S05: 2700, S06: 2300 },
      relativeAbundance: 6.51,
    },
    {
      asvId: 'ASV_008',
      sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 49.0,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Prevotellaceae',
      genus: 'Prevotella',
      species: 'Prevotella copri',
      confidence: 0.94,
      totalReads: 25400,
      sampleCounts: { S01: 5400, S02: 5800, S03: 5100, S04: 3100, S05: 3300, S06: 2700 },
      relativeAbundance: 5.95,
    },
    {
      asvId: 'ASV_009',
      sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGTACTGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCAGGACTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 51.8,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Clostridia',
      order: 'Lachnospirales',
      family: 'Lachnospiraceae',
      genus: 'Blautia',
      species: 'Blautia obeum',
      confidence: 0.95,
      totalReads: 22100,
      sampleCounts: { S01: 5200, S02: 5500, S03: 4900, S04: 2100, S05: 2300, S06: 2100 },
      relativeAbundance: 5.17,
    },
    {
      asvId: 'ASV_010',
      sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 48.6,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Tannerellaceae',
      genus: 'Parabacteroides',
      species: 'Parabacteroides distasonis',
      confidence: 0.93,
      totalReads: 19600,
      sampleCounts: { S01: 4100, S02: 4300, S03: 3900, S04: 2500, S05: 2600, S06: 2200 },
      relativeAbundance: 4.59,
    },
  ],
  otus: [
    {
      otuId: 'OTU_001',
      centroidSequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 47.1,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Bacteroidaceae',
      genus: 'Bacteroides',
      species: 'Bacteroides cluster (thetaiotaomicron / vulgatus)',
      confidence: 0.98,
      totalReads: 88700,
      memberAsvs: ['ASV_002', 'ASV_004'],
      sampleCounts: { S01: 15500, S02: 15600, S03: 15500, S04: 14300, S05: 14400, S06: 13400 },
      relativeAbundance: 20.77,
    },
    {
      otuId: 'OTU_002',
      centroidSequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
      length: 253,
      gcPercent: 51.4,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Clostridia',
      order: 'Oscillospirales',
      family: 'Ruminococcaceae',
      genus: 'Faecalibacterium',
      species: 'Faecalibacterium prausnitzii',
      confidence: 0.99,
      totalReads: 54100,
      memberAsvs: ['ASV_001'],
      sampleCounts: { S01: 14200, S02: 15300, S03: 13800, S04: 3800, S05: 4100, S06: 2900 },
      relativeAbundance: 12.67,
    },
    {
      otuId: 'OTU_003',
      centroidSequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTCAAGTCTGATGTGAAAGCCCCCGGCTCAACCGGGGAGGGTCATTGGAAACTGGGAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 52.0,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Clostridia',
      order: 'Lachnospirales',
      family: 'Lachnospiraceae',
      genus: 'Roseburia-Blautia cluster',
      species: 'Lachnospiraceae spp.',
      confidence: 0.95,
      totalReads: 49900,
      memberAsvs: ['ASV_007', 'ASV_009'],
      sampleCounts: { S01: 12000, S02: 12600, S03: 11400, S04: 4500, S05: 5000, S06: 4400 },
      relativeAbundance: 11.68,
    },
    {
      otuId: 'OTU_004',
      centroidSequence: 'TACGTAGGGTGCGAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGTTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAAGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
      length: 253,
      gcPercent: 54.2,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Pseudomonadota',
      classTaxa: 'Gammaproteobacteria',
      order: 'Enterobacterales',
      family: 'Enterobacteriaceae',
      genus: 'Escherichia-Shigella',
      species: 'Escherichia coli',
      confidence: 0.96,
      totalReads: 46200,
      memberAsvs: ['ASV_003'],
      sampleCounts: { S01: 1200, S02: 1500, S03: 1100, S04: 14500, S05: 15100, S06: 12800 },
      relativeAbundance: 10.82,
    },
    {
      otuId: 'OTU_005',
      centroidSequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 52.6,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Verrucomicrobiota',
      classTaxa: 'Verrucomicrobiae',
      order: 'Verrucomicrobiales',
      family: 'Akkermansiaceae',
      genus: 'Akkermansia',
      species: 'Akkermansia muciniphila',
      confidence: 0.99,
      totalReads: 34500,
      memberAsvs: ['ASV_005'],
      sampleCounts: { S01: 8500, S02: 9200, S03: 8100, S04: 2800, S05: 3200, S06: 2700 },
      relativeAbundance: 8.08,
    },
    {
      otuId: 'OTU_006',
      centroidSequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGGGCTCGTAGGCGGTTCGTCGCGTCCGGTGTGAAAGTCCATCGCTTAACGGTGGATCTGCGCCCGGTACGGGCGGGCTGGAGTGCGGTAGGGGAGACTGGAATTCCCGGTGTAACGGTGGAATGTGTAGATATCGGGAAGAACACCAACGGCGAAGGCAGGTCTCTGGGCCGTTACTGACGCTGA',
      length: 253,
      gcPercent: 57.7,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Actinomycetota',
      classTaxa: 'Actinomycetes',
      order: 'Bifidobacteriales',
      family: 'Bifidobacteriaceae',
      genus: 'Bifidobacterium',
      species: 'Bifidobacterium adolescentis',
      confidence: 0.98,
      totalReads: 31200,
      memberAsvs: ['ASV_006'],
      sampleCounts: { S01: 7600, S02: 7900, S03: 7200, S04: 2900, S05: 3100, S06: 2500 },
      relativeAbundance: 7.30,
    },
    {
      otuId: 'OTU_007',
      centroidSequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 49.0,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Prevotellaceae',
      genus: 'Prevotella',
      species: 'Prevotella copri',
      confidence: 0.94,
      totalReads: 25400,
      memberAsvs: ['ASV_008'],
      sampleCounts: { S01: 5400, S02: 5800, S03: 5100, S04: 3100, S05: 3300, S06: 2700 },
      relativeAbundance: 5.95,
    },
    {
      otuId: 'OTU_008',
      centroidSequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 48.6,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Bacteroidia',
      order: 'Bacteroidales',
      family: 'Tannerellaceae',
      genus: 'Parabacteroides',
      species: 'Parabacteroides distasonis',
      confidence: 0.93,
      totalReads: 19600,
      memberAsvs: ['ASV_010'],
      sampleCounts: { S01: 4100, S02: 4300, S03: 3900, S04: 2500, S05: 2600, S06: 2200 },
      relativeAbundance: 4.59,
    },
  ],
  diversity: {
    distanceMetric: 'Bray-Curtis',
    varianceExplained: [48.2, 24.6, 9.4],
    alpha: [
      { sampleId: 'S01', sampleName: 'Gut_Ctrl_1', group: 'Healthy Control', shannon: 3.82, simpson: 0.95, chao1: 342, observedASVs: 310, faithPD: 22.4 },
      { sampleId: 'S02', sampleName: 'Gut_Ctrl_2', group: 'Healthy Control', shannon: 3.91, simpson: 0.96, chao1: 358, observedASVs: 324, faithPD: 23.1 },
      { sampleId: 'S03', sampleName: 'Gut_Ctrl_3', group: 'Healthy Control', shannon: 3.86, simpson: 0.95, chao1: 336, observedASVs: 304, faithPD: 21.8 },
      { sampleId: 'S04', sampleName: 'Gut_IBD_1', group: 'Ulcerative Colitis', shannon: 2.64, simpson: 0.81, chao1: 195, observedASVs: 172, faithPD: 14.5 },
      { sampleId: 'S05', sampleName: 'Gut_IBD_2', group: 'Ulcerative Colitis', shannon: 2.71, simpson: 0.83, chao1: 204, observedASVs: 180, faithPD: 15.2 },
      { sampleId: 'S06', sampleName: 'Gut_IBD_3', group: 'Ulcerative Colitis', shannon: 2.58, simpson: 0.79, chao1: 188, observedASVs: 165, faithPD: 13.9 },
    ],
    beta: [
      { sampleId: 'S01', sampleName: 'Gut_Ctrl_1', group: 'Healthy Control', pc1: -0.38, pc2: 0.12, pc3: 0.05 },
      { sampleId: 'S02', sampleName: 'Gut_Ctrl_2', group: 'Healthy Control', pc1: -0.42, pc2: -0.08, pc3: -0.02 },
      { sampleId: 'S03', sampleName: 'Gut_Ctrl_3', group: 'Healthy Control', pc1: -0.36, pc2: 0.04, pc3: -0.06 },
      { sampleId: 'S04', sampleName: 'Gut_IBD_1', group: 'Ulcerative Colitis', pc1: 0.41, pc2: 0.15, pc3: 0.04 },
      { sampleId: 'S05', sampleName: 'Gut_IBD_2', group: 'Ulcerative Colitis', pc1: 0.39, pc2: -0.14, pc3: 0.07 },
      { sampleId: 'S06', sampleName: 'Gut_IBD_3', group: 'Ulcerative Colitis', pc1: 0.45, pc2: -0.02, pc3: -0.08 },
    ],
  },
  otuDiversity: {
    distanceMetric: 'Bray-Curtis',
    varianceExplained: [51.4, 26.2, 8.1],
    alpha: [
      { sampleId: 'S01', sampleName: 'Gut_Ctrl_1', group: 'Healthy Control', shannon: 3.42, simpson: 0.92, chao1: 198, observedASVs: 182, faithPD: 17.2 },
      { sampleId: 'S02', sampleName: 'Gut_Ctrl_2', group: 'Healthy Control', shannon: 3.49, simpson: 0.93, chao1: 206, observedASVs: 191, faithPD: 17.8 },
      { sampleId: 'S03', sampleName: 'Gut_Ctrl_3', group: 'Healthy Control', shannon: 3.45, simpson: 0.92, chao1: 194, observedASVs: 179, faithPD: 16.9 },
      { sampleId: 'S04', sampleName: 'Gut_IBD_1', group: 'Ulcerative Colitis', shannon: 2.38, simpson: 0.77, chao1: 118, observedASVs: 104, faithPD: 11.2 },
      { sampleId: 'S05', sampleName: 'Gut_IBD_2', group: 'Ulcerative Colitis', shannon: 2.44, simpson: 0.79, chao1: 124, observedASVs: 110, faithPD: 11.8 },
      { sampleId: 'S06', sampleName: 'Gut_IBD_3', group: 'Ulcerative Colitis', shannon: 2.32, simpson: 0.75, chao1: 112, observedASVs: 99, faithPD: 10.6 },
    ],
    beta: [
      { sampleId: 'S01', sampleName: 'Gut_Ctrl_1', group: 'Healthy Control', pc1: -0.42, pc2: 0.10, pc3: 0.04 },
      { sampleId: 'S02', sampleName: 'Gut_Ctrl_2', group: 'Healthy Control', pc1: -0.46, pc2: -0.07, pc3: -0.02 },
      { sampleId: 'S03', sampleName: 'Gut_Ctrl_3', group: 'Healthy Control', pc1: -0.40, pc2: 0.03, pc3: -0.05 },
      { sampleId: 'S04', sampleName: 'Gut_IBD_1', group: 'Ulcerative Colitis', pc1: 0.44, pc2: 0.13, pc3: 0.03 },
      { sampleId: 'S05', sampleName: 'Gut_IBD_2', group: 'Ulcerative Colitis', pc1: 0.42, pc2: -0.12, pc3: 0.06 },
      { sampleId: 'S06', sampleName: 'Gut_IBD_3', group: 'Ulcerative Colitis', pc1: 0.48, pc2: -0.01, pc3: -0.07 },
    ],
  },
};

// Dataset 2: Soil & Rhizosphere Microbiome
export const SOIL_MICROBIOME_DATASET: PipelineRunResults = {
  runId: 'RUN-SOIL-2026-0419',
  timestamp: '2026-11-03 10:15:00 UTC',
  config: { ...DEFAULT_PIPELINE_CONFIG, targetRegion: '16S-V4' },
  samples: [
    {
      id: 'SOIL_01',
      name: 'Rhizo_Tomato_1',
      group: 'Rhizosphere',
      fileR1: 'Rhizo_01_R1.fastq.gz',
      fileR2: 'Rhizo_01_R2.fastq.gz',
      rawReads: 112000,
      trimmedReads: 104500,
      denoisedReads: 98200,
      nonChimericReads: 94100,
      retainedPercent: 84.0,
    },
    {
      id: 'SOIL_02',
      name: 'Rhizo_Tomato_2',
      group: 'Rhizosphere',
      fileR1: 'Rhizo_02_R1.fastq.gz',
      fileR2: 'Rhizo_02_R2.fastq.gz',
      rawReads: 108400,
      trimmedReads: 101200,
      denoisedReads: 95300,
      nonChimericReads: 91400,
      retainedPercent: 84.3,
    },
    {
      id: 'SOIL_03',
      name: 'Bulk_Soil_1',
      group: 'Bulk Soil',
      fileR1: 'Bulk_01_R1.fastq.gz',
      fileR2: 'Bulk_01_R2.fastq.gz',
      rawReads: 99400,
      trimmedReads: 92100,
      denoisedReads: 86400,
      nonChimericReads: 82700,
      retainedPercent: 83.2,
    },
    {
      id: 'SOIL_04',
      name: 'Bulk_Soil_2',
      group: 'Bulk Soil',
      fileR1: 'Bulk_02_R1.fastq.gz',
      fileR2: 'Bulk_02_R2.fastq.gz',
      rawReads: 104200,
      trimmedReads: 96800,
      denoisedReads: 90700,
      nonChimericReads: 86900,
      retainedPercent: 83.4,
    },
    {
      id: 'SOIL_05',
      name: 'Compost_Add_1',
      group: 'Compost Amended',
      fileR1: 'Compost_01_R1.fastq.gz',
      fileR2: 'Compost_01_R2.fastq.gz',
      rawReads: 124000,
      trimmedReads: 115200,
      denoisedReads: 108100,
      nonChimericReads: 103500,
      retainedPercent: 83.5,
    },
    {
      id: 'SOIL_06',
      name: 'Compost_Add_2',
      group: 'Compost Amended',
      fileR1: 'Compost_02_R1.fastq.gz',
      fileR2: 'Compost_02_R2.fastq.gz',
      rawReads: 119800,
      trimmedReads: 111400,
      denoisedReads: 104200,
      nonChimericReads: 99800,
      retainedPercent: 83.3,
    },
  ],
  qc: {
    rawQuality: generateQualityCurve(false),
    trimmedQuality: generateQualityCurve(true),
    gcDistribution: generateGcDistribution(),
    adapterBefore: generateAdapterProfile(false),
    adapterAfter: generateAdapterProfile(true),
    totalRawReads: 667800,
    totalCleanReads: 558400,
    meanPhredBefore: 27.9,
    meanPhredAfter: 35.4,
    duplicationRate: 18.2,
  },
  asvs: [
    {
      asvId: 'ASV_S01',
      sequence: 'TACGTAGGGTGCAAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGCTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAGGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
      length: 253,
      gcPercent: 55.3,
      kingdom: 'Bacteria',
      phylum: 'Pseudomonadota',
      classTaxa: 'Gammaproteobacteria',
      order: 'Pseudomonadales',
      family: 'Pseudomonadaceae',
      genus: 'Pseudomonas',
      species: 'Pseudomonas putida',
      confidence: 0.99,
      totalReads: 78400,
      sampleCounts: { SOIL_01: 28400, SOIL_02: 26900, SOIL_03: 4100, SOIL_04: 4500, SOIL_05: 7200, SOIL_06: 7300 },
      relativeAbundance: 14.04,
    },
    {
      asvId: 'ASV_S02',
      sequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGAGCTCGTAGGCGGCTTGTCGCGTCGACTGTGAAATCCCGGGGCTCAACTCCGGGCCTGCAGTCGATACGGGCAGGCTAGAGTTCGGTAGGGGAGACTGGAATTCCTGGTGTAGCGGTGAAATGCGCAGATATCAGGAGGAACACCGGTGGCGAAGGCGGGTCTCTGGGCCGATACTGACGCTGA',
      length: 253,
      gcPercent: 62.4,
      kingdom: 'Bacteria',
      phylum: 'Actinomycetota',
      classTaxa: 'Actinomycetes',
      order: 'Streptomycetales',
      family: 'Streptomycetaceae',
      genus: 'Streptomyces',
      species: 'Streptomyces coelicolor',
      confidence: 0.98,
      totalReads: 71200,
      sampleCounts: { SOIL_01: 11200, SOIL_02: 10800, SOIL_03: 16400, SOIL_04: 17100, SOIL_05: 7800, SOIL_06: 7900 },
      relativeAbundance: 12.75,
    },
    {
      asvId: 'ASV_S03',
      sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
      length: 253,
      gcPercent: 54.1,
      kingdom: 'Bacteria',
      phylum: 'Acidobacteriota',
      classTaxa: 'Blastocatellia',
      order: 'Blastocatellales',
      family: 'Pyrinomonadaceae',
      genus: 'Pyrinomonas',
      species: 'Pyrinomonas methylaliphatogenes',
      confidence: 0.95,
      totalReads: 58900,
      sampleCounts: { SOIL_01: 4200, SOIL_02: 4400, SOIL_03: 18900, SOIL_04: 19400, SOIL_05: 6100, SOIL_06: 5900 },
      relativeAbundance: 10.55,
    },
    {
      asvId: 'ASV_S04',
      sequence: 'TACGTAGGGTGCAAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTGTTTTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGAAGGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
      length: 253,
      gcPercent: 56.5,
      kingdom: 'Bacteria',
      phylum: 'Pseudomonadota',
      classTaxa: 'Alphaproteobacteria',
      order: 'Rhizobiales',
      family: 'Rhizobiaceae',
      genus: 'Rhizobium',
      species: 'Rhizobium leguminosarum',
      confidence: 0.97,
      totalReads: 54600,
      sampleCounts: { SOIL_01: 21300, SOIL_02: 20400, SOIL_03: 2800, SOIL_04: 3100, SOIL_05: 3500, SOIL_06: 3500 },
      relativeAbundance: 9.78,
    },
    {
      asvId: 'ASV_S05',
      sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 53.0,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Bacilli',
      order: 'Bacillales',
      family: 'Bacillaceae',
      genus: 'Bacillus',
      species: 'Bacillus subtilis',
      confidence: 0.99,
      totalReads: 52100,
      sampleCounts: { SOIL_01: 8200, SOIL_02: 7900, SOIL_03: 6500, SOIL_04: 6700, SOIL_05: 11400, SOIL_06: 11400 },
      relativeAbundance: 9.33,
    },
    {
      asvId: 'ASV_S06',
      sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 49.2,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Flavobacteriia',
      order: 'Flavobacteriales',
      family: 'Flavobacteriaceae',
      genus: 'Flavobacterium',
      species: 'Flavobacterium succinicans',
      confidence: 0.96,
      totalReads: 44200,
      sampleCounts: { SOIL_01: 9800, SOIL_02: 9500, SOIL_03: 3400, SOIL_04: 3600, SOIL_05: 8900, SOIL_06: 9000 },
      relativeAbundance: 7.92,
    },
  ],
  otus: [
    {
      otuId: 'OTU_S01',
      centroidSequence: 'TACGTAGGGTGCAAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGCTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAGGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
      length: 253,
      gcPercent: 55.3,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Pseudomonadota',
      classTaxa: 'Gammaproteobacteria',
      order: 'Pseudomonadales',
      family: 'Pseudomonadaceae',
      genus: 'Pseudomonas-Rhizobium cluster',
      species: 'Pseudomonadota spp.',
      confidence: 0.98,
      totalReads: 133000,
      memberAsvs: ['ASV_S01', 'ASV_S04'],
      sampleCounts: { SOIL_01: 49700, SOIL_02: 47300, SOIL_03: 6900, SOIL_04: 7600, SOIL_05: 10700, SOIL_06: 10800 },
      relativeAbundance: 23.82,
    },
    {
      otuId: 'OTU_S02',
      centroidSequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGAGCTCGTAGGCGGCTTGTCGCGTCGACTGTGAAATCCCGGGGCTCAACTCCGGGCCTGCAGTCGATACGGGCAGGCTAGAGTTCGGTAGGGGAGACTGGAATTCCTGGTGTAGCGGTGAAATGCGCAGATATCAGGAGGAACACCGGTGGCGAAGGCGGGTCTCTGGGCCGATACTGACGCTGA',
      length: 253,
      gcPercent: 62.4,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Actinomycetota',
      classTaxa: 'Actinomycetes',
      order: 'Streptomycetales',
      family: 'Streptomycetaceae',
      genus: 'Streptomyces',
      species: 'Streptomyces coelicolor',
      confidence: 0.98,
      totalReads: 71200,
      memberAsvs: ['ASV_S02'],
      sampleCounts: { SOIL_01: 11200, SOIL_02: 10800, SOIL_03: 16400, SOIL_04: 17100, SOIL_05: 7800, SOIL_06: 7900 },
      relativeAbundance: 12.75,
    },
    {
      otuId: 'OTU_S03',
      centroidSequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
      length: 253,
      gcPercent: 54.1,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Acidobacteriota',
      classTaxa: 'Blastocatellia',
      order: 'Blastocatellales',
      family: 'Pyrinomonadaceae',
      genus: 'Pyrinomonas',
      species: 'Pyrinomonas methylaliphatogenes',
      confidence: 0.95,
      totalReads: 58900,
      memberAsvs: ['ASV_S03'],
      sampleCounts: { SOIL_01: 4200, SOIL_02: 4400, SOIL_03: 18900, SOIL_04: 19400, SOIL_05: 6100, SOIL_06: 5900 },
      relativeAbundance: 10.55,
    },
    {
      otuId: 'OTU_S04',
      centroidSequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
      length: 253,
      gcPercent: 53.0,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacillota',
      classTaxa: 'Bacilli',
      order: 'Bacillales',
      family: 'Bacillaceae',
      genus: 'Bacillus',
      species: 'Bacillus subtilis',
      confidence: 0.99,
      totalReads: 52100,
      memberAsvs: ['ASV_S05'],
      sampleCounts: { SOIL_01: 8200, SOIL_02: 7900, SOIL_03: 6500, SOIL_04: 6700, SOIL_05: 11400, SOIL_06: 11400 },
      relativeAbundance: 9.33,
    },
    {
      otuId: 'OTU_S05',
      centroidSequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
      length: 253,
      gcPercent: 49.2,
      identityCutoff: 0.97,
      kingdom: 'Bacteria',
      phylum: 'Bacteroidota',
      classTaxa: 'Flavobacteriia',
      order: 'Flavobacteriales',
      family: 'Flavobacteriaceae',
      genus: 'Flavobacterium',
      species: 'Flavobacterium succinicans',
      confidence: 0.96,
      totalReads: 44200,
      memberAsvs: ['ASV_S06'],
      sampleCounts: { SOIL_01: 9800, SOIL_02: 9500, SOIL_03: 3400, SOIL_04: 3600, SOIL_05: 8900, SOIL_06: 9000 },
      relativeAbundance: 7.92,
    },
  ],
  diversity: {
    distanceMetric: 'Bray-Curtis',
    varianceExplained: [56.4, 21.8, 8.5],
    alpha: [
      { sampleId: 'SOIL_01', sampleName: 'Rhizo_Tomato_1', group: 'Rhizosphere', shannon: 4.45, simpson: 0.97, chao1: 580, observedASVs: 520, faithPD: 34.2 },
      { sampleId: 'SOIL_02', sampleName: 'Rhizo_Tomato_2', group: 'Rhizosphere', shannon: 4.48, simpson: 0.97, chao1: 592, observedASVs: 531, faithPD: 34.8 },
      { sampleId: 'SOIL_03', sampleName: 'Bulk_Soil_1', group: 'Bulk Soil', shannon: 4.82, simpson: 0.98, chao1: 710, observedASVs: 640, faithPD: 41.5 },
      { sampleId: 'SOIL_04', sampleName: 'Bulk_Soil_2', group: 'Bulk Soil', shannon: 4.88, simpson: 0.98, chao1: 725, observedASVs: 654, faithPD: 42.1 },
      { sampleId: 'SOIL_05', sampleName: 'Compost_Add_1', group: 'Compost Amended', shannon: 4.65, simpson: 0.97, chao1: 645, observedASVs: 580, faithPD: 37.6 },
      { sampleId: 'SOIL_06', sampleName: 'Compost_Add_2', group: 'Compost Amended', shannon: 4.61, simpson: 0.97, chao1: 638, observedASVs: 574, faithPD: 37.1 },
    ],
    beta: [
      { sampleId: 'SOIL_01', sampleName: 'Rhizo_Tomato_1', group: 'Rhizosphere', pc1: -0.52, pc2: -0.15, pc3: 0.04 },
      { sampleId: 'SOIL_02', sampleName: 'Rhizo_Tomato_2', group: 'Rhizosphere', pc1: -0.49, pc2: -0.18, pc3: -0.02 },
      { sampleId: 'SOIL_03', sampleName: 'Bulk_Soil_1', group: 'Bulk Soil', pc1: 0.48, pc2: -0.22, pc3: 0.08 },
      { sampleId: 'SOIL_04', sampleName: 'Bulk_Soil_2', group: 'Bulk Soil', pc1: 0.51, pc2: -0.19, pc3: -0.05 },
      { sampleId: 'SOIL_05', sampleName: 'Compost_Add_1', group: 'Compost Amended', pc1: 0.02, pc2: 0.42, pc3: 0.06 },
      { sampleId: 'SOIL_06', sampleName: 'Compost_Add_2', group: 'Compost Amended', pc1: -0.01, pc2: 0.45, pc3: -0.03 },
    ],
  },
  otuDiversity: {
    distanceMetric: 'Bray-Curtis',
    varianceExplained: [59.2, 23.4, 7.8],
    alpha: [
      { sampleId: 'SOIL_01', sampleName: 'Rhizo_Tomato_1', group: 'Rhizosphere', shannon: 3.95, simpson: 0.94, chao1: 345, observedASVs: 312, faithPD: 25.1 },
      { sampleId: 'SOIL_02', sampleName: 'Rhizo_Tomato_2', group: 'Rhizosphere', shannon: 3.98, simpson: 0.94, chao1: 352, observedASVs: 318, faithPD: 25.4 },
      { sampleId: 'SOIL_03', sampleName: 'Bulk_Soil_1', group: 'Bulk Soil', shannon: 4.28, simpson: 0.95, chao1: 432, observedASVs: 395, faithPD: 31.0 },
      { sampleId: 'SOIL_04', sampleName: 'Bulk_Soil_2', group: 'Bulk Soil', shannon: 4.31, simpson: 0.95, chao1: 440, observedASVs: 402, faithPD: 31.5 },
      { sampleId: 'SOIL_05', sampleName: 'Compost_Add_1', group: 'Compost Amended', shannon: 4.12, simpson: 0.95, chao1: 390, observedASVs: 355, faithPD: 28.2 },
      { sampleId: 'SOIL_06', sampleName: 'Compost_Add_2', group: 'Compost Amended', shannon: 4.09, simpson: 0.94, chao1: 384, observedASVs: 350, faithPD: 27.9 },
    ],
    beta: [
      { sampleId: 'SOIL_01', sampleName: 'Rhizo_Tomato_1', group: 'Rhizosphere', pc1: -0.55, pc2: -0.12, pc3: 0.03 },
      { sampleId: 'SOIL_02', sampleName: 'Rhizo_Tomato_2', group: 'Rhizosphere', pc1: -0.52, pc2: -0.15, pc3: -0.01 },
      { sampleId: 'SOIL_03', sampleName: 'Bulk_Soil_1', group: 'Bulk Soil', pc1: 0.50, pc2: -0.20, pc3: 0.07 },
      { sampleId: 'SOIL_04', sampleName: 'Bulk_Soil_2', group: 'Bulk Soil', pc1: 0.53, pc2: -0.17, pc3: -0.04 },
      { sampleId: 'SOIL_05', sampleName: 'Compost_Add_1', group: 'Compost Amended', pc1: 0.02, pc2: 0.40, pc3: 0.05 },
      { sampleId: 'SOIL_06', sampleName: 'Compost_Add_2', group: 'Compost Amended', pc1: -0.01, pc2: 0.43, pc3: -0.03 },
    ],
  },
};

// Dataset 3: Human Gut Microbiome (Single-End Reads)
export const GUT_SINGLE_END_DATASET: PipelineRunResults = {
  runId: 'RUN-GUT-SE-2026-0914',
  timestamp: '2026-11-03 12:45:00 UTC',
  config: {
    ...DEFAULT_PIPELINE_CONFIG,
    sequencingType: 'single',
    reversePrimer: '',
    truncLenR: 0,
    maxEER: 0,
  },
  samples: [
    {
      id: 'SE01',
      name: 'Gut_SE_Ctrl_1',
      group: 'Healthy Control',
      layout: 'single',
      fileR1: 'SE01_Ctrl_R1.fastq.gz',
      rawReads: 84320,
      trimmedReads: 79500,
      denoisedReads: 75100,
      nonChimericReads: 72800,
      retainedPercent: 86.3,
    },
    {
      id: 'SE02',
      name: 'Gut_SE_Ctrl_2',
      group: 'Healthy Control',
      layout: 'single',
      fileR1: 'SE02_Ctrl_R1.fastq.gz',
      rawReads: 92450,
      trimmedReads: 87400,
      denoisedReads: 82300,
      nonChimericReads: 79600,
      retainedPercent: 86.1,
    },
    {
      id: 'SE03',
      name: 'Gut_SE_Ctrl_3',
      group: 'Healthy Control',
      layout: 'single',
      fileR1: 'SE03_Ctrl_R1.fastq.gz',
      rawReads: 79100,
      trimmedReads: 74900,
      denoisedReads: 70400,
      nonChimericReads: 68100,
      retainedPercent: 86.1,
    },
    {
      id: 'SE04',
      name: 'Gut_SE_IBD_1',
      group: 'Ulcerative Colitis',
      layout: 'single',
      fileR1: 'SE04_IBD_R1.fastq.gz',
      rawReads: 88900,
      trimmedReads: 82900,
      denoisedReads: 76200,
      nonChimericReads: 73000,
      retainedPercent: 82.1,
    },
    {
      id: 'SE05',
      name: 'Gut_SE_IBD_2',
      group: 'Ulcerative Colitis',
      layout: 'single',
      fileR1: 'SE05_IBD_R1.fastq.gz',
      rawReads: 95400,
      trimmedReads: 88700,
      denoisedReads: 80600,
      nonChimericReads: 77200,
      retainedPercent: 80.9,
    },
    {
      id: 'SE06',
      name: 'Gut_SE_IBD_3',
      group: 'Ulcerative Colitis',
      layout: 'single',
      fileR1: 'SE06_IBD_R1.fastq.gz',
      rawReads: 76200,
      trimmedReads: 70900,
      denoisedReads: 64100,
      nonChimericReads: 61500,
      retainedPercent: 80.7,
    },
  ],
  qc: GUT_MICROBIOME_DATASET.qc,
  asvs: GUT_MICROBIOME_DATASET.asvs,
  otus: GUT_MICROBIOME_DATASET.otus,
  diversity: GUT_MICROBIOME_DATASET.diversity,
  otuDiversity: GUT_MICROBIOME_DATASET.otuDiversity,
};

export const AVAILABLE_DATASETS = [
  { id: 'gut', name: 'Human Gut (Paired-End 16S, 6 Samples)', data: GUT_MICROBIOME_DATASET },
  { id: 'gut_single', name: 'Human Gut (Single-End 16S, 6 Samples)', data: GUT_SINGLE_END_DATASET },
  { id: 'soil', name: 'Soil Rhizosphere (Paired-End 16S, 6 Samples)', data: SOIL_MICROBIOME_DATASET },
];

export const CLEAN_USER_DATASET: PipelineRunResults = {
  runId: 'WORKSPACE-CUSTOM',
  datasetName: 'Custom Sequencing Project',
  timestamp: new Date().toISOString(),
  config: {
    ...DEFAULT_PIPELINE_CONFIG,
    autoRunOnUpload: false,
  },
  samples: [],
  qc: {
    totalRawReads: 0,
    totalCleanReads: 0,
    rawQuality: [],
    trimmedQuality: [],
    gcDistribution: [],
    adapterBefore: [],
    adapterAfter: [],
    meanPhredBefore: 0,
    meanPhredAfter: 0,
    duplicationRate: 0,
  },
  asvs: [],
  otus: [],
  diversity: {
    alpha: [],
    beta: [],
    varianceExplained: [0, 0, 0],
    distanceMetric: 'Bray-Curtis',
  },
  otuDiversity: {
    alpha: [],
    beta: [],
    varianceExplained: [0, 0, 0],
    distanceMetric: 'Bray-Curtis',
  },
};

/**
 * Rich seed pool of 32 Amplicon Sequence Variants across major human & environmental phyla
 */
const DYNAMIC_ASV_POOL: Omit<ASVRecord, 'sampleCounts' | 'totalReads' | 'relativeAbundance'>[] = [
  {
    asvId: 'ASV_001',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
    length: 253, gcPercent: 51.4, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Ruminococcaceae', genus: 'Faecalibacterium', species: 'Faecalibacterium prausnitzii', confidence: 0.99
  },
  {
    asvId: 'ASV_002',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 47.8, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Bacteroidaceae', genus: 'Bacteroides', species: 'Bacteroides thetaiotaomicron', confidence: 0.98
  },
  {
    asvId: 'ASV_003',
    sequence: 'TACGTAGGGTGCGAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGTTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAAGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
    length: 253, gcPercent: 54.2, kingdom: 'Bacteria', phylum: 'Pseudomonadota', classTaxa: 'Gammaproteobacteria', order: 'Enterobacterales', family: 'Enterobacteriaceae', genus: 'Escherichia-Shigella', species: 'Escherichia coli', confidence: 0.96
  },
  {
    asvId: 'ASV_004',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGATTGTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGACAATCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 46.2, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Bacteroidaceae', genus: 'Bacteroides', species: 'Bacteroides vulgatus', confidence: 0.97
  },
  {
    asvId: 'ASV_005',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 52.6, kingdom: 'Bacteria', phylum: 'Verrucomicrobiota', classTaxa: 'Verrucomicrobiae', order: 'Verrucomicrobiales', family: 'Akkermansiaceae', genus: 'Akkermansia', species: 'Akkermansia muciniphila', confidence: 0.99
  },
  {
    asvId: 'ASV_006',
    sequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGGGCTCGTAGGCGGTTCGTCGCGTCCGGTGTGAAAGTCCATCGCTTAACGGTGGATCTGCGCCCGGTACGGGCGGGCTGGAGTGCGGTAGGGGAGACTGGAATTCCCGGTGTAACGGTGGAATGTGTAGATATCGGGAAGAACACCAACGGCGAAGGCAGGTCTCTGGGCCGTTACTGACGCTGA',
    length: 253, gcPercent: 57.7, kingdom: 'Bacteria', phylum: 'Actinomycetota', classTaxa: 'Actinomycetes', order: 'Bifidobacteriales', family: 'Bifidobacteriaceae', genus: 'Bifidobacterium', species: 'Bifidobacterium adolescentis', confidence: 0.98
  },
  {
    asvId: 'ASV_007',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTCAAGTCTGATGTGAAAGCCCCCGGCTCAACCGGGGAGGGTCATTGGAAACTGGGAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 52.2, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Lachnospirales', family: 'Lachnospiraceae', genus: 'Roseburia', species: 'Roseburia intestinalis', confidence: 0.95
  },
  {
    asvId: 'ASV_008',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 49.0, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Prevotellaceae', genus: 'Prevotella', species: 'Prevotella copri', confidence: 0.94
  },
  {
    asvId: 'ASV_009',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGTACTGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCAGGACTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 51.8, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Lachnospirales', family: 'Lachnospiraceae', genus: 'Blautia', species: 'Blautia obeum', confidence: 0.95
  },
  {
    asvId: 'ASV_010',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 48.6, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Tannerellaceae', genus: 'Parabacteroides', species: 'Parabacteroides distasonis', confidence: 0.93
  },
  {
    asvId: 'ASV_011',
    sequence: 'TACGTAGGTGGCAAGCGTTATCCGGATTTATTGGGCGTAAAGAGCGAGCGCAGGCGGTTGCTTAAGTCTGATGTGAAAGCCCCCGGCTCAACCGGGGAGGGTCATTGGAAACTGGCAAGCTTGAGTGCAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 50.1, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Bacilli', order: 'Lactobacillales', family: 'Lactobacillaceae', genus: 'Lactobacillus', species: 'Lactobacillus acidophilus', confidence: 0.97
  },
  {
    asvId: 'ASV_012',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 49.8, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Bacilli', order: 'Lactobacillales', family: 'Streptococcaceae', genus: 'Streptococcus', species: 'Streptococcus thermophilus', confidence: 0.96
  },
  {
    asvId: 'ASV_013',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
    length: 253, gcPercent: 53.4, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Eubacteriales', family: 'Clostridiaceae', genus: 'Clostridium', species: 'Clostridium butyricum', confidence: 0.98
  },
  {
    asvId: 'ASV_014',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 55.0, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Negativicutes', order: 'Veillonellales', family: 'Veillonellaceae', genus: 'Veillonella', species: 'Veillonella parvula', confidence: 0.94
  },
  {
    asvId: 'ASV_015',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 51.0, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Ruminococcaceae', genus: 'Ruminococcus', species: 'Ruminococcus bromii', confidence: 0.97
  },
  {
    asvId: 'ASV_016',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTCAAGTCTGATGTGAAAGCCCCCGGCTCAACCGGGGAGGGTCATTGGAAACTGGGAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 48.9, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Bacilli', order: 'Lactobacillales', family: 'Enterococcaceae', genus: 'Enterococcus', species: 'Enterococcus faecalis', confidence: 0.99
  },
  {
    asvId: 'ASV_017',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 47.1, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Rikenellaceae', genus: 'Alistipes', species: 'Alistipes putredinis', confidence: 0.95
  },
  {
    asvId: 'ASV_018',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGTACTGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCAGGACTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 52.8, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Lachnospirales', family: 'Lachnospiraceae', genus: 'Coprococcus', species: 'Coprococcus comes', confidence: 0.96
  },
  {
    asvId: 'ASV_019',
    sequence: 'TACGTAGGGTGCGAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGTTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAAGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
    length: 253, gcPercent: 56.1, kingdom: 'Bacteria', phylum: 'Pseudomonadota', classTaxa: 'Betaproteobacteria', order: 'Burkholderiales', family: 'Sutterellaceae', genus: 'Sutterella', species: 'Sutterella wadsworthensis', confidence: 0.93
  },
  {
    asvId: 'ASV_020',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 54.8, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Negativicutes', order: 'Veillonellales', family: 'Dialisteraceae', genus: 'Dialister', species: 'Dialister pneumosintes', confidence: 0.92
  },
  {
    asvId: 'ASV_021',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
    length: 253, gcPercent: 51.9, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Eubacteriales', family: 'Eubacteriaceae', genus: 'Eubacterium', species: 'Eubacterium rectale', confidence: 0.98
  },
  {
    asvId: 'ASV_022',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 53.2, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Negativicutes', order: 'Acidaminococcales', family: 'Acidaminococcaceae', genus: 'Phascolarctobacterium', species: 'Phascolarctobacterium faecium', confidence: 0.95
  },
  {
    asvId: 'ASV_023',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGATTGTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGACAATCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 46.8, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Odoribacteraceae', genus: 'Odoribacter', species: 'Odoribacter splanchnicus', confidence: 0.96
  },
  {
    asvId: 'ASV_024',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 48.2, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Barnesiellaceae', genus: 'Barnesiella', species: 'Barnesiella intestinihominis', confidence: 0.94
  },
  {
    asvId: 'ASV_025',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGACGGCATGGCAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGCCAGGCTTGAGTACAGAAGAGGAGAGCGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 53.9, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Oscillospiraceae', genus: 'Oscillibacter', species: 'Oscillibacter valericigenes', confidence: 0.93
  },
  {
    asvId: 'ASV_026',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGATTGTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGACAATCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 47.5, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Bacteroidaceae', genus: 'Bacteroides', species: 'Bacteroides fragilis', confidence: 0.98
  },
  {
    asvId: 'ASV_027',
    sequence: 'TACGGAGGATCCGAGCGTTATCCGGATTTATTGGGTTTAAAGGGAGCGTAGGCGGACGCTTAAGTCAGTTGTGAAAGTTTGCGGCTCAACCGTAAAATTGCAGTTGAAACTGGGTGCCTTGAGTACATTAGAGGTAGGCGGAATTCGTGGTGTAGCGGTGAAATGCTTAGATATCACGAAGAACTCCGATTGCGAAGGCAGCTTACTGGAGTGTTACTGACGCTGA',
    length: 253, gcPercent: 49.3, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Tannerellaceae', genus: 'Parabacteroides', species: 'Parabacteroides merdae', confidence: 0.95
  },
  {
    asvId: 'ASV_028',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTCAAGTCTGATGTGAAAGCCCCCGGCTCAACCGGGGAGGGTCATTGGAAACTGGGAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGA',
    length: 253, gcPercent: 51.5, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Christensenellales', family: 'Christensenellaceae', genus: 'Christensenella', species: 'Christensenella minutissima', confidence: 0.96
  },
  {
    asvId: 'ASV_029',
    sequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGGGCTCGTAGGCGGTTCGTCGCGTCCGGTGTGAAAGTCCATCGCTTAACGGTGGATCTGCGCCCGGTACGGGCGGGCTGGAGTGCGGTAGGGGAGACTGGAATTCCCGGTGTAACGGTGGAATGTGTAGATATCGGGAAGAACACCAACGGCGAAGGCAGGTCTCTGGGCCGTTACTGACGCTGA',
    length: 253, gcPercent: 61.2, kingdom: 'Bacteria', phylum: 'Actinomycetota', classTaxa: 'Coriobacteriia', order: 'Coriobacteriales', family: 'Coriobacteriaceae', genus: 'Collinsella', species: 'Collinsella aerofaciens', confidence: 0.97
  },
  {
    asvId: 'ASV_030',
    sequence: 'TACGTAGGGTGCGAGCGTTAATCGGAATTACTGGGCGTAAAGCGTGCGCAGGCGGTTTGTTAAGTCAGATGTGAAATCCCCGGGCTCAACCTGGGAACTGCATTTGAAACTGGCAAGCTAGAGTCTTGTAGAGGGGGGTAGAATTCCAGGTGTAGCGGTGAAATGCGTAGAGATCTGGAGGAATACCGGTGGCGAAGGCGGCCCCCTGGACAAAGACTGACGCTCA',
    length: 253, gcPercent: 58.4, kingdom: 'Bacteria', phylum: 'Desulfobacterota', classTaxa: 'Desulfovibrionia', order: 'Desulfovibrionales', family: 'Desulfovibrionaceae', genus: 'Desulfovibrio', species: 'Desulfovibrio piger', confidence: 0.94
  },
  {
    asvId: 'ASV_031',
    sequence: 'TACGTAGGGTGCGAGCGTTGTCCGGATTTATTGGGCGTAAAGGGCTCGTAGGCGGTTCGTCGCGTCCGGTGTGAAAGTCCATCGCTTAACGGTGGATCTGCGCCCGGTACGGGCGGGCTGGAGTGCGGTAGGGGAGACTGGAATTCCCGGTGTAACGGTGGAATGTGTAGATATCGGGAAGAACACCAACGGCGAAGGCAGGTCTCTGGGCCGTTACTGACGCTGA',
    length: 253, gcPercent: 57.1, kingdom: 'Bacteria', phylum: 'Actinomycetota', classTaxa: 'Actinomycetes', order: 'Bifidobacteriales', family: 'Bifidobacteriaceae', genus: 'Bifidobacterium', species: 'Bifidobacterium longum', confidence: 0.99
  },
  {
    asvId: 'ASV_032',
    sequence: 'TACGTAGGGGGCAAGCGTTATCCGGATTTACTGGGTGTAAAGGGAGCGTAGGCGGTCTTTTAAGTCTGATGTGAAAGCCCACGGCTCAACCGTGGAGGGTCATTGGAAACTGGAAGACTTGAGTGCAGAAGAGGAGAGTGGAACTCCTGGTGTAGCGGTGAAATGCGTAGATATCAGGAGGAACACCGGTGGCGAAGGCGGCTCTCTGGTCTGTAACTGACGCTGAG',
    length: 253, gcPercent: 51.6, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Ruminococcaceae', genus: 'Faecalibacterium', species: 'Faecalibacterium duncaniae', confidence: 0.98
  },
];

/**
 * Seed pool of 22 Operational Taxonomic Units (97% identity centroids)
 */
const DYNAMIC_OTU_POOL: Omit<OTURecord, 'sampleCounts' | 'totalReads' | 'relativeAbundance'>[] = [
  {
    otuId: 'OTU_001',
    centroidSequence: DYNAMIC_ASV_POOL[0].sequence,
    length: 253, gcPercent: 51.4, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Ruminococcaceae', genus: 'Faecalibacterium', species: 'Faecalibacterium prausnitzii cluster', confidence: 0.99, memberAsvs: ['ASV_001', 'ASV_032']
  },
  {
    otuId: 'OTU_002',
    centroidSequence: DYNAMIC_ASV_POOL[1].sequence,
    length: 253, gcPercent: 47.8, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Bacteroidaceae', genus: 'Bacteroides', species: 'Bacteroides thetaiotaomicron/vulgatus cluster', confidence: 0.98, memberAsvs: ['ASV_002', 'ASV_004', 'ASV_026']
  },
  {
    otuId: 'OTU_003',
    centroidSequence: DYNAMIC_ASV_POOL[2].sequence,
    length: 253, gcPercent: 54.2, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Pseudomonadota', classTaxa: 'Gammaproteobacteria', order: 'Enterobacterales', family: 'Enterobacteriaceae', genus: 'Escherichia-Shigella', species: 'Escherichia coli centroid', confidence: 0.96, memberAsvs: ['ASV_003']
  },
  {
    otuId: 'OTU_004',
    centroidSequence: DYNAMIC_ASV_POOL[4].sequence,
    length: 253, gcPercent: 52.6, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Verrucomicrobiota', classTaxa: 'Verrucomicrobiae', order: 'Verrucomicrobiales', family: 'Akkermansiaceae', genus: 'Akkermansia', species: 'Akkermansia muciniphila centroid', confidence: 0.99, memberAsvs: ['ASV_005']
  },
  {
    otuId: 'OTU_005',
    centroidSequence: DYNAMIC_ASV_POOL[5].sequence,
    length: 253, gcPercent: 57.7, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Actinomycetota', classTaxa: 'Actinomycetes', order: 'Bifidobacteriales', family: 'Bifidobacteriaceae', genus: 'Bifidobacterium', species: 'Bifidobacterium spp. cluster', confidence: 0.98, memberAsvs: ['ASV_006', 'ASV_031']
  },
  {
    otuId: 'OTU_006',
    centroidSequence: DYNAMIC_ASV_POOL[6].sequence,
    length: 253, gcPercent: 52.2, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Lachnospirales', family: 'Lachnospiraceae', genus: 'Roseburia-Blautia cluster', species: 'Lachnospiraceae spp.', confidence: 0.95, memberAsvs: ['ASV_007', 'ASV_009', 'ASV_018']
  },
  {
    otuId: 'OTU_007',
    centroidSequence: DYNAMIC_ASV_POOL[7].sequence,
    length: 253, gcPercent: 49.0, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Prevotellaceae', genus: 'Prevotella', species: 'Prevotella copri centroid', confidence: 0.94, memberAsvs: ['ASV_008']
  },
  {
    otuId: 'OTU_008',
    centroidSequence: DYNAMIC_ASV_POOL[9].sequence,
    length: 253, gcPercent: 48.6, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Tannerellaceae', genus: 'Parabacteroides', species: 'Parabacteroides cluster', confidence: 0.93, memberAsvs: ['ASV_010', 'ASV_027']
  },
  {
    otuId: 'OTU_009',
    centroidSequence: DYNAMIC_ASV_POOL[10].sequence,
    length: 253, gcPercent: 50.1, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Bacilli', order: 'Lactobacillales', family: 'Lactobacillaceae', genus: 'Lactobacillus', species: 'Lactobacillus acidophilus centroid', confidence: 0.97, memberAsvs: ['ASV_011']
  },
  {
    otuId: 'OTU_010',
    centroidSequence: DYNAMIC_ASV_POOL[11].sequence,
    length: 253, gcPercent: 49.8, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Bacilli', order: 'Lactobacillales', family: 'Streptococcaceae', genus: 'Streptococcus', species: 'Streptococcus cluster', confidence: 0.96, memberAsvs: ['ASV_012']
  },
  {
    otuId: 'OTU_011',
    centroidSequence: DYNAMIC_ASV_POOL[12].sequence,
    length: 253, gcPercent: 53.4, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Eubacteriales', family: 'Clostridiaceae', genus: 'Clostridium', species: 'Clostridium cluster', confidence: 0.98, memberAsvs: ['ASV_013']
  },
  {
    otuId: 'OTU_012',
    centroidSequence: DYNAMIC_ASV_POOL[13].sequence,
    length: 253, gcPercent: 55.0, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Negativicutes', order: 'Veillonellales', family: 'Veillonellaceae', genus: 'Veillonella-Dialister cluster', species: 'Veillonellaceae spp.', confidence: 0.94, memberAsvs: ['ASV_014', 'ASV_020']
  },
  {
    otuId: 'OTU_013',
    centroidSequence: DYNAMIC_ASV_POOL[14].sequence,
    length: 253, gcPercent: 51.0, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Ruminococcaceae', genus: 'Ruminococcus', species: 'Ruminococcus bromii centroid', confidence: 0.97, memberAsvs: ['ASV_015']
  },
  {
    otuId: 'OTU_014',
    centroidSequence: DYNAMIC_ASV_POOL[15].sequence,
    length: 253, gcPercent: 48.9, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Bacilli', order: 'Lactobacillales', family: 'Enterococcaceae', genus: 'Enterococcus', species: 'Enterococcus faecalis centroid', confidence: 0.99, memberAsvs: ['ASV_016']
  },
  {
    otuId: 'OTU_015',
    centroidSequence: DYNAMIC_ASV_POOL[16].sequence,
    length: 253, gcPercent: 47.1, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Rikenellaceae', genus: 'Alistipes', species: 'Alistipes putredinis centroid', confidence: 0.95, memberAsvs: ['ASV_017']
  },
  {
    otuId: 'OTU_016',
    centroidSequence: DYNAMIC_ASV_POOL[18].sequence,
    length: 253, gcPercent: 56.1, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Pseudomonadota', classTaxa: 'Betaproteobacteria', order: 'Burkholderiales', family: 'Sutterellaceae', genus: 'Sutterella', species: 'Sutterella wadsworthensis centroid', confidence: 0.93, memberAsvs: ['ASV_019']
  },
  {
    otuId: 'OTU_017',
    centroidSequence: DYNAMIC_ASV_POOL[20].sequence,
    length: 253, gcPercent: 51.9, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Eubacteriales', family: 'Eubacteriaceae', genus: 'Eubacterium', species: 'Eubacterium rectale centroid', confidence: 0.98, memberAsvs: ['ASV_021']
  },
  {
    otuId: 'OTU_018',
    centroidSequence: DYNAMIC_ASV_POOL[21].sequence,
    length: 253, gcPercent: 53.2, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Negativicutes', order: 'Acidaminococcales', family: 'Acidaminococcaceae', genus: 'Phascolarctobacterium', species: 'Phascolarctobacterium faecium centroid', confidence: 0.95, memberAsvs: ['ASV_022']
  },
  {
    otuId: 'OTU_019',
    centroidSequence: DYNAMIC_ASV_POOL[22].sequence,
    length: 253, gcPercent: 46.8, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacteroidota', classTaxa: 'Bacteroidia', order: 'Bacteroidales', family: 'Odoribacteraceae', genus: 'Odoribacter-Barnesiella cluster', species: 'Bacteroidales spp.', confidence: 0.95, memberAsvs: ['ASV_023', 'ASV_024']
  },
  {
    otuId: 'OTU_020',
    centroidSequence: DYNAMIC_ASV_POOL[24].sequence,
    length: 253, gcPercent: 53.9, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Oscillospirales', family: 'Oscillospiraceae', genus: 'Oscillibacter', species: 'Oscillibacter valericigenes centroid', confidence: 0.93, memberAsvs: ['ASV_025']
  },
  {
    otuId: 'OTU_021',
    centroidSequence: DYNAMIC_ASV_POOL[27].sequence,
    length: 253, gcPercent: 51.5, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Bacillota', classTaxa: 'Clostridia', order: 'Christensenellales', family: 'Christensenellaceae', genus: 'Christensenella', species: 'Christensenella minutissima centroid', confidence: 0.96, memberAsvs: ['ASV_028']
  },
  {
    otuId: 'OTU_022',
    centroidSequence: DYNAMIC_ASV_POOL[28].sequence,
    length: 253, gcPercent: 61.2, identityCutoff: 0.97, kingdom: 'Bacteria', phylum: 'Actinomycetota', classTaxa: 'Coriobacteriia', order: 'Coriobacteriales', family: 'Coriobacteriaceae', genus: 'Collinsella', species: 'Collinsella aerofaciens centroid', confidence: 0.97, memberAsvs: ['ASV_029']
  },
];

/**
 * Builds realistic, fully-populated pipeline results (QC, ASVs, OTUs, Diversity)
 * scaled dynamically to any uploaded user sample set.
 */
export function buildPipelineResultsForSamples(
  samples: SampleMetadata[],
  config: PipelineConfig,
  runId?: string,
  datasetName?: string
): PipelineRunResults {
  if (!samples || samples.length === 0) {
    return {
      runId: runId || 'WORKSPACE-CUSTOM',
      datasetName: datasetName || 'Custom Sequencing Project',
      timestamp: new Date().toISOString(),
      config,
      samples: [],
      qc: {
        ...GUT_MICROBIOME_DATASET.qc,
        totalRawReads: 0,
        totalCleanReads: 0,
      },
      asvs: [],
      otus: [],
      diversity: {
        distanceMetric: 'Bray-Curtis',
        varianceExplained: [0, 0, 0],
        alpha: [],
        beta: [],
      },
      otuDiversity: {
        distanceMetric: 'Bray-Curtis',
        varianceExplained: [0, 0, 0],
        alpha: [],
        beta: [],
      },
    };
  }

  const actualSamples: SampleMetadata[] = samples;

  // 1. DETERMINISTIC SEEDING (Ensure same input produces same result)
  const seedString = actualSamples.map(s => `${s.name}-${s.fileR1}`).join('|') + (datasetName || '');
  const getSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };
  const seed = getSeed(seedString);
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // 2. STABLE SUB-SAMPLING based on seed
  const asvCount = 20 + Math.floor(pseudoRandom(1) * 13); // 20-32
  const selectedAsvs = [...DYNAMIC_ASV_POOL]
    .sort((a, b) => pseudoRandom(getSeed(a.asvId)) - pseudoRandom(getSeed(b.asvId)))
    .slice(0, asvCount);

  const otuCount = 10 + Math.floor(pseudoRandom(2) * 13); // 10-22
  const selectedOtus = [...DYNAMIC_OTU_POOL]
    .sort((a, b) => pseudoRandom(getSeed(a.otuId)) - pseudoRandom(getSeed(b.otuId)))
    .slice(0, otuCount);

  const totalRawReads = actualSamples.reduce((acc, s) => acc + (s.rawReads || 85000), 0);
  const totalCleanReads = actualSamples.reduce((acc, s) => acc + (s.nonChimericReads || 69000), 0);

  // 2. GENERATE DYNAMIC ASV READ COUNTS
  const asvs: ASVRecord[] = selectedAsvs.map((asvSeed, asvIdx) => {
    const sampleCounts: Record<string, number> = {};
    let totalAsvReads = 0;
    
    // Vary weights randomly per run
    const baseWeight = (0.15 / (asvIdx + 1)) * (0.8 + pseudoRandom(asvIdx + 100) * 0.4);

    actualSamples.forEach((sample, sampleIdx) => {
      const sampleCleanReads = sample.nonChimericReads || Math.round(totalCleanReads / actualSamples.length);
      const isTreatment = sample.group.toLowerCase().includes('treat') || sampleIdx % 2 === 1;
      
      // Artificial biological signal
      const biologicalFactor = isTreatment ? (asvIdx % 2 === 0 ? 1.5 : 0.5) : 1.0;
      const noise = 0.85 + pseudoRandom(asvIdx + sampleIdx + 500) * 0.3;
      
      const count = Math.max(8, Math.round(sampleCleanReads * baseWeight * biologicalFactor * noise));
      sampleCounts[sample.id] = count;
      totalAsvReads += count;
    });

    return {
      ...asvSeed,
      asvId: `ASV_${(asvIdx + 1).toString().padStart(3, '0')}`,
      sampleCounts,
      totalReads: totalAsvReads,
      relativeAbundance: Number(((totalAsvReads / Math.max(1, totalCleanReads)) * 100).toFixed(2)),
    };
  }).sort((a, b) => a.asvId.localeCompare(b.asvId, undefined, { numeric: true, sensitivity: 'base' }));

  // 4. GENERATE DYNAMIC OTU READ COUNTS (aggregated from their member ASVs)
  const otus: OTURecord[] = selectedOtus.map((otuSeed, otuIdx) => {
    const sampleCounts: Record<string, number> = {};
    let totalOtuReads = 0;

    actualSamples.forEach((sample) => {
      let sum = 0;
      otuSeed.memberAsvs.forEach(asvId => {
        // Find by index since we re-indexed asvs
        const asvIdxInSeed = DYNAMIC_ASV_POOL.findIndex(a => a.asvId === asvId);
        const foundAsv = asvs.find(a => a.sequence === DYNAMIC_ASV_POOL[asvIdxInSeed]?.sequence);
        if (foundAsv && foundAsv.sampleCounts[sample.id]) {
          sum += foundAsv.sampleCounts[sample.id];
        }
      });

      if (sum === 0) {
        sum = Math.max(12, Math.round((sample.nonChimericReads || 60000) * (0.01 + pseudoRandom(otuIdx + 1000) * 0.02)));
      }

      sampleCounts[sample.id] = sum;
      totalOtuReads += sum;
    });

    return {
      ...otuSeed,
      otuId: `OTU_${(otuIdx + 1).toString().padStart(3, '0')}`,
      sampleCounts,
      totalReads: totalOtuReads,
      relativeAbundance: Number(((totalOtuReads / Math.max(1, totalCleanReads)) * 100).toFixed(2)),
    };
  }).sort((a, b) => a.otuId.localeCompare(b.otuId, undefined, { numeric: true, sensitivity: 'base' }));

  // 5. GENERATE DYNAMIC ALPHA DIVERSITY
  const alpha = actualSamples.map((sample, idx) => {
    const isTreatment = sample.group.toLowerCase().includes('treat') || idx % 2 === 1;
    const baseShannon = 3.5 + pseudoRandom(idx + 2000) * 0.8;
    const effect = isTreatment ? -0.4 * pseudoRandom(idx + 2500) : 0.3 * pseudoRandom(idx + 2500);
    
    return {
      sampleId: sample.id,
      sampleName: sample.name,
      group: sample.group,
      shannon: Number((baseShannon + effect).toFixed(2)),
      simpson: Number((0.92 + pseudoRandom(idx + 3000) * 0.06).toFixed(2)),
      chao1: Math.round(250 + pseudoRandom(idx + 3500) * 150 + (isTreatment ? -40 : 40)),
      observedASVs: Math.round(220 + pseudoRandom(idx + 4000) * 120 + (isTreatment ? -35 : 35)),
      faithPD: Number((18.5 + pseudoRandom(idx + 4500) * 8).toFixed(1)),
    };
  });

  // 6. GENERATE DYNAMIC BETA DIVERSITY
  const beta = actualSamples.map((sample, idx) => {
    const isTreatment = sample.group.toLowerCase().includes('treat') || idx % 2 === 1;
    const pc1Base = isTreatment ? 0.35 : -0.35;
    const jitter = (off: number) => (pseudoRandom(idx + off + 5000) - 0.5) * 0.25;
    
    return {
      sampleId: sample.id,
      sampleName: sample.name,
      group: sample.group,
      pc1: Number((pc1Base + jitter(1)).toFixed(2)),
      pc2: Number((jitter(2) * 1.5).toFixed(2)),
      pc3: Number((jitter(3) * 1.2).toFixed(2)),
    };
  });

  // 7. GENERATE DYNAMIC QC CURVES
  const meanPhredBefore = Number((26 + pseudoRandom(6000) * 4).toFixed(1));
  const meanPhredAfter = Number((34 + pseudoRandom(6500) * 3).toFixed(1));

  const title = datasetName || `${actualSamples.length} Uploaded FASTQ Samples (${actualSamples.map(s => s.name).slice(0, 3).join(', ')}${actualSamples.length > 3 ? '...' : ''})`;

  return {
    runId: runId || `RUN-${Date.now().toString().slice(-6)}`,
    datasetName: title,
    timestamp: new Date().toISOString(),
    config,
    samples: actualSamples,
    qc: {
      totalRawReads,
      totalCleanReads,
      rawQuality: generateQualityCurve(false),
      trimmedQuality: generateQualityCurve(true),
      gcDistribution: generateGcDistribution(),
      adapterBefore: generateAdapterProfile(false),
      adapterAfter: generateAdapterProfile(true),
      meanPhredBefore,
      meanPhredAfter,
      duplicationRate: Number((8 + pseudoRandom(7000) * 12).toFixed(1)),
    },
    asvs,
    otus,
    diversity: {
      distanceMetric: 'Bray-Curtis',
      varianceExplained: [Number((40 + pseudoRandom(8000) * 15).toFixed(1)), Number((20 + pseudoRandom(8500) * 10).toFixed(1)), Number((8 + pseudoRandom(9000) * 5).toFixed(1))],
      alpha,
      beta,
    },
    otuDiversity: {
      distanceMetric: 'Bray-Curtis',
      varianceExplained: [Number((35 + pseudoRandom(9500) * 15).toFixed(1)), Number((18 + pseudoRandom(10000) * 10).toFixed(1)), Number((7 + pseudoRandom(10500) * 5).toFixed(1))],
      alpha,
      beta,
    },
  };
}


