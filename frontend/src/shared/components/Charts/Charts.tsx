import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive }) => (
  <div className="card-hover-fx bg-[#18181A] border border-[#2A2A2A] rounded-xl p-5 flex flex-col justify-between group">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider group-hover:text-white transition-colors">
        {title}
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40 group-hover:bg-[#D4AF37] transition-all" />
    </div>
    <div className="mt-3 flex items-baseline justify-between gap-2">
      <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-[#FAFAFA] transition-colors">
        {value}
      </span>
      {change && (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive
              ? 'text-[#22C55E] bg-emerald-500/10 border border-emerald-500/20'
              : 'text-[#EF4444] bg-red-500/10 border border-red-500/20'
          }`}
        >
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

