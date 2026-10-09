import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const getAutoVariant = (st: string): BadgeVariant => {
    const s = st.toLowerCase();
    if (['active', 'approved', 'completed', 'paid', 'present', 'on_track'].includes(s)) return 'success';
    if (['pending', 'in_progress', 'review', 'half_day', 'at_risk', 'locked'].includes(s)) return 'warning';
    if (
      ['rejected', 'cancelled', 'overdue', 'absent', 'terminated', 'delayed', 'critical', 'suspended', 'revoked', 'failed'].includes(s)
    )
      return 'danger';
    if (['draft', 'planning', 'lead'].includes(s)) return 'info';
    return 'neutral';
  };

  const finalVariant = variant || getAutoVariant(status);

  const styles: Record<BadgeVariant, string> = {
    success: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
    danger: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
    info: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
    gold: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/35',
    neutral: 'bg-[#222225] text-zinc-200 border-zinc-700 font-semibold',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[finalVariant]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
