import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Dashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Engineering Delivery Telemetry</h2>
      <p className="text-xs text-zinc-400">Sprint burndown, active initiatives, and deployment readiness</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard title="Sprint Completion" value="88%" change="+6% vs Target" isPositive={true} />
      <MetricCard title="Open Tasks in Flight" value="34" change="7 In Review" isPositive={true} />
      <MetricCard title="Critical Blockers" value="0" change="Nominal" isPositive={true} />
    </div>
  </div>
);

export default Dashboard;
