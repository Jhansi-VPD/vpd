import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Dashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Client Portfolio Overview</h2>
      <p className="text-xs text-zinc-400">Delivery status, milestone verification, and billing ledger</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Active Engagements" value="2 Projects" change="On Track" isPositive={true} />
      <MetricCard title="Delivered Milestones" value="8 / 10" change="80% Acceptance" isPositive={true} />
      <MetricCard title="Outstanding Balance" value="$0.00" change="All Paid" isPositive={true} />
    </div>
  </div>
);

export default Dashboard;
