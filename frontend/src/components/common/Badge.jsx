import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({
  children,
  variant = 'teal', // 'teal' | 'green' | 'amber' | 'coral' | 'slate'
  size = 'md',      // 'sm' | 'md'
  className = '',
}) {
  const variants = {
    teal: 'bg-softTeal/15 text-softTeal border-softTeal/30',
    green: 'bg-calmGreen/15 text-calmGreen border-calmGreen/30',
    amber: 'bg-mutedAmber/15 text-mutedAmber border-mutedAmber/30',
    coral: 'bg-mutedCoral/15 text-mutedCoral border-mutedCoral/30',
    slate: 'bg-elevatedSlate text-secondaryText border-slate-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border leading-none',
        variants[variant] || variants.teal,
        sizes[size] || sizes.md,
        className
      )}
    >
      {children}
    </span>
  );
}
