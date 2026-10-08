import React from 'react';

interface EyebrowProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <span className={`block font-label-caps text-label-caps uppercase tracking-widest text-brand ${className}`}>
      {children}
    </span>
  );
}
