import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive }) => (
  <div className="bg-[#1D1D1D] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3F3F46] transition-all flex flex-col justify-between">
    <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">{title}</span>
    <div className="mt-3 flex items-baseline justify-between gap-2">
      <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</span>
      {change && (
        <span className={`text-xs font-semibold ${isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
          {change}
        </span>
      )}
    </div>
  </div>
);

export const MiniBarChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end space-x-1.5 h-16 pt-2">
      {data.map((val, idx) => (
        <div
          key={idx}
          className="flex-1 bg-[#D4AF37]/70 hover:bg-[#D4AF37] rounded-t transition-all"
          style={{ height: `${(val / max) * 100}%` }}
        />
      ))}
    </div>
  );
};

