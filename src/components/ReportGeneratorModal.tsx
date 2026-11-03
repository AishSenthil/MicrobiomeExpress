import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  BarChart2, 
  Compass, 
  Table, 
  Dna,
  ShieldCheck
} from 'lucide-react';
import { PipelineRunResults } from '../types/pipeline';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: PipelineRunResults;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  dataset,
}) => {
  if (!isOpen) return null;

  const generateReportHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Microbiome ASV Analysis Report - ${dataset.runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 10px; font-size: 26px; }
    h2 { color: #0369a1; margin-top: 30px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 20px 0; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .metric-val { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; font-family: monospace; }
    .metric-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #334155; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <h1>Microbiome ASV & OTU Analysis Report</h1>
  <p><strong>Run ID:</strong> ${dataset.runId} | <strong>Generated:</strong> ${dataset.timestamp} | <span class="badge">DADA2 & VSEARCH 97% OTU</span></p>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-lbl">Total Samples</div>
      <div class="metric-val">${dataset.samples.length}</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Raw Reads</div>
      <div class="metric-val">${dataset.qc.totalRawReads.toLocaleString()}</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Clean Reads</div>
      <div class="metric-val">${dataset.qc.totalCleanReads.toLocaleString()}</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Exact ASVs</div>
      <div class="metric-val" style="color: #0284c7;">${dataset.asvs.length}</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">97% OTUs</div>
      <div class="metric-val" style="color: #0d9488;">${dataset.otus.length}</div>
    </div>
  </div>

  <h2>1. Workflow Configuration & Tool Provenance</h2>
  <table>
    <tr><th>Pipeline Step</th><th>Tool</th><th>Version</th><th>Parameters</th></tr>
    <tr><td>Quality Control</td><td>FastQC</td><td>v0.12.1</td><td>Per-base Phred threshold Q${dataset.config.phredCutoff}</td></tr>
    <tr><td>Primer & Adapter Trimming</td><td>Cutadapt</td><td>v4.4</td><td>F: ${dataset.config.forwardPrimer}, R: ${dataset.config.reversePrimer}</td></tr>
    <tr><td>Denoising & Error Learning</td><td>DADA2</td><td>v1.28.0</td><td>truncLenF=${dataset.config.truncLenF}, truncLenR=${dataset.config.truncLenR}, maxEE=[${dataset.config.maxEEF}, ${dataset.config.maxEER}]</td></tr>
    <tr><td>Chimera Detection</td><td>DADA2</td><td>v1.28.0</td><td>Method: ${dataset.config.chimeraMethod}</td></tr>
    <tr><td>OTU Clustering</td><td>VSEARCH</td><td>v2.22.1</td><td>Algorithm: cluster_fast, Identity: ${dataset.config.otuIdentity * 100}%</td></tr>
    <tr><td>Taxonomy Classification</td><td>SILVA</td><td>138.1</td><td>Confidence Threshold: ${dataset.config.confidenceThreshold * 100}%</td></tr>
  </table>

  <h2>2. Read Retention by Sample</h2>
  <table>
    <tr><th>Sample ID</th><th>Group</th><th>Raw Reads</th><th>Trimmed</th><th>Denoised</th><th>Non-Chimeric</th><th>Retention</th></tr>
    ${dataset.samples.map(s => `
      <tr>
        <td>${s.name}</td>
        <td style="font-family: sans-serif;">${s.group}</td>
        <td>${s.rawReads.toLocaleString()}</td>
        <td>${s.trimmedReads.toLocaleString()}</td>
        <td>${s.denoisedReads.toLocaleString()}</td>
        <td><strong>${s.nonChimericReads.toLocaleString()}</strong></td>
        <td>${s.retainedPercent}%</td>
      </tr>
    `).join('')}
  </table>

  <h2>3. Top Amplicon Sequence Variants (ASVs)</h2>
  <table>
    <tr><th>ASV ID</th><th>Phylum</th><th>Genus & Species</th><th>Confidence</th><th>Total Reads</th><th>Rel. Abundance</th></tr>
    ${dataset.asvs.slice(0, 8).map(a => `
      <tr>
        <td><strong>${a.asvId}</strong></td>
        <td style="font-family: sans-serif;">${a.phylum}</td>
        <td style="font-family: sans-serif; font-style: italic;">${a.genus} ${a.species}</td>
        <td>${(a.confidence * 100).toFixed(0)}%</td>
        <td>${a.totalReads.toLocaleString()}</td>
        <td>${a.relativeAbundance}%</td>
      </tr>
    `).join('')}
  </table>

  <h2>4. Diversity Summary Metrics</h2>
  <table>
    <tr><th>Sample</th><th>Group</th><th>Shannon</th><th>Simpson</th><th>Chao1</th><th>Observed ASVs</th></tr>
    ${dataset.diversity.alpha.map(d => `
      <tr>
        <td>${d.sampleName}</td>
        <td style="font-family: sans-serif;">${d.group}</td>
        <td>${d.shannon.toFixed(2)}</td>
        <td>${d.simpson.toFixed(2)}</td>
        <td>${d.chao1}</td>
        <td>${d.observedASVs}</td>
      </tr>
    `).join('')}
  </table>

  <div class="footer">
    Generated automatically by ASV Pipeline Studio • Reproducible Microbiome Analytics
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReportHtml());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateReportHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Microbiome_Report_${dataset.runId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Comprehensive Pipeline Report</h2>
              <p className="text-xs text-slate-500">Run ID: {dataset.runId} • Generated {dataset.timestamp}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body (Styled for Publication & Printable) */}
        <div className="p-8 space-y-6 text-xs text-slate-700 print:p-0">
          {/* Executive Header Banner */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Microbiome ASV Analysis
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-2">
                  16S rRNA Amplicon Sequence Variant Pipeline Report
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated processing via FastQC, Cutadapt, DADA2 error inference, and SILVA 138.1 taxonomic classification.
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs font-semibold text-slate-800">{dataset.runId}</div>
                <div className="text-[11px] text-slate-400">{dataset.timestamp}</div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Samples Analyzed</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {dataset.samples.length}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Raw Reads Input</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {dataset.qc.totalRawReads.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Clean Reads</div>
                <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">
                  {dataset.qc.totalCleanReads.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-blue-600 uppercase">100% ASVs</div>
                <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                  {dataset.asvs.length}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-teal-200 bg-teal-50/30 text-center">
                <div className="text-[10px] font-bold text-teal-700 uppercase">97% OTUs</div>
                <div className="text-base font-bold text-teal-700 font-mono mt-0.5">
                  {dataset.otus.length}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Tool Provenance */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              1. Software Versions & Pipeline Parameters
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Pipeline Step</th>
                    <th className="py-2 px-3">Software Tool</th>
                    <th className="py-2 px-3">Version</th>
                    <th className="py-2 px-3">Applied Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Raw Quality Control</td>
                    <td className="py-2 px-3 font-mono">FastQC</td>
                    <td className="py-2 px-3 font-mono">v0.12.1</td>
                    <td className="py-2 px-3 text-slate-600">Per-base Phred assessment, adapter check</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Adapter & Primer Trimming</td>
                    <td className="py-2 px-3 font-mono">Cutadapt</td>
                    <td className="py-2 px-3 font-mono">v4.4</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      -q {dataset.config.phredCutoff} -m {dataset.config.minReadLength} (Primers trimmed)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Denoising & Error Inference</td>
                    <td className="py-2 px-3 font-mono">DADA2</td>
                    <td className="py-2 px-3 font-mono">v1.28.0</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      truncLen=[{dataset.config.truncLenF}, {dataset.config.truncLenR}], maxEE=[{dataset.config.maxEEF}, {dataset.config.maxEER}]
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Chimera Removal</td>
                    <td className="py-2 px-3 font-mono">DADA2 / VSEARCH</td>
                    <td className="py-2 px-3 font-mono">v1.28.0</td>
                    <td className="py-2 px-3 text-slate-600">Method: {dataset.config.chimeraMethod}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">OTU Clustering (97%)</td>
                    <td className="py-2 px-3 font-mono">VSEARCH</td>
                    <td className="py-2 px-3 font-mono">v2.22.1</td>
                    <td className="py-2 px-3 text-teal-700 font-mono text-[11px]">cluster_fast --id {dataset.config.otuIdentity}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Taxonomic Classification</td>
                    <td className="py-2 px-3 font-mono">SILVA RDP Classifier</td>
                    <td className="py-2 px-3 font-mono">138.1</td>
                    <td className="py-2 px-3 text-slate-600">Min bootstrap confidence: {dataset.config.confidenceThreshold * 100}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Sample Read Tracking Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-blue-600" />
              2. Read Count Survival Across Pipeline Steps
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Sample</th>
                    <th className="py-2 px-3">Condition</th>
                    <th className="py-2 px-3 text-right">Raw Reads</th>
                    <th className="py-2 px-3 text-right">Trimmed</th>
                    <th className="py-2 px-3 text-right">Denoised</th>
                    <th className="py-2 px-3 text-right">Non-Chimeric ASVs</th>
                    <th className="py-2 px-3 text-right">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dataset.samples.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                      <td className="py-2 px-3 font-sans text-slate-600">{s.group}</td>
                      <td className="py-2 px-3 text-right">{s.rawReads.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{s.trimmedReads.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{s.denoisedReads.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {s.nonChimericReads.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                        {s.retainedPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Alpha & Beta Diversity Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              3. Diversity Analysis Summary
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Sample</th>
                    <th className="py-2 px-3">Group</th>
                    <th className="py-2 px-3 text-right">Shannon Index</th>
                    <th className="py-2 px-3 text-right">Simpson Index</th>
                    <th className="py-2 px-3 text-right">Chao1 Richness</th>
                    <th className="py-2 px-3 text-right">Observed ASVs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dataset.diversity.alpha.map((a) => (
                    <tr key={a.sampleId}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{a.sampleName}</td>
                      <td className="py-2 px-3 font-sans text-slate-600">{a.group}</td>
                      <td className="py-2 px-3 text-right">{a.shannon.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{a.simpson.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{a.chao1}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{a.observedASVs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sticky bottom-0 print:hidden">
          <span className="text-xs text-slate-500">
            Export or print this report for peer-reviewed publication supplementary material.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
