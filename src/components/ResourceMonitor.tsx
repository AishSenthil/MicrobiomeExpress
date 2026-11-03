import React from 'react';
import { Cpu, Database } from 'lucide-react';
import { PipelineStage } from '../types/pipeline';

interface ResourceMonitorProps {
  stages: PipelineStage[];
}

export const ResourceMonitor: React.FC<ResourceMonitorProps> = ({ stages }) => {
  const activeStage = stages.find(s => s.status === 'running') || stages.find(s => s.status === 'completed' && s.cpuUsage !== undefined);

  if (!activeStage) {
    return <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-xs text-center border border-slate-200">No resource data available.</div>;
  }

  const cpu = activeStage.cpuUsage || 0;
  const mem = activeStage.memoryUsage || 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
        <Cpu className="w-4 h-4 text-indigo-600" />
        Resource Utilization: {activeStage.name}
      </div>

      <div className="space-y-3">
        {/* CPU Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-slate-600">
            <span>CPU Usage</span>
            <span>{cpu}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${cpu}%` }} />
          </div>
        </div>

        {/* Memory Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-slate-600">
            <span>Memory Usage</span>
            <span>{mem} MB</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (mem / 8192) * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
