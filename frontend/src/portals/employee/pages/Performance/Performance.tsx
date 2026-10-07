import React from 'react';
import { MetricCard } from '../../../../shared/components/Charts';

export const Performance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Annual Performance Review & Goals</h2>
        <p className="text-xs text-zinc-400">Quarterly OKRs, peer feedback ratings, and manager assessments</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Goal Completion" value="94%" change="Exceeding Targets" isPositive={true} />
        <MetricCard title="Peer Rating" value="4.9 / 5.0" change="Top 5%" isPositive={true} />
        <MetricCard title="Next Review Cycle" value="Q4 Dec 2026" change="Scheduled" isPositive={true} />
      </div>
    </div>
  );
};

export default Performance;
