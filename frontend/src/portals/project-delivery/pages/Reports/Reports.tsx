import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Sprint & Delivery Reports</h2>
        <p className="text-xs text-zinc-400">Velocity trends, planned vs actual effort, and bug escape rates</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Sprint Velocity" value="44 SP" change="+4 SP vs Average" isPositive={true} />
        <MetricCard title="Defect Escape Rate" value="0.2%" change="Grade AAA" isPositive={true} />
        <MetricCard title="Code Review SLA" value="1.8 Hours" change="Fast turnaround" isPositive={true} />
      </div>
    </div>
  );
};

export default Reports;
