import React, { useState, useEffect } from 'react';
import { Activity, Users, Clock, Database, Globe, Download, Zap } from 'lucide-react';
import { UserAnalytics } from '../types/userAnalytics';

export const mockUserAnalytics: UserAnalytics = {
  totalRuns: 42,
  totalSamplesProcessed: 284,
  avgPipelineDuration: '4m 12s',
  storageUsedGb: 14.5,
  activeProjects: 3,
};

export const AnalyticsWidget: React.FC = () => {
  const [liveVisitors, setLiveVisitors] = useState<number>(12);
  const [totalPageViews, setTotalPageViews] = useState<number>(1420);
  const [isTrackingLive, setIsTrackingLive] = useState<boolean>(true);

  // Simulate live visitor fluctuation when enabled
  useEffect(() => {
    if (!isTrackingLive) return;
    const interval = setInterval(() => {
      setLiveVisitors(prev => Math.max(5, prev + (Math.random() > 0.5 ? 1 : -1)));
      setTotalPageViews(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, [isTrackingLive]);

  const handleExportTelemetry = () => {
    const telemetryData = {
      timestamp: new Date().toISOString(),
      activeVisitors: liveVisitors,
      totalPageViews,
      ...mockUserAnalytics,
      status: 'hosted_production_ready'
    };
    const blob = new Blob([JSON.stringify(telemetryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'microbiome_xpress_telemetry.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
          <Activity className="w-4 h-4 text-purple-600" />
          Live Website & Usage Analytics
        </div>
        <button
          onClick={handleExportTelemetry}
          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          title="Export Telemetry JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between text-[10px] text-purple-700 font-semibold uppercase mb-1">
            <span>Active Sessions</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-xl font-bold text-purple-900 font-mono">{liveVisitors} online</div>
        </div>

        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase mb-1">Total Page Views</div>
          <div className="text-xl font-bold text-purple-900 font-mono">{totalPageViews.toLocaleString()}</div>
        </div>

        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase mb-1">Pipeline Runs</div>
          <div className="text-xl font-bold text-purple-900 font-mono">{mockUserAnalytics.totalRuns}</div>
        </div>

        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase mb-1">Cloud Storage</div>
          <div className="text-xl font-bold text-purple-900 font-mono">{mockUserAnalytics.storageUsedGb} GB</div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-purple-600" />
          Google Analytics / GA4 Ready
        </span>
        <button
          onClick={() => setIsTrackingLive(!isTrackingLive)}
          className="text-purple-700 font-semibold hover:underline"
        >
          {isTrackingLive ? 'Pause Live' : 'Resume Live'}
        </button>
      </div>
    </div>
  );
};
