import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Executive Engagement Reports</h2>
        <p className="text-xs text-zinc-400">Engineering delivery velocity, SLA compliance metrics, and invoices</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Contract SLA Compliance" value="99.98%" change="Within Guarantee" isPositive={true} />
        <MetricCard title="Milestones Completed" value="8 / 10" change="+2 this month" isPositive={true} />
        <MetricCard title="Quarterly NPS" value="9.8 / 10" change="Exceptional" isPositive={true} />
      </div>
    </div>
  );
};

export default Reports;
