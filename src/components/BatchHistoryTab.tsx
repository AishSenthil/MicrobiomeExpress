import React, { useState } from 'react';
import { History, FileDown, FileText, CheckCircle, AlertCircle, Loader, Search } from 'lucide-react';
import { mockBatchHistory } from '../data/mockBatchHistory';

export const BatchHistoryTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = mockBatchHistory.filter(run => 
    run.runId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.timestamp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Batch Run History</h2>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Job ID or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-64 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 text-left">Run ID</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-right">Samples</th>
              <th className="py-3 px-4 text-left">Config</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.map((run) => (
              <tr key={run.runId} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-medium text-slate-900">{run.runId}</td>
                <td className="py-3 px-4 text-slate-600">{run.timestamp}</td>
                <td className="py-3 px-4">
                  <span 
                    title={run.errorMessage}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    run.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    run.status === 'error' ? 'bg-red-50 text-red-700 cursor-help' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {run.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                     run.status === 'error' ? <AlertCircle className="w-3 h-3" /> : <Loader className="w-3 h-3 animate-spin" />}
                    {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">{run.totalSamples}</td>
                <td className="py-3 px-4 text-slate-600 text-xs">{run.configSummary}</td>
                <td className="py-3 px-4 flex justify-center gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
