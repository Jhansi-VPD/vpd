import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading details...' }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-3">
    <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-zinc-400 font-medium">{message}</span>
  </div>
);

export default LoadingState;

