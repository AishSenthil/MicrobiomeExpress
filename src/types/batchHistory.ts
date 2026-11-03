export interface BatchHistoryRecord {
  runId: string;
  timestamp: string;
  status: 'completed' | 'error' | 'processing';
  totalSamples: number;
  configSummary: string; // e.g. "DADA2, SILVA138"
  outputFiles: {
    asvTableUrl: string;
    reportUrl: string;
    cleanedFastqDir: string;
  };
  metrics: {
    cleanReads: number;
    asvCount: number;
    otuCount: number;
  };
  errorMessage?: string;
}
