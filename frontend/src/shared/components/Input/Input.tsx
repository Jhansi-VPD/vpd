import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 bg-[#171717] border ${
            error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#2A2A2A] focus:border-[#D4AF37]'
          } rounded-xl text-white placeholder-[#71717A] text-sm focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-[#EF4444]' : 'focus:ring-[#D4AF37]'
          } transition-all ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#A1A1AA]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

