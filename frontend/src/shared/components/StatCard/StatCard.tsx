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
    <div className="bg-[#1D1D1D] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3F3F46] transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-[#171717] border border-[#2A2A2A] text-[#D4AF37] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {value}
        </div>
        {(change || subtitle) && (
          <div className="flex items-center gap-2 text-xs">
            {change && (
              <span className={`font-semibold ${trendColors[trend]}`}>
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-[#A1A1AA] truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

