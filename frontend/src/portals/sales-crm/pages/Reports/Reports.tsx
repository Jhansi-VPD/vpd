import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Sales & Revenue Reports</h2>
        <p className="text-xs text-zinc-400">Quarterly bookings, quota attainment, and customer acquisition costs</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Quota Attainment" value="112%" change="+8% vs Target" isPositive={true} />
        <MetricCard title="Win Rate" value="42.8%" change="+3.2%" isPositive={true} />
        <MetricCard title="Sales Cycle Velocity" value="38 Days" change="-6 Days" isPositive={true} />
      </div>
    </div>
  );
};

export default Reports;
