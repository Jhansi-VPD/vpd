import React from 'react';

interface ActionToastProps {
  message: string | null;
  onClose: () => void;
  title?: string;
  className?: string;
}

export const ActionToast: React.FC<ActionToastProps> = ({
  message,
  onClose,
  title = '⚡ Action:',
  className = 'mb-4',
}) => {
  if (!message) return null;

  return (
    <div
      className={`p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-lg animate-slideDown ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-emerald-400">{title}</span>
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-emerald-400 hover:text-white transition-colors ml-3"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};

export default ActionToast;
