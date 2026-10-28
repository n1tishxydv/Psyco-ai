import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    helperText,
    className = '',
    id,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium tracking-wide uppercase text-secondaryText"
        >
          {label} {required && <span className="text-mutedCoral">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full bg-deepBlueGray/70 border rounded-lg px-3.5 py-2 text-sm text-primaryText transition-colors duration-150 appearance-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-softTeal focus-visible:border-softTeal',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-mutedCoral focus-visible:ring-mutedCoral' : 'border-slate-700/80 hover:border-slate-600',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-deepBlueGray text-primaryText">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondaryText">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-mutedCoral">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-secondaryText">{helperText}</p>
      ) : null}
    </div>
  );
});
