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
          className="block text-xs font-medium tracking-wide uppercase text-secondaryText"
        >
          {label} {required && <span className="text-mutedCoral">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-secondaryText pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full bg-deepBlueGray/70 border rounded-lg px-3.5 py-2 text-sm text-primaryText placeholder:text-secondaryText/60 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-softTeal focus-visible:border-softTeal',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-mutedCoral focus-visible:ring-mutedCoral' : 'border-slate-700/80 hover:border-slate-600',
            Icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-mutedCoral flex items-center gap-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-secondaryText">{helperText}</p>
      ) : null}
    </div>
  );
});
