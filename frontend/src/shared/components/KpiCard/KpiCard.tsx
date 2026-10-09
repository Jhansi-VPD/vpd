import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  valueColor = 'text-white',
}) => (
  <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
    <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">{label}</div>
    <div className={`text-xl font-extrabold font-mono mt-0.5 ${valueColor}`}>{value}</div>
    {subtitle && <div className="text-xs text-zinc-300 mt-1 font-medium">{subtitle}</div>}
  </div>
);

export default KpiCard;
