import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block py-1 px-3 rounded-full font-label-caps text-label-caps uppercase ${className}`}
    >
      {children}
    </span>
  );
}
