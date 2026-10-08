import React from 'react';
import Badge from './Badge';

interface StatusBadgeProps {
  variant?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function StatusBadge({ variant = 'neutral', children, className = '' }: StatusBadgeProps) {
  return (
    <Badge className={`bg-status-${variant}-bg text-status-${variant}-text ${variant === 'neutral' ? 'dark:text-black' : ''} ${className}`}>
      {children}
    </Badge>
  );
}
