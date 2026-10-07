import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Dashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Sales & Pipeline Performance</h2>
      <p className="text-xs text-zinc-400">Quarterly bookings, weighted opportunity values, and conversion ratios</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Active Pipeline Value" value="$1,420,000" change="+24.5%" isPositive={true} />
      <MetricCard title="Closed Won (Q4)" value="$380,000" change="On Target" isPositive={true} />
      <MetricCard title="Average Deal Size" value="$95,000" change="+12%" isPositive={true} />
    </div>
  </div>
);

export default Dashboard;
