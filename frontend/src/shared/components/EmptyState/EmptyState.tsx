import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are currently no records to display.',
  action,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3">
      📁
    </div>
    <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
    <p className="text-xs text-zinc-500 max-w-sm mt-1">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;

