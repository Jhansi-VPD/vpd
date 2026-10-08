import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';

const fromClass = {
  up: 'reveal',
  left: 'reveal-left',
  right: 'reveal-right',
  zoom: 'reveal-zoom',
} as const;

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  from?: keyof typeof fromClass;
  delay?: number;
}

export default function Reveal({ as = 'div', className = '', children, from = 'up', delay, style, ...rest }: RevealProps) {
  const [ref, visible] = useScrollReveal() as [React.RefObject<HTMLElement | null>, boolean];
  const base = fromClass[from] ?? 'reveal';
  const Tag: any = as;

  return (
    <Tag
      ref={ref}
      className={`${base} ${visible ? 'reveal-visible' : ''} ${className}`}
      {...rest}
      style={delay != null ? { transitionDelay: `${delay}ms`, ...style } : style}
    >
      {children}
    </Tag>
  );
}
