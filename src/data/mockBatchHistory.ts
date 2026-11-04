import { BatchHistoryRecord } from '../types/batchHistory';

export const mockBatchHistory: BatchHistoryRecord[] = [
  {
    runId: 'RUN-SOIL-2026-0419',
    timestamp: '2026-04-19 14:30:00',
    status: 'completed',
    totalSamples: 6,
    configSummary: 'DADA2, SILVA138',
    outputFiles: {
      asvTableUrl: '/downloads/run-soil-0419-asv.tsv',
      reportUrl: '/reports/run-soil-0419-report.html',
      cleanedFastqDir: '/data/run-soil-0419/cleaned',
    },
    metrics: {
      cleanReads: 1250000,
      asvCount: 450,
      otuCount: 380,
    },
  },
  {
    runId: 'RUN-GUT-2026-0212',
    timestamp: '2026-02-12 09:15:00',
    status: 'completed',
    totalSamples: 12,
    configSummary: 'Deblur, Greengenes2',
    outputFiles: {
      asvTableUrl: '/downloads/run-gut-0212-asv.tsv',
      reportUrl: '/reports/run-gut-0212-report.html',
      cleanedFastqDir: '/data/run-gut-0212/cleaned',
    },
    metrics: {
      cleanReads: 2800000,
      asvCount: 820,
      otuCount: 710,
    },
  },
  {
    runId: 'RUN-SOIL-2026-0520',
    timestamp: '2026-05-20 11:00:00',
    status: 'error',
    totalSamples: 4,
    configSummary: 'DADA2, SILVA138',
    outputFiles: {
      asvTableUrl: '',
      reportUrl: '',
      cleanedFastqDir: '',
    },
    metrics: {
      cleanReads: 0,
      asvCount: 0,
      otuCount: 0,
    },
    errorMessage: 'Pipeline failed: FastQC error on sample SOIL_02_R2.fastq.gz (Invalid file format).',
  },
  {
    runId: 'RUN-BATCH-2026-0601',
    timestamp: '2026-06-01 16:45:00',
    status: 'processing',
    totalSamples: 8,
    configSummary: 'DADA2, SILVA138, Celery Batch',
    outputFiles: {
      asvTableUrl: '',
      reportUrl: '',
      cleanedFastqDir: '',
    },
    metrics: {
      cleanReads: 1420000,
      asvCount: 510,
      otuCount: 440,
    },
  },
];
