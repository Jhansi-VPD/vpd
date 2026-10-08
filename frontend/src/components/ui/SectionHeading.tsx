import React from 'react';

interface SectionHeadingProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading({ eyebrow, title, description, align = 'left', className = '' }: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <div className={`flex flex-col gap-stack-sm ${alignment} ${className}`}>
      {eyebrow && <span className="font-label-caps text-label-caps uppercase tracking-widest text-brand">{eyebrow}</span>}
      <h2 className="font-display text-headline-md text-brand-dark dark:text-dark-brand">{title}</h2>
      {description && <p className="font-body text-body-md text-ink-muted dark:text-white max-w-2xl">{description}</p>}
    </div>
  );
}
