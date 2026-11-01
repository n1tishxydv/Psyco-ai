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
          className="block text-xs font-medium tracking-wide uppercase text-psyco-coolGrey"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full bg-psyco-darkNavy border rounded-xl px-3.5 py-2 text-sm text-psyco-softGrey transition-colors duration-150 appearance-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-psyco-softGrey/50 focus-visible:border-psyco-coolGrey',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-500/80 focus-visible:ring-red-400' : 'border-psyco-steel/80 hover:border-psyco-coolGrey/50',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-psyco-darkNavy text-psyco-softGrey">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-psyco-coolGrey">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-psyco-coolGrey">{helperText}</p>
      ) : null}
    </div>
  );
});
