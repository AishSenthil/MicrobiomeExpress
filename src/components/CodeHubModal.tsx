import React, { useState } from 'react';
import { 
  FileCode2, 
  X, 
  Copy, 
  Check, 
  Download, 
  Folder, 
  File, 
  Terminal, 
  Layers, 
  ExternalLink 
} from 'lucide-react';
import { REPO_FILES, RepoFile } from '../data/repoCodeTemplates';

interface CodeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeHubModal: React.FC<CodeHubModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<RepoFile>(REPO_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (file: RepoFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllBundle = () => {
    // Generate a combined multi-file bash extraction archive
    const archiveScript = `#!/usr/bin/env bash
# ASV Pipeline Code Bundle Extractor
# Run 'bash unpack_pipeline.sh' to reconstruct the repository structure

set -e
echo "Unpacking ASV Pipeline Dashboard repository..."

${REPO_FILES.map(f => {
  return `mkdir -p "$(dirname "${f.path}")"
cat << 'EOF' > "${f.path}"
${f.content}
EOF
echo "Created ${f.path}"`;
}).join('\n\n')}

echo "Successfully extracted all ASV pipeline files!"
`;

    const blob = new Blob([archiveScript], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unpack_asv_pipeline.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'backend', label: 'Backend Wrappers' },
    { id: 'workflow', label: 'Workflows (Snakemake/Nextflow)' },
    { id: 'config', label: 'Config (Conda/YAML)' },
    { id: 'docker', label: 'Docker' },
    { id: 'tests', label: 'Tests' },
  ];

  const filteredFiles = activeCategory === 'all'
    ? REPO_FILES
    : REPO_FILES.filter(f => f.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileCode2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pipeline Repository & Tool Wrappers
              </h2>
              <p className="text-xs text-slate-500">
                Production-grade Python wrappers, DADA2 R script, Snakemake & Nextflow workflows, Conda env, and Dockerfile.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadAllBundle}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Download executable script that unpacks the full repository tree"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Pipeline Package (.sh)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left File Tree + Right Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0">
            {/* Category filter pills */}
            <div className="p-2 border-b border-slate-200 bg-white">
              <div className="flex flex-wrap gap-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                      activeCategory === c.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredFiles.map((f) => {
                const isSelected = selectedFile.path === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <File className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className="truncate">
                      <div className="truncate leading-tight">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{f.path}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Repo Structure Guide */}
            <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-500">
              <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-blue-500" /> Repository Structure
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Standard Nextflow & Snakemake modular layout with containerized bioconda environment.
              </p>
            </div>
          </div>

          {/* Right Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono uppercase">
                  {selectedFile.language}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Description bar */}
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[11px] text-slate-400 shrink-0">
              {selectedFile.description}
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 select-text">
              <pre>
                <code>
                  {selectedFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row">
                      <span className="table-cell select-none text-slate-600 text-right pr-4 w-8 font-mono text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="table-cell whitespace-pre">
                        {line}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
