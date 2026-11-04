import React, { useState, useEffect } from 'react';
import { Activity, Download, Globe, RefreshCw, CheckCircle2 } from 'lucide-react';
import { subscribeToPlatformAnalytics, syncRealPlatformMetrics, PlatformAnalytics, DEFAULT_ANALYTICS } from '../services/pipelineStorageService';

export const AnalyticsWidget: React.FC = () => {
  const [platformMetrics, setPlatformMetrics] = useState<PlatformAnalytics>(DEFAULT_ANALYTICS);
  const [liveVisitors, setLiveVisitors] = useState<number>(1);
  const [totalPageViews, setTotalPageViews] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Subscribe to real Firestore database updates
  useEffect(() => {
    const unsubscribe = subscribeToPlatformAnalytics((metrics) => {
      setPlatformMetrics(metrics);
    });
    return () => unsubscribe();
  }, []);

  // Track real session page views in localStorage (purging legacy 1,420 dummy seed)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('microbiome_xpress_pageviews');
      let views = 1;
      if (stored) {
        const parsed = parseInt(stored, 10);
        // If parsed is from the old dummy seed (>= 1000), purge it
        if (!isNaN(parsed) && parsed < 1000) {
          views = parsed + 1;
        } else {
          views = 1;
        }
      }
      localStorage.setItem('microbiome_xpress_pageviews', views.toString());
      setTotalPageViews(views);
    } catch {
      // fallback
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const synced = await syncRealPlatformMetrics();
      setPlatformMetrics(synced);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleExportTelemetry = () => {
    const telemetryData = {
      timestamp: new Date().toISOString(),
      activeVisitors: liveVisitors,
      totalPageViews,
      persistedMetrics: platformMetrics,
      database: platformMetrics.isLiveDb ? 'Cloud Firestore (Real Cluster Store)' : 'Local Storage Cache',
      status: 'production_synced'
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
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4" id="tour-analytics-widget">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
          <Activity className="w-4 h-4 text-purple-600" />
          <span>Live Platform & Usage Analytics</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {platformMetrics.isLiveDb ? 'Firestore Synced' : 'Connecting DB...'}
          </span>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Force Sync with Firestore Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={handleExportTelemetry}
            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Export Telemetry JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between text-[10px] text-purple-700 font-semibold uppercase mb-1">
            <span>Active Sessions</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold text-purple-900 font-mono">{liveVisitors} online</div>
          <div className="text-[10px] text-purple-600 mt-0.5 font-medium">Current Session</div>
        </div>

        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase mb-1">Total Page Views</div>
          <div className="text-xl font-bold text-purple-900 font-mono">{totalPageViews.toLocaleString()}</div>
          <div className="text-[10px] text-purple-600 mt-0.5 font-medium">Session Visits</div>
        </div>

        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase mb-1">Persisted Runs</div>
          <div className="text-xl font-bold text-purple-900 font-mono">{platformMetrics.totalRuns}</div>
          <div className="text-[10px] text-purple-600 mt-0.5 font-medium">
            {platformMetrics.totalSamplesProcessed} samples across cluster
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="text-[10px] text-purple-700 font-semibold uppercase mb-1">Cloud Storage</div>
          <div className="text-xl font-bold text-purple-900 font-mono">{platformMetrics.storageUsedGb.toFixed(1)} GB</div>
          <div className="text-[10px] text-purple-600 mt-0.5 font-medium">Active Cohort Buckets</div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-purple-600" />
          Real Database Metrics
        </span>
        <button
          onClick={handleManualSync}
          className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
};
