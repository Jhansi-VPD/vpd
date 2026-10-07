import React from 'react';
import Button from '../Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border border-red-900/30 rounded-2xl bg-red-950/10">
    <div className="w-12 h-12 rounded-full bg-red-900/20 text-red-400 flex items-center justify-center mb-3">
      ⚠️
    </div>
    <h4 className="text-sm font-semibold text-red-200">{title}</h4>
    <p className="text-xs text-red-400/80 max-w-sm mt-1 mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

export default ErrorState;

