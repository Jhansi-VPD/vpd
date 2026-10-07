import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3.5 py-2.5 bg-[#171717] border ${
            error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#2A2A2A] focus:border-[#D4AF37]'
          } rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#171717] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

