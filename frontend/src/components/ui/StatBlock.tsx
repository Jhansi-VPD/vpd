import React from 'react';
import useCountUp from '../../hooks/useCountUp';

interface StatBlockProps {
  value: string | number;
  label: React.ReactNode;
  valueClassName?: string;
  labelClassName?: string;
}

export default function StatBlock({ value, label, valueClassName = 'text-brand', labelClassName = 'text-ink' }: StatBlockProps) {
  const [ref, display] = useCountUp(value) as [React.RefObject<HTMLDivElement | null>, string | number];
  return (
    <div ref={ref}>
      <div className={`font-stat text-stat-lg ${valueClassName}`}>{display}</div>
      <div className={`font-label-caps text-label-caps uppercase ${labelClassName}`}>{label}</div>
    </div>
  );
}
