import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  subtitle,
}) => {
  const trendColors = {
    up: 'text-[#22C55E]',
    down: 'text-[#EF4444]',
    neutral: 'text-[#A1A1AA]',
  };

  return (
    <div className="card-hover-fx bg-[#18181A] border border-[#2A2A2A] rounded-xl p-5 flex flex-col justify-between group">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider truncate group-hover:text-white transition-colors">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-[#141414] border border-[#2A2A2A] text-[#D4AF37] group-hover:border-[#D4AF37]/40 group-hover:bg-[#D4AF37]/10 transition-all flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-[#FAFAFA] transition-colors">
          {value}
        </div>
        {(change || subtitle) && (
          <div className="flex items-center gap-2 text-xs">
            {change && (
              <span className={`font-semibold px-2 py-0.5 rounded-full ${
                trend === 'up'
                  ? 'text-[#22C55E] bg-emerald-500/10 border border-emerald-500/20'
                  : trend === 'down'
                  ? 'text-[#EF4444] bg-red-500/10 border border-red-500/20'
                  : 'text-zinc-300 bg-zinc-800/60 border border-zinc-700/60'
              }`}>
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-zinc-300 font-medium truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

