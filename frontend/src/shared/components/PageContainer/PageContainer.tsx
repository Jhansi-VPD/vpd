import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'standard' | 'full' | 'narrow';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = 'standard',
}) => {
  const maxClass = {
    standard: 'max-w-[1440px]',
    full: 'max-w-full',
    narrow: 'max-w-5xl',
  }[maxWidth];

  return (
    <div
      className={`w-full ${maxClass} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 ${className}`}
    >
      {children}
    </div>
  );
};

export default PageContainer;

