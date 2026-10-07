import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-[#d4af37] hover:bg-[#dfc067] text-[#0a0a0a] font-semibold shadow-sm focus:ring-[#d4af37]',
    secondary: 'bg-[#1e1e1e] hover:bg-[#282828] text-white border border-[#2a2a2a] focus:ring-[#d4af37]',
    outline: 'border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 focus:ring-[#d4af37]',
    danger: 'bg-red-600/90 hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'text-zinc-300 hover:text-white hover:bg-white/5 focus:ring-zinc-500',
    gold: 'bg-gradient-to-r from-[#d4af37] to-[#dfc067] text-black font-semibold hover:brightness-105 shadow-md shadow-[#d4af37]/20',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export function StatusBadge({ status = 'active' }) {
  const norm = String(status || '').toLowerCase().replace(/_/g, ' ');
  
  const getStyles = () => {
    switch (norm) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'won':
      case 'paid':
      case 'present':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in progress':
      case 'lead':
      case 'qualified':
      case 'submitted':
      case 'sent':
      case 'half day':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'pending':
      case 'draft':
      case 'on leave':
      case 'unpaid':
      case 'open':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'rejected':
      case 'lost':
      case 'failed':
      case 'cancelled':
      case 'absent':
      case 'terminated':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      <span className="capitalize">{norm}</span>
    </span>
  );
}

export function Card({ children, className = '', title, subtitle, action, footer }) {
  return (
    <div className={`bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 shadow-sm text-white ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4 border-b border-[#2a2a2a]/60 pb-3">
          <div>
            {title && <h3 className="font-semibold text-base text-zinc-100">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-3 border-t border-[#2a2a2a]/60">{footer}</div>}
    </div>
  );
}

export function MetricCard({ label, value, change, icon, trend = 'neutral', subtitle }) {
  return (
    <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#d4af37]/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[#202020] border border-[#2a2a2a] flex items-center justify-center text-[#d4af37]">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value ?? '—'}</span>
        {change && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-zinc-400'}`}>
            {change}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function LoadingSkeleton({ count = 3, height = 'h-10' }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-[#202020] rounded-lg ${height} w-full`}></div>
      ))}
    </div>
  );
}

export function EmptyState({ title = 'No records found', message = 'No data available to display right now.', action }) {
  return (
    <div className="text-center py-12 px-4 border border-dashed border-[#2a2a2a] rounded-xl bg-[#141414]">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1e1e1e] flex items-center justify-center text-zinc-500">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`relative bg-[#171717] border border-[#2a2a2a] rounded-xl w-full ${maxWidth} shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

