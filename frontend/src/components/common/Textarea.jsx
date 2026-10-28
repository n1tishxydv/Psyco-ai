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
          className="block text-xs font-medium tracking-wide uppercase text-secondaryText"
        >
          {label} {required && <span className="text-mutedCoral">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full bg-deepBlueGray/70 border rounded-lg px-3.5 py-2 text-sm text-primaryText placeholder:text-secondaryText/60 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-softTeal focus-visible:border-softTeal',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-mutedCoral focus-visible:ring-mutedCoral' : 'border-slate-700/80 hover:border-slate-600',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-xs text-mutedCoral">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-secondaryText">{helperText}</p>
      ) : null}
    </div>
  );
});
