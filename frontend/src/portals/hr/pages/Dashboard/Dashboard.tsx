import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Dashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">HR Operations Hub</h2>
      <p className="text-xs text-zinc-400">Workforce dynamics, recruitment pipeline, and retention metrics</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Total Staff" value="48" change="+4 this quarter" isPositive={true} />
      <MetricCard title="Open Positions" value="6" change="Active Outreach" isPositive={true} />
      <MetricCard title="On Leave Today" value="3" change="Planned PTO" isPositive={true} />
    </div>
  </div>
);

export default Dashboard;
