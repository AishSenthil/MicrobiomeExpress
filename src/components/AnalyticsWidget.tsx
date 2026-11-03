import React from 'react';
import { Activity, Users, Clock, Database, FolderKanban } from 'lucide-react';
import { UserAnalytics } from '../types/userAnalytics';

export const mockUserAnalytics: UserAnalytics = {
  totalRuns: 42,
  totalSamplesProcessed: 284,
  avgPipelineDuration: '4m 12s',
  storageUsedGb: 14.5,
  activeProjects: 3,
};

export const AnalyticsWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
        <Activity className="w-4 h-4 text-purple-600" />
        User Usage Analytics
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase">Total Runs</div>
          <div className="text-xl font-bold text-purple-900">{mockUserAnalytics.totalRuns}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase">Samples</div>
          <div className="text-xl font-bold text-purple-900">{mockUserAnalytics.totalSamplesProcessed}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase">Avg Time</div>
          <div className="text-lg font-bold text-purple-900">{mockUserAnalytics.avgPipelineDuration}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase">Storage</div>
          <div className="text-xl font-bold text-purple-900">{mockUserAnalytics.storageUsedGb} GB</div>
        </div>
      </div>
    </div>
  );
};
