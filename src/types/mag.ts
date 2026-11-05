export interface MAGRecord {
  binId: string;
  assignedName: string;
  gtdbTaxonomy: {
    domain: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  completeness: number; // e.g. 96.5%
  contamination: number; // e.g. 1.2%
  strainHeterogeneity: number; // e.g. 0.0%
  genomeSizeMb: number; // e.g. 3.42 Mb
  gcContent: number; // e.g. 46.5%
  contigCount: number; // e.g. 84
  n50: number; // e.g. 145000 bp
  qualityTier: 'High Quality' | 'Medium Quality' | 'Low Quality';
  sampleSource: string;
  sampleAbundances: Record<string, number>; // Map of sample ID to abundance %
}

export interface MAGAnalysisResults {
  totalReadsProcessed: number;
  totalAssembledContigs: number;
  totalBinsRecovered: number;
  highQualityBinsCount: number;
  bins: MAGRecord[];
}
