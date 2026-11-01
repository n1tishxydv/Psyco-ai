import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = '',
    id,
    disabled = false,
    required = false,
    rows = 4,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-medium tracking-wide uppercase text-psyco-coolGrey"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full bg-psyco-darkNavy border rounded-xl px-3.5 py-2 text-sm text-psyco-softGrey placeholder:text-psyco-coolGrey/50 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-psyco-softGrey/50 focus-visible:border-psyco-coolGrey',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500/80 focus-visible:ring-red-400' : 'border-psyco-steel/80 hover:border-psyco-coolGrey/50',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-psyco-coolGrey">{helperText}</p>
      ) : null}
    </div>
  );
});
