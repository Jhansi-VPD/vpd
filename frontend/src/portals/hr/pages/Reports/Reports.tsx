import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">HR & People Analytics Reports</h2>
        <p className="text-xs text-zinc-400">Attrition rates, recruitment efficiency, and department demographics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Staff Retention" value="96.2%" change="+1.4%" isPositive={true} />
        <MetricCard title="Time to Hire" value="21 Days" change="-4 Days" isPositive={true} />
        <MetricCard title="eNPS Employee Score" value="78 / 100" change="Top Decile" isPositive={true} />
      </div>
    </div>
  );
};

export default Reports;
