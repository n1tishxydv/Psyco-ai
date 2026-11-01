import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon = null,
    className = '',
    id,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium tracking-wide uppercase text-psyco-coolGrey"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-psyco-coolGrey pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full bg-psyco-darkNavy border rounded-xl px-3.5 py-2 text-sm text-psyco-softGrey placeholder:text-psyco-coolGrey/50 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-psyco-softGrey/50 focus-visible:border-psyco-coolGrey',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-500/80 focus-visible:ring-red-400' : 'border-psyco-steel/80 hover:border-psyco-coolGrey/50',
            Icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-red-400 flex items-center gap-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-psyco-coolGrey">{helperText}</p>
      ) : null}
    </div>
  );
});
