import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({
  children,
  variant = 'teal', // 'teal' | 'green' | 'amber' | 'coral' | 'slate'
  size = 'md',      // 'sm' | 'md'
  className = '',
}) {
  const variants = {
    teal: 'bg-psyco-slate text-psyco-softGrey border-psyco-steel',
    slate: 'bg-psyco-slate text-psyco-coolGrey border-psyco-steel',
    steel: 'bg-psyco-steel/30 text-psyco-softGrey border-psyco-steel',
    green: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
    amber: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
    coral: 'bg-red-950/40 text-red-300 border-red-700/50',
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
