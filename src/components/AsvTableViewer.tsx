import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Dna,
  FileSpreadsheet,
  ChevronRight,
  GitMerge,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { ASVRecord, OTURecord, SampleMetadata } from '../types/pipeline';

interface AsvTableViewerProps {
  asvs: ASVRecord[];
  otus: OTURecord[];
  samples: SampleMetadata[];
  activeMode: 'ASV' | 'OTU';
  onChangeMode: (mode: 'ASV' | 'OTU') => void;
  onDownloadTsv: (mode: 'ASV' | 'OTU') => void;
  onDownloadBiom: (mode: 'ASV' | 'OTU') => void;
  onDownloadFasta: (mode: 'ASV' | 'OTU') => void;
  onDownloadMap?: () => void;
}

export const AsvTableViewer: React.FC<AsvTableViewerProps> = ({
  asvs,
  otus,
  samples,
  activeMode,
  onChangeMode,
  onDownloadTsv,
  onDownloadBiom,
  onDownloadFasta,
  onDownloadMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhylum, setSelectedPhylum] = useState<string>('all');
  const [minAbundance, setMinAbundance] = useState<number>(0);
  const [inspectingItem, setInspectingItem] = useState<ASVRecord | OTURecord | null>(null);
  const [copiedSeq, setCopiedSeq] = useState(false);

  const isOtu = activeMode === 'OTU';
  const currentList = isOtu ? otus : asvs;

  // Unique phyla for filter dropdown
  const uniquePhyla = useMemo(() => {
    return Array.from(new Set(currentList.map(a => a.phylum))).filter(Boolean);
  }, [currentList]);

  // Filtered and sorted records
  const filteredList = useMemo(() => {
    return currentList.filter(item => {
      const id = isOtu ? (item as OTURecord).otuId : (item as ASVRecord).asvId;
      const seq = isOtu ? (item as OTURecord).centroidSequence : (item as ASVRecord).sequence;

      const matchSearch =
        searchTerm === '' ||
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phylum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seq.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPhylum = selectedPhylum === 'all' || item.phylum === selectedPhylum;
      const matchAbundance = item.totalReads >= minAbundance;

      return matchSearch && matchPhylum && matchAbundance;
    });
  }, [currentList, isOtu, searchTerm, selectedPhylum, minAbundance]);

  const handleCopyFasta = (item: ASVRecord | OTURecord) => {
    const id = isOtu ? (item as OTURecord).otuId : (item as ASVRecord).asvId;
    const seq = isOtu ? (item as OTURecord).centroidSequence : (item as ASVRecord).sequence;
    const fasta = `>${id} | ${item.genus} ${item.species} | ${item.totalReads} reads\n${seq}\n`;
    navigator.clipboard.writeText(fasta);
    setCopiedSeq(true);
    setTimeout(() => setCopiedSeq(false), 2000);
  };

  const getBlastUrl = (seq: string) => {
    return `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn&PAGE_TYPE=BlastSearch&LINK_LOC=blasthome&QUERY=${encodeURIComponent(seq)}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 to-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`p-1.5 rounded-lg border ${isOtu ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              <Table className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isOtu ? 'Operational Taxonomic Unit (OTU) Table' : 'Amplicon Sequence Variant (ASV) Table'}
              </h2>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                isOtu 
                  ? 'bg-teal-50 text-teal-700 border-teal-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isOtu ? '97% Identity (VSEARCH)' : '100% Exact (DADA2)'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOtu 
              ? 'Operational Taxonomic Units clustered at 97% sequence similarity threshold via VSEARCH cluster_fast.' 
              : 'Exact biological sequence variants resolved at single-nucleotide resolution by DADA2 error-rate modeling.'}
          </p>
        </div>

        {/* Resolution Switcher & Export buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ASV vs OTU Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onChangeMode('ASV')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !isOtu
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exact ASVs ({asvs.length})
            </button>
            <button
              onClick={() => onChangeMode('OTU')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isOtu
                  ? 'bg-white text-teal-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              97% OTUs ({otus.length})
            </button>
          </div>

          {/* Export buttons */}
          <button
            onClick={() => onDownloadTsv(activeMode)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download {activeMode} TSV</span>
          </button>
          <button
            onClick={() => onDownloadBiom(activeMode)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>BIOM</span>
          </button>
          <button
            onClick={() => onDownloadFasta(activeMode)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <Dna className="w-3.5 h-3.5 text-purple-600" />
            <span>FASTA</span>
          </button>
          {onDownloadMap && (
            <button
              onClick={onDownloadMap}
              className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
              title="Download ASV to OTU cluster membership map"
            >
              <GitMerge className="w-3.5 h-3.5 text-teal-600" />
              <span>Map TSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Resolution Comparison Insight Banner */}
      <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Resolution Concordance:</strong> {asvs.length} high-resolution biological ASVs collapsed into {otus.length} clusters at 97% sequence identity threshold ({Math.round(((asvs.length - otus.length) / asvs.length) * 100)}% feature consolidation).
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
          <span>ASV Resolution: 100% exact</span>
          <span>•</span>
          <span>OTU Resolution: 97% centroid</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeMode} ID, genus, species, or sequence...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 text-xs"
            />
          </div>

          {/* Phylum Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Phylum:</span>
            <select
              value={selectedPhylum}
              onChange={(e) => setSelectedPhylum(e.target.value)}
              aria-label="Filter by phylum"
              className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Phyla</option>
              {uniquePhyla.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Min Abundance Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Min Reads:</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={minAbundance}
              onChange={(e) => setMinAbundance(Number(e.target.value))}
              aria-label="Filter by minimum read count"
              className="w-20 bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
            />
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Showing <span className="font-bold text-slate-800">{filteredList.length}</span> of {currentList.length} {activeMode}s
        </div>
      </div>

      {/* Interactive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">{activeMode} ID</th>
              {isOtu && <th className="py-3 px-4">Member ASVs</th>}
              <th className="py-3 px-4">Phylum</th>
              <th className="py-3 px-4">Genus & Species</th>
              <th className="py-3 px-4 text-center">Confidence</th>
              <th className="py-3 px-4 text-right">Length</th>
              <th className="py-3 px-4 text-right">GC%</th>
              <th className="py-3 px-4 text-right">Total Reads</th>
              <th className="py-3 px-4 text-right">Rel. Abundance</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredList.map((item) => {
              const id = isOtu ? (item as OTURecord).otuId : (item as ASVRecord).asvId;
              const memberAsvs = isOtu ? (item as OTURecord).memberAsvs : [];

              return (
                <tr
                  key={id}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                    isOtu ? 'hover:bg-teal-50/30' : 'hover:bg-blue-50/30'
                  }`}
                  onClick={() => setInspectingItem(item)}
                >
                  <td className={`py-2.5 px-4 font-bold ${isOtu ? 'text-teal-700' : 'text-blue-700'}`}>
                    {id}
                  </td>
                  {isOtu && (
                    <td className="py-2.5 px-4 font-sans">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {memberAsvs.length} ASV{memberAsvs.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {memberAsvs.join(', ')}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="py-2.5 px-4 font-sans text-slate-700">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.phylum}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <div className="font-semibold text-slate-900 italic">{item.genus}</div>
                    <div className="text-[11px] text-slate-500 italic">{item.species}</div>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">{item.length} bp</td>
                  <td className="py-2.5 px-4 text-right text-slate-600">{item.gcPercent}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {item.totalReads.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 font-sans">
                      <span className="font-mono text-slate-700 font-medium">{item.relativeAbundance}%</span>
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isOtu ? 'bg-teal-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, item.relativeAbundance * 5)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingItem(item);
                      }}
                      className="p-1 rounded-md text-slate-400 group-hover:text-blue-600 hover:bg-blue-100 transition-colors"
                      title={`Inspect ${activeMode} sequence & BLAST`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inspector Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${isOtu ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Dna className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isOtu ? (inspectingItem as OTURecord).otuId : (inspectingItem as ASVRecord).asvId}: {inspectingItem.genus} {inspectingItem.species}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Taxonomy: {inspectingItem.kingdom} &gt; {inspectingItem.phylum} &gt; {inspectingItem.classTaxa} &gt; {inspectingItem.order} &gt; {inspectingItem.family}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member ASVs (for OTU) */}
            {isOtu && (
              <div className="mb-4 p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                <div className="text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4 text-teal-600" />
                  Consolidated Member ASVs ({(inspectingItem as OTURecord).memberAsvs.length} Variants)
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(inspectingItem as OTURecord).memberAsvs.map(asvId => (
                    <span key={asvId} className="px-2 py-0.5 bg-white border border-teal-200 text-teal-800 rounded font-mono text-xs font-semibold shadow-2xs">
                      {asvId} (100% biological variant)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics pills */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Total Reads</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {inspectingItem.totalReads.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Rel. Abundance</div>
                <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                  {inspectingItem.relativeAbundance}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Seq Length</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {inspectingItem.length} bp
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-medium">GC Content</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {inspectingItem.gcPercent}%
                </div>
              </div>
            </div>

            {/* Per-sample distribution */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Sample Abundance Breakdown
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {samples.map((s) => {
                  const count = inspectingItem.sampleCounts[s.id] || 0;
                  return (
                    <div key={s.id} className="p-2 rounded-lg border border-slate-200 bg-slate-50/50 text-center">
                      <div className="text-[10px] font-semibold text-slate-600 truncate">{s.name}</div>
                      <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                        {count.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FASTA Nucleotide Sequence */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  {isOtu ? 'Representative Centroid Sequence (97% cluster center)' : 'Representative Biological Sequence'}
                </span>
                <button
                  onClick={() => handleCopyFasta(inspectingItem)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {copiedSeq ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSeq ? 'Copied FASTA' : 'Copy FASTA'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 break-all leading-relaxed select-all border border-slate-800">
                {isOtu ? (inspectingItem as OTURecord).centroidSequence : (inspectingItem as ASVRecord).sequence}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <a
                href={getBlastUrl(isOtu ? (inspectingItem as OTURecord).centroidSequence : (inspectingItem as ASVRecord).sequence)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>NCBI BLAST 16S Search</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
